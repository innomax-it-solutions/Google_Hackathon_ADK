"""Medical report analysis via Gemini (multimodal).

Used by POST /analyze_report in main.py. Accepts a single uploaded medical
report (PDF or image) and asks Gemini 2.5 Flash to extract a structured,
patient-friendly summary: the likely condition, key findings, abnormal values,
and suggested next steps.

This is decision-support, NOT a medical diagnosis — every response carries a
disclaimer and the agent never treats it as ground truth.

Auth/config is the SAME as the ADK agent: google.genai.Client() reads
GOOGLE_GENAI_USE_VERTEXAI / GOOGLE_CLOUD_PROJECT / GOOGLE_CLOUD_LOCATION /
GOOGLE_API_KEY from the environment (loaded from backend/.env), so no extra
credentials are needed.
"""

from __future__ import annotations

import json
import os
from functools import lru_cache

from google import genai
from google.genai import types

MODEL = os.environ.get("MEDBRIDGE_MODEL", "gemini-2.5-flash")

# Accept common report formats only — everything else is rejected before we
# spend a model call on it. Matches the composer's per-file 20 MB limit.
ALLOWED_MIME_PREFIXES = ("image/",)
ALLOWED_MIME_EXACT = ("application/pdf",)
MAX_BYTES = 20 * 1024 * 1024

_PROMPT = """You are a careful clinical-documentation assistant helping a medical-tourism
coordinator. The attached file is a patient's medical report (lab result,
radiology/imaging report, discharge summary, prescription, or similar).

Read it and extract a concise, patient-friendly analysis. Respond with ONLY a
JSON object (no markdown, no commentary) using exactly these keys:

{
  "condition": "the primary diagnosis or suspected condition in plain language; '' if none is stated",
  "specialty": "the most relevant medical specialty (e.g. Cardiology, Orthopaedics); '' if unclear",
  "key_findings": ["short bullet strings of the most important findings"],
  "abnormal_values": ["any out-of-range lab/vital values, each like 'Name: value (range) - high/low'"],
  "summary": "2-4 sentence plain-language summary a non-medical patient can understand",
  "recommended_next_steps": ["short, practical next steps or specialists to consult"],
  "report_type": "lab | imaging | discharge | prescription | other"
}

Rules:
- Base everything ONLY on what the document actually contains. Do not invent values.
- If the file is unreadable or is clearly not a medical document, return the JSON
  with empty strings/arrays and set "summary" to a short explanation of why.
- Keep arrays to the few most important items (max ~6 each).
"""

_DISCLAIMER = (
    "This is an automated summary of your uploaded document for planning purposes "
    "only. It is not a medical diagnosis. Please confirm all details with a qualified doctor."
)


@lru_cache(maxsize=1)
def _client() -> "genai.Client":
    """Reads Vertex/API-key config from env, exactly like the ADK agent.
    Constructed lazily and cached so import never fails on missing creds."""
    return genai.Client()


def _parse_json(text: str) -> dict:
    """Parse the model's JSON, tolerating ```json fences or stray prose."""
    t = (text or "").strip()
    if t.startswith("```"):
        t = t.strip("`")
        nl = t.find("\n")
        if nl != -1:
            t = t[nl + 1:]
        t = t.strip()
    try:
        return json.loads(t)
    except Exception:
        start, end = t.find("{"), t.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(t[start:end + 1])
        raise


def _coerce(raw: dict) -> dict:
    """Normalise the model's JSON into the exact shape the frontend expects."""
    def _s(v):
        return v if isinstance(v, str) else ("" if v is None else str(v))

    def _l(v):
        if isinstance(v, list):
            return [_s(x).strip() for x in v if x is not None and _s(x).strip()]
        if v is None or v == "":
            return []
        return [_s(v).strip()]

    return {
        "status": "ok",
        "condition": _s(raw.get("condition")).strip(),
        "specialty": _s(raw.get("specialty")).strip(),
        "key_findings": _l(raw.get("key_findings")),
        "abnormal_values": _l(raw.get("abnormal_values")),
        "summary": _s(raw.get("summary")).strip(),
        "recommended_next_steps": _l(raw.get("recommended_next_steps")),
        "report_type": _s(raw.get("report_type")).strip() or "other",
        "disclaimer": _DISCLAIMER,
    }


def analyze_report_bytes(data: bytes, mime_type: str | None) -> dict:
    """Analyse one report. Returns the frontend contract dict; never raises for
    expected problems (bad type, too big, model/credential errors) — those come
    back as {"status": "error", "message": ...} so the client never hangs."""
    mime = (mime_type or "").lower().split(";")[0].strip()

    if not data:
        return {"status": "error", "message": "The uploaded file was empty."}
    if len(data) > MAX_BYTES:
        return {"status": "error", "message": "File is larger than 20 MB. Please upload a smaller report."}
    is_allowed = mime in ALLOWED_MIME_EXACT or any(mime.startswith(p) for p in ALLOWED_MIME_PREFIXES)
    if not is_allowed:
        return {
            "status": "error",
            "message": "Unsupported file type. Please upload a medical report as a PDF or an image (JPG/PNG).",
        }

    try:
        file_part = types.Part.from_bytes(data=data, mime_type=mime)
        response = _client().models.generate_content(
            model=MODEL,
            contents=[file_part, _PROMPT],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        raw = _parse_json(response.text)
        if not isinstance(raw, dict):
            return {"status": "error", "message": "Could not read a structured result from the report."}
        return _coerce(raw)
    except Exception as exc:  # credential / model / parse failure
        return {"status": "error", "message": f"Analysis failed: {exc}"}
