# Plan: Real hotel suggestions (with indicative pricing) via Google Places API

## Context

The agent's journey plan already covers hospital, cost, visa/docs, flights, and aftercare,
but **hotels are fake**: `backend/tools/hotels.py` returns three hardcoded placeholders
(`PH-001`…) with invented `price_per_night_usd` values, marked `status="placeholder"`. The
agent even discloses they aren't real. We want real hotel suggestions near the treatment
hospital, with price.

**Key finding — what Google Places API can and cannot do:**
- ✅ **Suggestions**: real hotels near the hospital — name, rating, # of ratings, address,
  location, distance, Google Maps link, photos.
- ✅ **Indicative price tier**: a coarse `priceLevel` enum (`$`–`$$$$`) and, where Google
  has it, a `priceRange` (currency + start/end). Coverage is partial.
- ❌ **Real nightly room rates / live availability for specific dates** — Places does NOT
  provide these. Those require Google's Hotel/Travel Partner API (advertiser partnership)
  or a third-party rates API (SerpApi, Amadeus, TBO Universal Hotel).

**Decision (confirmed with user):** Path A — **Places + indicative tier**. Replace the
placeholder with real Google Places lodging results and present price as an honest `$`–`$$$$`
tier (plus `priceRange` when available). No real-rates provider for now. This is the fastest
path and reuses code we already have.

**Why this is cheap:** Google Places API (New) is **already integrated** in
`backend/tools/places.py` (auth, POST helper, geocode, haversine), and `find_nearby_places`
already maps `"hotel"/"lodging"` → the `lodging` type. The frontend already auto-captures
every tool result by name into `toolData` (see `frontend/src/hooks/useStreaming.js:73`), so
`td.hotel_search` is already in hand — it just isn't rendered yet.

---

## Backend changes

### 1. Rewrite `hotel_search` to use Google Places — `backend/tools/hotels.py`

Reuse the existing Places plumbing instead of duplicating it. Import the private helpers from
`places.py`:

```python
from .places import _api_key, _post, _geocode_hospital, _haversine_m, _TEXT_SEARCH_URL, _NEARBY_URL
```

New signature (keep backward-compatible args the agent already passes; add `near_hospital` so
results rank by distance to the actual hospital, not just the city center):

```python
def hotel_search(city, checkin_date, checkout_date, rooms=1, adults=1, near_hospital=""):
```

Logic (mirrors `find_nearby_places` in `backend/tools/places.py:155`):
1. No API key → `{"status": "no_key", ...}` (same pattern as places.py:186).
2. Resolve center: `_geocode_hospital(f"{near_hospital} {city}".strip() or city)`. If it can't
   be located → `status="not_found"`.
3. `searchNearby` POST to `_NEARBY_URL` with:
   - `includedTypes: ["lodging"]`
   - `rankPreference: "DISTANCE"` (closest to hospital first; or `"POPULARITY"` — pick DISTANCE
     for the medical-travel use case)
   - `locationRestriction.circle` centered on the resolved hospital, radius ~5000 m
   - field mask:
     `places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.priceRange,places.googleMapsUri,places.photos`
4. Clean each result into:
   `{hotel_id (place id), name, rating, ratings_count, price_tier ("$".."$$$$" or null),
   price_range (text+currency or null), distance_m, area (formattedAddress), maps_url,
   photo_ref (places.photos[0].name or null)}`. Reuse `_haversine_m` for `distance_m`.
5. Sort by `distance_m`, return top `max_results` (~8).
6. Compute `nights` from `checkin_date`/`checkout_date`; include it so the UI/agent can frame
   "per night" vs "for the stay".

**Price-tier mapping** (Places enum → display):
`PRICE_LEVEL_INEXPENSIVE→"$"`, `MODERATE→"$$"`, `EXPENSIVE→"$$$"`, `VERY_EXPENSIVE→"$$$$"`,
`FREE`/unset→`null`.

Return shape:
```python
{
  "status": "ok" | "no_key" | "not_found" | "no_results" | "error",
  "disclosure": "Prices are Google's indicative price level ($–$$$$), not live nightly rates.",
  "city": city, "near_hospital": near_hospital,
  "checkin_date": ..., "checkout_date": ..., "nights": N, "rooms": rooms,
  "center": {name, address, lat, lng},
  "results": [ {hotel_id, name, rating, ratings_count, price_tier, price_range,
               distance_m, area, maps_url, photo_ref}, ... ],
}
```

