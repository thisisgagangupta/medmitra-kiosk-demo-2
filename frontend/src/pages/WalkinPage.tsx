// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
// import { UserPlus, Phone, Calendar, Users } from "lucide-react";
// import KioskLayout from "@/components/KioskLayout";
// import { useTranslation, getStoredLanguage } from "@/lib/i18n";
// import { useToast } from "@/hooks/use-toast";
// import { useEffect } from "react";

// const API_BASE_RAW = (import.meta.env.VITE_API_BASE_URL as string) || "";
// const API_BASE = API_BASE_RAW.replace(/\/+$/, ""); // strip trailing slash, if any
// // const KIOSK_KEY = import.meta.env.VITE_KIOSK_SHARED_KEY as string | undefined;

// interface WalkinFormData {
//   name: string;
//   mobile: string;
//   yearOfBirth: string;
//   gender?: string;
//   hasCaregiver: boolean;
// }

// type WalkinResponse = {
//   patientId: string;
//   created: boolean;
//   kioskVisitId: string;
//   normalizedPhone: string;
//   groupAssigned: string;
// };

// export default function WalkinPage() {
//   const navigate = useNavigate();
//   const { t } = useTranslation(getStoredLanguage());
//   const { toast } = useToast();

//   const [formData, setFormData] = useState<WalkinFormData>({
//     name: "",
//     mobile: "",
//     yearOfBirth: "",
//     hasCaregiver: false,
//   });
//   const [loading, setLoading] = useState(false);

//   const currentYear = new Date().getFullYear();
//   const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

//   useEffect(() => {
//     // clear old kiosk session cookie silently
//     fetch(`${API_BASE}/api/kiosk/session/clear`, {
//       method: "POST",
//       credentials: "include",
//     }).catch(() => {});
//     // also clear any stale FE session values
//     sessionStorage.removeItem("kioskPatientId");
//     sessionStorage.removeItem("kioskVisitId");
//     sessionStorage.removeItem("kioskPhone");
//     sessionStorage.setItem("kioskFlow", "walkin");
//   }, []);

//   const handleInputChange = (field: keyof WalkinFormData, value: string | boolean) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//   };
  
