"""Tool: find_nearby_places — post-surgery support places around a hospital.

After a patient has a recommended hospital, they often need nearby services:
diagnostic / medical labs, pharmacies, physiotherapy, follow-up clinics,
accommodation for an attendant, etc. This tool answers "find a medical lab near
Apollo Hospitals Hyderabad" using the **Google Places API (New)** in two steps:

  1. Text Search  (places:searchText) — resolve the hospital name + city to a
     place with coordinates.
  2. Nearby Search (places:searchNearby) — find the requested category within a
     radius of those coordinates, ranked by distance.

Categories the patient asks for in plain language are mapped to Places "Table A"
types (medical_lab, pharmacy, physiotherapist, ...). Anything we can't map falls
back to a Text Search ("<category> near <hospital>") so the tool still answers.

Returns clean structured JSON; the agent presents it to the patient as a short
text list. Auth is by API key (GOOGLE_PLACES_API_KEY / GOOGLE_MAPS_API_KEY) — no
gcloud login needed. With no key set, returns status "no_key" so the agent can
say the feature isn't configured rather than crash.
"""

from __future__ import annotations

import json
import math
import os
import urllib.error
import urllib.request

_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
_NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby"

# Plain-language category -> Places API (New) "Table A" type. Order matters only
# for readability; matching is by substring against the patient's phrasing.
_CATEGORY_TO_TYPE: dict[str, str] = {
    "medical lab": "medical_lab",
    "diagnostic": "medical_lab",
    "diagnostic center": "medical_lab",
    "diagnostic centre": "medical_lab",
    "pathology": "medical_lab",
    "blood test": "medical_lab",
    "lab": "medical_lab",
    "scan": "medical_lab",
    "radiology": "medical_lab",
    "imaging": "medical_lab",
    "pharmacy": "pharmacy",
    "chemist": "pharmacy",
    "medical store": "pharmacy",
    "medicine": "pharmacy",
    "drugstore": "drugstore",
    "physiotherapy": "physiotherapist",
    "physiotherapist": "physiotherapist",
    "physio": "physiotherapist",
    "rehab": "physiotherapist",
    "rehabilitation": "physiotherapist",
    "dentist": "dental_clinic",
    "dental": "dental_clinic",
    "doctor": "doctor",
    "clinic": "doctor",
    "follow up": "doctor",
    "follow-up": "doctor",
    "gp": "doctor",
    "hospital": "hospital",
    "emergency": "hospital",
    "wellness": "wellness_center",
    "spa": "spa",
    "hotel": "lodging",
    "accommodation": "lodging",
    "lodging": "lodging",
    "guest house": "lodging",
    "stay": "lodging",
}


def _resolve_type(category: str) -> str | None:
    c = (category or "").strip().lower()
    if c in _CATEGORY_TO_TYPE:
        return _CATEGORY_TO_TYPE[c]
    for phrase, typ in _CATEGORY_TO_TYPE.items():
        if phrase in c:
            return typ
    return None


def _api_key() -> str:
    return (
        os.environ.get("GOOGLE_PLACES_API_KEY")
        or os.environ.get("GOOGLE_MAPS_API_KEY")
        or ""
    ).strip()


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> int:
    r1, r2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    h = math.sin(dlat / 2) ** 2 + math.cos(r1) * math.cos(r2) * math.sin(dlon / 2) ** 2
    return int(round(2 * 6371000 * math.asin(min(1.0, math.sqrt(h)))))


def _post(url: str, body: dict, field_mask: str, timeout: int = 15) -> dict:
    """POST JSON to a Places endpoint with the API key + field mask headers."""
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": _api_key(),
            "X-Goog-FieldMask": field_mask,
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _geocode_hospital(query: str) -> dict | None:
    """Text Search -> the first matching place's name/address/coords, or None."""
    field_mask = "places.id,places.displayName,places.formattedAddress,places.location"
    data = _post(_TEXT_SEARCH_URL, {"textQuery": query, "maxResultCount": 1}, field_mask)
    places = data.get("places") or []
    if not places:
        return None
    p = places[0]
    loc = p.get("location") or {}
    return {
        "name": (p.get("displayName") or {}).get("text") or query,
        "address": p.get("formattedAddress"),
        "lat": loc.get("latitude"),
        "lng": loc.get("longitude"),
    }


