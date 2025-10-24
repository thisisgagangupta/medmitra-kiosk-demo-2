import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, IndianRupee, Check, X, Clock, Receipt } from "lucide-react";
import KioskLayout from "@/components/KioskLayout";
import { useTranslation, getStoredLanguage } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { SERVICE_CATALOG, calcBill, ServiceId } from "@/lib/pricing";

// ---- Types & globals --------------------------------------------------------
interface PaymentMethod {
  id: "upi" | "card";
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

// ---- Env & constants --------------------------------------------------------
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string || "").replace(/\/+$/, "");
const RZP_JS = import.meta.env.VITE_RAZORPAY_CHECKOUT_URL || "https://checkout.razorpay.com/v1/checkout.js";

// Small helper to safely load checkout.js once
async function loadRazorpay(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay checkout.js"));
    document.body.appendChild(s);
  });
}

// Attach payment details into the appointment row's `kiosk` field (no-op if we don't have an appointment)
async function attachPaymentToAppointment({
  method,
  amount,
  orderId,
  paymentId,
}: {
  method: "upi" | "card" | string;
  amount: number;        // rupees
  orderId: string;
  paymentId: string;
}) {
  const patientId = sessionStorage.getItem("kioskPatientId") || "";
  const appointmentId = sessionStorage.getItem("kioskSelectedAppointmentId") || "";

  if (!patientId || !appointmentId) return; // walk-in flow or missing context → skip

  await fetch(`${API_BASE}/api/kiosk/appointments/attach`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      patientId,
      appointmentId,
      kiosk: {
        payment: {
          provider: "razorpay",
          status: "success",
          method,
          amount,                          // ₹ (display amount)
          orderId,
          paymentId,
          verified: true,
          verifiedAt: new Date().toISOString(),
        },
      },
    }),
  }).catch(() => {
    // Intentionally swallow errors — payment is already verified; we don't block UX on telemetry write
  });
}


