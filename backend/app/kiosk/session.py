# backend/app/kiosk/session.py
import os, hmac, time, base64, hashlib
from typing import Optional
from fastapi import APIRouter, Response, Request, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/kiosk/session", tags=["kiosk-session"])

# --- Config via env ---
SECRET = (os.getenv("KIOSK_SESSION_SECRET") or "").encode("utf-8")
if not SECRET:
    # Fail fast in dev; set a strong random value in prod (32+ bytes)
    raise RuntimeError("Set KIOSK_SESSION_SECRET to a strong random secret (32+ bytes)")

COOKIE_NAME = os.getenv("KIOSK_COOKIE_NAME", "kiosk_pid")
COOKIE_DOMAIN = os.getenv("KIOSK_COOKIE_DOMAIN") or None  # e.g. ".medmitra-ai.com"
COOKIE_SECURE = (os.getenv("KIOSK_COOKIE_SECURE", "true").lower() != "false")  # default True
COOKIE_SAMESITE = os.getenv("KIOSK_COOKIE_SAMESITE", "Lax")  # "Lax" | "Strict" | "None"
# TTL (seconds) for the cookie payload validity (server-side check)
SESSION_TTL = int(os.getenv("KIOSK_SESSION_TTL", "86400"))  # 24h

# --- Minimal payload ---
class SetSessionBody(BaseModel):
    patientId: str = Field(..., min_length=6)

# --- Helpers: compact signed value pid.ts.sig (base64url) ---
def _b64u(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")

def _sign(pid: str, ts: int) -> str:
    mac = hmac.new(SECRET, f"{pid}.{ts}".encode("utf-8"), hashlib.sha256).digest()
    return _b64u(mac)

def _pack(pid: str, ts: Optional[int] = None) -> str:
    ts = ts or int(time.time())
    sig = _sign(pid, ts)
    return f"{pid}.{ts}.{sig}"

def _unpack_and_verify(raw: str) -> Optional[str]:
    try:
        pid, ts_str, sig = raw.split(".", 2)
        ts = int(ts_str)
    except Exception:
        return None
    # TTL check
    if ts + SESSION_TTL < int(time.time()):
        return None
    # signature check (timing-safe)
    exp = _sign(pid, ts)
    if not hmac.compare_digest(sig, exp):
        return None
    return pid

def _set_cookie(resp: Response, value: str, max_age: int = SESSION_TTL):
    resp.set_cookie(
        key=COOKIE_NAME,
        value=value,
        max_age=max_age,
        expires=max_age,
        secure=COOKIE_SECURE,
        httponly=True,
        samesite=COOKIE_SAMESITE,  # Lax recommended for kiosk
        domain=COOKIE_DOMAIN,       # set for cross-subdomain if needed
        path="/",
    )

def _clear_cookie(resp: Response):
    resp.delete_cookie(
        key=COOKIE_NAME,
        domain=COOKIE_DOMAIN,
        path="/",
    )

@router.post("/set")
def set_session(body: SetSessionBody, response: Response):
    """
    Persists a signed session cookie containing the patientId.
    Call this right after OTP verification or walk-in registration.
    """
    pid = body.patientId.strip()
    if not pid:
        raise HTTPException(status_code=400, detail="patientId required")
    packed = _pack(pid)
    _set_cookie(response, packed)
    return {"ok": True, "patientId": pid}

@router.get("/me")
def get_session(request: Request):
    """
    Returns the kiosk session's patientId if present and valid.
    """
    raw = request.cookies.get(COOKIE_NAME)
    if not raw:
        raise HTTPException(status_code=404, detail="No kiosk session")
    pid = _unpack_and_verify(raw)
    if not pid:
        raise HTTPException(status_code=401, detail="Invalid or expired kiosk session")
    return {"patientId": pid}

@router.post("/clear")
def clear_session(response: Response):
    """
    Clears the kiosk session cookie (use at end of flow if desired).
    """
    _clear_cookie(response)
    return {"ok": True}
