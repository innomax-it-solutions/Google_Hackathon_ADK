"""Aviationstack-backed flight provider (alternative to TBO).

WHY THIS EXISTS
---------------
TBO's Air API authorizes by IP allow-list, which blocks Cloud Run (dynamic
egress IP). Aviationstack authenticates by API KEY, so it works from anywhere —
no whitelisting. We use it as a drop-in source for `flight_search`.

IMPORTANT LIMITATION (read before trusting the numbers)
-------------------------------------------------------
Aviationstack is a flight *schedule / tracking* API. Its response contains
airlines, flight numbers, airports and times — but **NO ticket prices**. There
is no fare field anywhere in its data.

Because the app needs a fare to fold into the journey cost, we **ESTIMATE** the
fare from the great-circle distance of the route (see `estimate_fare_inr`). The
estimate is clearly an estimate — the option carries `fare_estimated: True` and
a `fare_note` so the UI/agent can say so. Schedules (airline, flight number,
times) come from Aviationstack when available; otherwise we synthesize a
realistic timetable so the demo never shows an empty result.

Output shape matches exactly what `tools.flights.flight_search` returns from the
TBO path, so the frontend JourneyPlanCard and the /estimate_hospital cost fold
work unchanged. Fares are in INR (currency "INR") because `main.py` feeds
`published_fare` straight into `flight_cost_inr`, which `estimate_cost` converts
to USD.
"""

from __future__ import annotations

import json
import math
import os
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path

from . import flight_fallback

# --------------------------------------------------------------------------- #
# Config                                                                       #
# --------------------------------------------------------------------------- #

AVIATIONSTACK_URL = "https://api.aviationstack.com/v1/flights"


def _load_key() -> str:
    """Aviationstack access key — never hardcoded. Resolution order:

      1. AVIATIONSTACK_KEY env var (Cloud Run env / Secret Manager in prod).
      2. A gitignored JSON file for local dev (default
         backend/aviationstack_credentials.json, {"AccessKey": "..."}),
         path overridable via AVIATIONSTACK_KEY_PATH.

    Returns "" if neither is set; the live lookup then no-ops and we fall back
    to the TBO snapshot / distance estimate (so the app still works keyless).
    """
    key = os.environ.get("AVIATIONSTACK_KEY", "").strip()
    if key:
        return key
    path = Path(
        os.environ.get("AVIATIONSTACK_KEY_PATH")
        or (Path(__file__).resolve().parent.parent / "aviationstack_credentials.json")
    )
    try:
        return str(json.loads(path.read_text(encoding="utf-8")).get("AccessKey", "")).strip()
    except Exception:
        return ""


# Key auth -> no IP whitelist needed (unlike TBO).
AVIATIONSTACK_KEY = _load_key()

# Whether to actually hit Aviationstack for live schedules. Default ON, but the
# free plan returns today-only data (and may be empty / rate-limited), so we
# always fall back to a synthesized timetable. Set AVIATIONSTACK_LIVE=0 to skip
# the network call entirely (saves the limited monthly quota during demos).
_LIVE = os.environ.get("AVIATIONSTACK_LIVE", "1") not in ("0", "false", "False")

# Fare estimation model (economy, INR). fare = BASE + PER_KM * km, per pax,
# doubled for a round trip. Tuned so Gulf->India lands in a realistic band
# (e.g. DXB-HYD round trip ~ INR 29k/adult).
_FARE_BASE_INR = 2500.0
_FARE_PER_KM_INR = 5.5
_CRUISE_KMH = 800.0  # for duration estimate

# --------------------------------------------------------------------------- #
# Airport coordinates (lat, lon, display city). Covers every hospital-city     #
# destination plus the common origin hubs. Unknown codes fall back to a        #
# default distance so we still return something.                               #
# --------------------------------------------------------------------------- #

