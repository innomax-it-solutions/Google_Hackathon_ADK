"""Pre-fetch REAL flight options from TBO and bake them into a static fallback.

WHY
---
TBO's live Air API only works from a whitelisted IP (this dev machine), not from
Cloud Run. Aviationstack (the cloud provider) has no fares and a tight free
quota. So we run this ONCE here, where TBO works, to capture real airlines /
times / fares for every origin->destination the app can plan, and write them to
`backend/data/flight_fallback.json`. In the cloud, `flight_fallback.py` serves
those options (dates re-anchored to the patient's trip) whenever the live
provider fails or is rate-limited.

RUN (from repo root, on the whitelisted machine):
    FLIGHT_PROVIDER=tbo python -m backend.scripts.build_flight_fallback

Idempotent / resumable: routes already in the JSON are skipped, so you can stop
and re-run. Failures are tolerated and logged — partial coverage is fine (the
serving layer falls back to a distance estimate for any missing route).
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path

# Force the TBO provider regardless of ambient env, so this always pulls REAL
# data even if someone runs it without setting FLIGHT_PROVIDER.
os.environ["FLIGHT_PROVIDER"] = "tbo"

from backend.tools.flights import flight_search  # noqa: E402

OUT_PATH = Path(__file__).resolve().parent.parent / "data" / "flight_fallback.json"

# Sample dates the snapshot is captured for. The serving layer shifts every
# leg's date by its offset from these, preserving time-of-day and multi-day
# connections. Pick a mid-week date ~5 weeks out so fares are representative.
BASE_DEPARTURE = "2026-07-15"
BASE_RETURN = "2026-08-05"

# Hospital-city destinations (from city_airports.CITY_TO_IATA).
DESTINATIONS = ["HYD", "MAA", "CJB", "DEL", "BOM", "BLR", "VTZ"]

# One primary hub per supported origin country (country_doc_rules.flight_hubs),
# Gulf first (the most common demo origins).
ORIGINS = [
    "DXB", "AUH", "SHJ", "DOH", "MCT", "KWI", "RUH", "JED", "BAH",
    "LHR", "JFK", "SIN", "KUL", "NBO", "LOS", "DAC", "CMB", "KTM",
]

MAX_OPTIONS = 4          # keep the cheapest few per route
SLEEP_BETWEEN = 1.2      # seconds; be polite to TBO


def _slim(option: dict) -> dict:
    """Drop trace-bound fields (result_index); keep everything the UI needs."""
    return {k: v for k, v in option.items() if k != "result_index"}


def main() -> None:
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    if OUT_PATH.exists():
        doc = json.loads(OUT_PATH.read_text(encoding="utf-8"))
    else:
        doc = {"base_departure": BASE_DEPARTURE, "base_return": BASE_RETURN, "routes": {}}
    routes = doc.setdefault("routes", {})

    pairs = [(o, d) for o in ORIGINS for d in DESTINATIONS if o != d]
    total = len(pairs)
    print(f"Building fallback for {total} routes -> {OUT_PATH}")

    ok = skip = fail = 0
    for i, (origin, dest) in enumerate(pairs, 1):
        key = f"{origin}-{dest}"
        if routes.get(key, {}).get("results"):
            skip += 1
            print(f"[{i}/{total}] {key}: already cached, skip")
            continue
        try:
            r = flight_search(
                origin=origin,
                destination=dest,
                departure_date=BASE_DEPARTURE,
                adults=1,
                return_date=BASE_RETURN,
            )
        except Exception as exc:
            fail += 1
            print(f"[{i}/{total}] {key}: EXCEPTION {exc}")
            time.sleep(SLEEP_BETWEEN)
            continue

        status = r.get("status")
        opts = r.get("results") or []
        if status == "ok" and opts:
            routes[key] = {
                "is_return": r.get("is_return", True),
                "results": [_slim(o) for o in opts[:MAX_OPTIONS]],
            }
            ok += 1
            cheapest = opts[0]
            print(f"[{i}/{total}] {key}: OK {len(opts)} opts, "
                  f"cheapest {cheapest.get('airline')} {cheapest.get('published_fare')} "
                  f"{cheapest.get('currency')}")
            # Persist after every successful route so a crash never loses work.
            OUT_PATH.write_text(json.dumps(doc, indent=2), encoding="utf-8")
        else:
            fail += 1
            print(f"[{i}/{total}] {key}: {status} ({r.get('message', 'no results')})")

        time.sleep(SLEEP_BETWEEN)

    OUT_PATH.write_text(json.dumps(doc, indent=2), encoding="utf-8")
    print(f"\nDone. ok={ok} skipped={skip} failed={fail}. "
          f"{len(routes)} routes cached in {OUT_PATH}")


if __name__ == "__main__":
    main()
