# MedBridge Patient Agent — Team Task Breakdown

**Project:** MedBridge — a medical-tourism AI agent that turns a patient's intake (condition, country, budget, timeline) into a complete **Journey Plan** (hospital recommendation + itemised cost + visa/document checklist).
**Hackathon:** Google for Startups AI Agents Challenge 2026 · **Track 1: Build (Net-New Agents)**
**Deadline:** June 5, 2026 · 5:00 PM PT — *submit early*
**Company:** Healtour Solutions / Kiron Group

---

## 0. Locked Architecture Decisions (read this first)

> ⚠️ **Stack change from the original doc:** We are building with **Gemini + Google ADK**, *not* Claude + LangGraph.
> **Why:** It uses our $500 Google Cloud credits (free), and it satisfies the hackathon's **Mandatory Technologies** rule cleanly (Gemini is Google's own model on the Agent Platform). This removes our biggest eligibility risk.

| Concern | Decision |
|---|---|
| **LLM (Intelligence)** | **Gemini** (`gemini-2.0-flash` for speed) via **Vertex AI** |
| **Orchestration** | **Google ADK** (Python) |
| **Tools** | **Python function tools** registered on the ADK agent (lookups over our JSON knowledge base). *ADK is MCP-compatible — we can expose them via MCP later if time allows.* |
| **Agent flow** | ADK workflow: `hospital_match` → **parallel**(`cost_estimator`, `document_checklist`) → `synthesise` |
| **Backend** | ADK + FastAPI → **Cloud Run** (1 service) |
| **Frontend** | React + Tailwind → **Cloud Run** (1 service), live streaming via SSE |
| **Data** | 3 JSON flat files (hospital registry, cost matrix, country-doc rules) |
| **Secrets** | ✅ **No LLM API key needed** — Gemini-on-Vertex authenticates via the Cloud Run service account. (Only secret-manage keys if we add other external APIs.) |

**Mandatory-tech checklist (all 3 must be true to qualify):**
- [x] Intelligence = Gemini ✅
- [x] Orchestration = ADK ✅
- [x] Infrastructure = deployed on Cloud Run ✅

---

## 1. Repo Structure (Shyam owns; everyone branches off it)

```
medbridge/
├── backend/                  # Team Alpha
│   ├── medbridge_agent/
│   │   ├── __init__.py
│   │   ├── agent.py          # ADK agent + orchestration   (SHYAM)
│   │   ├── contract.py       # shared tool schemas/types    (SHYAM)  ← build first
│   │   └── tools/
│   │       ├── hospital_match.py     (SHYAM + RAM)
│   │       ├── cost_estimator.py     (GOPI)
│   │       └── document_checklist.py (PALLAVI)
│   ├── data/                 # Knowledge base               (RAM)
│   │   ├── hospital_registry.json
│   │   ├── cost_matrix.json
│   │   └── country_doc_rules.json
│   ├── main.py               # FastAPI /run + SSE           (SHYAM)
│   ├── requirements.txt
│   ├── Dockerfile            # (RAM + SHYAM)
│   └── .env                  # Vertex/Gemini config (gitignored)
├── frontend/                 # Team Bravo
│   ├── src/
│   │   ├── IntakeForm.jsx     (HARI)
│   │   ├── JourneyPlanCard.jsx(VENKAT)
│   │   ├── ErrorBoundary.jsx  (OMKAR)
│   │   └── api.js            # SSE client                   (HARI)
│   ├── Dockerfile            # (OMKAR)
│   └── ...
├── TEAM_TASKS.md             # this file
└── README.md
```

**Git workflow:** `main` is protected. Each person works on a branch `feat/<name>-<thing>` (e.g. `feat/gopi-cost-tool`) and opens a PR. Shyam reviews backend PRs.

---

## 2. The API Contract (everyone codes to this)

**Request** — frontend → backend:
```
POST /run
{ "condition": "knee replacement", "origin_country": "AE", "budget_usd": 8000, "timeline_weeks": 6 }
```
**Response** — SSE stream (`text/event-stream`), events:
```
data: {"type":"token","text":"Based on your profile, ..."}
data: {"type":"hospital","name":"Apollo Hospitals","city":"Hyderabad","tier":"A"}
data: {"type":"cost","total_usd":6800,"breakdown":[...]}
data: {"type":"docs","items":["Passport","Medical records","Visa letter"]}
data: {"type":"done"}
```
> `origin_country` is always a **2-letter ISO code** (AE, US, GB...), chosen from a dropdown — never free text. This is the #1 silent bug.

---

# 3. Per-Person Assignments

Each section = **What you own · What you build · How to build it.**

---

## 🟦 TEAM ALPHA — Backend / Agent

### 👤 SHYAM — Agent Lead & Orchestration (you)
**What you own:** The agent brain, the repo scaffold, the shared contract, the API layer, backend deploy, and integration.

