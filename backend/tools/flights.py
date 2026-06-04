"""Flight tools for the autonomous MedBridge agent — TBO Universal Air API.

Scope boundary: STOP BEFORE PAYMENT. We search, re-price, and assemble a
booking-ready summary — we never call Book/Ticket and never issue (or simulate)
a PNR. Payment + ticketing happen downstream of a payment gateway (see the seam
in prepare_booking_summary).

Sequence the agent drives (TraceId + ResultIndex flow through the conversation
exactly like hospital_id does for the medical tools):

    flight_search          -> Search:    ranked options + TraceId
    flight_farequote       -> FareQuote:  re-price the chosen ResultIndex
    prepare_booking_summary-> FareQuote (reconfirm) + assemble the handoff package

Each returns clean structured JSON (no raw TBO envelope) so Gemini can present it.
Search / FareQuote are read-only and free.
"""

from __future__ import annotations

from . import tbo_client as tbo

# JourneyType / cabin / pax-type constants, named so the code reads clearly.
_JOURNEY_ONEWAY, _JOURNEY_RETURN = 1, 2
_PAXTYPE = {"adult": 1, "child": 2, "infant": 3}

# Monotonic counter for human-quotable references (matches request_appointment's
# MB-XXXX style). Resets per process — a real system would persist this.
_summary_seq = 0


def _err(exc: tbo.TboError) -> dict:
    """Map a typed TBO error to a structured tool result the LLM can relay."""
    kind = {
        tbo.TboAuthError: "auth_error",
        tbo.TboTraceExpired: "search_expired",
    }.get(type(exc), "error")
    return {"status": kind, "message": exc.message}


def _segment_summary(segments: list) -> dict:
    """Flatten TBO's nested Segments[][] (one inner list per leg group) to a
    human-friendly summary: first-leg departure, last-leg arrival, stop count."""
    legs = [leg for group in segments for leg in (group if isinstance(group, list) else [group])]
    if not legs:
        return {}
    # Per the live response: DepTime/ArrTime are siblings of Airport, one level
    # ABOVE it (Origin.DepTime, Destination.ArrTime), while the airport code is
    # Origin.Airport.AirportCode. Duration is per-leg, in minutes.
    origin_node = legs[0].get("Origin", {})
    dest_node = legs[-1].get("Destination", {})
    airlines = sorted({leg.get("Airline", {}).get("AirlineName") for leg in legs if leg.get("Airline")})
    return {
        "airline": ", ".join(a for a in airlines if a),
        "flight_numbers": [
            f"{leg.get('Airline', {}).get('AirlineCode', '')}{leg.get('Airline', {}).get('FlightNumber', '')}"
            for leg in legs
        ],
        "from": origin_node.get("Airport", {}).get("AirportCode"),
        "to": dest_node.get("Airport", {}).get("AirportCode"),
        "departure": origin_node.get("DepTime"),
        "arrival": dest_node.get("ArrTime"),
        "stops": max(len(legs) - 1, 0),
        "duration_minutes": sum(leg.get("Duration") or 0 for leg in legs) or None,
    }


# --------------------------------------------------------------------------- #
# 1. Search                                                                    #
# --------------------------------------------------------------------------- #


