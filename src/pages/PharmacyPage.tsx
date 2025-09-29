import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Pill, Search, CreditCard, QrCode, ShoppingCart, Clock, CheckCircle } from "lucide-react";
import KioskLayout from "@/components/KioskLayout";
import { useTranslation, getStoredLanguage } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

interface PharmacyItem {
  id: string;
  name: string;
  dosage: string;
  quantity: number;
  price: number;
  prescribed: boolean;
}

interface PharmacyBill {
  billNumber: string;
  patientName: string;
  items: PharmacyItem[];
  total: number;
  status: 'pending' | 'paid';
}

export default function PharmacyPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(getStoredLanguage());
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [bill, setBill] = useState<PharmacyBill | null>(null);

  // Mock pharmacy bill
  const mockBill: PharmacyBill = {
    billNumber: "PH2024001234",
    patientName: "Priya S.",
    items: [
      { id: "MED001", name: "Paracetamol", dosage: "500mg", quantity: 10, price: 25, prescribed: true },
      { id: "MED002", name: "Amoxicillin", dosage: "250mg", quantity: 15, price: 180, prescribed: true },
      { id: "MED003", name: "Vitamin D3", dosage: "60000 IU", quantity: 4, price: 120, prescribed: true },
      { id: "MED004", name: "Omeprazole", dosage: "20mg", quantity: 30, price: 95, prescribed: true },
    ],
    total: 420,
    status: 'pending'
  };

  const handleSearchBill = async () => {
    if (!searchTerm.trim()) {
      toast({
        variant: "destructive",
        title: "Bill Number Required",
        description: "Please enter your bill number or prescription ID."
      });
      return;
    }

    setLoading(true);
    
    // Simulate bill lookup
    setTimeout(() => {
      setBill(mockBill);
      toast({
        title: "Bill Found",
        description: `Prescription found for ${mockBill.patientName}`
      });
      setLoading(false);
    }, 1500);
  };

  const handlePayBill = async () => {
    if (!bill) return;

    setLoading(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setBill(prev => prev ? { ...prev, status: 'paid' } : null);
      
      const pickupToken = `PH${Date.now().toString().slice(-3)}`;
      
      toast({
        title: "Payment Successful",
        description: `Pickup token: ${pickupToken}`
      });
      
      setLoading(false);
    }, 2000);
  };

  const generatePickupToken = () => {
    const token = `PH${Date.now().toString().slice(-3)}`;
    toast({
      title: "Pickup Token Generated",
      description: `Your pickup token: ${token}`
    });
  };

  return (
    <KioskLayout title="Pharmacy Services">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Pill className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary mb-4">
            Pharmacy Services
          </h1>
          <p className="text-lg text-muted-foreground">
            Pay for your prescription and generate pickup token
          </p>
        </div>

        {/* Bill Search */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Find Your Prescription Bill
          </h2>
          
          <div className="flex gap-4">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter bill number or prescription ID"
              className="text-lg h-14 flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSearchBill()}
            />
            
            <Button
              onClick={handleSearchBill}
              size="lg"
              disabled={loading}
              className="text-lg px-8 py-6 h-14"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Search className="h-5 w-5 mr-2" />
              )}
              Search
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-3">
            You can find your bill number on the prescription or appointment receipt
          </p>
        </Card>

        {/* Bill Details */}
        {bill && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Bill Items */}
            <Card className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Prescription Details</h2>
                <Badge 
                  variant={bill.status === 'paid' ? 'default' : 'destructive'}
                  className="text-sm px-3 py-1"
                >
                  {bill.status === 'paid' ? 'Paid' : 'Pending Payment'}
                </Badge>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bill Number:</span>
                  <span className="font-mono">{bill.billNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Patient:</span>
                  <span>{bill.patientName}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                {bill.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.dosage} × {item.quantity} units
                      </p>
                      {item.prescribed && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          Doctor Prescribed
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-foreground">₹{item.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Payment Summary & Actions */}
            <div className="space-y-6">
              {/* Bill Summary */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Bill Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Medicines ({bill.items.length} items)
                    </span>
                    <span>₹{bill.total}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount</span>
                    <span className="text-primary">₹{bill.total}</span>
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Actions</h3>
                
                <div className="space-y-3">
                  {bill.status === 'pending' ? (
                    <Button
                      onClick={handlePayBill}
                      size="lg"
                      disabled={loading}
                      className="w-full justify-start"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <CreditCard className="h-5 w-5 mr-2" />
                      )}
                      Pay Now - ₹{bill.total}
                    </Button>
                  ) : (
                    <div className="text-center py-4">
                      <CheckCircle className="h-12 w-12 text-success mx-auto mb-2" />
                      <p className="font-medium text-success">Payment Complete</p>
                    </div>
                  )}
                  
                  <Button
                    onClick={generatePickupToken}
                    variant="outline"
                    size="lg"
                    disabled={bill.status === 'pending'}
                    className="w-full justify-start"
                  >
                    <QrCode className="h-5 w-5 mr-2" />
                    Generate Pickup Token
                  </Button>
                </div>
              </Card>

              {/* Pickup Instructions */}
              <Card className="p-4 bg-muted/30 border-0">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Pickup Instructions
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Medicines ready in 10-15 minutes</li>
                  <li>• Show pickup token at counter</li>
                  <li>• Carry valid ID for verification</li>
                  <li>• Check expiry dates before leaving</li>
                </ul>
              </Card>
            </div>
          </div>
        )}

        {/* Pharmacy Information */}
        <Card className="p-6 bg-gradient-subtle">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Pill className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium mb-1">Pharmacy Location</h4>
              <p className="text-sm text-muted-foreground">Ground Floor - Main Building</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium mb-1">Working Hours</h4>
              <p className="text-sm text-muted-foreground">8:00 AM - 9:00 PM</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium mb-1">Licensed Pharmacy</h4>
              <p className="text-sm text-muted-foreground">Certified & Quality Assured</p>
            </div>
          </div>
        </Card>

        {/* Help Section */}
        <Card className="mt-6 p-4 bg-muted/30 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Need help finding your prescription?</p>
              <p className="text-sm text-muted-foreground">
                Contact our pharmacy staff or visit the front desk for assistance
              </p>
            </div>
            
            <Button
              onClick={() => navigate('/help')}
              variant="outline"
            >
              Get Help
            </Button>
          </div>
        </Card>
      </div>
    </KioskLayout>
  );
}