//   const handleSubmit = async () => {
//     // --- Basic validation (digits only for phone) ---
//     const name = formData.name.trim();
//     const mobileDigits = (formData.mobile || "").replace(/\D/g, "");
//     if (!name) {
//       toast({ variant: "destructive", title: "Name Required", description: "Please enter your full name." });
//       return;
//     }
//     if (!mobileDigits || mobileDigits.length < 10) {
//       toast({ variant: "destructive", title: "Invalid Mobile Number", description: "Please enter a valid 10-digit mobile number." });
//       return;
//     }
//     if (!formData.yearOfBirth) {
//       toast({ variant: "destructive", title: "Year of Birth Required", description: "Please select your year of birth." });
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await fetch(`${API_BASE}/api/kiosk/walkins/register`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           // ...(KIOSK_KEY ? { "X-Kiosk-Key": KIOSK_KEY } : {}),
//         },
//         body: JSON.stringify({
//           name,
//           mobile: mobileDigits,            // backend normalizes to E.164
//           yearOfBirth: formData.yearOfBirth,
//           gender: formData.gender || "",
//           hasCaregiver: !!formData.hasCaregiver,
//           countryCode: "+91",              // adjust if you support multiple locales
//         }),
//       });

//       const payload = await res.json().catch(() => ({}));
//       if (!res.ok) {
//         // Surface server-provided detail if present
//         const detail = payload?.detail || `Registration failed (${res.status})`;
//         throw new Error(detail);
//       }

//       const data = payload as WalkinResponse;
//       // Persist for the next steps (Consent, Check-in, etc.)
//       sessionStorage.setItem("kioskPatientId", data.patientId);
//       sessionStorage.setItem("kioskVisitId", data.kioskVisitId);
//       sessionStorage.setItem("kioskPhone", data.normalizedPhone);
//       sessionStorage.setItem("kioskFlow", "walkin");

//       // New: persist kiosk session cookie as well
//       fetch(`${API_BASE}/api/kiosk/session/set`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ patientId: data.patientId }),
//         credentials: "include", 
//       }).catch(() => { /* ignore */ });

//       toast({
//         title: "Registration Successful",
//         description: data.created
//           ? "Your account has been created."
//           : "Welcome back! We found your account.",
//       });

//       navigate("/walkin-slot");
//     } catch (e: any) {
//       toast({
//         variant: "destructive",
//         title: "Registration Failed",
//         description: e?.message || "Please try again or see front desk.",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const mobileDigitsLen = (formData.mobile || "").replace(/\D/g, "").length;
//   const isFormValid = !!formData.name.trim() && mobileDigitsLen >= 10 && !!formData.yearOfBirth;

//   return (
//     <KioskLayout title="Walk-in Registration">
//       <div className="max-w-2xl mx-auto">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <UserPlus className="h-16 w-16 text-primary mx-auto mb-4" />
//           <h1 className="text-3xl font-bold text-primary mb-4">Walk-in Registration</h1>
//           <p className="text-lg text-muted-foreground">Please provide your basic information to register for your visit</p>
//         </div>

//         {/* Registration Form */}
//         <Card className="p-8 shadow-kiosk">
//           <div className="space-y-6">
//             {/* Name */}
//             <div className="space-y-2">
//               <Label htmlFor="name" className="text-lg font-medium">
//                 Full Name <span className="text-destructive">*</span>
//               </Label>
//               <Input
//                 id="name"
//                 type="text"
//                 value={formData.name}
//                 onChange={(e) => handleInputChange("name", e.target.value)}
//                 placeholder="Enter your full name"
//                 className="text-lg h-14 px-4"
//                 disabled={loading}
//               />
//             </div>

//             {/* Mobile Number */}
//             <div className="space-y-2">
//               <Label htmlFor="mobile" className="text-lg font-medium flex items-center gap-2">
//                 <Phone className="h-4 w-4" />
//                 Mobile Number <span className="text-destructive">*</span>
//               </Label>
//               <Input
//                 id="mobile"
//                 inputMode="numeric"
//                 pattern="[0-9]*"
//                 type="tel"
//                 value={formData.mobile}
//                 onChange={(e) => handleInputChange("mobile", e.target.value)}
//                 placeholder="Enter 10-digit mobile number"
//                 className="text-lg h-14 px-4"
//                 maxLength={10}
//                 disabled={loading}
//               />
//             </div>

//             {/* Year of Birth */}
//             <div className="space-y-2">
//               <Label className="text-lg font-medium flex items-center gap-2">
//                 <Calendar className="h-4 w-4" />
//                 Year of Birth <span className="text-destructive">*</span>
//               </Label>
//               <Select value={formData.yearOfBirth} onValueChange={(value) => handleInputChange("yearOfBirth", value)} disabled={loading}>
//                 <SelectTrigger className="text-lg h-14">
//                   <SelectValue placeholder="Select year of birth" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {years.map((year) => (
//                     <SelectItem key={year} value={year.toString()}>
//                       {year}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             {/* Gender (Optional) */}
//             <div className="space-y-2">
//               <Label className="text-lg font-medium">Gender (Optional)</Label>
//               <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)} disabled={loading}>
//                 <SelectTrigger className="text-lg h-14">
//                   <SelectValue placeholder="Select gender" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="male">Male</SelectItem>
//                   <SelectItem value="female">Female</SelectItem>
//                   <SelectItem value="other">Other</SelectItem>
//                   <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             {/* Caregiver Toggle */}
//             <Card className="p-4 bg-muted/30">
//               <div className="flex items-center space-x-3">
//                 <Checkbox
//                   id="caregiver"
//                   checked={formData.hasCaregiver}
//                   onCheckedChange={(checked) => handleInputChange("hasCaregiver", !!checked)}
//                   disabled={loading}
//                 />
//                 <div className="flex items-center gap-2">
//                   <Users className="h-4 w-4 text-muted-foreground" />
//                   <Label htmlFor="caregiver" className="text-base cursor-pointer">
//                     I am accompanied by a caregiver/guardian
//                   </Label>
//                 </div>
//               </div>
//             </Card>
//           </div>
//         </Card>

//         {/* Action Buttons */}
//         <div className="mt-8 space-y-4">
//           <Button onClick={handleSubmit} size="lg" disabled={!isFormValid || loading} className="w-full text-xl py-6 h-auto">
//             {loading ? (
//               <>
//                 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
//                 Registering...
//               </>
//             ) : (
//               <>
//                 <UserPlus className="h-5 w-5 mr-2" />
//                 {t("common.proceed")}
//               </>
//             )}
//           </Button>

//           <Button onClick={() => navigate("/start")} variant="outline" size="lg" className="w-full text-lg py-4 h-auto" disabled={loading}>
//             {t("common.back")} to Options
//           </Button>
//         </div>

//         {/* Information Note */}
//         <Card className="mt-6 p-4 bg-muted/30 border-0">
//           <p className="text-sm text-muted-foreground">
//             <strong>Privacy Note:</strong> Your information is securely stored and used only for medical purposes. Required fields are marked with (*). You
//             can update your details at any time.
//           </p>
//         </Card>
//       </div>
//     </KioskLayout>
//   );
// }
















import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Phone, Calendar, Users } from "lucide-react";
import KioskLayout from "@/components/KioskLayout";
import { useTranslation, getStoredLanguage } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

