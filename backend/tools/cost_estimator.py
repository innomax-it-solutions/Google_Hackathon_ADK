"""Tool: estimate_cost — itemised treatment cost for a hospital + procedure."""

from __future__ import annotations

from ..contract import cost_for, hospital_by_id
from .hospital_match import _resolve


def estimate_cost(hospital_id: str, procedure: str, origin_country: str) -> dict:
    """Estimate the itemised treatment cost for a specific hospital and procedure.

    Call this AFTER find_hospitals, using a hospital_id and the matched_procedure it returned.

    Args:
        hospital_id: The hospital id from find_hospitals, e.g. "apollo-hyd-001".
        procedure: The procedure slug from find_hospitals, e.g. "knee-replacement-unilateral".
        origin_country: The patient's 2-letter ISO code (for context).

    Returns:
        A dict with "status", itemised "line_items", USD and INR totals as a
        min-max range, "ward_days"/"icu_days", a "currency_note" and a
        "confidence" flag. The quoted figure is the hospital treatment package;
        flights and accommodation are not included. Never returns NaN/None for a
        cost; if the procedure isn't offered it returns status "unavailable".
    """
    hospital = hospital_by_id(hospital_id)
    if not hospital:
        return {"status": "unavailable", "message": f"No record for hospital '{hospital_id}'."}

    # The agent sometimes passes a loose term ("heart surgery") or a guessed slug
    # ("heart-surgery") instead of the exact matched_procedure. Resolve it the same
    # way find_hospitals does so a valid procedure still prices correctly.
    procedure = _resolve(procedure) or procedure

    cost = cost_for(hospital_id, procedure)
    if not cost:
        return {
            "status": "unavailable",
            "message": f"{hospital['name']} ({hospital['city']}) has no listed price for '{procedure}'.",
        }

    return {
        "status": "ok",
        "hospital_id": hospital_id,
        "hospital_name": hospital["name"],
        "city": hospital["city"],
        "procedure": procedure,
        "specialty": cost.get("specialty"),
        "line_items": cost.get("line_items", []),
        "total_usd_min": cost.get("total_usd_min"),
        "total_usd_max": cost.get("total_usd_max"),
        "total_inr_min": cost.get("total_inr_min"),
        "total_inr_max": cost.get("total_inr_max"),
        "ward_days": cost.get("ward_days"),
        "icu_days": cost.get("icu_days"),
        "currency_note": cost.get("currency_note", "Indicative estimate."),
        "confidence": cost.get("confidence", "estimated"),
        "scope_note": "Treatment package only — international flights and accommodation are estimated separately.",
    }
