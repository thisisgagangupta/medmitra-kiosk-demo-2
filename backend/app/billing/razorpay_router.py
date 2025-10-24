# backend/app/billing/razorpay_router.py
import hmac, hashlib, os, time
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel, Field
import razorpay
import logging
from app.db.dynamo import appointments_table
from datetime import datetime, timezone

log = logging.getLogger("billing-razorpay")
router = APIRouter(prefix="/billing/razorpay", tags=["billing-razorpay"])

def _now():
    return datetime.now(timezone.utc).isoformat()

# --- ENV / Config ---
RAZORPAY_KEY_ID     = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
RAZORPAY_AUTO_CAPTURE = (os.getenv("RAZORPAY_AUTO_CAPTURE", "true").lower() != "false")
CURRENCY = os.getenv("RAZORPAY_CURRENCY", "INR")

if not (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET):
    raise RuntimeError("Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# --- Minimal in-memory order cache (replace with Dynamo in prod) ---
_OPEN_ORDERS: Dict[str, str] = {}  # invoice_id -> order_id

class CreateOrderReq(BaseModel):
    invoice_id: str = Field(..., min_length=3)
    amount: int      # in paise
    notes: Optional[Dict[str, Any]] = None
    customer: Optional[Dict[str, str]] = None  # name/email/contact for prefill

class CreateOrderResp(BaseModel):
    key_id: str
    order_id: str
    amount: int
    currency: str
    invoice_id: str
    notes: Dict[str, Any] = {}

class VerifyReq(BaseModel):
    invoice_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@router.post("/order", response_model=CreateOrderResp)
def create_or_reuse_order(body: CreateOrderReq):
    """
    Idempotently create or reuse a Razorpay Order for this invoice.
    """
    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    # Reuse open order if we created one before for this invoice
    if body.invoice_id in _OPEN_ORDERS:
        order_id = _OPEN_ORDERS[body.invoice_id]
        try:
            o = client.order.fetch(order_id)
            if o and o.get("status") in ("created", "attempted"):
                return CreateOrderResp(
                    key_id=RAZORPAY_KEY_ID,
                    order_id=order_id,
                    amount=o["amount"],
                    currency=o["currency"],
                    invoice_id=body.invoice_id,
                    notes=o.get("notes") or {}
                )
        except Exception:
            pass  # fall through to create a new order

    payload = {
        "amount": body.amount,
        "currency": CURRENCY,
        "receipt": body.invoice_id,  # tie back to our invoice
        "notes": {
            "invoice_id": body.invoice_id,
            **(body.notes or {})
        },
        # partial_payment / first_payment_min_amount can be added later
    }
    try:
        order = client.order.create(payload)
        _OPEN_ORDERS[body.invoice_id] = order["id"]
        return CreateOrderResp(
            key_id=RAZORPAY_KEY_ID,
            order_id=order["id"],
            amount=order["amount"],
            currency=order["currency"],
            invoice_id=body.invoice_id,
            notes=order.get("notes") or {}
        )
    except Exception as e:
        log.exception("Razorpay order.create failed for %s", body.invoice_id)
        raise HTTPException(status_code=502, detail=f"Failed to create order: {e}")

@router.post("/verify")
def verify_signature(body: VerifyReq):
    """
    Verify HMAC from Checkout success and (optionally) capture immediately.
    """
    data = f"{body.razorpay_order_id}|{body.razorpay_payment_id}"
    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        data.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected, body.razorpay_signature):
        raise HTTPException(status_code=400, detail="Signature mismatch")

    # Optionally capture (if not auto-capture via dashboard)
    if not RAZORPAY_AUTO_CAPTURE:
        try:
            # You may store/retrieve amount from your invoice table instead of fetching payment
            p = client.payment.fetch(body.razorpay_payment_id)
            amount = int(p["amount"])
            client.payment.capture(body.razorpay_payment_id, amount)
        except Exception as e:
            log.exception("Manual capture failed")
            raise HTTPException(status_code=502, detail=f"Capture failed: {e}")
        
    inv = body.invoice_id or ""
    if inv and not inv.startswith("WALKIN-"):
        # Without patientId this is tricky; however the Appointments table is keyed by (patientId, appointmentId).
        # We'll do a best-effort fanout search only if you have a GSI; otherwise, accept patientId from FE.
        # Here we expect the FE to POST attach (recommended). Still, try a best-effort write if FE fails:
        try:
            pass  # leave as no-op (FE will attach). Or implement a lookup GSI if available.
        except Exception:
            pass

    return {"ok": True, "invoice_id": body.invoice_id}

# Optional: Webhook for reconciliation
@router.post("/webhook")
async def webhook(req: Request):
    # Validate signature header if configured
    body = await req.body()
    log.info("Razorpay webhook: %s", body[:512])
    # TODO: verify header X-Razorpay-Signature against webhook secret
    # TODO: upsert payment state by event type (payment.captured, payment.failed, refund.processed, order.paid)
    return {"ok": True}