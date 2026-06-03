"""MedBridge backend package.

Load the local .env before anything reads os.environ, so the agent picks up
GOOGLE_API_KEY / model config the same way whether launched via `adk web`,
`uvicorn backend.main:app`, or a deployed container.
"""

from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

from . import agent  # noqa: E402  (must come after load_dotenv)

__all__ = ["agent"]
