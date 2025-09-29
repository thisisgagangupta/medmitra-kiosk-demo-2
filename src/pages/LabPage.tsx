import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { TestTube, Calendar, CreditCard, Printer, QrCode, IndianRupee, Clock } from "lucide-react";
import KioskLayout from "@/components/KioskLayout";
import { useTranslation, getStoredLanguage } from "@/lib/i18n";
import { MockLabService } from "@/lib/mock-services";
import { useToast } from "@/hooks/use-toast";

interface LabTest {
  id: string;
  name: string;
  price: number;
  ordered: boolean;
  selected?: boolean;
}

export default function LabPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(getStoredLanguage());
  const { toast } = useToast();
  
  const [tests, setTests] = useState<LabTest[]>([
    { id: 'LAB001', name: 'Complete Blood Count (CBC)', price: 300, ordered: true },
    { id: 'LAB002', name: 'Lipid Profile', price: 450, ordered: true },
    { id: 'LAB003', name: 'Thyroid Function Test (T3, T4, TSH)', price: 600, ordered: false },
    { id: 'LAB004', name: 'Blood Sugar (Fasting)', price: 150, ordered: false },
    { id: 'LAB005', name: 'Liver Function Test', price: 400, ordered: false },
    { id: 'LAB006', name: 'Kidney Function Test', price: 350, ordered: false },
  ]);
  
  const [loading, setLoading] = useState(false);
  
  const orderedTests = tests.filter(test => test.ordered);
  const additionalTests = tests.filter(test => !test.ordered);
  const selectedAdditionalTests = additionalTests.filter(test => test.selected);
  
  const orderedTotal = orderedTests.reduce((sum, test) => sum + test.price, 0);
  const additionalTotal = selectedAdditionalTests.reduce((sum, test) => sum + test.price, 0);
  const grandTotal = orderedTotal + additionalTotal;

  const toggleTestSelection = (testId: string) => {
    setTests(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, selected: !test.selected }
        : test
    ));
  };

  const handleProceedToPayment = () => {
    if (grandTotal === 0) {
      toast({
        variant: "destructive",
        title: "No Tests Selected",
        description: "Please select at least one test to proceed."
      });
      return;
    }
    
    // Store lab booking data
    const labBooking = {
      orderedTests,
      additionalTests: selectedAdditionalTests,
      total: grandTotal,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('medmitra-lab-booking', JSON.stringify(labBooking));
    navigate('/pay');
  };

  const handleGenerateToken = async () => {
    if (orderedTests.length === 0) {
      toast({
        variant: "destructive",
        title: "No Ordered Tests",
        description: "No tests were ordered by the doctor."
      });
      return;
    }

    setLoading(true);
    
    // Simulate token generation
    setTimeout(() => {
      const labToken = `LAB${Date.now().toString().slice(-3)}`;
      
      toast({
        title: "Lab Token Generated",
        description: `Your lab token: ${labToken}`
      });
      
      setLoading(false);
    }, 1500);
  };

  const handlePrintBarcodes = () => {
    toast({
      title: "Barcode Labels Printing",
      description: "Lab barcode labels will be printed for sample collection."
    });
  };

  return (
    <KioskLayout title="Lab Services">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <TestTube className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary mb-4">
            Laboratory Services
          </h1>
          <p className="text-lg text-muted-foreground">
            Review your ordered tests and add additional tests if needed
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Doctor Ordered Tests */}
          <Card className="lg:col-span-2 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Doctor Ordered Tests
              </h2>
              <p className="text-sm text-muted-foreground">
                These tests have been prescribed by your doctor
              </p>
            </div>

            {orderedTests.length > 0 ? (
              <div className="space-y-3 mb-6">
                {orderedTests.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                    <div>
                      <h3 className="font-medium text-foreground">{test.name}</h3>
                      <Badge variant="default" className="mt-1 text-xs">
                        Doctor Prescribed
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-foreground">₹{test.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tests ordered by doctor</p>
              </div>
            )}

            <Separator className="my-6" />

            {/* Additional Tests */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Additional Tests (Optional)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add extra tests to your package
              </p>
            </div>

            <div className="space-y-3">
              {additionalTests.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={test.id}
                      checked={test.selected || false}
                      onCheckedChange={() => toggleTestSelection(test.id)}
                    />
                    <label htmlFor={test.id} className="cursor-pointer">
                      <h4 className="font-medium text-foreground">{test.name}</h4>
                    </label>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-foreground">₹{test.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Summary & Actions */}
          <div className="space-y-6">
            {/* Bill Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Bill Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ordered Tests</span>
                  <span>₹{orderedTotal}</span>
                </div>
                
                {selectedAdditionalTests.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Additional Tests</span>
                    <span>₹{additionalTotal}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-primary">₹{grandTotal}</span>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Actions</h3>
              
              <div className="space-y-3">
                {orderedTests.length > 0 && (
                  <Button
                    onClick={handleGenerateToken}
                    size="lg"
                    disabled={loading}
                    className="w-full justify-start"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <QrCode className="h-5 w-5 mr-2" />
                    )}
                    Generate Lab Token
                  </Button>
                )}
                
                <Button
                  onClick={handleProceedToPayment}
                  variant="outline"
                  size="lg"
                  disabled={grandTotal === 0}
                  className="w-full justify-start"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay Now - ₹{grandTotal}
                </Button>
                
                <Button
                  onClick={handlePrintBarcodes}
                  variant="outline"
                  size="lg"
                  disabled={orderedTests.length === 0}
                  className="w-full justify-start"
                >
                  <Printer className="h-5 w-5 mr-2" />
                  Print Sample Labels
                </Button>
              </div>
            </Card>

            {/* Lab Instructions */}
            <Card className="p-4 bg-muted/30 border-0">
              <h4 className="font-medium mb-2">Lab Instructions</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Fasting required for some tests</li>
                <li>• Carry valid ID for verification</li>
                <li>• Reports available in 24-48 hours</li>
                <li>• Collect reports from lab counter</li>
              </ul>
            </Card>
          </div>
        </div>

        {/* Sample Collection Info */}
        <Card className="mt-8 p-6 bg-gradient-subtle">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <TestTube className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium mb-1">Sample Collection</h4>
              <p className="text-sm text-muted-foreground">Ground Floor - Lab Wing</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium mb-1">Collection Hours</h4>
              <p className="text-sm text-muted-foreground">7:00 AM - 11:00 AM</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium mb-1">Report Delivery</h4>
              <p className="text-sm text-muted-foreground">Next day 6:00 PM</p>
            </div>
          </div>
        </Card>
      </div>
    </KioskLayout>
  );
}