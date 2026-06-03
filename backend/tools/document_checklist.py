"""Tool: get_document_checklist — visa & document requirements by country."""

from __future__ import annotations

from ..contract import doc_rules


def _shape(code: str, rules: dict, status: str) -> dict:
    """Project a country record into the tool's response, surfacing the rich
    fields (visa duration, processing time, notes, flight hubs) the agent can
    use to make the Journey Plan concrete."""
    return {
        "status": status,
        "origin_country": code,
        "country_name": rules.get("country_name", code),
        "visa_required": rules.get("visa_required", True),
        "visa_type": rules.get("visa_type", "India Medical Visa"),
        "visa_duration_days": rules.get("visa_duration_days"),
        "visa_extendable": rules.get("visa_extendable"),
        "processing_days": rules.get("processing_days"),
        "mandatory_docs": rules.get("mandatory_docs", []),
        "recommended_docs": rules.get("recommended_docs", []),
        "direct_flights": rules.get("direct_flights"),
        "flight_hubs": rules.get("flight_hubs", []),
        "notes": rules.get("notes"),
    }


def get_document_checklist(origin_country: str) -> dict:
    """Get the visa and document checklist for a patient travelling to India for treatment.

    Args:
        origin_country: The patient's country as a 2-letter ISO code, e.g. "AE", "US", "NG".

    Returns:
        A dict with visa_required, visa_type, visa_duration_days, processing_days,
        mandatory_docs, recommended_docs, direct_flights, flight_hubs and notes.
        For an unknown country it returns the GENERIC fallback (status "fallback")
        rather than an error or empty result. Note: some countries (e.g. NP) are
        visa-free, and some (e.g. PK) require an in-person embassy application —
        always relay visa_type and notes accurately to the patient.
    """
    rules = doc_rules()
    code = (origin_country or "").strip().upper()

    if code in rules and code not in ("_FX", "GENERIC"):
        return _shape(code, rules[code], "ok")

    # Unknown country -> use the data-defined GENERIC fallback.
    generic = rules.get("GENERIC", {})
    return _shape(code or "GENERIC", generic, "fallback")
