# MVT Bridge — AI-Powered Medical Tourism Platform

> ## 🔑 Demo Login Credentials (for evaluators)
>
> | Field | Value |
> |-------|-------|
> | **Email** | `admin@healtour.com` |
> | **Password** | `healtour@123` |
>
> **Live app:** https://mvtbridge-web-gmvjmac47q-uc.a.run.app
> Open the app, click **Login**, and enter the credentials above to access the platform.

---

An **autonomous** medical-tourism coordinator built on **Google ADK + Gemini**, deployed on **Cloud Run**. Gemini decides which tools to call and in what order — a reasoning agent, not a hardcoded workflow.

## Live deployment

| Service | URL |
|---------|-----|
| **Frontend (web app)** | https://mvtbridge-web-gmvjmac47q-uc.a.run.app |
| **Backend (agent API)** | https://mvtbridge-api-702861382786.us-central1.run.app |

## Repository layout

```
backend/    Google ADK + Gemini agent, served over FastAPI (SSE). See backend/README.md.
frontend/   React + Vite SPA, served by nginx on Cloud Run.
```

## What it does

A patient describes their condition, budget, and timeline. The agent reasons over a
knowledge base of MoU hospitals to recommend the best match, estimates itemised treatment
+ flight cost, builds a visa/document checklist, searches live flights, and assembles a
full **Journey Plan** — with multi-turn follow-ups ("what about a cheaper option?", "book it")
and live voice dictation.

See [`backend/README.md`](backend/README.md) for architecture, the SSE event contract, and
local-run / deploy instructions.