def flight_search(
    origin: str,
    destination: str,
    departure_date: str,
    adults: int,
    children: int = 0,
    infants: int = 0,
    cabin_class: int = 2,
    return_date: str = "",
    direct_only: bool = False,
) -> dict:
    """Search TBO for flights and return ranked options plus a TraceId.

    Call this once you know the patient's origin city, travel date and party
    size. Pass the returned trace_id and a chosen result_index to
    flight_farequote next. The TraceId expires after 15 minutes.

    Args:
        origin: Origin city/airport code, e.g. "DXB", "DEL".
        destination: Destination city/airport code (the hospital's city), e.g. "HYD", "DEL", "BOM".
        departure_date: Outbound date as YYYY-MM-DD.
        adults: Number of adult passengers (>=1).
        children: Number of children (2-11y). Default 0.
        infants: Number of infants (<2y). Default 0.
        cabin_class: 1=All,2=Economy,3=PremiumEconomy,4=Business,5=PremiumBusiness,6=First. Default 2.
        return_date: Optional return date as YYYY-MM-DD for a round trip; empty for one-way.
        direct_only: If true, only non-stop flights. Default false.

    Returns:
        dict with "status", "trace_id", and "results": a ranked list (cheapest
        first, max 6) of {result_index, airline, flight_numbers, from, to,
        departure, arrival, stops, published_fare, currency, is_lcc,
        is_refundable}. On failure, status is "auth_error"/"error" with a message.
    """
    segments = [{
        "Origin": origin.strip().upper(),
        "Destination": destination.strip().upper(),
        "FlightCabinClass": cabin_class,
        "PreferredDepartureTime": f"{departure_date}T00:00:00",
        "PreferredArrivalTime": f"{departure_date}T00:00:00",
    }]
    journey = _JOURNEY_ONEWAY
    if return_date:
        journey = _JOURNEY_RETURN
        segments.append({
            "Origin": destination.strip().upper(),
            "Destination": origin.strip().upper(),
            "FlightCabinClass": cabin_class,
            "PreferredDepartureTime": f"{return_date}T00:00:00",
            "PreferredArrivalTime": f"{return_date}T00:00:00",
        })

    # The working hopatlas collection sends counts and the boolean flags as
    # QUOTED STRINGS (not JSON numbers/bools); match it exactly.
    payload = {
        "AdultCount": str(int(adults)),
        "ChildCount": str(int(children)),
        "InfantCount": str(int(infants)),
        "JourneyType": journey,
        "DirectFlight": "true" if direct_only else "false",
        "OneStopFlight": "false",
        "Segments": segments,
    }

    try:
        resp = tbo.post("Search", payload)
    except tbo.TboError as exc:
        return _err(exc)

    trace_id = resp.get("TraceId", "")
    tbo.register_trace(trace_id)

    # Results is a list of result-groups (one per leg for return fares); for a
    # one-way it's [[...]]. Flatten and rank by PublishedFare.
    groups = resp.get("Results") or []
    flat = [r for group in groups for r in (group if isinstance(group, list) else [group])]

    options = []
    for r in flat:
        fare = r.get("Fare") or {}
        options.append({
            "result_index": r.get("ResultIndex"),
            "is_lcc": bool(r.get("IsLCC")),
            "is_refundable": bool(r.get("IsRefundable")),
            "published_fare": fare.get("PublishedFare"),
            "currency": fare.get("Currency"),
            **_segment_summary(r.get("Segments") or []),
        })
    options.sort(key=lambda o: (o.get("published_fare") is None, o.get("published_fare") or 0))

    return {
        "status": "ok" if options else "no_results",
        "trace_id": trace_id,
        "is_return": bool(return_date),
        "results": options[:6],
    }


# --------------------------------------------------------------------------- #
# 2. FareQuote (re-price)                                                      #
# --------------------------------------------------------------------------- #


def _farequote(trace_id: str, result_index: str) -> dict:
    """Internal: call FareQuote and return {price_changed, result}.

    Per the working collection, FareQuote's Results is a single object (not an
    array) and BOTH the fare and the IsPriceChanged flag live INSIDE it:
    Response.Results.Fare and Response.Results.IsPriceChanged.
    """
    tbo.assert_trace_fresh(trace_id)
    resp = tbo.post("FareQuote", {"TraceId": trace_id, "ResultIndex": result_index})
    result = resp.get("Results") or {}
    # Fall back to the top level too, in case the envelope ever differs.
    price_changed = result.get("IsPriceChanged", resp.get("IsPriceChanged"))
    return {"price_changed": bool(price_changed), "result": result}


def flight_farequote(trace_id: str, result_index: str) -> dict:
    """Re-price a chosen flight before booking; the fare may have changed.

    Call this after the patient picks an option from flight_search, using that
    option's result_index and the search's trace_id. Show the patient the
    re-priced fare (and call out if it changed) before assembling the summary.

    Args:
        trace_id: The trace_id returned by flight_search.
        result_index: The chosen option's result_index.

    Returns:
        dict with "status", "price_changed", "published_fare", "offered_fare",
        "currency", "is_lcc", "is_refundable", and echoes "trace_id"/"result_index".
        status "search_expired" means the 15-minute window lapsed — re-search.
    """
    try:
        fq = _farequote(trace_id, result_index)
    except tbo.TboError as exc:
        return _err(exc)

    result = fq["result"]
    fare = result.get("Fare") or {}
    return {
        "status": "ok",
        "trace_id": trace_id,
        "result_index": result.get("ResultIndex", result_index),
        "price_changed": fq["price_changed"],
        "is_lcc": bool(result.get("IsLCC")),
        "is_refundable": bool(result.get("IsRefundable")),
        "published_fare": fare.get("PublishedFare"),
        "offered_fare": fare.get("OfferedFare"),
        "base_fare": fare.get("BaseFare"),
        "tax": fare.get("Tax"),
        "currency": fare.get("Currency"),
    }


