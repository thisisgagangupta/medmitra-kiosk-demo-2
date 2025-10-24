import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Printer, QrCode, Clock, CheckCircle, Eye, ArrowRight } from "lucide-react";
import KioskLayout from "@/components/KioskLayout";
import { useTranslation, getStoredLanguage } from "@/lib/i18n";
import { generateMockToken, MockPrintService } from "@/lib/mock-services";
import { useToast } from "@/hooks/use-toast";

export default function TokenPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(getStoredLanguage());
  const { toast } = useToast();
  
  const [token] = useState(() => generateMockToken());
  const [showQR, setShowQR] = useState(false);
  const [printing, setPrinting] = useState(false);

  // Store token for queue tracking
  useEffect(() => {
    localStorage.setItem('medmitra-token', JSON.stringify(token));
  }, [token]);

  const handlePrintToken = async () => {
    setPrinting(true);
    
    try {
      const result = await MockPrintService.printToken(token);
      if (result.success) {
        toast({
          title: "Token Printed",
          description: "Your token has been printed successfully."
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Print Error",
        description: "Failed to print token. Please ask for help at the front desk."
      });
    } finally {
      setPrinting(false);
    }
  };

  const handleShowQR = () => {
    setShowQR(true);
    toast({
      title: "QR Code Generated",
      description: "Show this to staff for easy check-in."
    });
  };

  const handleViewQueue = () => {
    navigate('/queue');
  };

  const nextSteps = [
    "Find a comfortable seat in the waiting area",
    "Keep your token number visible and ready",
    "Listen for your token number announcement",
    "Proceed to the designated room when called",
    "Present your token to the medical staff"
  ];

  return (
    <KioskLayout title="Token Issued" showBack={false}>
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="bg-success/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-success" />
          </div>
          
          <h1 className="text-3xl font-bold text-success mb-4">
            Token Issued Successfully!
          </h1>
          
          <p className="text-lg text-muted-foreground">
            Your check-in is complete. Please wait for your turn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Token Details */}
          <Card className="p-8 text-center shadow-kiosk">
            <div className="mb-6">
              <h2 className="text-sm text-muted-foreground mb-2">Your Token Number</h2>
              <div className="text-6xl font-bold text-primary mb-4">
                {token.number}
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                Queue Position: {token.queuePosition}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="font-medium">Estimated Wait Time</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {token.estimatedTime}
                </div>
                
                {/* Confidence Indicator */}
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Estimate Confidence</span>
                    <span>{token.confidence}%</span>
                  </div>
                  <Progress value={token.confidence} className="h-2" />
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Wait times are estimated and may vary based on current queue status
              </p>
            </div>
          </Card>

          {/* Actions Card */}
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Token Actions</h3>
              
              <div className="space-y-3">
                <Button
                  onClick={handlePrintToken}
                  variant="outline"
                  size="lg"
                  disabled={printing}
                  className="w-full justify-start text-lg py-4 h-auto"
                >
                  <Printer className="h-5 w-5 mr-3" />
                  {printing ? 'Printing...' : 'Print Token'}
                </Button>
                
                <Button
                  onClick={handleShowQR}
                  variant="outline"
                  size="lg"
                  className="w-full justify-start text-lg py-4 h-auto"
                >
                  <QrCode className="h-5 w-5 mr-3" />
                  Show QR for Staff
                </Button>
                
                <Button
                  onClick={handleViewQueue}
                  size="lg"
                  className="w-full justify-start text-lg py-4 h-auto"
                >
                  <Eye className="h-5 w-5 mr-3" />
                  View Live Queue Status
                </Button>
              </div>
            </Card>

            {/* QR Code Display */}
            {showQR && (
              <Card className="p-6">
                <h4 className="font-medium text-center mb-4">Staff Scan QR</h4>
                <div className="bg-muted/30 aspect-square rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="h-24 w-24 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Token: {token.number}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* What to Expect Next */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            What to Expect Next
          </h3>
          
          <div className="space-y-3">
            {nextSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium text-primary mt-0.5">
                  {index + 1}
                </div>
                <p className="text-sm text-muted-foreground flex-1">{step}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => navigate('/lab')}
            variant="outline"
            size="lg"
            className="text-lg py-4 h-auto"
          >
            Lab Tests
          </Button>
          
          <Button
            onClick={() => navigate('/pharmacy')}
            variant="outline"
            size="lg"
            className="text-lg py-4 h-auto"
          >
            Pharmacy
          </Button>
          
          <Button
            onClick={() => navigate('/help')}
            variant="outline"
            size="lg"
            className="text-lg py-4 h-auto"
          >
            Need Help?
          </Button>
        </div>

        {/* Important Note */}
        <Card className="mt-6 p-4 bg-warning/10 border-warning/20">
          <p className="text-sm text-warning-foreground">
            <strong>Important:</strong> Please keep this token number safe. You'll need it to track your 
            position in the queue and when called for your appointment. If you lose your token, 
            please contact the front desk immediately.
          </p>
        </Card>
      </div>
    </KioskLayout>
  );
}