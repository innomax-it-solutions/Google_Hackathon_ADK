# TBO Flight API — IP Whitelisting Blocks Cloud Deployment

**Status:** Resolved (2026-06-11) — switched flight provider to Aviationstack (key-auth, no IP
whitelist). TBO path preserved and reversible. See §9.
**Date:** 2026-06-10
**Affected component:** Backend flight search (TBO / TravelBoutiqueOnline Universal Air API)
**Severity:** Medium — app is fully functional except live flight pricing; degrades gracefully to treatment-only cost.

---

## 1. Summary

The MedBridge backend calls the **TBO flight API** for live flight pricing. TBO only accepts API
requests that originate from an **IP address registered on the TBO account**. The backend works
on local/dev machines (whose IPs are registered) but **fails when deployed to Google Cloud Run**,
because Cloud Run's outbound (egress) IP is a dynamic Google datacenter IP that is **not registered
with TBO**.

All other features — hospital matching, cost estimates, document checklists, Gemini reasoning,
voice dictation, multi-turn chat — work correctly in the cloud. Only the TBO flight call is blocked.

---

## 2. Symptom

When the deployed backend calls `flight_search`, TBO returns an authorization error:

```
flight_search → status: "auth_error"
"TBO authorization/IP error (code 1): You are not authorized to access TBO API.
 The server's public IP must be whitelisted with TBO, and EndUserIp must match it."
```

The agent catches this and falls back to a treatment-only cost estimate (no crash), so the user
sees hospital and treatment costs but no flight prices.

---

## 3. Root Cause

TBO enforces an **IP allow-list**: it accepts API calls only from source IP addresses that have
been registered on the account. This is documented in the integration config:

> **IP Whitelisting:** TBO only accepts API calls from an IP address registered on the account
> (currently `66.116.204.28`, the live server). If a teammate tests from their own laptop/server,
> requests may return blank / unauthorized / connection refused.
> **Fix:** ask TBO to add the tester's public IP to the account.

The check is on the **actual network source IP** of the connection — i.e. *where the request leaves
from* — independent of the `EndUserIp` value sent in the request body.

---

## 4. Why it works locally but fails in the cloud

The only thing that changes between "works" and "fails" is **which machine opens the connection to
TBO**, and therefore which source IP TBO sees:

| Environment | Source IP (real connection) | `EndUserIp` field sent | Registered with TBO? | Result |
|-------------|-----------------------------|------------------------|----------------------|--------|
| Live server | `66.116.204.28`             | `66.116.204.28`        | ✅ Yes (primary)     | ✅ Works |
| Dev machine | `183.82.107.183`            | `66.116.204.28`        | ✅ Yes (added for testing) | ✅ Works |
| Cloud Run   | Google datacenter IP (dynamic) | `66.116.204.28`     | ❌ **No**            | ❌ **Rejected** |

The dev machine and the live server are both on TBO's registered-IP list (the dev IP was added per
the documented "add the tester's IP" step). Cloud Run's egress IP is not on the list, so TBO
rejects it. The credentials, code, and `EndUserIp` value are identical in all three cases — the
difference is purely the source IP.

**Key point:** No change to the code or to the secret (including `EndUserIp`) can fix this. The
request must physically *originate from* a registered IP.

---

## 5. Deployment context

- **Backend:** Google Cloud Run service `medbridge-api`, project `payyalas-project-498310`,
  region `us-central1`. Scaled to zero.
- **Frontend:** Google Cloud Run service `medbridge-web` (nginx static), same project/region.
- **Credentials:** TBO account `HYDS1080` (ClientId `tboprod`), stored in Google Secret Manager
  (`tbo-credentials`), mounted into the backend container.
- Cloud Run egress IPs are **dynamic** by default — they change and cannot be predicted or
  registered as-is.

---

## 6. Fix options

Every fix has two parts: **(a)** make the backend's TBO requests leave from a *static* IP, and
**(b)** have TBO **register that IP** on the account (a request to TBO support / account manager).

