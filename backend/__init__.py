from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env (GOOGLE_API_KEY, MEDBRIDGE_MODEL, ...) before importing the
# agent, which reads these at module load. Must happen first, whatever the entry
# point (uvicorn, adk web, tests).
load_dotenv(Path(__file__).parent / ".env")

from . import agent  # noqa: E402

__all__ = ["agent"]
