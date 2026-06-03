# MedBridge — Autonomous Agent (backend)

An **autonomous** medical-tourism coordinator built on **Google ADK + Gemini**, deployed on **Cloud Run**.
Gemini decides which tools to call and in what order — this is a reasoning agent, not a hardcoded workflow.

## Architecture

```
LlmAgent (gemini-2.5-flash)  ← reasons + decides
  ├── find_hospitals          (read)   match condition+budget → top 3 MoU hospitals
  ├── estimate_cost           (read)   itemised USD + INR cost for hospital × procedure
  ├── get_document_checklist  (read)   visa + document rules by ISO country
  └── request_appointment     (ACTION) book/reserve on the patient's behalf
```

Knowledge base: `backend/data/*.json` (loaded once at startup, cached).

`backend/` is the ADK agent package, so all commands run from the **repo root**.

## Run locally

```bash
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env   # set GOOGLE_CLOUD_PROJECT, then: gcloud auth application-default login

# Option A — ADK dev UI (best for testing the agent's reasoning):
adk web                     # from the repo root; pick "backend" in the dropdown

# Option B — the FastAPI server the frontend talks to:
uvicorn backend.main:app --reload --port 8080
```

Test the API:
```bash
curl -N -X POST localhost:8080/run -H "Content-Type: application/json" \
  -d '{"condition":"knee replacement","origin_country":"AE","budget_usd":8000,"timeline_weeks":6}'
```

## Deploy (Cloud Run)

```bash
adk deploy cloud_run \
  --project=$GOOGLE_CLOUD_PROJECT --region=us-central1 \
  --service_name=medbridge-backend --app_name=medbridge backend
```
Grant the Cloud Run service account the **Vertex AI User** role. No LLM API key needed.

## SSE event contract (frontend)

`session` · `token` (narrative text) · `tool_call` (agent decided to call a tool) ·
`tool_result` · `error` · `done`. Multi-turn: keep the `session_id` from the first
`/run` and send follow-ups to `/chat` ("what about a cheaper option?", "book it").
