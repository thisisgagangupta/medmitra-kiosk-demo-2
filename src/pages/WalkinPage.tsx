import { useState } from "react";
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

interface WalkinFormData {
  name: string;
  mobile: string;
  yearOfBirth: string;
  gender?: string;
  hasCaregiver: boolean;
}

export default function WalkinPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(getStoredLanguage());
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<WalkinFormData>({
    name: '',
    mobile: '',
    yearOfBirth: '',
    hasCaregiver: false
  });
  
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const handleInputChange = (field: keyof WalkinFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Name Required",
        description: "Please enter your full name."
      });
      return;
    }

    if (!formData.mobile || formData.mobile.length < 10) {
      toast({
        variant: "destructive",
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number."
      });
      return;
    }

    if (!formData.yearOfBirth) {
      toast({
        variant: "destructive",
        title: "Year of Birth Required",
        description: "Please select your year of birth."
      });
      return;
    }

    setLoading(true);
    
    // Simulate registration process
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Registration Successful",
        description: "Your details have been recorded."
      });
      navigate('/consent');
    }, 1500);
  };

  const isFormValid = formData.name.trim() && 
                     formData.mobile.length >= 10 && 
                     formData.yearOfBirth;

  return (
    <KioskLayout title="Walk-in Registration">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <UserPlus className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary mb-4">
            Walk-in Registration
          </h1>
          <p className="text-lg text-muted-foreground">
            Please provide your basic information to register for your visit
          </p>
        </div>

        {/* Registration Form */}
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
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                className="text-lg h-14 px-4"
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
                type="tel"
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
                placeholder="Enter 10-digit mobile number"
                className="text-lg h-14 px-4"
                maxLength={10}
              />
            </div>

            {/* Year of Birth */}
            <div className="space-y-2">
              <Label className="text-lg font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Year of Birth <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={formData.yearOfBirth}
                onValueChange={(value) => handleInputChange('yearOfBirth', value)}
              >
                <SelectTrigger className="text-lg h-14">
                  <SelectValue placeholder="Select year of birth" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gender (Optional) */}
            <div className="space-y-2">
              <Label className="text-lg font-medium">
                Gender (Optional)
              </Label>
              <Select 
                value={formData.gender}
                onValueChange={(value) => handleInputChange('gender', value)}
              >
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
                  onCheckedChange={(checked) => handleInputChange('hasCaregiver', !!checked)}
                />
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="caregiver" className="text-base cursor-pointer">
                    I am accompanied by a caregiver/guardian
                  </Label>
                </div>
              </div>
            </Card>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 space-y-4">
          <Button
            onClick={handleSubmit}
            size="lg"
            disabled={!isFormValid || loading}
            className="w-full text-xl py-6 h-auto"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Registering...
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 mr-2" />
                {t('common.proceed')} to Consent
              </>
            )}
          </Button>

          <Button
            onClick={() => navigate('/start')}
            variant="outline"
            size="lg"
            className="w-full text-lg py-4 h-auto"
            disabled={loading}
          >
            {t('common.back')} to Options
          </Button>
        </div>

        {/* Information Note */}
        <Card className="mt-6 p-4 bg-muted/30 border-0">
          <p className="text-sm text-muted-foreground">
            <strong>Privacy Note:</strong> Your information is securely stored and used only for medical purposes. 
            Required fields are marked with (*). You can update your details at any time.
          </p>
        </Card>
      </div>
    </KioskLayout>
  );
}