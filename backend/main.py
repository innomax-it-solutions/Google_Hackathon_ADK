"""FastAPI server exposing the autonomous MedBridge agent over SSE.

POST /run            - structured intake (frontend form) -> streamed Journey Plan
POST /chat           - free-text message on an existing session (multi-turn)
WS   /ws/transcribe  - live voice dictation -> streamed transcript + language
GET  /healthz        - liveness probe for Cloud Run
"""

from __future__ import annotations

import asyncio
import json
import uuid
from datetime import date as _date
from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env before any google.genai/ADK imports so credentials are
# available at import time. resolve() turns a relative __file__ into an
# absolute path, which fixes uvicorn --reload worker subprocess resolution.
_env_file = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_file, override=True)


from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from pydantic import BaseModel

from .agent import root_agent
from .city_airports import iata_for_city
from .contract import IntakeRequest, hospital_by_id
from .tools.cost_estimator import estimate_cost
from .tools.flights import flight_search
from .transcribe_stream import stream_transcribe

APP_NAME = "medbridge"

app = FastAPI(title="MedBridge Agent")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

session_service = InMemorySessionService()
runner = Runner(agent=root_agent, app_name=APP_NAME, session_service=session_service)


def _sse(event_type: str, payload: dict) -> str:
    return f"data: {json.dumps({'type': event_type, **payload})}\n\n"


async def _stream(user_id: str, session_id: str, text: str):
    """Run the agent and translate ADK events into the frontend SSE contract."""
    # create_session raises if the session already exists (every message after the
    # first reuses the same session_id for multi-turn chat). Catch and ignore — the
    # runner will find the existing session.
    try:
        await session_service.create_session(
            app_name=APP_NAME, user_id=user_id, session_id=session_id
        )
    except Exception:
        pass  # session already exists — reuse it

    # The model otherwise defaults to its training-cutoff year and invents PAST
    # travel dates, which the flight API rejects. Anchor it to the real date.
    today = _date.today().isoformat()
    dated = (
        f"[Today's date is {today}. For any flight search, treat this as the current "
        f"date and only use future dates — never a past year.]\n\n{text}"
    )
    message = types.Content(role="user", parts=[types.Part(text=dated)])

    yield _sse("session", {"session_id": session_id})
    try:
        async for event in runner.run_async(
            user_id=user_id, session_id=session_id, new_message=message
        ):
            for part in (event.content.parts if event.content else []) or []:
                if getattr(part, "text", None):
                    yield _sse("token", {"text": part.text})
                if getattr(part, "function_call", None):
                    yield _sse("tool_call", {
                        "name": part.function_call.name,
                        "args": dict(part.function_call.args or {}),
                    })
                if getattr(part, "function_response", None):
                    yield _sse("tool_result", {
                        "name": part.function_response.name,
                        "response": part.function_response.response,
                    })
            if event.is_final_response():
                yield _sse("done", {})
    except Exception as exc:  # never leave the client hanging on a blank stream
        yield _sse("error", {"message": str(exc)})
        yield _sse("done", {})


# ISO 639-1 code -> language name used in the reply-language directive.
LANGUAGE_NAMES = {
    "en": "English", "zh": "Mandarin Chinese", "hi": "Hindi", "es": "Spanish",
    "fr": "French", "ar": "Arabic", "bn": "Bengali", "pt": "Portuguese",
    "ru": "Russian", "ur": "Urdu",
}


def _with_language(text: str, language: str | None) -> str:
    """Prefix a reply-language directive so the agent answers in the user's language.

    English (or an unknown/blank code) is a no-op — the agent mirrors the user's
    language by default. Gemini does the actual translation natively.
    """
    name = LANGUAGE_NAMES.get((language or "en").lower())
    if not name or name == "English":
        return text
    return f"[Reply entirely in {name}.]\n\n{text}"


@app.post("/run")
async def run(intake: IntakeRequest):
    session_id = intake.session_id or uuid.uuid4().hex

    # Core profile, then append only the optional travel details the patient gave —
    # so the agent has departure city/date/party size for the flight step.
    parts = [
        f"condition: {intake.condition}",
        f"origin_country: {intake.origin_country}",
        f"budget_usd: {intake.budget_usd}",
        f"timeline_weeks: {intake.timeline_weeks}",
    ]
    if intake.interpreter_language:
        parts.append(f"interpreter_language: {intake.interpreter_language}")
    if intake.departure_city:
        parts.append(f"departure_city: {intake.departure_city}")
    if intake.travel_date:
        parts.append(f"travel_date: {intake.travel_date}")
    if intake.travellers:
        parts.append(f"travellers: {intake.travellers}")

    prompt = (
        "Patient profile — " + "; ".join(parts) + ". "
        "Please plan my medical journey to India and show me the full Journey Plan."
    )
    return StreamingResponse(
        _stream(
            user_id="web",
            session_id=session_id,
            text=_with_language(prompt, intake.language),
        ),
        media_type="text/event-stream",
    )