// ---- Component --------------------------------------------------------------
export default function PaymentPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(getStoredLanguage());
  const { toast } = useToast();

  const flow = (sessionStorage.getItem("kioskFlow") || "identify") as "walkin" | "identify";

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod["id"] | "">("");
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "success" | "failed">("pending");
  const [transactionId, setTransactionId] = useState<string>("");

  // guard against double-opens
  const openingRef = useRef(false);

  // ---------- Service picker (WALK-IN only) ----------
  const [selectedServices, setSelectedServices] = useState<ServiceId[]>(() => {
    const prev = sessionStorage.getItem("walkinSelectedServices");
    if (!prev) return ["consultation"];
    try {
      const arr = JSON.parse(prev) as ServiceId[];
      return Array.isArray(arr) && arr.length ? arr : ["consultation"];
    } catch {
      return ["consultation"];
    }
  });

  const bill = useMemo(() => {
    const includeRegistration = flow === "walkin";
    return calcBill(selectedServices, includeRegistration);
  }, [selectedServices, flow]);

  useEffect(() => {
    if (flow === "walkin") {
      sessionStorage.setItem("walkinSelectedServices", JSON.stringify(selectedServices));
      sessionStorage.setItem("walkinBill", JSON.stringify(bill));
    }
  }, [selectedServices, bill, flow]);

  // We keep only ONE online option for Razorpay (all methods inside).
  // To preserve types and existing handler, we call payWithRazorpay('upi').
  const paymentMethods: PaymentMethod[] = [
    {
      id: "upi", // used only to trigger the same checkout; we are NOT forcing UPI
      name: "Pay Online (Razorpay)",
      icon: Smartphone,
      description: "UPI, Card, Netbanking & Wallets"
    },
  ];

  const handleToggleService = (id: ServiceId) => {
    setSelectedServices(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  // Pick/derive an invoice id for this flow
  const getInvoiceId = () => {
    // Prefer unique, stable ids coming from your flow
    return (
      sessionStorage.getItem("kioskVisitId") ||
      sessionStorage.getItem("kioskSelectedAppointmentId") ||
      `WALKIN-${Date.now()}`
    );
  };

  // Amount (in rupees) rendered on UI; convert to paise for Razorpay Order
  const uiAmount = useMemo(() => (flow === "walkin" ? bill.total : 605), [flow, bill]);

  const payWithRazorpay = async (method: PaymentMethod["id"]) => {
    if (openingRef.current) return;            // prevent double invokes
    openingRef.current = true;

    setSelectedMethod(method);
    setPaymentStatus("processing");
    setLoading(true);

    try {
      // 1) Compute amount in paise (integer)
      const amountPaise = Math.round(uiAmount * 100);
      if (amountPaise <= 0) throw new Error("Invalid amount");

      // 2) Create (or reuse) an Order for our invoice
      const invoiceId = getInvoiceId();
      const createRes = await fetch(`${API_BASE}/api/billing/razorpay/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          invoice_id: invoiceId,
          amount: amountPaise,
          notes: {
            flow,
            patientId: sessionStorage.getItem("kioskPatientId") || "",
          },
          customer: {
            name: "",                                        // optional
            email: "",                                       // optional
            contact: sessionStorage.getItem("kioskPhone") || ""
          }
        }),
      });
      if (!createRes.ok) {
        const txt = await createRes.text().catch(() => "");
        throw new Error(`Order create failed (${createRes.status}): ${txt || "unknown"}`);
      }
      const { key_id, order_id, currency } = await createRes.json();

      // 3) Load checkout.js
      await loadRazorpay(RZP_JS);
      if (!window.Razorpay) throw new Error("Razorpay SDK not available");

      // 4) Open Razorpay Checkout (we do not force a method, so all options show)
      const rzp = new window.Razorpay({
        key: key_id,
        order_id,
        amount: amountPaise,
        currency: currency || "INR",
        name: "MedMitra AI",
        description: flow === "walkin" ? "Walk-in visit payment" : "Consultation payment",
        prefill: { contact: sessionStorage.getItem("kioskPhone") || "" },
        notes: { invoice_id: invoiceId },
        // Success handler (client-side) — must verify on server next
        handler: async (resp: any) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/api/billing/razorpay/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                invoice_id: invoiceId,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_signature: resp.razorpay_signature
              }),
            });
            if (!verifyRes.ok) throw new Error("Signature verification failed");

            setPaymentStatus("success");
            setTransactionId(resp.razorpay_payment_id || "");

            // Save for TokenPage/printing
            sessionStorage.setItem("lastPayment", JSON.stringify({
              flow,
              method,
              amount: uiAmount,
              transactionId: resp.razorpay_payment_id || "",
              at: new Date().toISOString(),
              bill
            }));

            await attachPaymentToAppointment({
              method,
              amount: uiAmount,
              orderId: resp.razorpay_order_id,
              paymentId: resp.razorpay_payment_id,
            });

            // Handoff to token page shortly
            setTimeout(() => navigate("/token"), 1200);
          } catch (e: any) {
            setPaymentStatus("failed");
            toast({ variant: "destructive", title: "Verification Failed", description: e?.message || "Please try again." });
          } finally {
            setLoading(false);
            openingRef.current = false;
          }
        },
        modal: {
          ondismiss: () => {
            // user closed the modal — reset UI to allow retry
            setPaymentStatus("pending");
            setSelectedMethod("");
            setLoading(false);
            openingRef.current = false;
          }
        },
        theme: { color: "#1E293B" } // optional brand color (matches your UI vibe)
      });

      rzp.open();
    } catch (err: any) {
      console.error(err);
      setPaymentStatus("failed");
      toast({ variant: "destructive", title: "Payment Error", description: err?.message || "Could not start payment" });
      setLoading(false);
      openingRef.current = false;
    }
  };

  const handleRetry = () => {
    setPaymentStatus("pending");
    setSelectedMethod("");
    setTransactionId("");
  };

  const handleSkip = () => {
    // Allowed mostly for Identify flow where payment may be pre-paid or handled at desk
    navigate("/token");
  };

  const handlePrintReceipt = async () => {
    if (transactionId) {
      toast({ title: "Receipt Printing", description: "Your receipt will be printed at the front desk." });
    }
  };

  // ---------- Success / Failed UIs ----------
  if (paymentStatus === "success") {
    return (
      <KioskLayout title="Payment Successful" showBack={false}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="bg-success/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Check className="h-12 w-12 text-success" />
            </div>
            <h1 className="text-3xl font-bold text-success mb-4">Payment Successful!</h1>
            <p className="text-lg text-muted-foreground">Your payment has been processed successfully</p>
          </div>

          <Card className="p-6 mb-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="text-2xl font-bold text-foreground">₹{uiAmount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Transaction ID</span>
                <Badge variant="outline" className="font-mono">{transactionId}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="capitalize">{selectedMethod}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Date & Time</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
            </div>
          </Card>

          <div className="flex gap-4">
            <Button onClick={handlePrintReceipt} variant="outline" size="lg" className="flex-1 text-lg py-4 h-auto">
              <Receipt className="h-5 w-5 mr-2" /> Print Receipt
            </Button>
            <Button onClick={() => navigate("/token")} size="lg" className="flex-1 text-lg py-4 h-auto"> Continue </Button>
          </div>

          <Card className="mt-6 p-4 bg-muted/30 border-0">
            <p className="text-sm text-muted-foreground">
              Proceeding to token generation in <Clock className="inline h-4 w-4" /> ~1–2 seconds...
            </p>
          </Card>
        </div>
      </KioskLayout>
    );
  }

  if (paymentStatus === "failed") {
    return (
      <KioskLayout title="Payment Failed">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="bg-destructive/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <X className="h-12 w-12 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold text-destructive mb-4">Payment Failed</h1>
            <p className="text-lg text-muted-foreground mb-6">
              We couldn't process your payment. Please try again or contact our front desk for assistance.
            </p>
            <div className="flex gap-4">
              <Button onClick={handleRetry} size="lg" className="flex-1 text-xl py-6 h-auto">Try Again</Button>
              <Button onClick={() => navigate("/help")} variant="outline" size="lg" className="flex-1 text-lg py-4 h-auto">Get Help</Button>
            </div>
          </div>
        </div>
      </KioskLayout>
    );
  }

  // ---------- Main Payment page ----------
  const payDisabled = (m: PaymentMethod) =>
    loading || (flow === "walkin" && selectedServices.length === 0);

  const cashDisabled = loading || (flow === "walkin" && selectedServices.length === 0);

  return (
    <KioskLayout title="Payment">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <IndianRupee className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary mb-4">Payment Summary</h1>
          <p className="text-lg text-muted-foreground">
            {flow === "walkin" ? "Please select your services and complete the payment" : "Please review your charges and complete the payment"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bill Summary */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Bill Details</h2>

            {flow === "walkin" ? (
              <>
                {/* Selected services list */}
                <div className="space-y-2 mb-3">
                  {selectedServices.map(sid => {
                    const svc = SERVICE_CATALOG.find(s => s.id === sid);
                    return (
                      <div key={sid} className="flex justify-between">
                        <span className="text-muted-foreground">{svc?.name}</span>
                        <span>₹{svc?.price}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Registration fee (auto) */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registration Fee</span>
                  <span>₹{bill.registrationFee}</span>
                </div>

                <Separator className="my-3" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{bill.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST (10%)</span>
                  <span>₹{bill.tax}</span>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount</span>
                  <span className="text-primary">₹{bill.total}</span>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-muted-foreground">Consultation Fee</span><span>₹500</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Registration Fee</span><span>₹50</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">GST (10%)</span><span>₹55</span></div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold"><span>Total Amount</span><span className="text-primary">₹605</span></div>
              </div>
            )}
          </Card>

          {/* Payment Methods / Service Picker */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {flow === "walkin" ? "Choose How You Want to Pay" : "Choose How You Want to Pay"}
            </h2>

            {flow === "walkin" && (
              <div className="mb-6 space-y-3">
                {SERVICE_CATALOG.filter(s => s.selectable).map(svc => (
                  <label key={svc.id} className="flex items-center justify-between border rounded-md px-4 py-3 cursor-pointer">
                    <div>
                      <div className="font-medium">{svc.name}</div>
                      {svc.description && <div className="text-sm text-muted-foreground">{svc.description}</div>}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">₹{svc.price}</span>
                      <input
                        type="checkbox"
                        className="h-5 w-5"
                        checked={selectedServices.includes(svc.id)}
                        onChange={() => handleToggleService(svc.id)}
                      />
                    </div>
                  </label>
                ))}
                <p className="text-xs text-muted-foreground">
                  Registration fee is automatically applied for walk-ins.
                </p>
                <Separator className="my-4" />
              </div>
            )}

            {/* Payment method / processing */}
            {paymentStatus === "processing" ? (
              <div className="text-center py-8">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <h3 className="text-lg font-medium mb-2">Processing Payment...</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while we process your {selectedMethod || "selected"} payment
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Online via Razorpay (all methods available) */}
                {paymentMethods.map(method => {
                  const IconComponent = method.icon;
                  return (
                    <Button
                      key={method.id}
                      variant="outline"
                      className="w-full h-auto p-4 flex items-center gap-4 hover:shadow-card transition-all disabled:opacity-60"
                      onClick={() => payWithRazorpay(method.id)}
                      disabled={payDisabled(method)}
                    >
                      <div className="bg-primary/10 rounded-full p-2">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium">{method.name}</h3>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                    </Button>
                  );
                })}

                {/* Pay at Reception (Cash) */}
                <Button
                  variant="outline"
                  className="w-full h-auto p-4 flex items-center gap-4 hover:shadow-card transition-all disabled:opacity-60"
                  onClick={handleSkip}
                  disabled={cashDisabled}
                >
                  <div className="bg-primary/10 rounded-full p-2">
                    <IndianRupee className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium">Pay at Reception (Cash)</h3>
                    <p className="text-sm text-muted-foreground">Pay in cash at the front desk and get your token</p>
                  </div>
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Skip (mostly Identify) */}
        <Card className="mt-6 p-4 bg-muted/30 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Already paid?</p>
              <p className="text-sm text-muted-foreground">Skip payment if you've already settled the bill at the front desk</p>
            </div>
            <Button onClick={handleSkip} variant="outline" disabled={loading}>
              Skip Payment
            </Button>
          </div>
        </Card>
      </div>
    </KioskLayout>
  );
}
