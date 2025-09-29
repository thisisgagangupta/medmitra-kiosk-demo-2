import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, IndianRupee, Check, X, Clock, Receipt } from "lucide-react";
import KioskLayout from "@/components/KioskLayout";
import { useTranslation, getStoredLanguage } from "@/lib/i18n";
import { MockBillingService } from "@/lib/mock-services";
import { useToast } from "@/hooks/use-toast";

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(getStoredLanguage());
  const { toast } = useToast();
  
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
  const [transactionId, setTransactionId] = useState<string>("");

  // Mock bill details
  const billDetails = {
    consultationFee: 500,
    registrationFee: 50,
    tax: 55,
    total: 605
  };

  const paymentMethods: PaymentMethod[] = [
    {
      id: "upi",
      name: "UPI Payment",
      icon: Smartphone,
      description: "Pay using any UPI app (GPay, PhonePe, Paytm, etc.)"
    },
    {
      id: "card",
      name: "Debit/Credit Card",
      icon: CreditCard,
      description: "Pay using your debit or credit card"
    }
  ];

  const handlePayment = async (method: string) => {
    setSelectedMethod(method);
    setPaymentStatus('processing');
    setLoading(true);

    try {
      const result = await MockBillingService.pay('BILL001', billDetails.total);
      
      if (result.success) {
        setPaymentStatus('success');
        setTransactionId(result.transactionId || '');
        toast({
          title: "Payment Successful",
          description: `Transaction ID: ${result.transactionId}`
        });
        
        // Auto-navigate after success
        setTimeout(() => {
          navigate('/token');
        }, 3000);
      } else {
        setPaymentStatus('failed');
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: result.message
        });
      }
    } catch (error) {
      setPaymentStatus('failed');
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setPaymentStatus('pending');
    setSelectedMethod('');
    setTransactionId('');
  };

  const handleSkip = () => {
    navigate('/token');
  };

  const handlePrintReceipt = async () => {
    if (transactionId) {
      toast({
        title: "Receipt Printing",
        description: "Your receipt will be printed at the front desk."
      });
    }
  };

  if (paymentStatus === 'success') {
    return (
      <KioskLayout title="Payment Successful" showBack={false}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="bg-success/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Check className="h-12 w-12 text-success" />
            </div>
            
            <h1 className="text-3xl font-bold text-success mb-4">
              Payment Successful!
            </h1>
            
            <p className="text-lg text-muted-foreground">
              Your payment has been processed successfully
            </p>
          </div>

          <Card className="p-6 mb-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="text-2xl font-bold text-foreground">₹{billDetails.total}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Transaction ID</span>
                <Badge variant="outline" className="font-mono">
                  {transactionId}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="capitalize">{selectedMethod}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Date & Time</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
            </div>
          </Card>

          <div className="flex gap-4">
            <Button
              onClick={handlePrintReceipt}
              variant="outline"
              size="lg"
              className="flex-1 text-lg py-4 h-auto"
            >
              <Receipt className="h-5 w-5 mr-2" />
              Print Receipt
            </Button>
            
            <Button
              onClick={() => navigate('/token')}
              size="lg"
              className="flex-1 text-lg py-4 h-auto"
            >
              Continue
            </Button>
          </div>

          <Card className="mt-6 p-4 bg-muted/30 border-0">
            <p className="text-sm text-muted-foreground">
              Proceeding to token generation in <Clock className="inline h-4 w-4" /> 3 seconds...
            </p>
          </Card>
        </div>
      </KioskLayout>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <KioskLayout title="Payment Failed">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="bg-destructive/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <X className="h-12 w-12 text-destructive" />
            </div>
            
            <h1 className="text-3xl font-bold text-destructive mb-4">
              Payment Failed
            </h1>
            
            <p className="text-lg text-muted-foreground mb-6">
              We couldn't process your payment. Please try again or contact our front desk for assistance.
            </p>
            
            <div className="flex gap-4">
              <Button
                onClick={handleRetry}
                size="lg"
                className="flex-1 text-xl py-6 h-auto"
              >
                Try Again
              </Button>
              
              <Button
                onClick={() => navigate('/help')}
                variant="outline"
                size="lg"
                className="flex-1 text-lg py-4 h-auto"
              >
                Get Help
              </Button>
            </div>
          </div>
        </div>
      </KioskLayout>
    );
  }

  return (
    <KioskLayout title="Payment">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <IndianRupee className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary mb-4">
            Payment Summary
          </h1>
          <p className="text-lg text-muted-foreground">
            Please review your charges and complete the payment
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bill Summary */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Bill Details</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Consultation Fee</span>
                <span>₹{billDetails.consultationFee}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registration Fee</span>
                <span>₹{billDetails.registrationFee}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST (10%)</span>
                <span>₹{billDetails.tax}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount</span>
                <span className="text-primary">₹{billDetails.total}</span>
              </div>
            </div>
          </Card>

          {/* Payment Methods */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Select Payment Method</h2>
            
            {paymentStatus === 'processing' ? (
              <div className="text-center py-8">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <h3 className="text-lg font-medium mb-2">Processing Payment...</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while we process your {selectedMethod} payment
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map(method => {
                  const IconComponent = method.icon;
                  
                  return (
                    <Button
                      key={method.id}
                      variant="outline"
                      className="w-full h-auto p-4 flex items-center gap-4 hover:shadow-card transition-all"
                      onClick={() => handlePayment(method.id)}
                      disabled={loading}
                    >
                      <div className="bg-primary/10 rounded-full p-2">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      
                      <div className="flex-1 text-left">
                        <h3 className="font-medium">{method.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {method.description}
                        </p>
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Skip Option */}
        <Card className="mt-6 p-4 bg-muted/30 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Already paid?</p>
              <p className="text-sm text-muted-foreground">
                Skip payment if you've already settled the bill at the front desk
              </p>
            </div>
            
            <Button
              onClick={handleSkip}
              variant="outline"
              disabled={loading}
            >
              Skip Payment
            </Button>
          </div>
        </Card>
      </div>
    </KioskLayout>
  );
}