def _clean_place(p: dict, center: dict) -> dict:
    loc = p.get("location") or {}
    lat, lng = loc.get("latitude"), loc.get("longitude")
    dist = None
    if all(isinstance(v, (int, float)) for v in (lat, lng, center.get("lat"), center.get("lng"))):
        dist = _haversine_m(center["lat"], center["lng"], lat, lng)
    hours = p.get("currentOpeningHours") or p.get("regularOpeningHours") or {}
    return {
        "name": (p.get("displayName") or {}).get("text"),
        "address": p.get("formattedAddress"),
        "rating": p.get("rating"),
        "ratings_count": p.get("userRatingCount"),
        "open_now": hours.get("openNow"),
        "distance_m": dist,
        "phone": p.get("nationalPhoneNumber"),
        "maps_url": p.get("googleMapsUri"),
    }


def find_nearby_places(
    category: str,
    near_hospital: str,
    city: str = "",
    radius_m: int = 3000,
    max_results: int = 8,
) -> dict:
    """Find support places (labs, pharmacies, physio, etc.) near a hospital.

    Call this when a patient asks for nearby services around a specific hospital
    — e.g. "find a diagnostic lab near Apollo Hospitals Hyderabad", "pharmacies
    close to the hospital", "physiotherapy nearby for recovery". First resolves
    the hospital's location, then searches the requested category around it.

    Args:
        category: What to find, in plain language — e.g. "medical lab",
            "diagnostic center", "pharmacy", "physiotherapy", "dentist",
            "follow-up clinic", "hotel for attendant".
        near_hospital: The hospital name to search around, e.g. "Apollo Hospitals".
        city: The hospital's city, e.g. "Hyderabad". Strongly recommended so the
            right branch is located.
        radius_m: Search radius in metres (default 3000, max 50000).
        max_results: Max places to return (default 8, max 20).

    Returns:
        dict with "status" and, on success, "center" (the resolved hospital) and
        "places": a distance-ranked list of {name, address, rating,
        ratings_count, open_now, distance_m, phone, maps_url}. status is "no_key"
        if the Places API key isn't configured, "not_found" if the hospital
        couldn't be located, "no_results" if nothing matched, "error" on failure.
    """
    if not _api_key():
        return {
            "status": "no_key",
            "message": "Google Places API key is not configured (GOOGLE_PLACES_API_KEY).",
        }

    query = " ".join(part for part in (near_hospital, city) if part).strip()
    if not query:
        return {"status": "error", "message": "A hospital name is required to search nearby."}

    radius_m = max(100, min(int(radius_m or 3000), 50000))
    max_results = max(1, min(int(max_results or 8), 20))

    try:
        center = _geocode_hospital(query)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:300] if exc.fp else ""
        return {"status": "error", "message": f"Places text search failed (HTTP {exc.code}): {detail}"}
    except Exception as exc:
        return {"status": "error", "message": f"Places text search failed: {exc}"}

    if not center or center.get("lat") is None:
        return {"status": "not_found", "message": f"Could not locate '{query}'.", "category": category}

    place_type = _resolve_type(category)
    field_mask = (
        "places.displayName,places.formattedAddress,places.location,places.rating,"
        "places.userRatingCount,places.currentOpeningHours,places.googleMapsUri,"
        "places.nationalPhoneNumber"
    )

    try:
        if place_type:
            body = {
                "includedTypes": [place_type],
                "maxResultCount": max_results,
                "rankPreference": "DISTANCE",
                "locationRestriction": {
                    "circle": {
                        "center": {"latitude": center["lat"], "longitude": center["lng"]},
                        "radius": float(radius_m),
                    }
                },
            }
            data = _post(_NEARBY_URL, body, field_mask)
        else:
            # No mapped type — natural-language Text Search biased to the hospital.
            body = {
                "textQuery": f"{category} near {query}",
                "maxResultCount": max_results,
                "locationBias": {
                    "circle": {
                        "center": {"latitude": center["lat"], "longitude": center["lng"]},
                        "radius": float(radius_m),
                    }
                },
            }
            data = _post(_TEXT_SEARCH_URL, body, field_mask)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:300] if exc.fp else ""
        return {"status": "error", "message": f"Places search failed (HTTP {exc.code}): {detail}"}
    except Exception as exc:
        return {"status": "error", "message": f"Places search failed: {exc}"}

    places = [_clean_place(p, center) for p in (data.get("places") or [])]
    places = [p for p in places if p.get("name")]
    places.sort(key=lambda p: (p.get("distance_m") is None, p.get("distance_m") or 0))

    return {
        "status": "ok" if places else "no_results",
        "category": category,
        "resolved_type": place_type,
        "center": center,
        "radius_m": radius_m,
        "places": places[:max_results],
    }
