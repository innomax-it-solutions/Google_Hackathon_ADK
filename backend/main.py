"""FastAPI server exposing the autonomous MedBridge agent over SSE.

POST /run     - structured intake (frontend form) -> streamed Journey Plan
POST /chat    - free-text message on an existing session (multi-turn follow-ups)
GET  /healthz - liveness probe for Cloud Run
"""

from __future__ import annotations

import json
import uuid
from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env (GOOGLE_API_KEY, MEDBRIDGE_MODEL, ...) before the agent /
# google.genai client initialise, so credentials are present at import time.
load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from pydantic import BaseModel

from .agent import root_agent
from .contract import IntakeRequest

APP_NAME = "medbridge"

app = FastAPI(title="MedBridge Agent")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

session_service = InMemorySessionService()
runner = Runner(agent=root_agent, app_name=APP_NAME, session_service=session_service)


def _sse(event_type: str, payload: dict) -> str:
    return f"data: {json.dumps({'type': event_type, **payload})}\n\n"


async def _stream(user_id: str, session_id: str, text: str):
    """Run the agent and translate ADK events into the frontend SSE contract."""
    await session_service.create_session(
        app_name=APP_NAME, user_id=user_id, session_id=session_id
    )
    message = types.Content(role="user", parts=[types.Part(text=text)])

    yield _sse("session", {"session_id": session_id})
    try:
        async for event in runner.run_async(
            user_id=user_id, session_id=session_id, new_message=message
        ):
            for part in (event.content.parts if event.content else []) or []:
                if getattr(part, "text", None):
                    yield _sse("token", {"text": part.text})
                if getattr(part, "function_call", None):
                    yield _sse("tool_call", {
                        "name": part.function_call.name,
                        "args": dict(part.function_call.args or {}),
                    })
                if getattr(part, "function_response", None):
                    yield _sse("tool_result", {
                        "name": part.function_response.name,
                        "response": part.function_response.response,
                    })
            if event.is_final_response():
                yield _sse("done", {})
    except Exception as exc:  # never leave the client hanging on a blank stream
        yield _sse("error", {"message": str(exc)})
        yield _sse("done", {})


@app.post("/run")
async def run(intake: IntakeRequest):
    session_id = intake.session_id or uuid.uuid4().hex
    prompt = (
        f"Patient profile — condition: {intake.condition}; "
        f"origin_country: {intake.origin_country}; "
        f"budget_usd: {intake.budget_usd}; timeline_weeks: {intake.timeline_weeks}. "
        "Please plan my medical journey to India and show me the full Journey Plan."
    )
    return StreamingResponse(
        _stream(user_id="web", session_id=session_id, text=prompt),
        media_type="text/event-stream",
    )


class ChatRequest(BaseModel):
    session_id: str
    message: str


@app.post("/chat")
async def chat(req: ChatRequest):
    """Continue an existing conversation (e.g. 'what about Thailand?', 'book it')."""
    return StreamingResponse(
        _stream(user_id="web", session_id=req.session_id, text=req.message),
        media_type="text/event-stream",
    )


@app.get("/healthz")
def healthz():
    return {"status": "ok"}
