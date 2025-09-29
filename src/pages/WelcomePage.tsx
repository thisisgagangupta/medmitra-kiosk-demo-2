// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Globe, ChevronRight, QrCode, Smartphone } from "lucide-react";
// import KioskLayout from "@/components/KioskLayout";
// import { useTranslation, getStoredLanguage, setStoredLanguage, type Language } from "@/lib/i18n";

// export default function WelcomePage() {
//   const navigate = useNavigate();
//   const [language, setLanguage] = useState<Language>(getStoredLanguage());
//   const { t } = useTranslation(language);

//   const handleLanguageSelect = (lang: Language) => {
//     setLanguage(lang);
//     setStoredLanguage(lang);
//   };

//   const handleProceed = () => {
//     navigate('/identify');
//   };

//   const options = [
//     {
//       icon: QrCode,
//       title: t("welcome.appointmentTitle"),
//       description: t("welcome.appointmentDesc"),
//       action: () => navigate('/identify')
//     },
//     {
//       icon: Smartphone,
//       title: t("welcome.walkinTitle"),
//       description: t("welcome.walkinDesc"),
//       action: () => navigate('/walkin')
//     }
//   ];

//   return (
//     <KioskLayout 
//       title="Welcome" 
//       showBack={false} 
//       showLanguage={true}
//       onBack={() => navigate('/start')}
//     >
//       <div className="max-w-4xl mx-auto">
//         {/* Welcome Header */}
//         <div className="text-center mb-12">
//         <h1 className="text-4xl font-bold text-primary mb-4">
//           {t('welcome.title')}
//         </h1>
//         <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
//           {t('welcome.subtitle')}
//         </p>
//         </div>

//         {/* Language Selection */}
//         <Card className="p-6 mb-8 bg-gradient-subtle">
//           <div className="flex items-center justify-center gap-6">
//             <div className="flex items-center gap-3">
//               <Globe className="h-6 w-6 text-primary" />
//               <span className="text-lg font-medium text-foreground">
//                 Select Language / भाषा चुनें
//               </span>
//             </div>
            
//             <div className="flex gap-3">
//               {(['en', 'hi'] as Language[]).map((lang) => (
//                 <Button
//                   key={lang}
//                   variant={language === lang ? "default" : "outline"}
//                   size="lg"
//                   onClick={() => handleLanguageSelect(lang)}
//                   className="min-w-[120px] h-14 text-lg"
//                 >
//                   {t(`languages.${lang}`)}
//                 </Button>
//               ))}
//             </div>
//           </div>
//         </Card>

//         {/* Main Options */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
//           {options.map((option, index) => (
//             <Card 
//               key={index}
//               className="p-8 cursor-pointer hover:shadow-kiosk transition-all duration-300 transform hover:scale-105 group"
//               onClick={option.action}
//             >
//               <div className="text-center">
//                 <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
//                   <option.icon className="h-10 w-10 text-primary" />
//                 </div>
                
//                 <h3 className="text-2xl font-semibold text-foreground mb-3">
//                   {option.title}
//                 </h3>
                
//                 <p className="text-muted-foreground mb-6">
//                   {option.description}
//                 </p>
                
//                 <div className="flex items-center justify-center text-primary group-hover:text-accent transition-colors">
//                   <span className="font-medium mr-2">{t("welcome.continue")}</span>
//                   <ChevronRight className="h-5 w-5" />
//                 </div>
//               </div>
//             </Card>
//           ))}
//         </div>

//         {/* Helper Text */}
//         <Card className="p-6 bg-muted/30 border-0">
//           <div className="text-center">
//             <p className="text-sm text-muted-foreground">
//               <strong>{t("welcome.assistance")}</strong>
//             </p>
//           </div>
//         </Card>
//       </div>
//     </KioskLayout>
//   );
// }









import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Globe, ChevronRight, QrCode, Smartphone, TestTube, Pill } from "lucide-react";
import KioskLayout from "@/components/KioskLayout";
import { useTranslation, getStoredLanguage, setStoredLanguage, type Language } from "@/lib/i18n";

export default function WelcomePage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<Language>(getStoredLanguage());
  const { t } = useTranslation(language);

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setStoredLanguage(lang);
  };

  const handleProceed = () => {
    navigate('/identify');
  };

  const options = [
    {
      icon: QrCode,
      title: "I have an appointment",
      description: "Scan QR code or enter details",
      action: () => navigate('/identify')
    },
    {
      icon: Smartphone,
      title: "Walk-in patient",
      description: "Register for new visit",
      action: () => navigate('/walkin')
    },
    {
      icon: TestTube,
      title: "Lab services",
      description: "Book tests or collect reports",
      action: () => navigate('/lab')
    },
    {
      icon: Pill,
      title: "Pharmacy",
      description: "Purchase medicines or pickup orders",
      action: () => navigate('/pharmacy')
    }
  ];

  return (
    <KioskLayout 
      title="Welcome" 
      showBack={false} 
      showLanguage={true}
      onBack={() => navigate('/idle')}
    >
      <div className="max-w-4xl mx-auto">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Welcome to MedMitra AI
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your digital healthcare assistant. Please select how you'd like to proceed with your visit today.
          </p>
        </div>

        {/* Language Selection */}
        <Card className="p-6 mb-8 bg-gradient-subtle">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-3">
              <Globe className="h-6 w-6 text-primary" />
              <span className="text-lg font-medium text-foreground">
                Select Language / भाषा चुनें
              </span>
            </div>
            
            <div className="flex gap-3">
              {(['en', 'hi'] as Language[]).map((lang) => (
                <Button
                  key={lang}
                  variant={language === lang ? "default" : "outline"}
                  size="lg"
                  onClick={() => handleLanguageSelect(lang)}
                  className="min-w-[120px] h-14 text-lg"
                >
                  {t(`languages.${lang}`)}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Main Options */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {options.map((option, index) => (
            <Card 
              key={index}
              className="p-8 cursor-pointer hover:shadow-kiosk transition-all duration-300 transform hover:scale-105 group"
              onClick={option.action}
            >
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <option.icon className="h-10 w-10 text-primary" />
                </div>
                
                <h3 className="text-2xl font-semibold text-foreground mb-3">
                  {option.title}
                </h3>
                
                <p className="text-muted-foreground mb-6">
                  {option.description}
                </p>
                
                <div className="flex items-center justify-center text-primary group-hover:text-accent transition-colors">
                  <span className="font-medium mr-2">Continue</span>
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Helper Text */}
        <Card className="p-6 bg-muted/30 border-0">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              <strong>Need assistance?</strong> Our friendly staff at the front desk are happy to help you get started.
            </p>
          </div>
        </Card>
      </div>
    </KioskLayout>
  );
}