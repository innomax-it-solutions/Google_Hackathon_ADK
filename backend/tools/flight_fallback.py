"""Serve REAL flight options from the pre-built fallback snapshot.

`scripts/build_flight_fallback.py` captures live TBO options (airlines, times,
fares) for each origin->destination and writes them to data/flight_fallback.json
against fixed sample dates. This module loads that file and, for a given trip,
returns the matching options with every leg's date **re-anchored** to the
patient's requested departure/return (time-of-day and multi-day connections
preserved), and the fare scaled to the party size.

Used as the in-cloud fallback when the live provider (Aviationstack) is empty,
rate-limited, or errors. Output shape is identical to `flights.flight_search`'s
results, so nothing downstream changes. Returns [] for any uncached route, so
the caller can fall through to a distance estimate.
"""

from __future__ import annotations

import copy
import json
from datetime import datetime, timedelta
from functools import lru_cache
from pathlib import Path

_PATH = Path(__file__).resolve().parent.parent / "data" / "flight_fallback.json"


@lru_cache(maxsize=1)
def _doc() -> dict:
    try:
        return json.loads(_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {"routes": {}}


def has_route(origin: str, destination: str) -> bool:
    key = f"{(origin or '').strip().upper()}-{(destination or '').strip().upper()}"
    return bool((_doc().get("routes") or {}).get(key, {}).get("results"))


def _shift(iso: str, base_date: str, target_date: str) -> str:
    """Move an ISO datetime from base_date to target_date, keeping time-of-day
    and preserving any day offset (e.g. a red-eye that lands the next day)."""
    if not iso:
        return iso
    try:
        dt = datetime.strptime(iso[:19], "%Y-%m-%dT%H:%M:%S")
        base = datetime.strptime(base_date, "%Y-%m-%d").date()
        target = datetime.strptime(target_date, "%Y-%m-%d").date()
        new_date = target + timedelta(days=(dt.date() - base).days)
        return f"{new_date.isoformat()}T{dt.strftime('%H:%M:%S')}"
    except Exception:
        return iso


def _reanchor_dir(d: dict, base: str, target: str) -> None:
    for f in ("departure", "arrival"):
        if d.get(f):
            d[f] = _shift(d[f], base, target)
    for leg in d.get("legs") or []:
        for f in ("departure", "arrival"):
            if leg.get(f):
                leg[f] = _shift(leg[f], base, target)


def get_route(origin: str, destination: str, departure_date: str,
              return_date: str, adults: int, children: int = 0) -> list[dict]:
    """Return re-anchored, party-sized options for the route, or [] if uncached."""
    doc = _doc()
    key = f"{(origin or '').strip().upper()}-{(destination or '').strip().upper()}"
    entry = (doc.get("routes") or {}).get(key)
    if not entry or not entry.get("results"):
        return []

    base_dep = doc.get("base_departure", "2026-07-15")
    base_ret = doc.get("base_return", "2026-08-05")
    gap = (datetime.strptime(base_ret, "%Y-%m-%d") - datetime.strptime(base_dep, "%Y-%m-%d")).days

    # If no return date was requested, preserve the original trip length so the
    # cached return leg still makes sense.
    if not (return_date or "").strip():
        try:
            dep_dt = datetime.strptime(departure_date, "%Y-%m-%d")
            return_date = (dep_dt + timedelta(days=gap)).strftime("%Y-%m-%d")
        except Exception:
            return_date = departure_date

    pax = max(1, int(adults)) + max(0, int(children))

    out: list[dict] = []
    for i, opt in enumerate(entry["results"]):
        o = copy.deepcopy(opt)
        dirs = o.get("directions") or []
        for j, d in enumerate(dirs):
            if j == 0:
                _reanchor_dir(d, base_dep, departure_date)
            else:
                _reanchor_dir(d, base_ret, return_date)
        # Flat outbound fields mirror the first direction.
        if dirs:
            o["departure"] = dirs[0].get("departure")
            o["arrival"] = dirs[0].get("arrival")

        fare = o.get("published_fare")
        if isinstance(fare, (int, float)) and pax > 1:
            o["published_fare"] = round(fare * pax, -1)

        o["result_index"] = f"FB-{i}"
        o["fare_estimated"] = False
        o["fare_note"] = (
            "Indicative fare from a recent live quote; confirm exact price at booking."
        )
        out.append(o)

    out.sort(key=lambda x: x.get("published_fare") or 0)
    return out
