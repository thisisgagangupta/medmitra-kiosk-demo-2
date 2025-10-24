# MedMitra AI - Clinic OS (Kiosk UI)

A comprehensive touch-first PWA kiosk system for clinic patient self-service, built with React, TypeScript, and Tailwind CSS.

## 🏥 Features

### Complete Patient Journey (16 Screens)
- **Idle/Welcome** - Attractive loop with language selection
- **Patient Identification** - QR scan + mobile OTP verification  
- **Appointment Management** - View details, payment status
- **Walk-in Registration** - Quick patient onboarding
- **Digital Consent** - Touch signature with legal compliance
- **Visit Reason** - Symptom selection and custom input
- **Payment Processing** - UPI/Card with receipt generation
- **Token Generation** - Queue position with ETA tracking
- **Live Queue** - Real-time status updates
- **Lab Services** - Test booking and sample collection
- **Pharmacy** - Prescription lookup and pickup tokens
- **Help & Support** - Category-based issue resolution
- **Staff Mode** - PIN-protected admin functions
- **Error Handling** - Contextual error recovery
- **Settings** - Accessibility and system configuration

### Design System
- **Brand Colors**: MedMitra purple (#A379A9) with accessible palette
- **Touch-Optimized**: 48px minimum touch targets, large spacing
- **Responsive**: Portrait 1080×1920 optimized, works on all devices
- **Accessibility**: High contrast, font scaling, bilingual support
- **Animations**: Smooth transitions and feedback

### Mock Services (Frontend Only)
- Authentication (OTP/QR)
- Appointment lookup
- Payment processing
- Queue management  
- Lab test ordering
- Pharmacy integration
- Print services

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production  
npm run build
```

## 🎨 Customization

### Change Brand Color
Edit `src/index.css` primary color variables:
```css
--primary: 285 27% 59%; /* Your HSL color */
```

### Add Languages
Update `src/lib/i18n.ts` with new language translations.

### Logo Replacement
Replace `src/assets/medmitra-logo.png` with your clinic logo.

## 🏗️ Architecture

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components  
│   └── KioskLayout.tsx  # Main layout with navigation
├── pages/               # 16 kiosk screens
├── lib/                 # Utilities and services
│   ├── mock-services.ts # Frontend-only mock APIs
│   └── i18n.ts         # Multi-language support
└── assets/             # Images and static files
```

## 📱 PWA Features
- Offline capability
- Installable on devices
- Touch-first interface
- Auto-idle management
- Print integration ready

## 🔧 Technical Stack
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Lucide React** for icons
- **React Router** for navigation

## 🎯 Production Notes
- All data is mock/frontend-only
- Ready for backend integration
- Comprehensive error handling
- Accessibility compliant (WCAG guidelines)
- Touch-optimized for kiosk hardware

## 📄 License
Built for MedMitra AI clinic management system.