# backend/app/appointments/availability.py
import os
import logging
from typing import Optional
import boto3
from boto3.dynamodb.conditions import Key
from fastapi import APIRouter, HTTPException, Query

log = logging.getLogger("appt-availability")
router = APIRouter(prefix="/appointments", tags=["appointments"])

AWS_REGION = os.getenv("AWS_REGION", "us-west-2")
DDB_TABLE_SLOTS = os.getenv("DDB_TABLE_SLOTS", "medmitra_appointment_slots")
DYNAMODB_ENDPOINT = (os.getenv("DYNAMODB_LOCAL_URL") or "").strip() or None

def _slots_table():
    kw = {"region_name": AWS_REGION}
    if DYNAMODB_ENDPOINT:
        kw["endpoint_url"] = DYNAMODB_ENDPOINT
    ddb = boto3.resource("dynamodb", **kw)
    return ddb.Table(DDB_TABLE_SLOTS)

@router.get("/availability")
def availability(
    type: str = Query(..., regex="^(doctor|lab)$"),
    resourceId: str = Query(..., min_length=1),
    date: str = Query(..., regex=r"^\d{4}-\d{2}-\d{2}$"),
):
    """
    Returns booked slots for the resource on a given date.
    {
      "resourceKey": "doctor#1",
      "date": "YYYY-MM-DD",
      "booked": ["HH:mm", ...]
    }
    """
    resource_key = f"{type}#{resourceId}"
    try:
        tbl = _slots_table()
        prefix = f"{date}#"
        resp = tbl.query(
            KeyConditionExpression=Key("resourceKey").eq(resource_key) & Key("slotKey").begins_with(prefix)
        )
        booked: list[str] = []
        for it in resp.get("Items", []):
            sk = it.get("slotKey", "")
            if "#" in sk:
                booked.append(sk.split("#", 1)[1])
        booked = sorted(set(booked))
        return {"resourceKey": resource_key, "date": date, "booked": booked}
    except Exception as e:
        log.exception("Slots query failed")
        raise HTTPException(status_code=500, detail=str(e))
