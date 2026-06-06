"""City name -> primary IATA airport for hospital destinations.

The hospital registry stores city names (e.g. "Hyderabad", "Navi Mumbai"), not
airport codes; the live agent infers airports via the LLM. This deterministic map
lets the per-hospital re-cost endpoint (/estimate_hospital) pick a destination
airport WITHOUT the LLM, so a flight can be searched for any of the suggested
hospitals — not just the one the agent costed.

Covers every city present in data/hospital_registry.json.
"""

from __future__ import annotations

CITY_TO_IATA = {
    "Bangalore": "BLR",
    "Bengaluru": "BLR",
    "Hyderabad": "HYD",
    "Chennai": "MAA",
    "Delhi": "DEL",
    "New Delhi": "DEL",
    "Gurugram": "DEL",      # nearest major international airport
    "Mumbai": "BOM",
    "Navi Mumbai": "BOM",
    "Visakhapatnam": "VTZ",
    "Coimbatore": "CJB",
}


def iata_for_city(city: str) -> str | None:
    """Best-effort IATA code for a hospital city, or None if unknown."""
    if not city:
        return None
    c = city.strip()
    return CITY_TO_IATA.get(c) or CITY_TO_IATA.get(c.title())
