import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, Smartphone, Loader2, Shield } from "lucide-react";
import KioskLayout from "@/components/KioskLayout";
import { useTranslation, getStoredLanguage } from "@/lib/i18n";
import { MockAuthService } from "@/lib/mock-services";
import { useToast } from "@/hooks/use-toast";

export default function IdentifyPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(getStoredLanguage());
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("qr");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrScanning, setQrScanning] = useState(false);

  const handleSendOTP = async () => {
    if (phoneNumber.length < 10) {
      toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit mobile number."
      });
      return;
    }

    setLoading(true);
    try {
      const result = await MockAuthService.sendOTP(phoneNumber);
      if (result.success) {
        setOtpSent(true);
        toast({
          title: "OTP Sent",
          description: "Please check your mobile phone for the verification code."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send OTP. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length < 4) {
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "Please enter the complete verification code."
      });
      return;
    }

    setLoading(true);
    try {
      const result = await MockAuthService.verifyOTP(phoneNumber, otpCode);
      if (result.success && result.appointment) {
        toast({
          title: "Verified Successfully",
          description: "Appointment found!"
        });
        navigate('/appt');
      } else {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: "Invalid OTP or no appointment found."
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Verification failed. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = () => {
    setQrScanning(true);
    // Simulate QR scanning
    setTimeout(() => {
      setQrScanning(false);
      toast({
        title: "QR Code Scanned",
        description: "Appointment found!"
      });
      navigate('/appt');
    }, 2000);
  };

  return (
    <KioskLayout title="Identify Yourself">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-4">
            {t('identify.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            Please verify your identity to proceed with your appointment
          </p>
        </div>

        {/* Main Card */}
        <Card className="p-8 shadow-kiosk">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-16">
              <TabsTrigger value="qr" className="text-lg py-4">
                <QrCode className="h-5 w-5 mr-2" />
                {t('identify.scanQR')}
              </TabsTrigger>
              <TabsTrigger value="otp" className="text-lg py-4">
                <Smartphone className="h-5 w-5 mr-2" />
                {t('identify.enterOTP')}
              </TabsTrigger>
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
                      <p className="text-lg text-muted-foreground">
                        Camera preview would appear here
                      </p>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Position your appointment QR code in the center of the frame
                      </p>
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={handleQRScan}
                  size="lg"
                  disabled={qrScanning}
                  className="text-xl px-8 py-6 h-auto"
                >
                  {qrScanning ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    'Start QR Scan'
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="otp" className="mt-8">
              <div className="space-y-6">
                {!otpSent ? (
                  <>
                    <div>
                      <label className="block text-lg font-medium mb-3">
                        {t('identify.phoneNumber')}
                      </label>
                      <Input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Enter 10-digit mobile number"
                        className="text-lg h-14 px-4"
                        maxLength={10}
                      />
                    </div>
                    
                    <Button
                      onClick={handleSendOTP}
                      size="lg"
                      disabled={loading || phoneNumber.length < 10}
                      className="w-full text-xl py-6 h-auto"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        t('identify.sendOTP')
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-lg font-medium mb-3">
                        {t('identify.enterOTPCode')}
                      </label>
                      <Input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="Enter 4-digit OTP"
                        className="text-lg h-14 px-4 text-center"
                        maxLength={4}
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        OTP sent to {phoneNumber}
                      </p>
                    </div>
                    
                    <Button
                      onClick={handleVerifyOTP}
                      size="lg"
                      disabled={loading || otpCode.length < 4}
                      className="w-full text-xl py-6 h-auto"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        t('identify.verify')
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode("");
                      }}
                      variant="outline"
                      size="lg"
                      className="w-full text-lg py-4 h-auto"
                    >
                      Change Phone Number
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Privacy Note */}
        <Card className="mt-6 p-4 bg-muted/30 border-0">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              {t('identify.privacyNote')}
            </p>
          </div>
        </Card>
      </div>
    </KioskLayout>
  );
}