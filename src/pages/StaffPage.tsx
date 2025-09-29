import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lock, Shield, User, SkipForward, Edit, Eye, LogOut, AlertCircle } from "lucide-react";
import KioskLayout from "@/components/KioskLayout";
import { useTranslation, getStoredLanguage } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

export default function StaffPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(getStoredLanguage());
  const { toast } = useToast();
  
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      toast({
        variant: "destructive",
        title: "Invalid PIN",
        description: "Please enter a 4-digit PIN."
      });
      return;
    }

    setLoading(true);
    
    // Mock PIN verification
    setTimeout(() => {
      if (pin === "1234" || pin === "0000") {
        setIsAuthenticated(true);
        setStaffName("Dr. Sarah Kumar");
        toast({
          title: "Access Granted",
          description: "Staff mode activated successfully."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Invalid PIN. Please try again."
        });
      }
      setLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPin("");
    setStaffName("");
    toast({
      title: "Logged Out",
      description: "Staff mode deactivated."
    });
  };

  const staffActions = [
    {
      id: "override-payment",
      title: "Override Payment",
      description: "Skip payment step for patients",
      icon: SkipForward,
      action: () => {
        toast({ title: "Payment Override", description: "Payment step will be skipped for next patient." });
      }
    },
    {
      id: "edit-appointment",
      title: "Edit Appointment",
      description: "Modify appointment details",
      icon: Edit,
      action: () => {
        toast({ title: "Edit Mode", description: "Appointment editing enabled." });
      }
    },
    {
      id: "view-logs",
      title: "View Activity Logs",
      description: "Check kiosk activity history",
      icon: Eye,
      action: () => {
        toast({ title: "Activity Logs", description: "Displaying recent kiosk activities." });
      }
    },
    {
      id: "reset-session",
      title: "Reset Patient Session",
      description: "Clear current patient data",
      icon: AlertCircle,
      action: () => {
        localStorage.clear();
        toast({ title: "Session Reset", description: "Patient session cleared successfully." });
      }
    }
  ];

  if (!isAuthenticated) {
    return (
      <KioskLayout title="Staff Access" showBack={false}>
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-warning/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Lock className="h-12 w-12 text-warning" />
            </div>
            
            <h1 className="text-3xl font-bold text-warning mb-4">
              Staff Access Required
            </h1>
            
            <p className="text-lg text-muted-foreground">
              Enter your 4-digit PIN to access staff functions
            </p>
          </div>

          {/* PIN Entry */}
          <Card className="p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-medium mb-3">
                  Staff PIN
                </label>
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter 4-digit PIN"
                  className="text-2xl text-center h-16 px-4 tracking-widest"
                  maxLength={4}
                  onKeyPress={(e) => e.key === 'Enter' && handlePinSubmit()}
                />
              </div>
              
              <Button
                onClick={handlePinSubmit}
                size="lg"
                disabled={loading || pin.length !== 4}
                className="w-full text-xl py-6 h-auto"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 mr-2" />
                    Access Staff Mode
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* PIN Pad (for touch devices) */}
          <Card className="mt-6 p-4">
            <h3 className="text-lg font-semibold mb-4">Quick PIN Entry</h3>
            
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Button
                  key={num}
                  variant="outline"
                  size="lg"
                  onClick={() => pin.length < 4 && setPin(prev => prev + num)}
                  className="h-16 text-xl"
                  disabled={pin.length >= 4}
                >
                  {num}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => setPin("")}
                className="h-16"
              >
                Clear
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => pin.length < 4 && setPin(prev => prev + "0")}
                className="h-16 text-xl"
                disabled={pin.length >= 4}
              >
                0
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => setPin(prev => prev.slice(0, -1))}
                className="h-16"
              >
                ⌫
              </Button>
            </div>
          </Card>

          {/* Return to Main */}
          <div className="mt-6 text-center">
            <Button
              onClick={() => navigate('/start')}
              variant="ghost"
              className="text-muted-foreground"
            >
              Return to Main Kiosk
            </Button>
          </div>
        </div>
      </KioskLayout>
    );
  }

  return (
    <KioskLayout 
      title="Staff Mode Active" 
      showBack={false}
      className="bg-warning/5"
    >
      <div className="max-w-4xl mx-auto">
        {/* Staff Header */}
        <div className="mb-8">
          <Card className="p-4 bg-warning/10 border-warning/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-warning" />
                <div>
                  <h2 className="text-xl font-semibold text-warning">Staff Mode Active</h2>
                  <p className="text-sm text-warning/80">Logged in as: {staffName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-warning text-warning">
                  All actions logged
                </Badge>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="border-warning text-warning hover:bg-warning/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Staff Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {staffActions.map((action) => {
            const IconComponent = action.icon;
            
            return (
              <Card
                key={action.id}
                className="p-6 cursor-pointer hover:shadow-kiosk transition-all duration-200 transform hover:scale-105"
                onClick={action.action}
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Navigation */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Navigation</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => navigate('/identify')}
              variant="outline"
              size="lg"
              className="h-auto p-4 flex flex-col gap-2"
            >
              <User className="h-6 w-6" />
              <span className="text-sm">Patient ID</span>
            </Button>
            
            <Button
              onClick={() => navigate('/queue')}
              variant="outline"
              size="lg"
              className="h-auto p-4 flex flex-col gap-2"
            >
              <Eye className="h-6 w-6" />
              <span className="text-sm">Queue Status</span>
            </Button>
            
            <Button
              onClick={() => navigate('/settings')}
              variant="outline"
              size="lg"
              className="h-auto p-4 flex flex-col gap-2"
            >
              <Shield className="h-6 w-6" />
              <span className="text-sm">Settings</span>
            </Button>
            
            <Button
              onClick={() => navigate('/error?type=general')}
              variant="outline"
              size="lg"
              className="h-auto p-4 flex flex-col gap-2"
            >
              <AlertCircle className="h-6 w-6" />
              <span className="text-sm">Error Test</span>
            </Button>
          </div>
        </Card>

        {/* Activity Log Preview */}
        <Card className="mt-6 p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Patient check-in completed</span>
              <Badge variant="outline" className="text-xs">2 min ago</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Payment processed successfully</span>
              <Badge variant="outline" className="text-xs">5 min ago</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Lab token generated</span>
              <Badge variant="outline" className="text-xs">8 min ago</Badge>
            </div>
          </div>
        </Card>

        {/* Warning */}
        <Card className="mt-6 p-4 bg-destructive/5 border-destructive/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              <strong>Important:</strong> All staff actions are logged and monitored. 
              Please use staff privileges responsibly and only when necessary.
            </p>
          </div>
        </Card>
      </div>
    </KioskLayout>
  );
}