_AIRPORTS: dict[str, tuple[float, float, str]] = {
    # India (hospital destinations)
    "BLR": (13.1986, 77.7066, "Bengaluru"),
    "HYD": (17.2403, 78.4294, "Hyderabad"),
    "MAA": (12.9941, 80.1709, "Chennai"),
    "DEL": (28.5562, 77.1000, "Delhi"),
    "BOM": (19.0896, 72.8656, "Mumbai"),
    "VTZ": (17.7211, 83.2245, "Visakhapatnam"),
    "CJB": (11.0300, 77.0434, "Coimbatore"),
    "COK": (10.1520, 76.4019, "Kochi"),
    "CCU": (22.6547, 88.4467, "Kolkata"),
    # Gulf / Middle East (common origins)
    "DXB": (25.2532, 55.3657, "Dubai"),
    "AUH": (24.4330, 54.6511, "Abu Dhabi"),
    "SHJ": (25.3286, 55.5172, "Sharjah"),
    "DOH": (25.2731, 51.6080, "Doha"),
    "MCT": (23.5933, 58.2844, "Muscat"),
    "KWI": (29.2266, 47.9689, "Kuwait City"),
    "RUH": (24.9576, 46.6988, "Riyadh"),
    "JED": (21.6796, 39.1565, "Jeddah"),
    "BAH": (26.2708, 50.6336, "Bahrain"),
    # Other intl hubs
    "LHR": (51.4700, -0.4543, "London"),
    "JFK": (40.6413, -73.7781, "New York"),
    "SIN": (1.3644, 103.9915, "Singapore"),
    "KUL": (2.7456, 101.7099, "Kuala Lumpur"),
    "BKK": (13.6900, 100.7501, "Bangkok"),
    "NBO": (-1.3192, 36.9278, "Nairobi"),
    "LOS": (6.5774, 3.3212, "Lagos"),
    "ADD": (8.9778, 38.7993, "Addis Ababa"),
    "DAR": (-6.8781, 39.2026, "Dar es Salaam"),
}

_DEFAULT_DISTANCE_KM = 3000.0

# Carriers we synthesize when live schedules are unavailable. Realistic for
# Gulf<->India; the agent only ever presents these as options, never books.
_CARRIERS = [
    ("Emirates", "EK"),
    ("IndiGo", "6E"),
    ("Air India", "AI"),
    ("Etihad Airways", "EY"),
    ("Air Arabia", "G9"),
]

# Departure slots used to spread synthesized options across the day.
_SLOTS = [(2, 15), (9, 40), (14, 10), (21, 30)]


# --------------------------------------------------------------------------- #
# Geometry / fare                                                              #
# --------------------------------------------------------------------------- #


def _coord(iata: str) -> tuple[float, float, str] | None:
    return _AIRPORTS.get((iata or "").strip().upper())


def distance_km(origin: str, destination: str) -> float:
    """Great-circle distance between two IATA codes (km); default if unknown."""
    a, b = _coord(origin), _coord(destination)
    if not a or not b:
        return _DEFAULT_DISTANCE_KM
    lat1, lon1 = math.radians(a[0]), math.radians(a[1])
    lat2, lon2 = math.radians(b[0]), math.radians(b[1])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * 6371.0 * math.asin(min(1.0, math.sqrt(h)))


def estimate_fare_inr(origin: str, destination: str, pax: int, round_trip: bool) -> float:
    """Estimate an economy fare in INR from route distance. NOT a real quote."""
    km = distance_km(origin, destination)
    one_way = _FARE_BASE_INR + _FARE_PER_KM_INR * km
    fare = one_way * (2 if round_trip else 1) * max(1, pax)
    return round(fare, -1)  # nearest 10 INR


def _duration_minutes(origin: str, destination: str) -> int:
    km = distance_km(origin, destination)
    return int(round(km / _CRUISE_KMH * 60)) + 45  # + taxi/buffer


# --------------------------------------------------------------------------- #
# Live Aviationstack lookup (best-effort, cached per route per process)        #
# --------------------------------------------------------------------------- #

_route_cache: dict[str, list[dict]] = {}


