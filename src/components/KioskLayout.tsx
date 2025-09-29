import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, HelpCircle, Globe } from "lucide-react";
import { useTranslation, getStoredLanguage, setStoredLanguage, type Language } from "@/lib/i18n";
import medmitraLogo from "@/assets/medmitra-logo.png";

interface KioskLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  showHelp?: boolean;
  showLanguage?: boolean;
  onBack?: () => void;
  className?: string;
}

export default function KioskLayout({
  children,
  title,
  showBack = true,
  showHelp = true,
  showLanguage = false,
  onBack,
  className = ""
}: KioskLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState<Language>(getStoredLanguage());
  const { t } = useTranslation(language);

  // Auto-idle functionality
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        // Don't auto-idle during payment or signature screens
        if (!location.pathname.includes('/pay') && !location.pathname.includes('/consent')) {
          navigate('/start');
        }
      }, 30000); // 30 seconds
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetIdleTimer, true));
    
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach(event => document.removeEventListener(event, resetIdleTimer, true));
    };
  }, [navigate, location.pathname]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleHelp = () => {
    navigate('/help');
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    setStoredLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* App Bar */}
      <header className="flex items-center justify-between p-6 bg-card/80 backdrop-blur-sm shadow-card">
        <div className="flex items-center gap-4">
          <img 
            src={medmitraLogo} 
            alt="MedMitra AI" 
            className="h-12 w-auto"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-medium">
            MedMitra AI
          </div>
          {title && <h1 className="text-xl font-semibold text-foreground">{title}</h1>}
        </div>

        <div className="flex items-center gap-4">
          {/* {showLanguage && (
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div className="flex gap-2">
                {(['en', 'hi'] as Language[]).map((lang) => (
                  <Button
                    key={lang}
                    variant={language === lang ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleLanguageChange(lang)}
                    className="min-w-[60px]"
                  >
                    {t(`languages.${lang}`)}
                  </Button>
                ))}
              </div>
            </div>
          )} */}

          {showHelp && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleHelp}
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              {t('common.help')}
            </Button>
          )}

          {showBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2 min-w-[100px]"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 p-6 ${className}`}>
        {children}
      </main>
    </div>
  );
}