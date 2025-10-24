import os
import re
import logging
from typing import List, Optional, Dict, Any

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from fastapi import APIRouter, HTTPException, Query

log = logging.getLogger("appt-list")
router = APIRouter(prefix="/appointments", tags=["appointments"])

AWS_REGION = os.getenv("AWS_REGION", "us-west-2")

# DynamoDB Appointments table (same name your patient portal writes to)
DDB_TABLE_APPOINTMENTS = os.getenv("DDB_TABLE_APPOINTMENTS", "medmitra_appointments")

# Optional local DynamoDB endpoint for dev
DYNAMODB_ENDPOINT = (os.getenv("DYNAMODB_LOCAL_URL") or "").strip() or None

# Cognito (to resolve phone -> user sub/patientId)
COGNITO_USER_POOL_ID = (os.getenv("COGNITO_USER_POOL_ID") or "").strip()
if not COGNITO_USER_POOL_ID:
    raise RuntimeError("Missing COGNITO_USER_POOL_ID")
cognito = boto3.client("cognito-idp", region_name=AWS_REGION)

def _ddb_table():
    kw = {"region_name": AWS_REGION}
    if DYNAMODB_ENDPOINT:
        kw["endpoint_url"] = DYNAMODB_ENDPOINT
    ddb = boto3.resource("dynamodb", **kw)
    return ddb.Table(DDB_TABLE_APPOINTMENTS)

def _coerce_str(v: Optional[str]) -> str:
    return (v or "").strip()

def _normalize_phone(mobile: str, country_code: str = "+91") -> str:
    # mirrors kiosk identify normalization (kept local to avoid import cycles)
    digits = re.sub(r"\D", "", mobile or "")
    if not digits:
        return ""
    if (mobile or "").strip().startswith("+"):
        return (mobile or "").strip()
    if country_code in ("+91", "91"):
        if len(digits) == 10:
            return f"+91{digits}"
        if digits.startswith("0") and len(digits) == 11:
            return f"+91{digits[1:]}"
        if digits.startswith("91") and len(digits) == 12:
            return f"+{digits}"
    return f"+{str(country_code).strip('+')}{digits}"

def _cognito_sub_from_phone(e164: str) -> Optional[str]:
    try:
        # exact match first
        resp = cognito.list_users(
            UserPoolId=COGNITO_USER_POOL_ID,
            Filter=f'phone_number = "{e164}"',
            Limit=2,
        )
        users = resp.get("Users", []) or []
        if not users:
            # prefix match (handles cases where + is missing in stored attr etc.)
            digits = e164.lstrip("+")
            try:
                resp2 = cognito.list_users(
                    UserPoolId=COGNITO_USER_POOL_ID,
                    Filter=f'phone_number ^= "+{digits}"',
                    Limit=5,
                )
                users = resp2.get("Users", []) or []
            except ClientError:
                users = []
        if not users:
            return None
        user = users[0]
        # pull "sub" from attributes
        attrs = {a["Name"]: a["Value"] for a in user.get("Attributes", [])}
        return attrs.get("sub") or user.get("Username")
    except ClientError as e:
        msg = e.response["Error"].get("Message", str(e))
        log.exception("Cognito list_users failed: %s", msg)
        raise HTTPException(status_code=500, detail=f"Cognito error: {msg}")