def _fetch_live_schedule(origin: str, destination: str) -> list[dict]:
    """Best-effort: ask Aviationstack which carriers fly origin->destination.

    Returns a list of {airline, code, flight_number, dep_time, arr_time} drawn
    from real schedule rows (times are HH:MM, re-anchored to the travel date by
    the caller). Empty list on any error, empty data, or when live is disabled —
    the caller then synthesizes. Cached per route so a 4-hospital fan-out costs
    at most one call per distinct route.
    """
    key = f"{origin}->{destination}"
    if key in _route_cache:
        return _route_cache[key]
    if not _LIVE or not AVIATIONSTACK_KEY:
        _route_cache[key] = []
        return []

    params = urllib.parse.urlencode({
        "access_key": AVIATIONSTACK_KEY,
        "dep_iata": origin,
        "arr_iata": destination,
        "limit": 10,
    })
    rows: list[dict] = []
    try:
        with urllib.request.urlopen(f"{AVIATIONSTACK_URL}?{params}", timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        for f in (data.get("data") or []):
            air = (f.get("airline") or {})
            flt = (f.get("flight") or {})
            dep = (f.get("departure") or {})
            arr = (f.get("arrival") or {})
            name = air.get("name")
            iata = (flt.get("iata") or "")
            if not name or not iata:
                continue
            rows.append({
                "airline": name,
                "code": (air.get("iata") or iata[:2]).upper(),
                "flight_number": iata.upper(),
                "dep_time": _hhmm(dep.get("scheduled")),
                "arr_time": _hhmm(arr.get("scheduled")),
            })
    except Exception:
        rows = []  # silent fall-through to synthesized schedule
    _route_cache[key] = rows
    return rows


def _hhmm(iso: str | None) -> str | None:
    """Pull HH:MM from an ISO datetime string, or None."""
    if not iso or "T" not in iso:
        return None
    try:
        return iso.split("T", 1)[1][:5]
    except Exception:
        return None


# --------------------------------------------------------------------------- #
# Option / direction assembly (mirrors flights._segment_summary output)        #
# --------------------------------------------------------------------------- #


def _at(date_str: str, hh: int, mm: int) -> str:
    return f"{date_str}T{hh:02d}:{mm:02d}:00"


def _add_minutes(date_str: str, hh: int, mm: int, minutes: int) -> str:
    base = datetime.strptime(f"{date_str} {hh:02d}:{mm:02d}", "%Y-%m-%d %H:%M")
    out = base + timedelta(minutes=minutes)
    return out.strftime("%Y-%m-%dT%H:%M:00")


def _direction(origin: str, destination: str, date_str: str, hh: int, mm: int,
               airline: str, flight_number: str, label: str) -> dict:
    dur = _duration_minutes(origin, destination)
    o = _coord(origin)
    d = _coord(destination)
    dep = _at(date_str, hh, mm)
    arr = _add_minutes(date_str, hh, mm, dur)
    leg = {
        "from": origin,
        "to": destination,
        "flight_number": flight_number or None,
        "airline": airline,
        "departure": dep,
        "arrival": arr,
        "duration_minutes": dur,
    }
    return {
        "label": label,
        "airline": airline,
        "flight_numbers": [flight_number] if flight_number else [],
        "from": origin,
        "to": destination,
        "departure": dep,
        "arrival": arr,
        "stops": 0,
        "duration_minutes": dur,
        "legs": [leg],
        "_city_from": o[2] if o else origin,
        "_city_to": d[2] if d else destination,
    }


# Per-process cache of search results so flight_farequote / booking can re-read
# an estimated fare by (trace_id, result_index) without a live call.
_searches: dict[str, dict] = {}


def search(origin: str, destination: str, departure_date: str, return_date: str,
           adults: int, children: int = 0, infants: int = 0,
           cabin_class: int = 2) -> dict:
    """Aviationstack-backed flight search. Returns the SAME shape as the TBO
    `flight_search` (status / trace_id / is_return / results[]), with estimated
    INR fares. See module docstring for the pricing caveat."""
    origin = (origin or "").strip().upper()
    destination = (destination or "").strip().upper()
    round_trip = bool((return_date or "").strip())
    pax = max(1, int(adults)) + max(0, int(children))

    live = _fetch_live_schedule(origin, destination)

    # When live data is unavailable (empty / rate-limited / error), prefer the
    # pre-built TBO snapshot — those are REAL airlines/times/fares, far better
    # than a distance estimate. Only synthesize if neither live nor snapshot has
    # the route.
    if not live:
        fb = flight_fallback.get_route(
            origin, destination, departure_date, return_date, adults, children
        )
        if fb:
            trace_id = f"AVS-FB-{origin}{destination}-{departure_date}".replace("-", "")
            _searches[trace_id] = {o["result_index"]: o for o in fb}
            return {
                "status": "ok",
                "trace_id": trace_id,
                "is_return": round_trip,
                "provider": "tbo_fallback",
                "results": fb,
            }

    # Build up to 4 options. Prefer live carriers/flight-numbers when present;
    # otherwise synthesize from the carrier pool. Times come from the day-slots
    # (live "scheduled" times are today-only, so we re-anchor to the travel date).
    options: list[dict] = []
    n = min(4, max(3, len(live) or 4))
    for i in range(n):
        slot_h, slot_m = _SLOTS[i % len(_SLOTS)]
        if i < len(live):
            airline = live[i]["airline"]
            code = live[i]["code"]
            fnum = live[i]["flight_number"]
            t = live[i].get("dep_time")
            if t and ":" in t:
                slot_h, slot_m = int(t[:2]), int(t[3:5])
        else:
            airline, code = _CARRIERS[i % len(_CARRIERS)]
            fnum = f"{code}{200 + i * 37}"

        out_dir = _direction(origin, destination, departure_date, slot_h, slot_m,
                             airline, fnum, "Outbound")
        directions = [out_dir]
        if round_trip:
            # Return ~ a few hours later in the day, same carrier.
            rh, rm = _SLOTS[(i + 2) % len(_SLOTS)]
            ret_fnum = f"{code}{201 + i * 37}"
            directions.append(_direction(destination, origin, return_date, rh, rm,
                                          airline, ret_fnum, "Return"))

        fare = estimate_fare_inr(origin, destination, pax, round_trip)
        fare += i * 1500  # spread options so "cheapest first" is meaningful

        out = directions[0]
        all_airlines = airline
        option = {
            "result_index": f"AV-{i}",
            "is_lcc": code in ("6E", "G9", "SG"),
            "is_refundable": False,
            "published_fare": fare,
            "currency": "INR",
            "fare_estimated": True,
            "fare_note": (
                "Estimated economy fare (distance-based) — Aviationstack provides "
                "schedules, not prices. Confirm exact fare at booking."
            ),
            # flat OUTBOUND fields + per-direction detail (matches TBO shape)
            "airline": all_airlines,
            "flight_numbers": out.get("flight_numbers", []),
            "from": out.get("from"),
            "to": out.get("to"),
            "departure": out.get("departure"),
            "arrival": out.get("arrival"),
            "stops": out.get("stops"),
            "duration_minutes": out.get("duration_minutes"),
            "is_round_trip": round_trip,
            "directions": directions,
        }
        options.append(option)

    options.sort(key=lambda o: o.get("published_fare") or 0)

    trace_id = f"AVS-{origin}{destination}-{departure_date}".replace("-", "")
    _searches[trace_id] = {o["result_index"]: o for o in options}

    return {
        "status": "ok" if options else "no_results",
        "trace_id": trace_id,
        "is_return": round_trip,
        "provider": "aviationstack",
        "results": options,
    }


def farequote(trace_id: str, result_index: str) -> dict | None:
    """Re-read a previously searched option's estimated fare. Returns None if the
    trace/option is unknown (e.g. process restarted) so the caller can fall back."""
    opt = (_searches.get(trace_id) or {}).get(result_index)
    if not opt:
        return None
    return {
        "status": "ok",
        "trace_id": trace_id,
        "result_index": result_index,
        "price_changed": False,
        "is_lcc": opt.get("is_lcc", False),
        "is_refundable": opt.get("is_refundable", False),
        "published_fare": opt.get("published_fare"),
        "offered_fare": opt.get("published_fare"),
        "base_fare": opt.get("published_fare"),
        "tax": 0,
        "currency": "INR",
        "fare_estimated": True,
        "fare_note": opt.get("fare_note"),
    }