**What you build:**
1. Repo scaffold + `contract.py` (the tool schemas) — **Day 1 AM, first thing**.
2. The ADK agent + orchestration flow.
3. `hospital_match` tool (with Ram).
4. FastAPI `/run` endpoint with SSE streaming.
5. Backend Cloud Run deploy.

**How to build it:**
- `pip install google-adk fastapi uvicorn`.
- `contract.py`: define the tool inputs/outputs as Pydantic models or typed dicts + clear docstrings. Commit immediately so Gopi/Pallavi/Ram build against it.
- `agent.py`: build a **deterministic ADK workflow** (don't leave the order to the LLM):
  - a node that calls `hospital_match`,
  - a **`ParallelAgent`** running `cost_estimator` + `document_checklist`,
  - a final **`LlmAgent`** (Gemini) that synthesises the 3 results into the Journey Plan.
  - Wrap as a `SequentialAgent`: `[hospital_match, parallel_tools, synthesise]`.
- Test locally with **`adk web`** using the Rahul case before any frontend exists.
- `main.py`: FastAPI app exposing `POST /run`, runs the ADK agent, **streams** results as SSE, sends a `data: [PING]` keepalive every ~20s, and enables **CORS** (`allow_origins=["*"]`).
- Deploy: `adk deploy cloud_run` (or Docker + `gcloud run deploy medbridge-backend --timeout 300 --allow-unauthenticated`). The resulting URL is our **testing-access deliverable**.

---

### 👤 RAM — Knowledge Base & Backend Deploy *(Day 1 dependency gate)*
**What you own:** All 3 JSON data files — the "moat." Everything in Layer 3 waits on this.

**What you build:**
- `hospital_registry.json` — **22 hospital records**.
- `cost_matrix.json` — costs per hospital × procedure.
- `country_doc_rules.json` — visa/doc rules per country.
- Co-own backend Cloud Run deploy with Shyam.

**How to build it:**
- Use Shyam's `contract.py` schema. **Finish + get Shyam's review by end of Day 1** so Gopi/Pallavi can start.
- `hospital_registry.json` — each record:
  ```json
  { "id":"apollo-hyd-001", "name":"Apollo Hospitals", "city":"Hyderabad", "state":"Telangana",
    "specialties":["orthopedics","cardiac","oncology","neurology","transplant"],
    "tier":"A", "mou_active":true, "cost_index":0.7, "international_desk":true }
  ```
  Rules: ≥5 specialty tags each, `mou_active:true` to appear, unique `id`.
- `cost_matrix.json` — keyed `hospital_id → procedure-slug → { total_usd_min/max, total_inr_min/max, line_items:[{label,usd}] }`.
- `country_doc_rules.json` — keyed by ISO code → `{ visa_required, visa_type, mandatory_docs:[], recommended_docs:[] }`.
- Write a tiny `validate.py` that loads each file and checks required fields; exclude (with a warning) any incomplete record.
- Data loads **once at startup** (module-level variable), not per request.

---

### 👤 GOPI — Cost Estimator Tool
**What you own:** The `cost_estimator` tool.

**What you build:** A Python function tool: `cost_estimator(hospital_id, procedure, origin_country) -> CostBreakdown`.

**How to build it:**
- Import the schema from `contract.py`.
- Read `cost_matrix.json`, look up `hospital_id × procedure`, sum the `line_items`, return `total_usd` + `total_inr`.
- **Hardcode the FX rate** (June 2026) — no live FX API (one less thing to fail in the demo). Add a `currency_note` like "Indicative estimate, June 2026 rates".
- Apply an origin-country surcharge if relevant.
- **Never return NaN/None for a cost** — if a field is unknown, return `0` with a `"confidence":"approximate"` flag.
- Write a **clear docstring** — ADK feeds it to Gemini as the tool description, so Gemini knows when/how to call it. Example: `"""Estimate itemised treatment cost for a given hospital and procedure. Returns USD + INR totals and line items."""`

---

### 👤 PALLAVI — Document Checklist Tool *(build first — lowest risk)*
**What you own:** The `document_checklist` tool.

**What you build:** A Python function tool: `document_checklist(origin_country, hospital_id) -> DocChecklist`.

**How to build it:**
- Import the schema from `contract.py`.
- Read `country_doc_rules.json`, look up the **ISO country code**, return mandatory + recommended docs and visa info.
- Unknown country → return a **generic fallback** ("Contact the destination embassy for visa details") — never an error, never empty.
- Pure static logic, no external calls. **Build this first** on Day 1 — it's the simplest tool, so use it to prove the whole ADK → tool → response chain works before the harder tools are ready.
- Write a clear docstring for Gemini.

---

## 🟩 TEAM BRAVO — Frontend / Demo

### 👤 VENKAT — Frontend Lead · Journey Plan Renderer + Demo Video
**What you own:** The result UI and the demo experience.

**What you build:**
- `JourneyPlanCard.jsx` — renders 3 sections: hospital, cost breakdown, document checklist.
- Loading skeleton (appears instantly on submit).
- Co-own the 90-sec demo video.

**How to build it:**
- React + Tailwind. Render from the agent JSON **by key name, never by array index** (the agent may reorder fields).
- Wrap any `JSON.parse` in try/catch — on failure, show the raw narrative text, **never a blank screen**.
- Skeleton card renders the moment the user submits; SSE tokens stream in and fill it live — this is what makes the video compelling.
- Video: follow the "Rahul, 54, Dubai, knee replacement, quoted $22k" script (in the tech doc). Fill the form live → skeleton → plan streams in → close on "$6,800, 3 docs, saved $15k".

---

### 👤 HARI — Intake Form + SSE Client
**What you own:** Data in (the form) and stream in (the SSE client).

**What you build:**
- `IntakeForm.jsx` — controlled form, 4 fields.
- `api.js` — the SSE client that talks to the backend.

**How to build it:**
- Controlled React inputs: `condition` (text), `origin_country` (**ISO dropdown**, not free text), `budget_usd` (number), `timeline_weeks` (number).
- On submit, `POST /run` to the backend Cloud Run URL, then open an **`EventSource`** to consume the SSE stream, appending tokens/events to Venkat's card.
- Show the loading skeleton immediately on submit.

---

### 👤 CHANDRIKA — Validation + Devpost Submission Owner
**What you own:** Input correctness AND the final submission (this is critical — submission is a deliverable).

**What you build:**
- Client-side form validation rules.
- The polished Journey Plan card sections (with Venkat).
- **The Devpost submission page + the business-case writeup** (30% of the score).

**How to build it:**
- Validation: all fields required; `budget_usd > 0`; `condition` min 3 chars; `timeline_weeks` sensible (≥2). Show inline errors **before** the network call.
- **Business case** (most important for scoring): write the problem + ROI story — "medical tourism saves patients 60–80%; MedBridge cuts research from days to seconds; Rahul saved $15,000." Quantify it.
- Assemble the **4 deliverables** on Devpost: code link, architecture PNG, demo video, live URL. Pick **Theme = Build**, set the Region. **Submit a day early.**

---

### 👤 OMKAR — Error Handling + Frontend Deploy + Config
**What you own:** Resilience and getting the frontend live.

**What you build:**
- `ErrorBoundary.jsx` — catches agent timeout / network failure, shows a retry button.
- Frontend Cloud Run deploy.
- Config / any secrets.

**How to build it:**
- Error boundary: on any failure, show a friendly message + retry — **never a blank screen** (judges will see it).
- Dockerfile: build the React app, serve via nginx on port 8080; proxy `/api` to the backend URL.
- `gcloud run deploy medbridge-frontend` → confirm the URL **opens in an incognito window**.
- ✅ **Note:** with Gemini-on-Vertex we have **no LLM API key** to secret-manage. Just ensure the backend's Cloud Run service account has the **Vertex AI User** role. Only use Secret Manager if we add other third-party APIs.

---

## 4. Day-by-Day Timeline

| Day | Alpha | Bravo |
|---|---|---|
| **Day 1** | Shyam: scaffold + `contract.py` + agent skeleton in `adk web`. Ram: 3 JSON files (synthetic ok) + Shyam review. Pallavi: doc tool (first). Gopi: cost tool. | Hari: intake form. Venkat: Journey card + skeleton. Chandrika: validation. Omkar: error boundary. |
| **Day 2** | Finish agent flow + parallel tools + FastAPI/SSE → **deploy backend to Cloud Run**. | Wire frontend to real backend URL → **deploy frontend** → CORS check. **8 PM integration checkpoint (Shyam + Venkat).** |
| **Day 3** | Polish, edge cases, arch diagram PNG (Shyam), make repo judge-accessible. | Record video (Venkat + Omkar). Chandrika fills Devpost. **Submit early.** |

## 5. Day-2 Integration Checkpoint (must all pass)
1. Backend `/run` live on Cloud Run, returns 200 for a test intake. (Ram)
2. All 3 tools return valid JSON matching `contract.py`. (Shyam)
3. Frontend submits to the **Cloud Run URL** (not localhost). (Venkat)
4. SSE stream renders live — no blank pause. (Hari)
5. Journey card shows hospital + cost + docs. (Chandrika)
6. Error state renders cleanly. (Omkar)
7. Demo URL opens in incognito. (Venkat)

> ❗ If any check fails by Day-2 evening, **escalate to Prasanthi immediately.** A known blocker with 12 hours left is recoverable; an unknown one on Day 3 morning is not.

## 6. The 4 Submission Deliverables
| # | Deliverable | Owner |
|---|---|---|
| 1 | Source code (GitHub, public or judge access) | Shyam |
| 2 | Architecture diagram (PNG) | Shyam |
| 3 | 90-sec demo video ("Rahul") | Venkat + Omkar |
| 4 | Live Cloud Run demo link (test incognito!) | Omkar / Ram |

---
*Single source of truth for the MedBridge build. Stack: Gemini + ADK + Cloud Run. Questions → Shyam (backend) / Venkat (frontend) / Prasanthi (escalation).*
