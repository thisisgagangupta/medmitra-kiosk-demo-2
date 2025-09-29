import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, Brain, Bone, Eye, Pill, Plus, MessageSquare, Upload, Mic, MicOff } from "lucide-react";
import KioskLayout from "@/components/KioskLayout";
import { useTranslation, getStoredLanguage } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import DocumentUploadQR from "@/components/DocumentUploadQR";

interface ReasonOption {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

export default function ReasonPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(getStoredLanguage());
  const { toast } = useToast();
  
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const reasonOptions: ReasonOption[] = [
    { id: "general-checkup", title: "General Check-up", icon: Heart, category: "General" },
    { id: "fever-cold", title: "Fever / Cold", icon: Heart, category: "General" },
    { id: "headache", title: "Headache", icon: Brain, category: "Neurological" },
    { id: "back-pain", title: "Back Pain", icon: Bone, category: "Orthopedic" },
    { id: "joint-pain", title: "Joint Pain", icon: Bone, category: "Orthopedic" },
    { id: "eye-problem", title: "Eye Problem", icon: Eye, category: "Ophthalmology" },
    { id: "skin-issue", title: "Skin Issue", icon: Heart, category: "Dermatology" },
    { id: "stomach-pain", title: "Stomach Pain", icon: Heart, category: "Gastroenterology" },
    { id: "diabetes", title: "Diabetes Check", icon: Pill, category: "Endocrinology" },
    { id: "blood-pressure", title: "Blood Pressure", icon: Heart, category: "Cardiology" },
    { id: "pregnancy", title: "Pregnancy Related", icon: Heart, category: "Gynecology" },
    { id: "follow-up", title: "Follow-up Visit", icon: Plus, category: "General" }
  ];

  const categories = [...new Set(reasonOptions.map(option => option.category))];

  const toggleReason = (reasonId: string) => {
    setSelectedReasons(prev => 
      prev.includes(reasonId) 
        ? prev.filter(id => id !== reasonId)
        : [...prev, reasonId]
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        // For now, just indicate that voice input was captured
        const currentText = customReason;
        const voiceIndicator = currentText ? 
          `${currentText}\n\n[Voice recording captured - ${new Date().toLocaleTimeString()}]` : 
          `[Voice recording captured - ${new Date().toLocaleTimeString()}]`;
        setCustomReason(voiceIndicator);
        
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      toast({
        title: "Recording Started",
        description: "Speak clearly about your symptoms or condition."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions."
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      
      toast({
        title: "Recording Stopped",
        description: "Voice input has been captured."
      });
    }
  };

  const handleSubmit = async () => {
    if (selectedReasons.length === 0 && !customReason.trim()) {
      toast({
        variant: "destructive",
        title: "Reason Required",
        description: "Please select at least one reason or describe your condition."
      });
      return;
    }

    setLoading(true);
    
    // Simulate processing
    setTimeout(() => {
      const visitData = {
        reasons: selectedReasons,
        customReason: customReason.trim(),
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('medmitra-visit-reason', JSON.stringify(visitData));
      
      toast({
        title: "Visit Reason Recorded",
        description: "Proceeding to check-in process."
      });
      
      setLoading(false);
      navigate('/token');
    }, 1000);
  };

  return (
    <KioskLayout title="Reason for Visit">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <MessageSquare className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary mb-4">
            What brings you here today?
          </h1>
          <p className="text-lg text-muted-foreground">
            Please select the reason(s) for your visit to help us serve you better
          </p>
        </div>

        {/* Reason Categories */}
        {categories.map(category => (
          <Card key={category} className="mb-6 p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">{category}</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {reasonOptions
                .filter(option => option.category === category)
                .map(option => {
                  const isSelected = selectedReasons.includes(option.id);
                  const IconComponent = option.icon;
                  
                  return (
                    <Button
                      key={option.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`h-auto p-4 flex flex-col items-center gap-3 transition-all duration-200 ${
                        isSelected ? 'shadow-button' : 'hover:shadow-card'
                      }`}
                      onClick={() => toggleReason(option.id)}
                    >
                      <IconComponent className="h-6 w-6" />
                      <span className="text-sm font-medium text-center">
                        {option.title}
                      </span>
                      {isSelected && (
                        <Badge variant="secondary" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </Button>
                  );
                })}
            </div>
          </Card>
        ))}

        {/* Custom Reason */}
        <Card className="mb-8 p-6">
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            Other / Additional Details
          </h2>
          
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please describe your condition or symptoms in your own words..."
                className="min-h-[120px] text-base pr-12"
              />
              
              <Button
                type="button"
                size="sm"
                variant={isRecording ? "destructive" : "outline"}
                className={`absolute top-3 right-3 ${
                  isRecording ? 'animate-pulse' : ''
                }`}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mic className="h-4 w-4" />
              <span>
                {isRecording 
                  ? "Recording... Click the microphone button to stop" 
                  : "Click the microphone button to record your voice"
                }
              </span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            You can provide additional details about your symptoms, previous treatments, 
            or any other relevant information by typing or using voice recording.
          </p>
        </Card>

        {/* Selected Summary */}
        {selectedReasons.length > 0 && (
          <Card className="mb-6 p-4 bg-primary/5 border-primary/20">
            <h3 className="font-medium mb-3">Selected Reasons:</h3>
            <div className="flex flex-wrap gap-2">
              {selectedReasons.map(reasonId => {
                const reason = reasonOptions.find(opt => opt.id === reasonId);
                return (
                  <Badge key={reasonId} variant="default" className="text-sm">
                    {reason?.title}
                  </Badge>
                );
              })}
            </div>
          </Card>
        )}

        {/* Document Upload Section */}
        {!showDocumentUpload ? (
          <Card className="p-6 mb-6 bg-accent/5 border border-accent/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-accent/10 rounded-full p-3">
                  <Upload className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Upload Medical Documents</h3>
                  <p className="text-sm text-muted-foreground">Share previous reports to help your doctor</p>
                </div>
              </div>
              <Button 
                onClick={() => setShowDocumentUpload(true)}
                variant="outline"
                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              >
                Upload Documents
              </Button>
            </div>
          </Card>
        ) : (
          <div className="mb-6">
            <DocumentUploadQR 
              patientId={`VISIT_${Date.now()}`}
              onSkip={() => setShowDocumentUpload(false)}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handleSubmit}
            size="lg"
            disabled={loading || (selectedReasons.length === 0 && !customReason.trim())}
            className="flex-1 text-xl py-6 h-auto"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Continue to Check-in
              </>
            )}
          </Button>

          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            size="lg"
            disabled={loading}
            className="text-lg py-6 h-auto"
          >
            {t('common.back')}
          </Button>
        </div>

        {/* Helper Text */}
        <Card className="mt-6 p-4 bg-muted/30 border-0">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Privacy Note:</strong> This information helps our medical staff prepare for your visit 
            and ensure you receive appropriate care. All details are kept confidential.
          </p>
        </Card>
      </div>
    </KioskLayout>
  );
}