class ChatRequest(BaseModel):
    session_id: str
    message: str
    language: str | None = None


@app.post("/chat")
async def chat(req: ChatRequest):
    """Continue an existing conversation (e.g. 'what about Thailand?', 'book it')."""
    return StreamingResponse(
        _stream(
            user_id="web",
            session_id=req.session_id,
            text=_with_language(req.message, req.language),
        ),
        media_type="text/event-stream",
    )


@app.websocket("/ws/transcribe")
async def ws_transcribe(websocket: WebSocket):
    """Live voice dictation: browser streams 16 kHz mono PCM in, we stream back
    {type: interim|final, text, language} transcript events from Cloud STT v2.

    The client sends binary audio frames and a final "stop" text frame. STT
    detects the spoken language (Chirp) and we relay it so the composer can
    switch the agent's reply language. See transcribe_stream.stream_transcribe.
    """
    await websocket.accept()
    audio_queue: asyncio.Queue = asyncio.Queue()

    async def pump_audio():
        """Feed inbound audio frames to the queue; `None` signals end-of-audio."""
        try:
            while True:
                message = await websocket.receive()
                if message["type"] == "websocket.disconnect":
                    break
                if message.get("bytes") is not None:
                    await audio_queue.put(message["bytes"])
                elif message.get("text") == "stop":
                    break
        finally:
            await audio_queue.put(None)

    pump_task = asyncio.create_task(pump_audio())
    try:
        async for event in stream_transcribe(audio_queue):
            await websocket.send_json(event)
    except WebSocketDisconnect:
        pass
    except Exception as exc:  # surface STT/credential errors instead of a silent close
        try:
            await websocket.send_json({"type": "error", "message": str(exc)})
        except Exception:
            pass
    finally:
        await audio_queue.put(None)  # unblock the request generator if still waiting
        pump_task.cancel()
        try:
            await websocket.close()
        except Exception:
            pass


class EstimateHospitalRequest(BaseModel):
    """Re-cost a single (non-recommended) hospital so the card can show its own
    plan + cost. The frontend supplies the flight context derived from the
    recommended hospital's already-run search (origin airport, dates, party size)."""

    hospital_id: str
    procedure: str = ""          # the matched_procedure slug from find_hospitals
    origin_country: str = ""     # 2-letter ISO, for estimate_cost context
    origin_airport: str = ""     # derived client-side from the seeded flight_search
    departure_date: str = ""     # YYYY-MM-DD, derived client-side
    return_date: str = ""        # optional; flight_search auto-defaults +21d if blank
    adults: int = 1
    children: int = 0
    infants: int = 0
    cabin_class: int = 2
    skip_flights: bool = False    # phase 1: return treatment cost instantly, no flight search


@app.post("/estimate_hospital")
def estimate_hospital(req: EstimateHospitalRequest):
    """Deterministic per-hospital estimate: search flights to the hospital's city,
    fold the cheapest fare into estimate_cost, and return {cost, flights} in the
    exact shapes JourneyPlanCard already consumes. No agent/LLM, only read-only
    flight Search (never FareQuote/Book). Degrades to treatment-only on any flight
    failure rather than erroring."""
    hospital = hospital_by_id(req.hospital_id)
    if not hospital:
        return {
            "cost": {"status": "unavailable", "message": f"No record for hospital '{req.hospital_id}'."},
            "flights": None,
        }

    flights_payload = None
    flight_cost_inr: float = 0
    flight_result_index = ""
    flight_trace_id = ""

    dest = iata_for_city(hospital.get("city"))
    can_search = bool(
        not req.skip_flights
        and dest and req.origin_airport and req.departure_date and req.procedure
    )
    if can_search:
        fs = flight_search(
            origin=req.origin_airport,
            destination=dest,
            departure_date=req.departure_date,
            adults=max(1, req.adults),
            children=req.children,
            infants=req.infants,
            cabin_class=req.cabin_class,
            return_date=req.return_date,
        )
        flights_payload = fs
        if fs.get("status") == "ok" and fs.get("results"):
            cheapest = fs["results"][0]
            fare = cheapest.get("published_fare")
            if isinstance(fare, (int, float)) and fare > 0:
                flight_cost_inr = fare
                flight_result_index = cheapest.get("result_index") or ""
                flight_trace_id = fs.get("trace_id") or ""

    cost = estimate_cost(
        hospital_id=req.hospital_id,
        procedure=req.procedure,
        origin_country=req.origin_country,
        flight_cost_inr=flight_cost_inr,
        flight_result_index=flight_result_index,
        flight_trace_id=flight_trace_id,
    )
    return {"cost": cost, "flights": flights_payload}


@app.get("/healthz")
def healthz():
    return {"status": "ok"}
