import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Stethoscope, CreditCard, CheckCircle } from "lucide-react";
import KioskLayout from "@/components/KioskLayout";
import { useTranslation, getStoredLanguage } from "@/lib/i18n";
import { MockAppointment } from "@/lib/mock-services";

export default function AppointmentPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(getStoredLanguage());
  
  const [appointment] = useState<MockAppointment>({
    id: 'APT001',
    patientFirstName: 'Priya',
    doctorName: 'Dr. Sharma',
    time: '2:30 PM',
    status: 'Paid'
  });

  const handleProceed = () => {
    if (appointment.status === 'Unpaid') {
      navigate('/pay');
    } else {
      navigate('/reason');
    }
  };

  const handlePayNow = () => {
    navigate('/pay');
  };

  const handleNotYou = () => {
    navigate('/identify');
  };

  return (
    <KioskLayout title="Appointment Details">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary mb-4">
            {t('appointment.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            We found your appointment details
          </p>
        </div>

        {/* Appointment Card */}
        <Card className="p-8 shadow-kiosk mb-6">
          <div className="space-y-6">
            {/* Patient Name */}
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 rounded-full p-3">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('appointment.patient')}</p>
                <p className="text-xl font-semibold text-foreground">{appointment.patientFirstName}</p>
              </div>
            </div>

            {/* Doctor */}
            <div className="flex items-center gap-4">
              <div className="bg-accent/10 rounded-full p-3">
                <Stethoscope className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('appointment.doctor')}</p>
                <p className="text-xl font-semibold text-foreground">{appointment.doctorName}</p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-4">
              <div className="bg-secondary/50 rounded-full p-3">
                <Clock className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('appointment.time')}</p>
                <p className="text-xl font-semibold text-foreground">{appointment.time}</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-4">
              <div className="bg-muted rounded-full p-3">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{t('appointment.status')}</p>
                  <p className="text-xl font-semibold text-foreground">Payment Status</p>
                </div>
                <Badge 
                  variant={appointment.status === 'Paid' ? 'default' : 'destructive'}
                  className="text-lg px-4 py-2"
                >
                  {t(`appointment.${appointment.status.toLowerCase()}`)}
                </Badge>
              </div>
            </div>

            {/* Amount (if unpaid) */}
            {appointment.status === 'Unpaid' && appointment.amount && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <p className="text-sm text-warning-foreground mb-1">Outstanding Amount</p>
                <p className="text-2xl font-bold text-warning">₹{appointment.amount}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          {appointment.status === 'Unpaid' ? (
            <>
              <Button
                onClick={handlePayNow}
                size="lg"
                className="w-full text-xl py-6 h-auto"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                {t('appointment.payNow')} - ₹{appointment.amount}
              </Button>
              
              <Button
                onClick={handleProceed}
                variant="outline"
                size="lg"
                className="w-full text-xl py-6 h-auto"
              >
                {t('common.proceed')} (Pay Later)
              </Button>
            </>
          ) : (
            <Button
              onClick={handleProceed}
              size="lg"
              className="w-full text-xl py-6 h-auto"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              {t('common.proceed')}
            </Button>
          )}

          <Button
            onClick={handleNotYou}
            variant="outline"
            size="lg"
            className="w-full text-lg py-4 h-auto"
          >
            {t('appointment.notYou')}
          </Button>
        </div>

        {/* Helper Text */}
        <Card className="mt-6 p-4 bg-muted/30 border-0">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Please verify:</strong> Make sure all the details above are correct before proceeding.
            If anything seems wrong, please use "Not You?" button or ask for help.
          </p>
        </Card>
      </div>
    </KioskLayout>
  );
}