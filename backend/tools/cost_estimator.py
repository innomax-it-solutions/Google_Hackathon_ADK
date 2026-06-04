"""Tool: estimate_cost — itemised treatment cost for a hospital + procedure."""

from __future__ import annotations

from ..contract import cost_for, doc_rules, hospital_by_id

_FALLBACK_USD_TO_INR = 86.0


def _usd_to_inr() -> float:
    """Indicative USD->INR rate from the KB, with a safe fallback."""
    try:
        return float(doc_rules().get("_fx", {}).get("usd_to_inr") or _FALLBACK_USD_TO_INR)
    except (TypeError, ValueError):
        return _FALLBACK_USD_TO_INR


def estimate_cost(
    hospital_id: str,
    procedure: str,
    origin_country: str,
    flight_cost_inr: float = 0,
    flight_result_index: str = "",
    flight_trace_id: str = "",
) -> dict:
    """Estimate the itemised treatment cost for a specific hospital and procedure.

    Call this AFTER find_hospitals, using a hospital_id and the matched_procedure it returned.
    When you have already searched flights, pass the selected flight's fare as
    flight_cost_inr so the estimate becomes a single consolidated total (treatment
    + flights) instead of two separate numbers.

    Args:
        hospital_id: The hospital id from find_hospitals, e.g. "apollo-hyd-001".
        procedure: The procedure slug from find_hospitals, e.g. "knee-replacement-unilateral".
        origin_country: The patient's 2-letter ISO code (for context).
        flight_cost_inr: Optional. The selected flight's fare in INR (e.g. the
            PublishedFare from flight_search). Default 0 = treatment only, no
            flight line. When nonzero, a "Flights" line is added and folded into
            the USD and INR totals.
        flight_result_index: Optional. The selected flight's result_index, echoed
            back in "selected_flight" so downstream steps/the frontend can FareQuote it.
        flight_trace_id: Optional. The flight search's trace_id, echoed back likewise.

    Returns:
        A dict with "status", itemised "line_items", USD and INR totals as a
        min-max range, "ward_days"/"icu_days", a "currency_note" and a
        "confidence" flag. When flight_cost_inr is given, "includes_flights" is
        true, a "Flights" line item appears, the totals include it, and
        "selected_flight" carries the result_index/trace_id. Never returns
        NaN/None for a cost; if the procedure isn't offered it returns status
        "unavailable".
    """
    hospital = hospital_by_id(hospital_id)
    if not hospital:
        return {"status": "unavailable", "message": f"No record for hospital '{hospital_id}'."}

    cost = cost_for(hospital_id, procedure)
    if not cost:
        return {
            "status": "unavailable",
            "message": f"{hospital['name']} ({hospital['city']}) has no listed price for '{procedure}'.",
        }

    # Copy the cached line-items before appending so we never mutate the KB cache.
    line_items = list(cost.get("line_items", []))
    usd_min = cost.get("total_usd_min")
    usd_max = cost.get("total_usd_max")
    inr_min = cost.get("total_inr_min")
    inr_max = cost.get("total_inr_max")

    includes_flights = bool(flight_cost_inr and flight_cost_inr > 0)
    if includes_flights:
        flight_usd = round(flight_cost_inr / _usd_to_inr())
        flight_inr = round(flight_cost_inr)
        line_items = line_items + [{"label": "Flights", "usd": flight_usd, "inr": flight_inr}]
        # Fold the flight into both ends of each range (a fixed add-on).
        if usd_min is not None:
            usd_min += flight_usd
        if usd_max is not None:
            usd_max += flight_usd
        if inr_min is not None:
            inr_min += flight_inr
        if inr_max is not None:
            inr_max += flight_inr

    scope_note = (
        "Treatment package plus the selected flight. Accommodation is estimated separately."
        if includes_flights
        else "Treatment package only — international flights and accommodation are estimated separately."
    )

    result = {
        "status": "ok",
        "hospital_id": hospital_id,
        "hospital_name": hospital["name"],
        "city": hospital["city"],
        "procedure": procedure,
        "specialty": cost.get("specialty"),
        "line_items": line_items,
        "total_usd_min": usd_min,
        "total_usd_max": usd_max,
        "total_inr_min": inr_min,
        "total_inr_max": inr_max,
        "includes_flights": includes_flights,
        "ward_days": cost.get("ward_days"),
        "icu_days": cost.get("icu_days"),
        "currency_note": cost.get("currency_note", "Indicative estimate."),
        "confidence": cost.get("confidence", "estimated"),
        "scope_note": scope_note,
    }
    if includes_flights and (flight_result_index or flight_trace_id):
        # Carry the booking handles so FareQuote/summary and the frontend can
        # reference the exact flight that was costed in.
        result["selected_flight"] = {
            "result_index": flight_result_index,
            "trace_id": flight_trace_id,
            "fare_inr": round(flight_cost_inr),
        }
    return result