# --------------------------------------------------------------------------- #
# 3. prepare_booking_summary (the handoff — STOPS BEFORE PAYMENT)             #
# --------------------------------------------------------------------------- #


def _book_ready_passengers(passengers: list[dict], passport_required: bool) -> list[dict]:
    """Build the TBO Book-ready Passenger payload shape from plain dicts.

    This is the exact shape the downstream Book call will need; we assemble it
    now so the post-payment step is a clean POST. Passport fields are only
    included when FareQuote says the fare requires them.
    """
    out = []
    for i, p in enumerate(passengers):
        pax = {
            "Title": p.get("title", "Mr"),
            "FirstName": p["first_name"],
            "LastName": p["last_name"],
            "PaxType": _PAXTYPE.get(str(p.get("type", "adult")).lower(), 1),
            "DateOfBirth": p.get("date_of_birth", ""),
            "Gender": p.get("gender", 1),
            "ContactNo": p.get("contact_no", ""),
            "Email": p.get("email", ""),
            "IsLeadPax": i == 0,
        }
        if passport_required:
            pax["PassportNo"] = p.get("passport_no", "")
            pax["PassportExpiry"] = p.get("passport_expiry", "")
        out.append(pax)
    return out


def prepare_booking_summary(
    trace_id: str,
    result_index: str,
    passengers: list[dict],
    hotel: dict | None = None,
) -> dict:
    """Assemble the final pre-payment booking package. Call this ONLY after the
    patient has chosen a flight (and hotel) and you are ready to summarise before
    sending them to pay. This is the LAST step — it stops before payment.

    It re-prices the flight one final time (FareQuote) to lock the displayed
    fare, flags if the price changed, builds the Book-ready passenger payload,
    mints a reference, and returns a clean payment-handoff package. It does NOT
    book or ticket anything.

    Args:
        trace_id: The trace_id from flight_search.
        result_index: The chosen flight's result_index.
        passengers: List of passenger dicts. Each needs first_name, last_name,
            type ("adult"/"child"/"infant"), title, gender (1=male,2=female),
            contact_no, email; plus passport_no, passport_expiry (YYYY-MM-DD) and
            date_of_birth when international travel requires a passport.
        hotel: Optional chosen-hotel dict, e.g. {"hotel_id","name",
            "price_per_night_usd","nights","currency"}.

    Returns:
        dict with "status" ("ready_for_payment"), "reference", "flight"
        (re-priced), "price_changed", "passengers" (Book-ready shape), "hotel",
        "totals", and "payment" (the handoff seam). status "search_expired" or
        "auth_error" means fix that first.
    """
    global _summary_seq
    if not passengers:
        return {"status": "error", "message": "At least one passenger is required."}

    try:
        fq = _farequote(trace_id, result_index)
    except tbo.TboError as exc:
        return _err(exc)

    result = fq["result"]
    fare = result.get("Fare") or {}
    passport_required = bool(result.get("IsPassportRequiredAtBook"))
    currency = fare.get("Currency")
    flight_total = fare.get("PublishedFare")

    _summary_seq += 1
    reference = f"MB-TRV-{_summary_seq:04d}"

    hotel_total = None
    if hotel and hotel.get("price_per_night_usd") and hotel.get("nights"):
        hotel_total = float(hotel["price_per_night_usd"]) * int(hotel["nights"])

    summary = {
        "status": "ready_for_payment",
        "reference": reference,
        "price_changed": fq["price_changed"],
        "flight": {
            "result_index": result.get("ResultIndex", result_index),
            "is_lcc": bool(result.get("IsLCC")),
            "is_refundable": bool(result.get("IsRefundable")),
            "published_fare": flight_total,
            "currency": currency,
            "passport_required": passport_required,
            **_segment_summary(result.get("Segments") or []),
        },
        "passengers": _book_ready_passengers(passengers, passport_required),
        "hotel": hotel,
        "totals": {
            "flight": flight_total,
            "flight_currency": currency,
            "hotel_usd": hotel_total,
        },
        # --- Payment handoff seam -------------------------------------------
        # The journey is fully assembled and priced. The next step is to collect
        # payment, and ONLY after a successful charge does ticketing/booking run.
        # TODO: payment gateway — on success, resume with TBO Book/Ticket using
        # this trace_id + result_index + the Book-ready `passengers` payload.
        "payment": {
            "status": "pending_payment",
            "next_action": "Proceed to Payment",
            "amount_flight": flight_total,
            "amount_flight_currency": currency,
            "amount_hotel_usd": hotel_total,
        },
        "note": (
            "Pre-payment summary only. No flight or hotel has been booked or "
            "ticketed. Booking happens after payment."
        ),
    }
    return summary