| # | Approach | Cost/mo | Code change | Notes |
|---|----------|---------|-------------|-------|
| **A** | **Deploy on the existing live server** (`66.116.204.28`) | — | None | Already registered with TBO. Works instantly, **no new whitelisting**. Requires access to that server. |
| **B** | **Cloud Run + Cloud NAT** static egress IP | ~$32–45 | None | Reserve a static IP, route Cloud Run egress through Cloud NAT, register that IP with TBO. Keeps current serverless setup. |
| **C** | **Static-IP forward proxy** (small VM) | ~$0–13 | Minimal (`HTTPS_PROXY` env var) | Run a proxy on a VM with a static IP; route only TBO calls through it. Backend stays scale-to-zero. |
| **D** | **Backend on a VM** with a static IP | ~$13 | None | Run the container on an e2-small VM; register the VM's IP. Always-on (no scale-to-zero). |

In all cases, the `EndUserIp` value can remain `66.116.204.28` — only the connection's source IP
needs to be registered.

---

## 7. Recommended action

1. **If the team has access to the live server at `66.116.204.28`** → deploy the backend there
   (Option A). Fastest, zero new whitelisting, zero extra cost.
2. **Otherwise** → set up a static egress IP for Cloud Run (Option B or C) and **request TBO to add
   that IP** to account `HYDS1080`, exactly as was done previously for the dev machine.

### What to ask TBO

> "Please add the following public IP to our account `HYDS1080` (ClientId `tboprod`) so our
> production server can call the Air API: `<new static IP>`."

---

## 8. Verification

After registering the new IP, confirm the fix by calling the deployed backend and checking that
`flight_search` returns `status: ok` instead of `auth_error`:

```
POST https://<backend-url>/run
{ "condition": "knee replacement", "origin_country": "AE", "budget_usd": 15000,
  "departure_city": "DXB", "travel_date": "2026-07-15" }
```

Look for a `flight_search` tool result with `"status": "ok"` in the streamed response.

---

## 9. Resolution (2026-06-11) — switched to Aviationstack

Rather than keep fighting TBO's IP allow-list (Cloud NAT was set up and torn down — a stable IP
still has to be whitelisted by TBO, which defeats the purpose), the flight provider was switched to
**Aviationstack**, which authenticates by **API key** and therefore works from Cloud Run with **no
IP whitelisting**.

**Caveat (important):** Aviationstack is a flight *schedule/tracking* API — it returns airlines,
flight numbers and times, but **no ticket prices**. Fares are therefore **estimated from route
distance** (great-circle km → INR), clearly flagged per option with `fare_estimated: true` and a
`fare_note`. Schedules come from Aviationstack when available; otherwise a realistic timetable is
synthesized so the plan never shows empty flights.

**Implementation:**
- `backend/tools/aviation_client.py` — new provider: airport coords, distance→INR fare estimate,
  best-effort live schedule lookup (cached per route), synthesized fallback. Output shape is
  identical to the TBO `flight_search`, so the frontend and `/estimate_hospital` cost-fold are
  unchanged.
- `backend/tools/flights.py` — added `FLIGHT_PROVIDER` switch (default `aviationstack`). The entire
  TBO path is **preserved and still runs** when `FLIGHT_PROVIDER=tbo`. `flight_farequote` re-reads
  the cached estimate for Aviationstack traces.

**Config / env:**
- `FLIGHT_PROVIDER` — `aviationstack` (default) or `tbo`.
- `AVIATIONSTACK_KEY` — API key (a free-tier key is embedded as default; override in prod).
- `AVIATIONSTACK_LIVE` — `1` (default) to attempt live schedules, `0` to skip the network call and
  always synthesize (saves the limited monthly quota during demos).

**To revert to live TBO pricing:** whitelist the server IP with TBO, then set `FLIGHT_PROVIDER=tbo`.

**Deploy note:** the running Cloud Run revision still has the old code — **redeploy `medbridge-api`**
for this to take effect in the cloud.
