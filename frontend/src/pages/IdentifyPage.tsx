import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, Smartphone, Loader2, Shield } from "lucide-react";
import KioskLayout from "@/components/KioskLayout";
import { useTranslation, getStoredLanguage } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

// Trim trailing slashes; safe if empty.
const trim = (s?: string) => (s || "").replace(/\/+$/, "");

// Prefer NODE (Twilio) by default; can override with VITE_OTP_BACKEND=python.
const OTP_BACKEND = ((import.meta.env.VITE_OTP_BACKEND as "python" | "node") || "node");
const PY_BASE   = trim(import.meta.env.VITE_API_BASE_URL as string);
const NODE_BASE = trim(import.meta.env.VITE_NODE_API_BASE_URL as string);
const OTP_BASE  = OTP_BACKEND === "python" ? PY_BASE : NODE_BASE;
// If OTP_BASE is empty (env missing), requests will go relative to the FE origin.

export default function IdentifyPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(getStoredLanguage());
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("otp");
  const [phoneNumber, setPhoneNumber] = useState("");
  const countryCode = "+91";
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrScanning, setQrScanning] = useState(false);

  const toE164 = (raw: string) => {
    const digits = (raw || "").replace(/\D/g, "");
    if (!digits) return "";
    if (countryCode === "+91") {
      if (digits.length === 10) return `${countryCode}${digits}`;
      if (raw.trim().startsWith("+")) return raw.trim();
      return `${countryCode}${digits}`;
    }
    if (raw.trim().startsWith("+")) return raw.trim();
    return `${countryCode}${digits}`;
  };

  const handleSendOTP = async () => {
    const e164 = toE164(phoneNumber);
    if (!e164 || e164.length < 12) {
      toast({ variant: "destructive", title: "Invalid Phone Number", description: "Please enter a valid 10-digit mobile number." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${OTP_BASE}/api/kiosk/identify/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: e164, countryCode, createIfMissing: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `Failed (${res.status})`);

      sessionStorage.setItem("kioskPhone", e164);
      sessionStorage.setItem("kioskFlow", "identify");

      if (data.otpSessionId) sessionStorage.setItem("otpSessionId", data.otpSessionId);

      setOtpSent(true);
      toast({ title: "OTP Sent", description: "Please check your phone for the code." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e?.message || "Failed to send OTP. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const code = (otpCode || "").replace(/\D/g, "");
    if (code.length < 4) {
      toast({ variant: "destructive", title: "Invalid OTP", description: "Please enter the complete verification code." });
      return;
    }
    setLoading(true);
    try {
      const e164 = toE164(phoneNumber);
      const res = await fetch(`${OTP_BASE}/api/kiosk/identify/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: e164,
          code,
          countryCode,
          otpSessionId: sessionStorage.getItem("otpSessionId") || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `Verification failed (${res.status})`);

      sessionStorage.setItem("kioskPatientId", data.patientId);
      sessionStorage.setItem("kioskPhone", e164);

      const API_BASE = (import.meta.env.VITE_API_BASE_URL as string || "").replace(/\/+$/, "");
      fetch(`${API_BASE}/api/kiosk/session/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: data.patientId }),
        credentials: "include", 
      }).catch(() => { /* ignore */ });

      toast({ title: "Verified Successfully", description: "You’re checked in." });
      navigate("/appt");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Verification Failed", description: e?.message || "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = () => {
    setQrScanning(true);
    setTimeout(() => {
      setQrScanning(false);
      toast({ title: "QR Code Scanned", description: "Appointment found!" });
      navigate("/appt");
    }, 2000);
  };

  return (
    <KioskLayout title="Identify Yourself">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-4">{t("identify.title")}</h1>
          <p className="text-lg text-muted-foreground">Please verify your identity to proceed with your appointment</p>
        </div>

        <Card className="p-8 shadow-kiosk">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-16">
              <TabsTrigger value="qr" className="text-lg py-4"><QrCode className="h-5 w-5 mr-2" />{t("identify.scanQR")}</TabsTrigger>
              <TabsTrigger value="otp" className="text-lg py-4"><Smartphone className="h-5 w-5 mr-2" />{t("identify.enterOTP")}</TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="mt-8">
              <div className="text-center">
                <div className="bg-secondary/30 rounded-2xl p-12 mb-6 min-h-[300px] flex items-center justify-center">
                  {qrScanning ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-16 w-16 text-primary animate-spin" />
                      <p className="text-lg text-muted-foreground">Scanning QR Code...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <QrCode className="h-20 w-20 text-muted-foreground" />
                      <p className="text-lg text-muted-foreground">Camera preview would appear here</p>
                      <p className="text-sm text-muted-foreground max-w-md">Position your appointment QR code in the center of the frame</p>
                    </div>
                  )}
                </div>
                <Button onClick={handleQRScan} size="lg" disabled={qrScanning} className="text-xl px-8 py-6 h-auto">
                  {qrScanning ? (<><Loader2 className="h-5 w-5 mr-2 animate-spin" />Scanning...</>) : "Start QR Scan"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="otp" className="mt-8">
              <div className="space-y-6">
                {!otpSent ? (
                  <>
                    <div>
                      <label className="block text-lg font-medium mb-3">{t("identify.phoneNumber")}</label>
                      <Input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Enter 10-digit mobile number"
                        className="text-lg h-14 px-4"
                        maxLength={10}
                      />
                    </div>
                    <Button onClick={handleSendOTP} size="lg" disabled={loading || (phoneNumber || "").replace(/\D/g, "").length < 10} className="w-full text-xl py-6 h-auto">
                      {loading ? (<><Loader2 className="h-5 w-5 mr-2 animate-spin" />Sending...</>) : t("identify.sendOTP")}
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-lg font-medium mb-3">{t("identify.enterOTPCode")}</label>
                      <Input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="Enter 4-6 digit OTP" className="text-lg h-14 px-4 text-center" maxLength={6} />
                      <p className="text-sm text-muted-foreground mt-2">
                        OTP sent to {sessionStorage.getItem("kioskPhone") || toE164(phoneNumber)}
                      </p>
                    </div>
                    <Button onClick={handleVerifyOTP} size="lg" disabled={loading || (otpCode || "").replace(/\D/g, "").length < 4} className="w-full text-xl py-6 h-auto">
                      {loading ? (<><Loader2 className="h-5 w-5 mr-2 animate-spin" />Verifying...</>) : t("identify.verify")}
                    </Button>
                    <Button onClick={() => { setOtpSent(false); setOtpCode(""); }} variant="outline" size="lg" className="w-full text-lg py-4 h-auto">
                      Change Phone Number
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="mt-6 p-4 bg-muted/30 border-0">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">{t("identify.privacyNote")}</p>
          </div>
        </Card>
      </div>
    </KioskLayout>
  );
}
