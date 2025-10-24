import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Stethoscope, TestTube, MapPin, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import KioskLayout from "@/components/KioskLayout";
import { useTranslation, getStoredLanguage } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

const trim = (s?: string) => (s || "").replace(/\/+$/, "");
const API_BASE = trim(import.meta.env.VITE_API_BASE_URL as string);

type AppointmentItem = {
  appointmentId: string;
  patientId: string;
  createdAt: string;
  status: string;
  recordType?: "doctor" | "lab" | "appointment" | string;
  clinicName?: string;
  clinicAddress?: string;
  doctorId?: string;
  doctorName?: string;
  specialty?: string;
  consultationType?: string;
  appointmentType?: string;
  dateISO?: string;
  timeSlot?: string;
  fee?: string;
  tests?: Array<{ name?: string; price?: number | string }>;
  collection?: { type?: string; preferredDateISO?: string; preferredSlot?: string };
  appointment_details?: { dateISO?: string; timeSlot?: string; doctorId?: string; doctorName?: string };
  payment?: { status?: string; total?: number };
  s3Key?: string | null;
  _raw?: any;
};

export default function AppointmentPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(getStoredLanguage());
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AppointmentItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const patientId = sessionStorage.getItem("kioskPatientId") || "";
  const phone = sessionStorage.getItem("kioskPhone") || "";

  useEffect(() => {
    const goIdentify = () => navigate("/identify");

    const fetchByPatientId = async (pid: string) => {
      const res = await fetch(`${API_BASE}/api/appointments/${encodeURIComponent(pid)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `Failed (${res.status})`);
      return data as { items?: AppointmentItem[]; lastEvaluatedKey?: any };
    };

    const fetchByPhone = async (mobile: string) => {
      const url = new URL(`${API_BASE}/api/appointments/by-phone`);
      url.searchParams.set("phone", mobile);
      url.searchParams.set("countryCode", "+91");
      const res = await fetch(url.toString());
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `Failed (${res.status})`);
      // If BE resolved the patientId, cache it for later steps in the flow
      if (data.patientId) sessionStorage.setItem("kioskPatientId", data.patientId);
      return data as { items?: AppointmentItem[]; lastEvaluatedKey?: any; patientId?: string };
    };

    (async () => {
      try {
        setLoading(true);
        setError(null);

        let out: { items?: AppointmentItem[] } = {};
        if (patientId) {
          out = await fetchByPatientId(patientId);
        } else if (phone) {
          out = await fetchByPhone(phone);
        } else {
          // Neither present → user must re-identify
          return goIdentify();
        }

        const list: AppointmentItem[] = (out.items || []).map((it: any) => it);
        setItems(list);
        if (!list.length) {
          toast({ title: "No Appointments Found", description: "We didn’t find any active bookings for this number." });
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId, phone, navigate, toast]);

  const normalized = useMemo(() => {
    return (items || []).map((it) => {
      const apptDate = it.appointment_details?.dateISO || it.dateISO || it.collection?.preferredDateISO || "";
      const apptTime = it.appointment_details?.timeSlot || it.timeSlot || it.collection?.preferredSlot || "";
      const doctorNm = it.appointment_details?.doctorName || it.doctorName || "";
      const kind = (it.recordType || (it.tests?.length ? "lab" : doctorNm ? "doctor" : "appointment")) as AppointmentItem["recordType"];
      const status = (it.payment?.status || it.status || "BOOKED").toUpperCase();

      return {
        ...it,
        _kind: kind,
        _date: apptDate,
        _time: apptTime,
        _doctor: doctorNm,
        _isUnpaid: ["PENDING", "UNPAID"].includes(status),
        _status: status,
      };
    });
  }, [items]);

  const handleProceed = (chosen: AppointmentItem) => {
    sessionStorage.setItem("kioskSelectedAppointmentId", chosen.appointmentId);
    sessionStorage.setItem("kioskSelectedAppointmentRaw", JSON.stringify(chosen));
    if (["PENDING", "UNPAID"].includes((chosen.payment?.status || chosen.status || "").toUpperCase())) {
      navigate("/payment");
    } else {
      navigate("/reason");
    }
  };

  const handleNotYou = () => {
    sessionStorage.removeItem("kioskPatientId");
    sessionStorage.removeItem("kioskPhone");
    navigate("/identify");
  };

  return (
    <KioskLayout title="Appointment Details">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">{t("appointment.title")}</h1>
          <p className="text-lg text-muted-foreground">
            {phone ? <>Showing bookings for <strong>{phone}</strong></> : "Your upcoming bookings"}
          </p>
        </div>

        {/* Loading / Error */}
        {loading && (
          <Card className="p-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin inline-block mb-3" />
            <div className="text-muted-foreground">Fetching your appointments…</div>
          </Card>
        )}
        {!loading && error && (
          <Card className="p-6 text-center border-destructive/40">
            <div className="text-destructive font-medium mb-2">Failed to load</div>
            <div className="text-sm text-muted-foreground">{error}</div>
            <div className="mt-4">
              <Button onClick={() => window.location.reload()} size="lg">Retry</Button>
            </div>
          </Card>
        )}

        {/* No results */}
        {!loading && !error && normalized.length === 0 && (
          <Card className="p-8 text-center">
            <div className="text-lg">No appointments found.</div>
            <div className="text-sm text-muted-foreground mt-1">
              If you recently booked, please wait a moment or contact the front desk.
            </div>
            <div className="mt-6">
              <Button onClick={() => navigate("/walkin")} size="lg">Start a Walk-in Visit</Button>
            </div>
          </Card>
        )}

        {/* Appointments list */}
        <div className="grid grid-cols-1 gap-6">
          {normalized.map((a) => {
            const isLab = a._kind === "lab";
            return (
              <Card key={a.appointmentId} className="p-6 shadow-kiosk">
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full p-3 bg-primary/10">
                        {isLab ? <TestTube className="h-6 w-6 text-primary" /> : <Stethoscope className="h-6 w-6 text-primary" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-semibold text-foreground">
                            {isLab ? "Lab Tests" : (a._doctor || a.specialty || "Consultation")}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {(a._status || "BOOKED").toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {a.clinicName || a.clinicAddress ? (
                            <>
                              {a.clinicName || "Clinic"}{a.clinicName && a.clinicAddress ? " · " : ""}{a.clinicAddress}
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2 text-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-lg font-medium">{a._time || a.timeSlot || "--:--"}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {a._date || a.dateISO || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Details row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{a._doctor || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{a.clinicName || a.clinicAddress || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      <span>
                        {["PENDING", "UNPAID"].includes(a._status) ? "Unpaid" : "Paid / NA"}
                        {a.fee ? ` · ₹${a.fee}` : (a.payment?.total ? ` · ₹${a.payment.total}` : "")}
                      </span>
                    </div>
                  </div>

                  {/* Tests preview for lab */}
                  {isLab && (a.tests?.length ?? 0) > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Tests: {a.tests!.slice(0, 3).map(t => t?.name || "Test").join(", ")}
                      {(a.tests!.length > 3) ? ` +${a.tests!.length - 3} more` : ""}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button size="lg" className="px-6" onClick={() => handleProceed(a)}>
                      Continue <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={handleNotYou} className="w-full sm:w-auto">
            Not you? Change number
          </Button>
          <Button variant="secondary" onClick={() => navigate("/walkin")} className="w-full sm:w-auto">
            Start a Walk-in Visit
          </Button>
        </div>
      </div>
    </KioskLayout>
  );
}
