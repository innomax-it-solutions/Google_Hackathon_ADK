"""Hotel tools — PLACEHOLDER pending the Universal Hotel API doc content.

Decision: hotels use TBO's **Universal Hotel API** (api.tektravels.com, REST/JSON,
shares the TokenId auth in tbo_client.py). Scope is search/detail ONLY — same
stop-before-payment boundary as flights (no room block, no hotel booking).

These tools cannot be built accurately yet: the official doc
(https://api.tektravels.com/hotelAPIDocument/) is a JS-rendered page that the
fetch tooling returns "Invalid Resource Requested" for, so the exact REST method
names (CityId static-data lookup, HotelSearch, GetHotelRoom) and field schemas
aren't confirmed — and we don't guess TBO field names.

Until the doc content is provided, hotel_search returns clearly-labelled
placeholder data so the journey flow (search -> present -> summarise) works end
to end. Every result is marked status="placeholder" so the agent discloses it.

To finish: feed me the Universal Hotel API doc (PDF/HTML/text), I'll restate the
CityId-resolution -> HotelSearch -> room/price schemas, then replace the bodies
below with real tbo_client.post(...) calls to the Hotel service base URL.
"""

from __future__ import annotations

_PLACEHOLDER_DISCLOSURE = (
    "Placeholder hotel data — the live TBO Universal Hotel API is not yet wired "
    "in (awaiting the official doc). Tell the patient these are indicative "
    "options, not live availability."
)


def hotel_search(
    city: str,
    checkin_date: str,
    checkout_date: str,
    rooms: int = 1,
    adults: int = 1,
) -> dict:
    """Search hotels near the treatment city (PLACEHOLDER — not live yet).

    Returns indicative options so the journey can be planned end to end. The
    results are NOT live availability; disclose this to the patient. Pass a
    chosen option into prepare_booking_summary's `hotel` argument.

    Args:
        city: Destination city (the hospital's city), e.g. "Hyderabad".
        checkin_date: Check-in date YYYY-MM-DD.
        checkout_date: Check-out date YYYY-MM-DD.
        rooms: Number of rooms. Default 1.
        adults: Total adult guests. Default 1.

    Returns:
        dict with status "placeholder", a "disclosure" string, and "results":
        a list of {hotel_id, name, star_rating, area, price_per_night_usd, currency}.
    """
    options = [
        {"hotel_id": "PH-001", "name": f"{city} Medical District Suites", "star_rating": 4,
         "area": "Near hospital", "price_per_night_usd": 55, "currency": "USD"},
        {"hotel_id": "PH-002", "name": f"{city} Comfort Inn (recovery-friendly)", "star_rating": 3,
         "area": "10 min from hospital", "price_per_night_usd": 35, "currency": "USD"},
        {"hotel_id": "PH-003", "name": f"{city} Grand Care Hotel", "star_rating": 5,
         "area": "Hospital-adjacent", "price_per_night_usd": 95, "currency": "USD"},
    ]
    return {
        "status": "placeholder",
        "disclosure": _PLACEHOLDER_DISCLOSURE,
        "city": city,
        "checkin_date": checkin_date,
        "checkout_date": checkout_date,
        "rooms": rooms,
        "results": options,
    }
