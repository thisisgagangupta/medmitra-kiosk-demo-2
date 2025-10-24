import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import KioskLayout from "@/components/KioskLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Stethoscope, MapPin, Star, Clock, AlertTriangle, Users, CheckCircle2, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getStoredLanguage, useTranslation } from "@/lib/i18n";
import { Separator } from "@/components/ui/separator";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string || "").replace(/\/+$/, "");

// ---- helpers ----
function generateQuarterHourSlots(start = "08:00", end = "20:00"): string[] {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const out: string[] = [];
  for (let h = sh; h < eh || (h === eh && (em ?? 0) > 0); h++) {
    for (let m of [0, 15, 30, 45]) {
      if (h === sh && m < sm) continue;
      if (h > eh || (h === eh && m >= (em || 0))) break;
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
}
function dateToLocalYYYYMMDD(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10); }
function filterPastSlots(date: Date, all: string[]) {
  const today = new Date();
  const same = today.toDateString() === date.toDateString();
  if (!same) return all;
  const curH = today.getHours(), curM = today.getMinutes();
  return all.filter((t) => {
    const [h, m] = t.split(":").map(Number);
    return h > curH || (h === curH && m > curM);
  });
}
function addMinutes(HHMM: string, mins: number) {
  const [h, m] = HHMM.split(":").map(Number);
  const t = new Date(2000, 0, 1, h, m);
  t.setMinutes(t.getMinutes() + mins);
  return `${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`;
}

// ---- demo doctors list (replace with API later) ----
type Doctor = { id: string; name: string; specialty: string; clinicName: string; rating?: number; qualifications?: string; };
const DOCTORS: Doctor[] = [
  { id: "1", name: "Dr. Michael Chen", specialty: "General Medicine", clinicName: "MedMitra Downtown Clinic", rating: 4.8, qualifications: "MBBS, MD" },
  { id: "2", name: "Dr. Priya Sharma",  specialty: "General Medicine", clinicName: "MedMitra Central Clinic",   rating: 4.6, qualifications: "MBBS, MD" },
];

export default function WalkinSlotPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation(getStoredLanguage());

  const patientId = sessionStorage.getItem("kioskPatientId") || "";
  const phone     = sessionStorage.getItem("kioskPhone") || "";
  const groupSize = Math.max(1, Number(sessionStorage.getItem("kioskGroupSize") || "1"));

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(DOCTORS[0]?.id || "");
  const doctor = useMemo(() => DOCTORS.find(d => d.id === selectedDoctorId)!, [selectedDoctorId]);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string>("");

  const [booked, setBooked] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSlots = useMemo(() => generateQuarterHourSlots("08:00", "20:00"), []);
  const visibleSlots = useMemo(() => {
    if (!selectedDate) return [];
    const base = filterPastSlots(selectedDate, allSlots);
    return base.filter((s) => !booked.includes(s));
  }, [selectedDate, allSlots, booked]);

  // compute consecutive slots preview for the group
  const requiredSlots = useMemo(() => {
    if (!selectedSlot) return [];
    const arr = [selectedSlot];
    for (let i = 1; i < groupSize; i++) arr.push(addMinutes(selectedSlot, 15 * i));
    return arr;
  }, [selectedSlot, groupSize]);

  const hasAllConsecutive = useMemo(() => {
    if (!selectedSlot) return false;
    return requiredSlots.every((s) => visibleSlots.includes(s));
  }, [requiredSlots, visibleSlots, selectedSlot]);

  // Ensure identity exists
  useEffect(() => {
    if (!patientId) {
      toast({ variant: "destructive", title: "Session Expired", description: "Please verify again." });
      navigate("/identify");
    }
  }, [patientId, navigate, toast]);

  // Availability fetch + freshness
  const pollingRef = useRef<number | null>(null);
  useEffect(() => {
    let aborted = false;
    const fetchAvailability = async () => {
      if (!selectedDate || !doctor) return;
      setLoading(true); setError(null);
      try {
        const date = dateToLocalYYYYMMDD(selectedDate);
        const url = new URL(`${API_BASE}/api/appointments/availability`);
        url.searchParams.set("type", "doctor");
        url.searchParams.set("resourceId", doctor.id);
        url.searchParams.set("date", date);
        const res = await fetch(url.toString(), { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || `Failed to load availability (${res.status})`);
        if (!aborted) setBooked((data.booked || []) as string[]);
      } catch (e: any) {
        if (!aborted) { setError(e?.message || "Failed to load availability"); setBooked([]); }
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    fetchAvailability();
    if (pollingRef.current) window.clearInterval(pollingRef.current);
    pollingRef.current = window.setInterval(fetchAvailability, 20000);
    const onFocus = () => fetchAvailability();
    window.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      aborted = true;
      if (pollingRef.current) { window.clearInterval(pollingRef.current); pollingRef.current = null; }
      window.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [doctor, selectedDate]);

  // If a selected slot becomes booked, clear it immediately
  useEffect(() => {
    if (selectedSlot && booked.includes(selectedSlot)) setSelectedSlot("");
  }, [booked, selectedSlot]);

  async function handleBook() {
    if (!patientId || !doctor || !selectedDate || !selectedSlot) return;
    if (groupSize > 1 && !hasAllConsecutive) {
      toast({ variant: "destructive", title: "Not enough consecutive slots", description: "Please pick a different start time." });
      return;
    }
    setBooking(true); setError(null);
    try {
      const dateISO = dateToLocalYYYYMMDD(selectedDate);

      if (groupSize === 1) {
        // single booking → existing endpoint
        const payload = {
          patientId,
          contact: { phone, name: "" },
          appointment_details: {
            dateISO,
            timeSlot: selectedSlot,
            clinicName: doctor.clinicName,
            specialty: doctor.specialty,
            doctorId: doctor.id,
            doctorName: doctor.name,
            consultationType: "in-person",
            appointmentType: "walkin",
            symptoms: "", fee: "", languages: [],
          },
          source: "kiosk",
        };
        const res = await fetch(`${API_BASE}/api/appointments/book`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          await refreshAfterRace(dateISO);
          toast({ variant: "destructive", title: "Slot Unavailable", description: data.detail || "Please pick another slot." });
          setBooking(false);
          return;
        }
        if (!res.ok) throw new Error(data.detail || `Booking failed (${res.status})`);
        const apptId = data.appointmentId as string;
        sessionStorage.setItem("kioskSelectedAppointmentId", apptId);
        sessionStorage.setItem("kioskSelectedAppointmentRaw", JSON.stringify(data));
      } else {
        // group booking → batch endpoint
        const payload = {
          patientId,
          contact: { phone, name: "" },
          appointment_details: {
            dateISO,
            clinicName: doctor.clinicName,
            specialty: doctor.specialty,
            doctorId: doctor.id,
            doctorName: doctor.name,
            consultationType: "in-person",
            appointmentType: "walkin",
            symptoms: "", fee: "", languages: [],
          },
          timeSlots: requiredSlots, // consecutive slots
          source: "kiosk",
        };
        const res = await fetch(`${API_BASE}/api/appointments/book-batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          await refreshAfterRace(dateISO);
          const bad = (data.conflicts || []).join(", ");
          toast({ variant: "destructive", title: "Some slots just got taken", description: bad ? `Conflicts: ${bad}` : "Pick another start time." });
          setBooking(false);
          return;
        }
        if (!res.ok) throw new Error(data.detail || `Batch booking failed (${res.status})`);
        // remember the first appointment id for downstream pages (reason/payment/token)
        const first = Array.isArray(data.appointments) ? data.appointments[0] : null;
        if (first?.appointmentId) {
          sessionStorage.setItem("kioskSelectedAppointmentId", first.appointmentId);
        }
        sessionStorage.setItem("kioskSelectedAppointmentRaw", JSON.stringify(data));
      }

      sessionStorage.setItem("kioskFlow", "walkin");
      toast({ title: "Appointment(s) Booked", description: groupSize > 1 ? `Booked ${groupSize} consecutive slots.` : "Proceeding to reason." });
      navigate("/reason");
    } catch (e: any) {
      setError(e?.message || "Failed to book appointment");
    } finally {
      setBooking(false);
    }
  }

  async function refreshAfterRace(dateISO: string) {
    try {
      const url = new URL(`${API_BASE}/api/appointments/availability`);
      url.searchParams.set("type", "doctor");
      url.searchParams.set("resourceId", doctor.id);
      url.searchParams.set("date", dateISO);
      const r2 = await fetch(url.toString());
      const d2 = await r2.json().catch(() => ({}));
      setBooked((d2.booked || []) as string[]);
      if (selectedSlot && (d2.booked || []).includes(selectedSlot)) setSelectedSlot("");
    } catch {}
  }

  const earliest = visibleSlots[0];

  return (
    <KioskLayout title="Book Walk-in Appointment">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">Book Your Walk-in Appointment</h1>
          <p className="text-lg text-muted-foreground">
            {groupSize > 1 
              ? `Booking for ${groupSize} people - ${groupSize} consecutive slots will be reserved`
              : "Select your preferred doctor, date, and time slot"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="mb-6 border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-semibold text-destructive">Booking Error</p>
                  <p className="text-sm text-destructive/90 mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Doctor & Date Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Doctor Selection */}
            <Card className="shadow-md">
              <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" /> 
                    Choose Your Doctor
                  </CardTitle>
                </div>
                <CardDescription>Select from available walk-in doctors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="doctor-select" className="text-base">Available Doctors</Label>
                  <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                    <SelectTrigger id="doctor-select" className="h-12">
                      <SelectValue placeholder="Choose a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCTORS.map((d) => (
                        <SelectItem key={d.id} value={d.id} className="py-3">
                          <div className="flex flex-col">
                            <span className="font-medium">{d.name}</span>
                            <span className="text-xs text-muted-foreground">{d.specialty}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {doctor && (
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{doctor.clinicName}</p>
                        <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-4 text-sm">
                      {doctor.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{doctor.rating}</span>
                          <span className="text-muted-foreground">Rating</span>
                        </div>
                      )}
                      {doctor.qualifications && (
                        <div className="text-muted-foreground">
                          {doctor.qualifications}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {groupSize > 1 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Users className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Group Booking</p>
                      <p className="text-xs text-muted-foreground">
                        {groupSize} consecutive time slots will be reserved
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      {groupSize}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Date & Time Selection */}
            <Card className="shadow-md">
              <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" /> 
                    Select Date
                  </CardTitle>
                </div>
                <CardDescription>Pick your preferred appointment date</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => { 
                      setSelectedSlot(""); 
                      setSelectedDate(d || new Date()); 
                    }}
                    className="rounded-md border"
                    disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Time Slot Selection */}
            <Card className="shadow-md">
              <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">3</span>
                    </div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" /> 
                      Choose Time Slot
                    </CardTitle>
                  </div>
                  {earliest && (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      Next: {earliest}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {selectedDate ? `Available slots for ${dateToLocalYYYYMMDD(selectedDate)}` : "Select a date first"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 animate-pulse mb-3" />
                    <p className="text-lg font-medium">Loading available slots...</p>
                    <p className="text-sm">Please wait</p>
                  </div>
                ) : visibleSlots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mb-3" />
                    <p className="text-lg font-medium">No slots available</p>
                    <p className="text-sm">Please try a different date</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                      {visibleSlots.map((slot) => {
                        const selected = selectedSlot === slot;
                        const inGroup = requiredSlots.includes(slot);
                        
                        return (
                          <Button
                            key={slot}
                            variant={selected ? "default" : "outline"}
                            className={`h-14 text-base font-medium relative ${
                              selected ? "ring-2 ring-primary ring-offset-2" : ""
                            } ${inGroup && !selected ? "bg-primary/10 border-primary/30" : ""}`}
                            onClick={() => setSelectedSlot(slot)}
                          >
                            {slot}
                            {inGroup && (
                              <CheckCircle2 className="h-3 w-3 absolute -top-1 -right-1 text-primary" />
                            )}
                          </Button>
                        );
                      })}
                    </div>

                    {/* Group Preview */}
                    {groupSize > 1 && selectedSlot && (
                      <div className={`p-4 rounded-lg border-2 ${
                        hasAllConsecutive 
                          ? "bg-primary/5 border-primary/30" 
                          : "bg-destructive/5 border-destructive/30"
                      }`}>
                        <div className="flex items-start gap-3">
                          {hasAllConsecutive ? (
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                          )}
                          <div className="flex-1 space-y-2">
                            <p className={`font-semibold ${
                              hasAllConsecutive ? "text-primary" : "text-destructive"
                            }`}>
                              {hasAllConsecutive 
                                ? `✓ ${groupSize} Consecutive Slots Reserved` 
                                : `⚠ Not Enough Consecutive Slots`}
                            </p>
                            {hasAllConsecutive ? (
                              <div className="flex flex-wrap gap-2">
                                {requiredSlots.map((s, idx) => (
                                  <Badge key={s} variant="secondary" className="text-sm">
                                    {idx + 1}. {s}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-destructive/90">
                                Please select a different start time with {groupSize} consecutive available slots.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              {/* Booking Summary */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 pb-3 border-b">
                      <Stethoscope className="h-4 w-4 text-muted-foreground mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1">Doctor</p>
                        <p className="font-medium text-sm break-words">{doctor?.name || "—"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pb-3 border-b">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1">Clinic</p>
                        <p className="text-sm break-words">{doctor?.clinicName || "—"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pb-3 border-b">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1">Date</p>
                        <p className="font-medium text-sm">
                          {selectedDate ? dateToLocalYYYYMMDD(selectedDate) : "Not selected"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pb-3 border-b">
                      <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1">Time</p>
                        <p className="font-medium text-sm">
                          {selectedSlot || "Not selected"}
                        </p>
                      </div>
                    </div>

                    {groupSize > 1 && (
                      <div className="flex items-start gap-3">
                        <Users className="h-4 w-4 text-muted-foreground mt-1" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">Group Size</p>
                          <Badge variant="secondary">{groupSize} people</Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Button
                      className="w-full h-12 text-base font-semibold"
                      size="lg"
                      onClick={handleBook}
                      disabled={
                        !selectedSlot || 
                        !selectedDate || 
                        !doctor || 
                        booking || 
                        (groupSize > 1 && !hasAllConsecutive)
                      }
                    >
                      {booking ? (
                        <>
                          <Clock className="h-4 w-4 animate-spin" />
                          Booking...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          {groupSize > 1 ? `Book ${groupSize} Slots` : "Confirm & Continue"}
                        </>
                      )}
                    </Button>

                    <Button 
                      variant="outline" 
                      className="w-full h-11" 
                      onClick={() => navigate("/walkin")}
                      disabled={booking}
                    >
                      Back to Walk-in Options
                    </Button>
                  </div>

                  {(!selectedSlot || (groupSize > 1 && !hasAllConsecutive)) && (
                    <p className="text-xs text-center text-muted-foreground">
                      {!selectedSlot 
                        ? "Please select a time slot to continue" 
                        : "Select a valid start time for consecutive slots"}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Help Card */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium">Need Assistance?</p>
                    <p className="text-xs text-muted-foreground">
                      Staff members are available at the reception desk for help
                    </p>
                    <Button variant="link" size="sm" onClick={() => navigate("/help")}>
                      Get Help
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </KioskLayout>
  );
}
