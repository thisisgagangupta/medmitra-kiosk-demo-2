import os
import re
import logging
from datetime import datetime, timezone
from typing import Optional, Any, Dict

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field, validator
from botocore.exceptions import ClientError
from app.db.dynamo import appointments_table

log = logging.getLogger("appt-kiosk-attach")
router = APIRouter(prefix="/kiosk/appointments", tags=["kiosk-appointments"])

class KioskPayload(BaseModel):
    # required keys to locate the row
    patientId: str = Field(..., min_length=6)
    appointmentId: str = Field(..., min_length=6)

    # everything we want to attach under "kiosk"
    kiosk: Dict[str, Any] = Field(
        default_factory=dict,
        description="Free-form kiosk payload (reason, voice flags, payment, device info, etc.)"
    )

    # Optional safety: allow only plain JSON map values (lists/str/num/bool/None)
    @validator("kiosk")
    def _no_binary(cls, v):
        # very light guard; extend as needed
        if not isinstance(v, dict):
            raise ValueError("kiosk must be an object")
        return v

def _now():
    return datetime.now(timezone.utc).isoformat()

@router.post("/attach")
def attach_kiosk_data(payload: KioskPayload = Body(...)):
    """
    Merge/attach kiosk details into the appointment row as a single map field 'kiosk'.
    - Requires existing item (patientId + appointmentId).
    - Adds/updates kiosk.updatedAt; sets kiosk.createdAt if first time.
    - Server-side merge logic to preserve previous 'kiosk' content.
    """
    tbl = appointments_table()
    pid = payload.patientId.strip()
    aid = payload.appointmentId.strip()

    # Server-enrichment
    kiosk_in = dict(payload.kiosk or {})
    kiosk_in.setdefault("source", "kiosk")
    kiosk_in["updatedAt"] = _now()

    # Use UpdateExpression with if_not_exists to keep earlier data and shallow-merge.
    # We compute the new merged map in a single SET by reading existing, but DDB
    # can't do deep merge. Strategy: if kiosk exists -> overwrite top-level with
    # client-provided keys. If not exists -> create full map.
    # Easiest robust approach: SET kiosk = if_not_exists(kiosk, :empty) and then
    # overwrite kiosk with :knew (single write). That's acceptable since kiosk is
    # kiosk-owned and we control callers.
    try:
        # Check whether kiosk exists so we can set createdAt once
        resp = tbl.get_item(Key={"patientId": pid, "appointmentId": aid})
        item = resp.get("Item")
        if not item:
            raise HTTPException(status_code=404, detail="Appointment not found")

        existing_kiosk = item.get("kiosk") or {}
        if "createdAt" not in existing_kiosk:
            kiosk_in.setdefault("createdAt", _now())

        # Final write: replace 'kiosk' atomically, do not touch other attrs
        update_resp = tbl.update_item(
            Key={"patientId": pid, "appointmentId": aid},
            UpdateExpression="SET #k = :k, #u = :u",
            ExpressionAttributeNames={
                "#k": "kiosk",
                "#u": "updatedAt",
            },
            ExpressionAttributeValues={
                ":k": {**existing_kiosk, **kiosk_in},  # shallow merge (kiosk-level)
                ":u": _now(),
            },
            ConditionExpression="attribute_exists(patientId) AND attribute_exists(appointmentId)",
            ReturnValues="ALL_NEW",
        )

        return {
            "ok": True,
            "patientId": pid,
            "appointmentId": aid,
            "kiosk": update_resp["Attributes"].get("kiosk", {}),
            "updatedAt": update_resp["Attributes"].get("updatedAt"),
        }
    except HTTPException:
        raise
    except ClientError as e:
        code = e.response["Error"].get("Code")
        msg  = e.response["Error"].get("Message", str(e))
        if code == "ConditionalCheckFailedException":
            raise HTTPException(status_code=404, detail="Appointment not found")
        log.exception("DynamoDB update failed: %s", msg)
        raise HTTPException(status_code=500, detail=f"DynamoDB error: {msg}")
    except Exception as e:
        log.exception("Unexpected error")
        raise HTTPException(status_code=500, detail=str(e))