const API_BASE_RAW = (import.meta.env.VITE_API_BASE_URL as string) || "";
const API_BASE = API_BASE_RAW.replace(/\/+$/, "");

interface WalkinFormData {
  name: string;
  mobile: string;
  yearOfBirth: string;
  gender?: string;
  hasCaregiver: boolean;
  groupSize: number; // NEW
}

type WalkinResponse = {
  patientId: string;
  created: boolean;
  kioskVisitId: string;
  normalizedPhone: string;
  groupAssigned?: string;
};

export default function WalkinPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(getStoredLanguage());
  const { toast } = useToast();

  const [formData, setFormData] = useState<WalkinFormData>({
    name: "",
    mobile: "",
    yearOfBirth: "",
    hasCaregiver: false,
    groupSize: 1,
  });
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetch(`${API_BASE}/api/kiosk/session/clear`, { method: "POST", credentials: "include" }).catch(() => {});
    sessionStorage.removeItem("kioskPatientId");
    sessionStorage.removeItem("kioskVisitId");
    sessionStorage.removeItem("kioskPhone");
    sessionStorage.setItem("kioskFlow", "walkin");
  }, []);

  const handleInputChange = (field: keyof WalkinFormData, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value as any }));
  };

  const handleSubmit = async () => {
    const name = formData.name.trim();
    const mobileDigits = (formData.mobile || "").replace(/\D/g, "");
    if (!name) {
      toast({ variant: "destructive", title: "Name Required", description: "Please enter your full name." });
      return;
    }
    if (!mobileDigits || mobileDigits.length < 10) {
      toast({ variant: "destructive", title: "Invalid Mobile Number", description: "Please enter a valid 10-digit mobile number." });
      return;
    }
    if (!formData.yearOfBirth) {
      toast({ variant: "destructive", title: "Year of Birth Required", description: "Please select your year of birth." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/kiosk/walkins/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          mobile: mobileDigits,
          yearOfBirth: formData.yearOfBirth,
          gender: formData.gender || "",
          hasCaregiver: !!formData.hasCaregiver,
          countryCode: "+91",
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = payload?.detail || `Registration failed (${res.status})`;
        throw new Error(detail);
      }

      const data = payload as WalkinResponse;
      sessionStorage.setItem("kioskPatientId", data.patientId);
      sessionStorage.setItem("kioskVisitId", data.kioskVisitId);
      sessionStorage.setItem("kioskPhone", data.normalizedPhone);
      sessionStorage.setItem("kioskFlow", "walkin");
      // NEW: persist group size for the slot page
      sessionStorage.setItem("kioskGroupSize", String(formData.groupSize || 1));

      fetch(`${API_BASE}/api/kiosk/session/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: data.patientId }),
        credentials: "include",
      }).catch(() => {});

      toast({
        title: "Registration Successful",
        description: data.created ? "Your account has been created." : "Welcome back! We found your account.",
      });

      navigate("/walkin-slot");
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: e?.message || "Please try again or see front desk.",
      });
    } finally {
      setLoading(false);
    }
  };

  const mobileDigitsLen = (formData.mobile || "").replace(/\D/g, "").length;
  const isFormValid = !!formData.name.trim() && mobileDigitsLen >= 10 && !!formData.yearOfBirth;

  return (
    <KioskLayout title="Walk-in Registration">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <UserPlus className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary mb-4">Walk-in Registration</h1>
          <p className="text-lg text-muted-foreground">Please provide your basic information to register for your visit</p>
        </div>

        <Card className="p-8 shadow-kiosk">
          <div className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-lg font-medium">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter your full name"
                className="text-lg h-14 px-4"
                disabled={loading}
              />
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-lg font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Mobile Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="mobile"
                inputMode="numeric"
                pattern="[0-9]*"
                type="tel"
                value={formData.mobile}
                onChange={(e) => handleInputChange("mobile", e.target.value)}
                placeholder="Enter 10-digit mobile number"
                className="text-lg h-14 px-4"
                maxLength={10}
                disabled={loading}
              />
            </div>

            {/* Year of Birth */}
            <div className="space-y-2">
              <Label className="text-lg font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Year of Birth <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.yearOfBirth} onValueChange={(value) => handleInputChange("yearOfBirth", value)} disabled={loading}>
                <SelectTrigger className="text-lg h-14">
                  <SelectValue placeholder="Select year of birth" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gender (Optional) */}
            <div className="space-y-2">
              <Label className="text-lg font-medium">Gender (Optional)</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)} disabled={loading}>
                <SelectTrigger className="text-lg h-14">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Caregiver Toggle */}
            <Card className="p-4 bg-muted/30">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="caregiver"
                  checked={formData.hasCaregiver}
                  onCheckedChange={(checked) => handleInputChange("hasCaregiver", !!checked)}
                  disabled={loading}
                />
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="caregiver" className="text-base cursor-pointer">
                    I am accompanied by a caregiver/guardian
                  </Label>
                </div>
              </div>
            </Card>

            {/* Group size */}
            <div className="space-y-2">
              <Label className="text-lg font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Group Size (including you)
              </Label>
              <Select
                value={String(formData.groupSize)}
                onValueChange={(v) => handleInputChange("groupSize", Number(v))}
                disabled={loading}
              >
                <SelectTrigger className="text-lg h-14">
                  <SelectValue placeholder="Select group size" />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                We’ll book {formData.groupSize} consecutive slots for your visit.
              </p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 space-y-4">
          <Button onClick={handleSubmit} size="lg" disabled={!isFormValid || loading} className="w-full text-xl py-6 h-auto">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Registering...
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 mr-2" />
                {t("common.proceed")}
              </>
            )}
          </Button>

          <Button onClick={() => navigate("/start")} variant="outline" size="lg" className="w-full text-lg py-4 h-auto" disabled={loading}>
            {t("common.back")} to Options
          </Button>
        </div>

        <Card className="mt-6 p-4 bg-muted/30 border-0">
          <p className="text-sm text-muted-foreground">
            <strong>Privacy Note:</strong> Your information is securely stored and used only for medical purposes.
          </p>
        </Card>
      </div>
    </KioskLayout>
  );
}