Keep the stop-before-payment boundary (search/detail only — no booking), consistent with the
rest of the codebase. Delete the placeholder data and its module docstring's "awaiting doc"
language; replace with a docstring describing the Places-based behavior and the honest
price-tier caveat.

### 2. Update the agent instructions — `backend/agent.py`

- Step 7 (lines 203–204): change "PLACEHOLDER data, say so honestly" to: hotel_search now
  returns **real nearby hotels** with an **indicative price tier (`$`–`$$$$`), not live nightly
  rates** — disclose that prices are indicative. Pass the chosen hospital's name as
  `near_hospital` and its `city`, plus the patient's check-in/out dates.
- Rules (lines 257–258): replace "A hotel result is 'placeholder'…" with guidance to present
  hotels ranked by distance to the hospital and to state the price tier is indicative.
- Leave the import (line 27) and tool registration (line 279) as-is — only behavior changes.

### 3. Cost estimate — no change needed (recommended)

`backend/tools/cost_estimator.py:93` already says "accommodation is estimated separately."
Since Places gives no real nightly rate, do **not** fold a guessed hotel cost into the headline
total (keeps the codebase's honesty stance). Hotels render as their own panel. *(Future: when/if
a real-rates provider is added, fold an accommodation line the same way flights are folded at
cost_estimator.py:78–91.)*

---

## Frontend changes

The result is already captured as `td.hotel_search`; we only need to render it.

### 1. Pass the prop — `frontend/src/components/MessageBubble/MessageBubble.jsx`
- At the `<JourneyPlanCard … flights={td.flight_search}>` block (~line 132–139), add
  `hotels={td.hotel_search}`.
- `hotel_search` is already in `TOOL_LABELS` (line 26). Optionally add `"hotel_search"` to
  `PLANNING_TOOLS` (line 16) so the loader waits for it before showing the card.

### 2. Render a Hotels panel — `frontend/src/components/JourneyPlanCard/JourneyPlanCard.jsx`
- Accept the new `hotels` prop alongside `flights` (~line 52).
- Add a **Hotels** `<Panel>` mirroring the existing Flights panel (~line 357), with a new
  `HotelsBody` component that lists `hotels.results`: name, ⭐ rating (+count), price tier
  (`$`–`$$$$`) and `price_range` when present, distance from hospital, and a "View on Maps"
  link (`maps_url`). Show the `disclosure` text as fine print.
- Handle non-`ok` statuses gracefully (no_key / not_found / no_results → a short empty state),
  matching how the card handles missing flight data.

### 3. Photos (optional, defer)
`photo_ref` is a Places photo resource name; rendering it needs
`https://places.googleapis.com/v1/{photo_ref}/media?maxHeightPx=300&key=KEY`, which would
expose the API key to the browser. **Recommendation:** ship text cards first (no photos). If
photos are wanted, add a tiny backend proxy endpoint (e.g. `GET /places/photo?ref=`) in
`backend/main.py` that fetches the media server-side with the existing key — do not embed the
key in the frontend.

### 4. PDF export (optional)
`frontend/src/services/pdf/journeyPlanPdf.js` already renders flights; add a short Hotels
section there if hotels should appear in the exported plan.

---

## Verification

1. **Env**: confirm `GOOGLE_PLACES_API_KEY` (or `GOOGLE_MAPS_API_KEY`) is set in `backend/.env`
   and the key has **Places API (New)** enabled in GCP.
2. **Unit-ish smoke test** (backend): a tiny script calling
   `hotel_search("Hyderabad", "2026-08-15", "2026-08-20", near_hospital="Apollo Hospitals")`
   and printing the result — expect `status:"ok"` with real hotel names, distances, and a mix
   of price tiers. Verify `status:"no_key"` path by temporarily unsetting the key.
   (Model the script on the existing `frontend/wl_flight_test.py` style or a plain `python -c`.)
3. **End-to-end**: run backend (`uvicorn`/Cloud Run local) + frontend (`npm run dev`), submit
   the intake form (Knee Replacement / Hyderabad-area hospital), and confirm the Journey Plan
   card shows a **Hotels** panel with real options ranked by distance and an indicative price
   tier, plus the "indicative, not live nightly rates" disclosure.
4. **Agent honesty**: in chat, ask "any hotels near the hospital?" and confirm the agent
   presents real options and states the price is an indicative tier, not a live rate.

## Out of scope (noted for later)
- Real per-night rates / bookable availability (needs SerpApi Google Hotels, Amadeus Hotel
  Search, or the originally-planned TBO Universal Hotel API).
- Hotel booking — the whole app intentionally stops before payment.
