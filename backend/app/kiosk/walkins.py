import os
import re
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Body, Header, HTTPException
from botocore.exceptions import ClientError

from app.auth import cognito as cg
from app.db.dynamo import patients_table
from app.models.patients import WalkinRegisterRequest, WalkinRegisterResponse

log = logging.getLogger("kiosk-walkins")
router = APIRouter(prefix="/kiosk", tags=["kiosk"])

# KIOSK_SHARED_KEY = os.getenv("KIOSK_SHARED_SECRET")
PLACEHOLDER_EMAIL_DOMAIN = os.getenv("PLACEHOLDER_EMAIL_DOMAIN", "noemail.medmitra")

def _norm_e164(mobile: str, default_country="+91") -> str:
    m = re.sub(r"\D", "", mobile or "")
    if not m: return ""
    if mobile.strip().startswith("+"):
        return f"+{re.sub(r'[^0-9]', '', mobile)}"
    return f"{default_country}{m}"

def _split_name(full: str):
    s = (full or "").strip()
    if not s: return "", ""
    parts = s.split()
    return (" ".join(parts[:-1]), parts[-1]) if len(parts) > 1 else (parts[0], "")

def _user_sub(user: dict) -> Optional[str]:
    # Prefer the 'sub' attribute
    for a in user.get("Attributes", []):
        if a.get("Name") == "sub":
            return a.get("Value")
    # Fallback: Cognito's Username is a stable UUID in most pool configs
    uid = user.get("Username")
    return uid if uid else None


def _upsert_patient(patient_id: str, e164: str, req: WalkinRegisterRequest):
    now = datetime.now(timezone.utc).isoformat()
    first, last = _split_name(req.name)
    item = {
        "patientId": patient_id,
        "mobile": e164,
        "firstName": first,
        "lastName": last,
        "fullName": req.name,
        "yearOfBirth": req.yearOfBirth,
        "gender": (req.gender or ""),
        "hasCaregiver": bool(req.hasCaregiver),
        "source": "kiosk",
        "updatedAt": now,
        "createdAt": now,
    }
    patients_table.put_item(Item=item)

@router.post("/walkins/register", response_model=WalkinRegisterResponse, status_code=201)
def walkin_register(
    payload: WalkinRegisterRequest = Body(...),
    x_kiosk_key: Optional[str] = Header(default=None, alias="X-Kiosk-Key"),
):
    # if KIOSK_SHARED_KEY and x_kiosk_key != KIOSK_SHARED_KEY:
    #     raise HTTPException(status_code=401, detail="Unauthorized kiosk client")

    e164 = _norm_e164(payload.mobile, payload.countryCode or "+91")
    if not e164 or len(re.sub(r"\D", "", e164)) < 10:
        raise HTTPException(status_code=400, detail="Invalid mobile number")

    user = cg.list_user_by_phone(e164)
    created = False

    if not user:
        # Pool expects email as username -> use a placeholder email as the username.
        # Keep the real phone in phone_number (and verify later via OTP flow).
        local_part = re.sub(r"\D", "", e164)  # e.g. "+9198..." -> "9198..."
        username = f"{local_part}@{PLACEHOLDER_EMAIL_DOMAIN}"
        first, last = _split_name(payload.name)
        attrs = [
            {"Name": "phone_number", "Value": e164},
            {"Name": "phone_number_verified", "Value": "false"},
            {"Name": "name", "Value": payload.name},
            # {"Name": "given_name", "Value": first},
            # {"Name": "family_name", "Value": last},
            # {"Name": "custom:year_of_birth", "Value": payload.yearOfBirth},
            # {"Name": "custom:gender", "Value": payload.gender or ""},
            # {"Name": "custom:has_caregiver", "Value": "true" if payload.hasCaregiver else "false"},
            # {"Name": "email", "Value": username},
            # {"Name": "email_verified", "Value": "false"},
        ]
        try:
            cg.admin_create_user(username, attrs)
            cg.ensure_group(username)
            user = cg.admin_get_user(username)
            created = True
        except ClientError as e:
            msg = e.response["Error"].get("Message", str(e))
            raise HTTPException(status_code=400, detail=f"Cognito create failed: {msg}")

    patient_id = _user_sub(user) or ""
    if not patient_id:
        raise HTTPException(status_code=500, detail="Could not determine patientId (sub)")

    try:
        _upsert_patient(patient_id, e164, payload)
    except ClientError as e:
        msg = e.response["Error"].get("Message", str(e))
        raise HTTPException(status_code=500, detail=f"DynamoDB error: {msg}")

    return WalkinRegisterResponse(
        patientId=patient_id,
        created=created,
        kioskVisitId=str(uuid.uuid4()),
        normalizedPhone=e164,
    )
