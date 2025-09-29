import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, QrCode } from "lucide-react";
import QRCode from "qrcode";

interface DocumentUploadQRProps {
  patientId?: string;
  appointmentId?: string;
  onSkip?: () => void;
}

export default function DocumentUploadQR({ 
  patientId, 
  appointmentId, 
  onSkip 
}: DocumentUploadQRProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateQRCode();
  }, [patientId, appointmentId]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      
      // Generate URL for patient portal with patient/appointment context
      const baseURL = "https://portal.medmitra.ai/upload";
      const params = new URLSearchParams();
      
      if (patientId) params.append('patientId', patientId);
      if (appointmentId) params.append('appointmentId', appointmentId);
      
      const uploadURL = `${baseURL}?${params.toString()}`;
      
      // Generate QR code
      const qrDataURL = await QRCode.toDataURL(uploadURL, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeDataURL(qrDataURL);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-accent/5 to-primary/5 border-dashed border-2 border-accent/30">
      <div className="text-center space-y-4">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="bg-accent/10 rounded-full p-3">
            <Upload className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">Upload Medical Documents</h3>
            <p className="text-sm text-muted-foreground">Lab reports, prescriptions, imaging</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white p-4 rounded-lg inline-block shadow-sm">
          {loading ? (
            <div className="w-64 h-64 bg-muted animate-pulse rounded flex items-center justify-center">
              <QrCode className="h-12 w-12 text-muted-foreground" />
            </div>
          ) : (
            <img 
              src={qrCodeDataURL} 
              alt="QR Code for Document Upload"
              className="w-64 h-64"
            />
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground">
            Scan with your phone to upload documents
          </p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Previous lab reports</p>
            <p>• Current prescriptions</p>
            <p>• Medical imaging (X-rays, scans)</p>
            <p>• Any relevant medical documents</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-success/10 rounded-lg p-3 text-sm">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-success font-medium">Help your doctor provide better care</p>
              <p className="text-success/80">Upload documents for faster consultation</p>
            </div>
          </div>
        </div>

        {/* Skip Option */}
        {onSkip && (
          <Button
            onClick={onSkip}
            variant="ghost"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Skip for now - Upload later
          </Button>
        )}
      </div>
    </Card>
  );
}