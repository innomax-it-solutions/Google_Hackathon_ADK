"""Thin client for the TBO (TekTravels) Universal Air API.

Owns the three cross-cutting concerns the flight tools should NOT each reinvent:

  1. Credentials  - loaded once from backend/.env (JSON), never logged.
  2. Authentication - TokenId is fetched lazily and cached for the process;
     a token/expiry error triggers exactly one re-auth + retry.
  3. TraceId lifetime - Search hands back a TraceId that every downstream call
     echoes; TBO expires it after 15 minutes. We stamp each TraceId we see and
     refuse to use a stale one (the agent is told to re-search).

Everything goes through `post()`, which injects EndUserIp + TokenId, parses the
JSON, and raises a typed error on a non-zero Error.ErrorCode. Read-only calls
(Authenticate/Search/FareQuote) are always live; the money-spending Book/Ticket
path lives in flights.py behind a dry-run flag.

Hosts (ground truth: the working hopatlas Postman collection for THIS account,
which overrides the public apidoc hosts):
  Auth:   https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate
  Air:    https://tboapi.travelboutiqueonline.com/AirAPI_V10/AirService.svc/rest/<Method>
          (Search, FareQuote — read-only, used here)
  Booking: https://booking.travelboutiqueonline.com/AirAPI_V10/...  (Book/Ticket
          family — NOT used; we stop before payment. Kept here for reference only.)
"""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from functools import lru_cache
from pathlib import Path

_ENV_PATH = Path(__file__).resolve().parent.parent / "tbo_credentials.json"

AUTH_URL = (
    "https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate"
)
AIR_BASE = "https://tboapi.travelboutiqueonline.com/AirAPI_V10/AirService.svc/rest/"
# Book/Ticket live at https://booking.travelboutiqueonline.com/AirAPI_V10/ — out
# of scope (stop before payment); recorded only so the boundary is explicit.
BOOKING_BASE = "https://booking.travelboutiqueonline.com/AirAPI_V10/AirService.svc/rest/"

# TBO expires a TraceId 15 minutes after Search. Leave a small safety margin.
TRACE_TTL_SECONDS = 15 * 60
_TRACE_SAFETY_MARGIN = 30

# Proactively re-authenticate well before TBO's token lifetime lapses (~60 min).
TOKEN_TTL_SECONDS = 50 * 60

# Error codes that mean "your TokenId is dead" -> re-auth and retry once.
# TBO uses ErrorCode 6 ("session expired") for this; we treat the message too.
_TOKEN_EXPIRED_CODES = {6}
_TOKEN_EXPIRED_HINTS = ("token", "session", "logged out", "re-login")
# Hints that the failure is an IP whitelist / authorization problem, which the
# operator must fix at TBO's end -> surface loudly rather than retrying.
_IP_AUTH_HINTS = ("ip", "whitelist", "not authorized", "unauthorized", "enduserip")


# --------------------------------------------------------------------------- #
# Errors                                                                       #
# --------------------------------------------------------------------------- #


class TboError(RuntimeError):
    """A TBO API call returned a non-zero ErrorCode (or transport failed)."""

    def __init__(self, message: str, code: int | None = None):
        super().__init__(message)
        self.code = code
        self.message = message


class TboAuthError(TboError):
    """Authentication / IP-whitelist failure — operator action required."""


class TboTraceExpired(TboError):
    """The TraceId is older than TBO's 15-minute window — a fresh Search is needed."""


# --------------------------------------------------------------------------- #
# Credentials                                                                  #
# --------------------------------------------------------------------------- #


