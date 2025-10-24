import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Phone, MessageSquare, MapPin, Clock, User, CreditCard, TestTube, Pill } from "lucide-react";
import KioskLayout from "@/components/KioskLayout";
import { useTranslation, getStoredLanguage } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

interface HelpCategory {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  issues: string[];
}

export default function HelpPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(getStoredLanguage());
  const { toast } = useToast();
  
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedIssue, setSelectedIssue] = useState<string>("");
  const [assistanceRequested, setAssistanceRequested] = useState(false);

  const helpCategories: HelpCategory[] = [
    {
      id: "appointment",
      title: "Appointment Issues",
      icon: User,
      description: "Problems with appointment verification or details",
      issues: [
        "Can't find my appointment",
        "Wrong appointment details shown",
        "QR code not scanning",
        "OTP not received",
        "Appointment already used"
      ]
    },
    {
      id: "payment",
      title: "Payment Problems",
      icon: CreditCard,
      description: "Issues with payments and billing",
      issues: [
        "Payment failed",
        "Wrong amount charged",
        "Payment not reflecting",
        "Need payment receipt",
        "Refund request"
      ]
    },
    {
      id: "lab",
      title: "Lab Services",
      icon: TestTube,
      description: "Laboratory test related queries",
      issues: [
        "Fasting requirements",
        "Sample collection time",
        "Test report delay",
        "Additional tests needed",
        "Lab location help"
      ]
    },
    {
      id: "pharmacy",
      title: "Pharmacy Help",
      icon: Pill,
      description: "Medicine and prescription assistance",
      issues: [
        "Can't find prescription",
        "Medicine not available",
        "Dosage confusion",
        "Pickup time query",
        "Medicine interaction concerns"
      ]
    },
    {
      id: "technical",
      title: "Technical Issues",
      icon: HelpCircle,
      description: "Kiosk or system related problems",
      issues: [
        "Touch screen not working",
        "Slow system response",
        "Print not working",
        "Screen frozen",
        "Camera not working"
      ]
    },
    {
      id: "general",
      title: "General Information",
      icon: MapPin,
      description: "Facility and general queries",
      issues: [
        "Doctor's cabin location",
        "Parking information",
        "Facility timings",
        "Emergency procedures",
        "Visitor policies"
      ]
    }
  ];

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedIssue("");
  };

  const handleIssueSelect = (issue: string) => {
    setSelectedIssue(issue);
  };

  const handleRequestAssistance = () => {
    setAssistanceRequested(true);
    
    const assistanceData = {
      category: selectedCategory,
      issue: selectedIssue,
      timestamp: new Date().toISOString(),
      kioskNumber: "K001" // Mock kiosk number
    };

    // In a real app, this would send notification to staff
    console.log('Assistance requested:', assistanceData);
    
    toast({
      title: "Assistance Requested",
      description: "Front desk staff will be with you shortly."
    });
  };

  const selectedCategoryData = helpCategories.find(cat => cat.id === selectedCategory);

  if (assistanceRequested) {
    return (
      <KioskLayout title="Help Requested" showBack={false}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="bg-primary/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Phone className="h-12 w-12 text-primary" />
            </div>
            
            <h1 className="text-3xl font-bold text-primary mb-4">
              Help is on the Way!
            </h1>
            
            <p className="text-lg text-muted-foreground mb-6">
              A staff member will assist you shortly. Please remain at the kiosk.
            </p>
            
            <Badge variant="outline" className="text-lg px-4 py-2">
              Kiosk Number: K001
            </Badge>
          </div>

          <Card className="p-6 mb-6">
            <h3 className="font-semibold mb-3">Your Request Details:</h3>
            <div className="space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span>{selectedCategoryData?.title || 'General'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issue:</span>
                <span>{selectedIssue || 'General assistance'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </Card>

          <div className="flex gap-4">
            <Button
              onClick={() => setAssistanceRequested(false)}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Cancel Request
            </Button>
            
            <Button
              onClick={() => navigate('/start')}
              size="lg"
              className="flex-1"
            >
              Return to Start
            </Button>
          </div>
        </div>
      </KioskLayout>
    );
  }

  return (
    <KioskLayout title="Help & Support">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <HelpCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary mb-4">
            How can we help you?
          </h1>
          <p className="text-lg text-muted-foreground">
            Select your issue category and we'll get you the right assistance
          </p>
        </div>

        {!selectedCategory ? (
          /* Category Selection */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpCategories.map((category) => {
              const IconComponent = category.icon;
              
              return (
                <Card
                  key={category.id}
                  className="p-6 cursor-pointer hover:shadow-kiosk transition-all duration-200 transform hover:scale-105"
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <div className="text-center">
                    <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-2">{category.title}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Issue Selection */
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <Button
                onClick={() => setSelectedCategory("")}
                variant="outline"
                className="mb-4"
              >
                ← Back to Categories
              </Button>
              
              <Card className="p-4 bg-primary/5">
                <div className="flex items-center gap-3">
                  {selectedCategoryData && (
                    <>
                      <selectedCategoryData.icon className="h-6 w-6 text-primary" />
                      <div>
                        <h2 className="text-lg font-semibold">{selectedCategoryData.title}</h2>
                        <p className="text-sm text-muted-foreground">{selectedCategoryData.description}</p>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>

            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Select your specific issue:</h3>
              
              <div className="space-y-3">
                {selectedCategoryData?.issues.map((issue, index) => (
                  <Button
                    key={index}
                    variant={selectedIssue === issue ? "default" : "outline"}
                    size="lg"
                    onClick={() => handleIssueSelect(issue)}
                    className="w-full justify-start text-left h-auto p-4"
                  >
                    {issue}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleRequestAssistance}
                size="lg"
                className="text-lg py-6 h-auto"
              >
                <Phone className="h-5 w-5 mr-2" />
                Request Staff Assistance
              </Button>
              
              <Button
                onClick={() => navigate('/start')}
                variant="outline"
                size="lg"
                className="text-lg py-6 h-auto"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Try Self-Service Again
              </Button>
            </div>
          </div>
        )}

        {/* Contact Information */}
        <Card className="mt-8 p-6 bg-gradient-subtle">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium mb-1">Emergency</h4>
              <p className="text-sm text-muted-foreground">Call: +91-XXX-XXXX-XXX</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium mb-1">Front Desk</h4>
              <p className="text-sm text-muted-foreground">Main Reception Area</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium mb-1">Support Hours</h4>
              <p className="text-sm text-muted-foreground">24/7 Available</p>
            </div>
          </div>
        </Card>
      </div>
    </KioskLayout>
  );
}