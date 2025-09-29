import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FileText, PenTool, Save, Printer, Clock } from "lucide-react";
import KioskLayout from "@/components/KioskLayout";
import { useTranslation, getStoredLanguage } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

export default function ConsentPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(getStoredLanguage());
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [consents, setConsents] = useState({
    treatment: false,
    privacy: false,
    billing: false
  });
  const [signatureProvided, setSignatureProvided] = useState(false);
  const [loading, setLoading] = useState(false);

  const consentVersion = "v2.1";
  const currentDateTime = new Date().toLocaleString();

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setSignatureProvided(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#A379A9';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureProvided(false);
    }
  };

  const handleConsentChange = (type: keyof typeof consents, checked: boolean) => {
    setConsents(prev => ({
      ...prev,
      [type]: checked
    }));
  };

  const handleSubmit = async () => {
    if (!Object.values(consents).every(Boolean)) {
      toast({
        variant: "destructive",
        title: "Consent Required",
        description: "Please agree to all consent terms to proceed."
      });
      return;
    }

    if (!signatureProvided) {
      toast({
        variant: "destructive",
        title: "Signature Required",
        description: "Please provide your signature to complete consent."
      });
      return;
    }

    setLoading(true);
    
    // Simulate consent processing
    setTimeout(() => {
      const consentId = `CONSENT_${Date.now()}`;
      localStorage.setItem('medmitra-consent', consentId);
      
      toast({
        title: "Consent Recorded",
        description: `Consent ID: ${consentId}`
      });
      
      setLoading(false);
      navigate('/reason');
    }, 1500);
  };

  const handlePrint = () => {
    toast({
      title: "Print Initiated",
      description: "Consent form will be printed at the front desk."
    });
  };

  const isFormComplete = Object.values(consents).every(Boolean) && signatureProvided;

  return (
    <KioskLayout title="Consent Form">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <FileText className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary mb-2">
            Medical Consent Form
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {currentDateTime}
            </span>
            <span>Version: {consentVersion}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Consent Text */}
          <Card className="lg:col-span-2 p-6">
            <h2 className="text-xl font-semibold mb-4">Consent Terms</h2>
            
            <ScrollArea className="h-80 pr-4">
              <div className="space-y-6 text-sm">
                <div>
                  <h3 className="font-medium text-base mb-2">Treatment Consent</h3>
                  <p className="text-muted-foreground">
                    I consent to the medical treatment and procedures as deemed necessary by the healthcare provider. 
                    I understand the nature of the treatment, potential risks, benefits, and alternatives have been 
                    explained to me. I voluntarily give my consent for the medical care and treatment.
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium text-base mb-2">Privacy & Data Protection</h3>
                  <p className="text-muted-foreground">
                    I authorize the healthcare facility to collect, store, and process my personal health information 
                    for the purpose of medical treatment, billing, and healthcare operations. I understand my rights 
                    regarding the privacy of my medical information as outlined in applicable privacy laws.
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium text-base mb-2">Financial Responsibility</h3>
                  <p className="text-muted-foreground">
                    I acknowledge my financial responsibility for all charges incurred during my treatment. 
                    I understand the payment policies and agree to pay for services rendered according to 
                    the facility's billing procedures. I authorize the healthcare provider to process payments 
                    through approved methods.
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium text-base mb-2">Emergency Treatment</h3>
                  <p className="text-muted-foreground">
                    In case of a medical emergency, I consent to emergency treatment as deemed necessary by 
                    the healthcare provider, even if I am unable to provide explicit consent at that time. 
                    This includes life-saving measures and emergency procedures.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </Card>

          {/* Consent Checkboxes & Signature */}
          <div className="space-y-6">
            {/* Consent Checkboxes */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Required Agreements</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="treatment"
                    checked={consents.treatment}
                    onCheckedChange={(checked) => handleConsentChange('treatment', !!checked)}
                  />
                  <label htmlFor="treatment" className="text-sm cursor-pointer">
                    I consent to medical treatment and procedures
                  </label>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="privacy"
                    checked={consents.privacy}
                    onCheckedChange={(checked) => handleConsentChange('privacy', !!checked)}
                  />
                  <label htmlFor="privacy" className="text-sm cursor-pointer">
                    I agree to privacy and data protection terms
                  </label>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="billing"
                    checked={consents.billing}
                    onCheckedChange={(checked) => handleConsentChange('billing', !!checked)}
                  />
                  <label htmlFor="billing" className="text-sm cursor-pointer">
                    I accept financial responsibility for services
                  </label>
                </div>
              </div>
            </Card>

            {/* Digital Signature */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Digital Signature</h3>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted rounded-lg">
                  <canvas
                    ref={canvasRef}
                    width={280}
                    height={120}
                    className="w-full cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  {!signatureProvided && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <PenTool className="h-4 w-4" />
                        <span className="text-sm">Sign here</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={clearSignature}
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={!signatureProvided}
                >
                  Clear Signature
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Button
            onClick={handleSubmit}
            size="lg"
            disabled={!isFormComplete || loading}
            className="flex-1 text-xl py-6 h-auto"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Complete Consent
              </>
            )}
          </Button>

          <Button
            onClick={handlePrint}
            variant="outline"
            size="lg"
            disabled={!isFormComplete}
            className="text-lg py-6 h-auto"
          >
            <Printer className="h-5 w-5 mr-2" />
            Print Copy
          </Button>
        </div>

        {/* Helper Text */}
        <Card className="mt-6 p-4 bg-muted/30 border-0">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Important:</strong> By signing this form, you acknowledge that you have read, 
            understood, and agree to all the terms and conditions outlined above.
          </p>
        </Card>
      </div>
    </KioskLayout>
  );
}