import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Palette, Type, Clock, Printer, Globe, Volume2, Sun } from "lucide-react";
import KioskLayout from "@/components/KioskLayout";
import { useTranslation, getStoredLanguage, setStoredLanguage, type Language } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(getStoredLanguage());
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    language: getStoredLanguage(),
    fontSize: 100,
    highContrast: false,
    soundEnabled: true,
    idleTimeout: 30,
    printEnabled: true,
    debugMode: false,
    autoLanguageDetect: true
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Apply language change immediately
    if (key === 'language') {
      setStoredLanguage(value as Language);
    }
    
    // Apply font size change to root
    if (key === 'fontSize') {
      document.documentElement.style.fontSize = `${value}%`;
    }
    
    // Apply high contrast mode
    if (key === 'highContrast') {
      document.documentElement.classList.toggle('high-contrast', value);
    }
    
    toast({
      title: "Setting Updated",
      description: `${key} has been changed successfully.`
    });
  };

  const handleResetSettings = () => {
    const defaultSettings = {
      language: 'en' as Language,
      fontSize: 100,
      highContrast: false,
      soundEnabled: true,
      idleTimeout: 30,
      printEnabled: true,
      debugMode: false,
      autoLanguageDetect: true
    };
    
    setSettings(defaultSettings);
    setStoredLanguage('en');
    document.documentElement.style.fontSize = '100%';
    document.documentElement.classList.remove('high-contrast');
    
    toast({
      title: "Settings Reset",
      description: "All settings have been restored to defaults."
    });
  };

  const handleTestPrinter = () => {
    toast({
      title: "Printer Test",
      description: settings.printEnabled ? "Test page sent to printer." : "Printer is disabled."
    });
  };

  const brandColors = [
    { name: 'MedMitra Purple', value: '#A379A9', active: true },
    { name: 'Healthcare Blue', value: '#3B82F6' },
    { name: 'Wellness Green', value: '#10B981' },
    { name: 'Professional Gray', value: '#6B7280' }
  ];

  return (
    <KioskLayout title="Kiosk Settings" showBack={false}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Settings className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary mb-4">
            Kiosk Settings
          </h1>
          <p className="text-lg text-muted-foreground">
            Configure system preferences and accessibility options
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Language & Localization */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Language & Localization</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Default Language</label>
                <Select
                  value={settings.language}
                  onValueChange={(value: Language) => handleSettingChange('language', value)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                    <SelectItem value="mr">मराठी (Marathi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-detect Language</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically suggest language based on user behavior
                  </p>
                </div>
                <Switch
                  checked={settings.autoLanguageDetect}
                  onCheckedChange={(checked) => handleSettingChange('autoLanguageDetect', checked)}
                />
              </div>
            </div>
          </Card>

          {/* Accessibility */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Sun className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Accessibility</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">
                  Font Size: {settings.fontSize}%
                </label>
                <Slider
                  value={[settings.fontSize]}
                  onValueChange={(value) => handleSettingChange('fontSize', value[0])}
                  min={75}
                  max={150}
                  step={25}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Small</span>
                  <span>Large</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">High Contrast Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Enhance visibility for better accessibility
                  </p>
                </div>
                <Switch
                  checked={settings.highContrast}
                  onCheckedChange={(checked) => handleSettingChange('highContrast', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sound Feedback</p>
                  <p className="text-sm text-muted-foreground">
                    Enable audio cues for button presses
                  </p>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => handleSettingChange('soundEnabled', checked)}
                />
              </div>
            </div>
          </Card>

          {/* System Configuration */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">System Configuration</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">
                  Idle Timeout: {settings.idleTimeout} seconds
                </label>
                <Slider
                  value={[settings.idleTimeout]}
                  onValueChange={(value) => handleSettingChange('idleTimeout', value[0])}
                  min={10}
                  max={60}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>10s</span>
                  <span>60s</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Debug Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Show additional information for troubleshooting
                  </p>
                </div>
                <Switch
                  checked={settings.debugMode}
                  onCheckedChange={(checked) => handleSettingChange('debugMode', checked)}
                />
              </div>
            </div>
          </Card>

          {/* Hardware Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Printer className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Hardware Settings</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Printer Enabled</p>
                  <p className="text-sm text-muted-foreground">
                    Enable token and receipt printing
                  </p>
                </div>
                <Switch
                  checked={settings.printEnabled}
                  onCheckedChange={(checked) => handleSettingChange('printEnabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Printer Status</p>
                  <p className="text-sm text-muted-foreground">
                    Current printer connection status
                  </p>
                </div>
                <Badge variant={settings.printEnabled ? "default" : "secondary"}>
                  {settings.printEnabled ? "Connected" : "Disabled"}
                </Badge>
              </div>
              
              <Button
                onClick={handleTestPrinter}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Test Printer
              </Button>
            </div>
          </Card>
        </div>

        {/* Brand Colors Preview */}
        <Card className="mt-6 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Brand Color Preview</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {brandColors.map((color, index) => (
              <div key={index} className="text-center">
                <div
                  className="w-16 h-16 rounded-lg mx-auto mb-2 border-2"
                  style={{ 
                    backgroundColor: color.value,
                    borderColor: color.active ? '#A379A9' : 'transparent'
                  }}
                />
                <p className="text-sm font-medium">{color.name}</p>
                <p className="text-xs text-muted-foreground">{color.value}</p>
                {color.active && (
                  <Badge variant="outline" className="text-xs mt-1">
                    Active
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Button
            onClick={() => navigate('/staff')}
            size="lg"
            className="flex-1"
          >
            Save & Exit
          </Button>
          
          <Button
            onClick={handleResetSettings}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            Reset to Defaults
          </Button>
        </div>

        {/* System Information */}
        <Card className="mt-6 p-4 bg-muted/30 border-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm font-medium">Kiosk ID</p>
              <p className="text-xs text-muted-foreground">K001</p>
            </div>
            <div>
              <p className="text-sm font-medium">Version</p>
              <p className="text-xs text-muted-foreground">v2.1.0</p>
            </div>
            <div>
              <p className="text-sm font-medium">Last Update</p>
              <p className="text-xs text-muted-foreground">2024-01-15</p>
            </div>
            <div>
              <p className="text-sm font-medium">Uptime</p>
              <p className="text-xs text-muted-foreground">2h 34m</p>
            </div>
          </div>
        </Card>
      </div>
    </KioskLayout>
  );
}