"""User registration / login for MedBridge.

Storage:   Firestore  (collection `users`, document id = normalised email)
Password:  bcrypt
Session:   stateless JWT (HS256) sent as `Authorization: Bearer <token>`

Endpoints (mounted under /auth in main.py):
    POST /auth/register  -> { token, user }   create an account + sign in
    POST /auth/login     -> { token, user }   sign in
    GET  /auth/me        -> user              who am I (validates the token)

Firestore uses Application Default Credentials — locally the same gcloud auth
that already powers Vertex AI, in production the Cloud Run service account. Set
FIRESTORE_EMULATOR_HOST to talk to a local emulator instead. No data file is
written to the container disk, so this survives Cloud Run's ephemeral fs.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.api_core import exceptions as gcloud_exceptions
from pydantic import BaseModel, EmailStr, Field

logger = logging.getLogger("medbridge.auth")

# --- Config (read once at import; main.py loads .env before importing us) ----
# 32+ byte dev default keeps local runs warning-free; override in any real env.
_DEV_JWT_SECRET = "dev-insecure-secret-change-me-before-deploying"
JWT_SECRET = os.getenv("JWT_SECRET_KEY", _DEV_JWT_SECRET)
JWT_ALGO = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", str(60 * 24 * 7)))  # 7 days
USERS_COLLECTION = os.getenv("USERS_COLLECTION", "users")
GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")

# Demo account kept working so the README credentials still sign evaluators in,
# now through the real Firestore-backed flow rather than hardcoded frontend env.
DEMO_ADMIN_EMAIL = os.getenv("DEMO_ADMIN_EMAIL", "admin@healtour.com")
DEMO_ADMIN_PASSWORD = os.getenv("DEMO_ADMIN_PASSWORD", "healtour@123")
DEMO_ADMIN_NAME = os.getenv("DEMO_ADMIN_NAME", "Healtour Admin")

if JWT_SECRET == _DEV_JWT_SECRET:
    logger.warning("JWT_SECRET_KEY is unset — using an insecure dev default. "
                   "Set JWT_SECRET_KEY before deploying.")


# --- Firestore client (lazy singleton) ---------------------------------------
_db = None


def get_db():
    """Return a cached Firestore client, creating it on first use."""
    global _db
    if _db is None:
        try:
            from google.cloud import firestore

            _db = firestore.Client(project=GOOGLE_CLOUD_PROJECT or None)
        except Exception as exc:  # missing creds / library / project
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"User database unavailable: {exc}",
            ) from exc
    return _db


# --- Password hashing --------------------------------------------------------
def hash_password(password: str) -> str:
    # bcrypt only considers the first 72 bytes; slice so long passwords don't raise.
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    if not hashed:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8")[:72], hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# --- JWT ---------------------------------------------------------------------
def create_token(email: str, name: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": email,
        "name": name,
        "iat": now,
        "exp": now + timedelta(minutes=JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session."
        ) from exc


# --- Models ------------------------------------------------------------------
class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str | None = None
    country: str | None = None  # 2-letter ISO


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    email: EmailStr
    name: str
    phone: str | None = None
    country: str | None = None
    created_at: str | None = None


class AuthResponse(BaseModel):
    token: str
    user: UserPublic


def _get_user_doc(email: str):
    """Fetch a user document, mapping Firestore outages to a clean 503."""
    try:
        return get_db().collection(USERS_COLLECTION).document(email).get()
    except gcloud_exceptions.GoogleAPICallError as exc:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"User database unavailable: {exc.message}",
        ) from exc


def _public(data: dict) -> UserPublic:
    """Project a stored user document to the safe, password-free public shape."""
    return UserPublic(
        email=data.get("email"),
        name=data.get("name", ""),
        phone=data.get("phone") or None,
        country=data.get("country") or None,
        created_at=data.get("created_at"),
    )


# --- Auth dependency ---------------------------------------------------------
_bearer = HTTPBearer(auto_error=True)


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(_bearer),
) -> UserPublic:
    """FastAPI dependency: decode the bearer token and load the live user."""
    email = (decode_token(creds.credentials).get("sub") or "").lower()
    if not email:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid session.")
    snap = _get_user_doc(email)
    if not snap.exists:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Account no longer exists.")
    return _public(snap.to_dict())


# --- Routes ------------------------------------------------------------------
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest):
    email = req.email.lower().strip()
    user_doc = {
        "email": email,
        "name": req.name.strip(),
        "phone": (req.phone or "").strip(),
        "country": (req.country or "").strip(),
        "password_hash": hash_password(req.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    # .create() fails if the document already exists → cheap unique-email guard.
    try:
        get_db().collection(USERS_COLLECTION).document(email).create(user_doc)
    except gcloud_exceptions.AlreadyExists:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )
    except gcloud_exceptions.GoogleAPICallError as exc:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"User database unavailable: {exc.message}",
        ) from exc
    return AuthResponse(token=create_token(email, user_doc["name"]), user=_public(user_doc))


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    email = req.email.lower().strip()
    snap = _get_user_doc(email)
    # Same generic message whether the email is unknown or the password is wrong.
    if not snap.exists:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    data = snap.to_dict()
    if not verify_password(req.password, data.get("password_hash", "")):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    return AuthResponse(token=create_token(email, data.get("name", "")), user=_public(data))


@router.get("/me", response_model=UserPublic)
def me(current: UserPublic = Depends(get_current_user)):
    return current


# --- Startup seed ------------------------------------------------------------
def seed_demo_admin() -> None:
    """Ensure the demo admin exists so README credentials keep working.

    Best-effort: a Firestore outage logs a warning instead of crashing startup.
    """
    if not (DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD):
        return
    email = DEMO_ADMIN_EMAIL.lower().strip()
    try:
        ref = get_db().collection(USERS_COLLECTION).document(email)
        if ref.get().exists:
            return
        ref.create({
            "email": email,
            "name": DEMO_ADMIN_NAME,
            "phone": "",
            "country": "",
            "password_hash": hash_password(DEMO_ADMIN_PASSWORD),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_demo": True,
        })
        logger.info("Seeded demo admin account: %s", email)
    except Exception as exc:  # noqa: BLE001 — never block startup on the seed
        logger.warning("Could not seed demo admin (Firestore unavailable?): %s", exc)