@lru_cache(maxsize=1)
def _creds() -> dict:
    """Read the four TBO credentials from backend/.env (a JSON object).

    EndUserIp may be overridden by the TBO_END_USER_IP env var (handy when the
    deploy target's public IP differs from what's committed). The password is
    never returned to callers other than the authenticate POST and is never
    logged.
    """
    try:
        raw = json.loads(_ENV_PATH.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise TboAuthError(
            f"TBO credentials file not found at {_ENV_PATH}. Create it with "
            "UserName, Password, ClientId, EndUserIp."
        ) from exc
    except json.JSONDecodeError as exc:
        raise TboAuthError(f"Could not parse {_ENV_PATH} as JSON: {exc}") from exc

    missing = [k for k in ("UserName", "Password", "ClientId", "EndUserIp") if not raw.get(k)]
    if missing:
        raise TboAuthError(f"{_ENV_PATH} is missing required keys: {', '.join(missing)}")

    return {
        "UserName": raw["UserName"],
        "Password": raw["Password"],
        "ClientId": raw["ClientId"],
        "EndUserIp": os.environ.get("TBO_END_USER_IP", raw["EndUserIp"]),
    }


def end_user_ip() -> str:
    return _creds()["EndUserIp"]


# --------------------------------------------------------------------------- #
# Transport                                                                    #
# --------------------------------------------------------------------------- #


def _raw_post(url: str, payload: dict, timeout: int = 30) -> dict:
    """POST JSON, return parsed JSON. Raises TboError on transport failure."""
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=body, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:300] if exc.fp else ""
        raise TboError(f"TBO HTTP {exc.code} from {url.rsplit('/', 1)[-1]}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise TboError(f"Could not reach TBO ({url.rsplit('/', 1)[-1]}): {exc.reason}") from exc


def _classify_error(code: int, message: str) -> TboError:
    msg = (message or "").lower()
    if any(h in msg for h in _IP_AUTH_HINTS):
        return TboAuthError(
            f"TBO authorization/IP error (code {code}): {message}. "
            f"The server's public IP ({end_user_ip()}) must be whitelisted with TBO, "
            "and EndUserIp must match it. Fix the whitelist or set TBO_END_USER_IP.",
            code,
        )
    return TboError(f"TBO error (code {code}): {message}", code)


# --------------------------------------------------------------------------- #
# Authentication + token cache                                                 #
# --------------------------------------------------------------------------- #

_token: dict | None = None  # {"TokenId": str, "fetched_at": float}


def authenticate(force: bool = False) -> str:
    """Return a cached TokenId, fetching a new one if absent or forced."""
    global _token
    if _token and not force and (time.monotonic() - _token["fetched_at"]) < TOKEN_TTL_SECONDS:
        return _token["TokenId"]

    c = _creds()
    data = _raw_post(
        AUTH_URL,
        {
            "ClientId": c["ClientId"],
            "UserName": c["UserName"],
            "Password": c["Password"],
            "EndUserIp": c["EndUserIp"],
        },
    )

    err = data.get("Error") or {}
    code = err.get("ErrorCode", 0)
    if code and code != 0:
        raise _classify_error(code, err.get("ErrorMessage", ""))

    token_id = data.get("TokenId")
    if not token_id:
        raise TboAuthError("Authenticate succeeded but returned no TokenId.")

    _token = {"TokenId": token_id, "fetched_at": time.monotonic()}
    return token_id


def post(method: str, payload: dict, *, _retry: bool = True) -> dict:
    """POST to an Air method with EndUserIp + TokenId injected.

    On a token/session-expiry error, re-authenticates once and retries. Returns
    the parsed `Response` object (TBO wraps the real payload under "Response").
    """
    token_id = authenticate()
    full = {"EndUserIp": end_user_ip(), "TokenId": token_id, **payload}
    data = _raw_post(AIR_BASE + method, full)

    response = data.get("Response", data)
    err = (response.get("Error") if isinstance(response, dict) else None) or data.get("Error") or {}
    code = err.get("ErrorCode", 0)

    if code and code != 0:
        message = err.get("ErrorMessage", "")
        is_token = code in _TOKEN_EXPIRED_CODES or any(
            h in (message or "").lower() for h in _TOKEN_EXPIRED_HINTS
        )
        if is_token and _retry:
            authenticate(force=True)
            return post(method, payload, _retry=False)
        if is_token and not _retry:
            # A token error that survives a fresh re-auth is almost always an IP
            # whitelist mismatch: TBO binds the token to the request's source IP,
            # so a brand-new token still fails if that IP isn't whitelisted (or
            # EndUserIp doesn't match it). Surface the actionable error.
            raise TboAuthError(
                f"TBO rejected the token even after re-authenticating (code {code}: "
                f"{message}). This means the server's public IP is not whitelisted "
                f"by TBO, or EndUserIp ({end_user_ip()}) doesn't match the source IP. "
                "Whitelist the IP with TBO and/or set TBO_END_USER_IP to match.",
                code,
            )
        raise _classify_error(code, message)

    return response


# --------------------------------------------------------------------------- #
# TraceId lifetime tracking                                                    #
# --------------------------------------------------------------------------- #

_traces: dict[str, float] = {}  # TraceId -> monotonic timestamp first seen


def register_trace(trace_id: str) -> None:
    if trace_id and trace_id not in _traces:
        _traces[trace_id] = time.monotonic()


def assert_trace_fresh(trace_id: str) -> None:
    """Raise TboTraceExpired if the TraceId is unknown or past TBO's 15-min window."""
    started = _traces.get(trace_id)
    if started is None:
        # Unknown trace (e.g. process restarted) — treat as expired to be safe.
        raise TboTraceExpired(
            "This flight search has expired (TraceId unknown). Please search again."
        )
    if time.monotonic() - started > TRACE_TTL_SECONDS - _TRACE_SAFETY_MARGIN:
        raise TboTraceExpired(
            "This flight search is more than 15 minutes old and has expired. "
            "Please search again to get fresh prices."
        )
