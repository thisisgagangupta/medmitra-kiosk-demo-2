import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home, Phone, Camera, Printer, CreditCard, Wifi } from "lucide-react";
import KioskLayout from "@/components/KioskLayout";
import { useTranslation, getStoredLanguage } from "@/lib/i18n";

interface ErrorType {
  type: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  suggestions: string[];
}

export default function ErrorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(getStoredLanguage());
  
  // Get error type from URL params or state
  const urlParams = new URLSearchParams(location.search);
  const errorType = urlParams.get('type') || 'general';

  const errorTypes: Record<string, ErrorType> = {
    'otp-failed': {
      type: 'otp-failed',
      title: 'OTP Verification Failed',
      description: 'We couldn\'t verify your mobile number. This could be due to an incorrect OTP or network issues.',
      icon: Phone,
      suggestions: [
        'Check if you entered the correct OTP',
        'Wait for a few seconds and try again',
        'Ensure you have good mobile network coverage',
        'Request a new OTP if the current one expired'
      ]
    },
    'camera-blocked': {
      type: 'camera-blocked',
      title: 'Camera Access Blocked',
      description: 'The QR code scanner needs camera access to work properly.',
      icon: Camera,
      suggestions: [
        'Allow camera access when prompted',
        'Check if camera is blocked by browser settings',
        'Try using mobile number verification instead',
        'Clean the camera lens if it appears blurry'
      ]
    },
    'printer-error': {
      type: 'printer-error',
      title: 'Printer Not Available',
      description: 'The printer is currently not working or out of paper.',
      icon: Printer,
      suggestions: [
        'Your token/receipt is still valid electronically',
        'Show the screen to staff for verification',
        'Note down your token number for reference',
        'Visit the front desk for a printed copy'
      ]
    },
    'payment-failed': {
      type: 'payment-failed',
      title: 'Payment Processing Failed',
      description: 'Your payment could not be processed at this time.',
      icon: CreditCard,
      suggestions: [
        'Check if your card has sufficient balance',
        'Try using a different payment method',
        'Ensure stable internet connection',
        'Wait a few minutes and retry the payment'
      ]
    },
    'network-error': {
      type: 'network-error',
      title: 'Network Connection Issue',
      description: 'There seems to be a connectivity problem.',
      icon: Wifi,
      suggestions: [
        'Check if the internet connection is stable',
        'Wait for the connection to restore',
        'Try refreshing the page',
        'Ask staff about network status'
      ]
    },
    'general': {
      type: 'general',
      title: 'Something Went Wrong',
      description: 'An unexpected error occurred. Don\'t worry, we\'re here to help.',
      icon: AlertTriangle,
      suggestions: [
        'Try the operation again',
        'Check if all required information is correct',
        'Restart the kiosk session',
        'Contact our support staff for assistance'
      ]
    }
  };

  const currentError = errorTypes[errorType] || errorTypes.general;
  const IconComponent = currentError.icon;

  const handleRetry = () => {
    navigate(-1); // Go back to previous page
  };

  const handleStartOver = () => {
    navigate('/start');
  };

  const handleGetHelp = () => {
    navigate('/help');
  };

  return (
    <KioskLayout title="Error" showBack={false}>
      <div className="max-w-2xl mx-auto text-center">
        {/* Error Header */}
        <div className="mb-8">
          <div className="bg-destructive/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <IconComponent className="h-12 w-12 text-destructive" />
          </div>
          
          <h1 className="text-3xl font-bold text-destructive mb-4">
            {currentError.title}
          </h1>
          
          <p className="text-lg text-muted-foreground">
            {currentError.description}
          </p>
        </div>

        {/* Suggestions */}
        <Card className="p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold mb-4">What you can try:</h2>
          
          <ul className="space-y-3">
            {currentError.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium text-primary mt-0.5 flex-shrink-0">
                  {index + 1}
                </div>
                <span className="text-muted-foreground">{suggestion}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleRetry}
              size="lg"
              className="text-lg py-6 h-auto"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Try Again
            </Button>
            
            <Button
              onClick={handleStartOver}
              variant="outline"
              size="lg"
              className="text-lg py-6 h-auto"
            >
              <Home className="h-5 w-5 mr-2" />
              Start Over
            </Button>
          </div>

          <Button
            onClick={handleGetHelp}
            variant="outline"
            size="lg"
            className="w-full text-lg py-6 h-auto"
          >
            <Phone className="h-5 w-5 mr-2" />
            Get Help from Staff
          </Button>
        </div>

        {/* Error Details for Support */}
        <Card className="mt-8 p-4 bg-muted/30 border-0">
          <details className="text-left">
            <summary className="cursor-pointer font-medium text-sm mb-2">
              Technical Details (for support staff)
            </summary>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Error Type:</strong> {currentError.type}</p>
              <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
              <p><strong>Kiosk ID:</strong> K001</p>
              <p><strong>Session:</strong> {Math.random().toString(36).substr(2, 9)}</p>
            </div>
          </details>
        </Card>

        {/* Contact Information */}
        <Card className="mt-6 p-4 bg-gradient-subtle">
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <Phone className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">Emergency</p>
              <p className="text-xs text-muted-foreground">Ext: 911</p>
            </div>
            
            <div className="text-center">
              <AlertTriangle className="h-6 w-6 text-warning mx-auto mb-2" />
              <p className="text-sm font-medium">Front Desk</p>
              <p className="text-xs text-muted-foreground">Main Reception</p>
            </div>
          </div>
        </Card>
      </div>
    </KioskLayout>
  );
}