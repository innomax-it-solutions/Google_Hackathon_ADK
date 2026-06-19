"""Hotel tools — live data via SerpApi's Google Hotels engine.

Scope boundary mirrors flights: search/present ONLY, STOP BEFORE PAYMENT. We
surface indicative options (name, star rating, nightly price, rating, booking
link) so the journey flow can be planned end to end; we never block a room or
take payment. The patient's chosen option is passed into
prepare_booking_summary's `hotel` argument exactly like a flight result.

Provider: SerpApi google_hotels (https://serpapi.com/google-hotels-api). It is
key-authorized (works from anywhere, including Cloud Run — unlike IP-whitelisted
TBO) but the free tier is ~100 searches/month, so treat calls as a scarce
resource. Set the key in the environment as SERPAPI_KEY (loaded from .env via
python-dotenv). If the key is missing or the call fails/returns nothing, we fall
back to clearly-labelled placeholder options (status="placeholder") so the
journey never breaks and the agent discloses the data isn't live.

Uses stdlib urllib (matching aviation_client.py) — no extra dependency.
"""

from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request

_SERPAPI_URL = "https://serpapi.com/search.json"
_TIMEOUT_SECONDS = 12
_MAX_RESULTS = 14   # parse a wide pool; the caller ranks + trims for display

# Google "type" strings for non-hotel stays we exclude when hotels_only is set.
_RENTAL_TYPES = ("vacation rental", "apartment", "rental", "guest house", "hostel", "cottage", "villa", "home", "condo")

_LIVE_DISCLOSURE = (
    "Live hotel options from Google Hotels (via SerpApi). Prices are indicative "
    "and can change — confirm the exact rate at booking. We do not block rooms "
    "or take payment here."
)
_PLACEHOLDER_DISCLOSURE = (
    "Placeholder hotel data — live hotel search is not configured (no SERPAPI_KEY) "
    "or was unavailable. Tell the patient these are indicative options, not live "
    "availability."
)


def _api_key() -> str:
    return (os.environ.get("SERPAPI_KEY") or "").strip()


def _placeholder(city: str, checkin_date: str, checkout_date: str, rooms: int) -> dict:
    """Indicative options used when live search can't run. Same shape as live."""
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


def _is_rental(prop: dict) -> bool:
    """True for apartments / vacation rentals / homestays (not real hotels)."""
    t = (prop.get("type") or "").strip().lower()
    return any(kw in t for kw in _RENTAL_TYPES)


def _nearest_landmark(prop: dict) -> str | None:
    """A short human area hint from the property's nearby_places, if any."""
    for place in prop.get("nearby_places") or []:
        name = place.get("name")
        if name:
            return name
    return None


def _parse_property(prop: dict) -> dict:
    """Map one SerpApi property to our clean, frontend-friendly result shape."""
    rate = prop.get("rate_per_night") or {}
    total = prop.get("total_rate") or {}
    images = prop.get("images") or []
    return {
        "hotel_id": prop.get("property_token"),
        "name": prop.get("name"),
        "type": prop.get("type"),
        "star_rating": prop.get("extracted_hotel_class"),
        "rating": prop.get("overall_rating"),
        "reviews": prop.get("reviews"),
        "price_per_night_usd": rate.get("extracted_lowest"),
        "total_usd": total.get("extracted_lowest"),
        "currency": "USD",
        "area": _nearest_landmark(prop),
        "gps": prop.get("gps_coordinates"),
        "thumbnail": (images[0] or {}).get("thumbnail") if images else None,
        "link": prop.get("link"),
    }


def hotel_search(
    city: str,
    checkin_date: str,
    checkout_date: str,
    rooms: int = 1,
    adults: int = 1,
    near_hospital: str = "",
    hotel_class: str = "",
    hotels_only: bool = False,
) -> dict:
    """Search hotels near the treatment city via live Google Hotels data.

    Returns indicative options (name, star rating, nightly price in USD, guest
    rating, and a booking link) so the journey can be planned end to end. Prices
    are NOT a locked quote — tell the patient to confirm at booking. Pass a
    chosen option into prepare_booking_summary's `hotel` argument.

    If live search is unavailable (no SERPAPI_KEY, network error, or no
    results), returns clearly-labelled placeholder options with
    status="placeholder" — disclose that to the patient.

    Args:
        city: Destination city (the hospital's city), e.g. "Hyderabad".
        checkin_date: Check-in date YYYY-MM-DD.
        checkout_date: Check-out date YYYY-MM-DD.
        rooms: Number of rooms. Default 1.
        adults: Total adult guests. Default 1.
        near_hospital: Optional hospital name to bias results to its vicinity,
            e.g. "Apollo Hospitals". When given, the query becomes
            "hotels near {near_hospital}, {city}".
        hotel_class: Optional Google star-class filter, a comma-separated list of
            2..5, e.g. "4,5" to bias toward premium hotels (used for larger
            budgets). Empty = no class filter.
        hotels_only: When True, apartments / vacation rentals / homestays are
            dropped so only real hotels remain.

    Returns:
        dict with "status" ("ok" or "placeholder"), a "disclosure" string, the
        echoed search params, and "results": a list of hotels with hotel_id,
        name, star_rating, rating, price_per_night_usd, total_usd, currency,
        area, gps, thumbnail, and link.
    """
    key = _api_key()
    if not key:
        return _placeholder(city, checkin_date, checkout_date, rooms)

    query = f"hotels near {near_hospital}, {city}" if near_hospital.strip() else f"{city} hotels"
    query_params = {
        "engine": "google_hotels",
        "q": query,
        "check_in_date": checkin_date,
        "check_out_date": checkout_date,
        "adults": max(1, int(adults)),
        "currency": "USD",
        "gl": "us",
        "hl": "en",
        "api_key": key,
    }
    if hotel_class.strip():
        query_params["hotel_class"] = hotel_class.strip()
    params = urllib.parse.urlencode(query_params)

    try:
        with urllib.request.urlopen(f"{_SERPAPI_URL}?{params}", timeout=_TIMEOUT_SECONDS) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception:
        return _placeholder(city, checkin_date, checkout_date, rooms)

    if data.get("error"):
        return _placeholder(city, checkin_date, checkout_date, rooms)

    properties = data.get("properties") or []
    if hotels_only:
        properties = [p for p in properties if not _is_rental(p)]
    results = [_parse_property(p) for p in properties[:_MAX_RESULTS] if p.get("name")]
    if not results:
        return _placeholder(city, checkin_date, checkout_date, rooms)

    return {
        "status": "ok",
        "disclosure": _LIVE_DISCLOSURE,
        "city": city,
        "checkin_date": checkin_date,
        "checkout_date": checkout_date,
        "rooms": rooms,
        "results": results,
    }