def _normalize_item(it: Dict[str, Any]) -> Dict[str, Any]:
    # Decide kind and flatten common display fields (supports both FastAPI+Lambda writers)
    kind = it.get("recordType") or (
        "lab" if it.get("tests")
        else "doctor" if (it.get("doctorId") or it.get("doctorName") or (it.get("appointment_details") and (it["appointment_details"].get("doctorId") or it["appointment_details"].get("doctorName"))))
        else "appointment"
    )
    return {
        "appointmentId": it.get("appointmentId"),
        "patientId": it.get("patientId"),
        "createdAt": it.get("createdAt"),
        "status": it.get("status", it.get("payment", {}).get("status", "BOOKED")),

        "recordType": kind,
        "clinicName": _coerce_str(it.get("clinicName") or it.get("appointment_details", {}).get("clinicName")),
        "clinicAddress": _coerce_str(it.get("clinicAddress")),
        "doctorId": _coerce_str(it.get("doctorId") or it.get("appointment_details", {}).get("doctorId")),
        "doctorName": _coerce_str(it.get("doctorName") or it.get("appointment_details", {}).get("doctorName")),
        "specialty": _coerce_str(it.get("specialty") or it.get("appointment_details", {}).get("specialty")),
        "consultationType": _coerce_str(it.get("consultationType") or it.get("appointment_details", {}).get("consultationType")),
        "appointmentType": _coerce_str(it.get("appointmentType") or it.get("appointment_details", {}).get("appointmentType")),
        "dateISO": _coerce_str(it.get("dateISO") or it.get("appointment_details", {}).get("dateISO") or it.get("collection", {}).get("preferredDateISO")),
        "timeSlot": _coerce_str(it.get("timeSlot") or it.get("appointment_details", {}).get("timeSlot") or it.get("collection", {}).get("preferredSlot")),
        "fee": _coerce_str(it.get("fee") or it.get("appointment_details", {}).get("fee")),
        "s3Key": it.get("s3Key"),

        "tests": it.get("tests") or [],
        "collection": it.get("collection"),
        "appointment_details": it.get("appointment_details"),
        "payment": it.get("payment"),
        "_raw": it,
    }

def _query_appointments(patient_id: str, limit: int, start_key: Optional[Dict[str, Any]] = None):
    tbl = _ddb_table()
    kwargs: Dict[str, Any] = {
        "KeyConditionExpression": Key("patientId").eq(patient_id),
        "ScanIndexForward": False,  # newest first
        "Limit": limit,
    }
    if start_key:
        kwargs["ExclusiveStartKey"] = start_key
    resp = tbl.query(**kwargs)
    items: List[dict] = resp.get("Items", [])
    normalized = [_normalize_item(it) for it in items]
    return {
        "items": normalized,
        "lastEvaluatedKey": resp.get("LastEvaluatedKey"),
    }

# -----------------------------
# GET /appointments/{patientId}
# -----------------------------
@router.get("/{patientId}")
def list_appointments_for_patient(
    patientId: str,
    limit: int = Query(100, ge=1, le=500),
    startKey_patientId: Optional[str] = Query(None, description="for pagination"),
    startKey_appointmentId: Optional[str] = Query(None, description="for pagination"),
):
    """
    Fetch all appointments for a given patient (newest first).
    Kiosk has OTP-verified identity already; no JWT required.
    Supports pagination with startKey_*.
    """
    try:
        start_key = None
        if startKey_patientId and startKey_appointmentId:
            start_key = {"patientId": startKey_patientId, "appointmentId": startKey_appointmentId}
        return _query_appointments(patientId, limit, start_key)
    except ClientError as e:
        msg = e.response["Error"].get("Message", str(e))
        log.exception("DynamoDB query failed")
        raise HTTPException(status_code=500, detail=f"DynamoDB error: {msg}")
    except Exception as e:
        log.exception("Unexpected error")
        raise HTTPException(status_code=500, detail=str(e))

# -----------------------------------
# GET /appointments/by-phone?phone=…
# -----------------------------------
@router.get("/by-phone")
def list_by_phone(
    phone: str = Query(..., description="raw user input (10 digits or +E.164)"),
    countryCode: str = Query("+91"),
    limit: int = Query(100, ge=1, le=500),
    startKey_patientId: Optional[str] = Query(None),
    startKey_appointmentId: Optional[str] = Query(None),
):
    """
    Convenience/backup endpoint:
    1) normalize phone
    2) look up the Cognito user (sub == patientId)
    3) return that patient's appointments
    Useful if FE doesn't have kioskPatientId in session for any reason.
    """
    e164 = _normalize_phone(phone, countryCode)
    if not e164:
        raise HTTPException(status_code=400, detail="Invalid phone number")

    patient_id = _cognito_sub_from_phone(e164)
    if not patient_id:
        return {"items": [], "patientId": None, "normalizedPhone": e164}

    start_key = None
    if startKey_patientId and startKey_appointmentId:
        start_key = {"patientId": startKey_patientId, "appointmentId": startKey_appointmentId}

    data = _query_appointments(patient_id, limit, start_key)
    data["patientId"] = patient_id
    data["normalizedPhone"] = e164
    return data
