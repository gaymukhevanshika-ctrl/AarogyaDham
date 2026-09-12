import React, { useState, useRef, useEffect } from 'react';
import { 
  UserRole, 
  Language 
} from '../types';
import { translations } from '../data/translations';
import { 
  HeartHandshake, 
  MapPin, 
  Stethoscope, 
  Activity, 
  Volume2, 
  VolumeX, 
  Wifi, 
  WifiOff, 
  PhoneCall, 
  ShieldAlert, 
  Sliders, 
  Sparkles,
  ChevronDown,
  Check,
  LayoutDashboard
} from 'lucide-react';

interface HeaderProps {
  role: UserRole;
  setRole: (r: UserRole) => void;
  lang: Language;
  setLang: (l: Language) => void;
  isOffline: boolean;
  setIsOffline: (o: boolean) => void;
  highContrast: boolean;
  setHighContrast: (c: boolean) => void;
  fontSize: 'normal' | 'large' | 'xl';
  setFontSize: (s: 'normal' | 'large' | 'xl') => void;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
  onOpenSos: () => void;
  unsyncedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  role,
  setRole,
  lang,
  setLang,
  isOffline,
  setIsOffline,
  highContrast,
  setHighContrast,
  fontSize,
  setFontSize,
  isSpeaking,
  onToggleSpeech,
  onOpenSos,
  unsyncedCount,
}) => {
  const t = translations[lang];
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDashboardDetails = (r: UserRole) => {
    switch (r) {
      case 'patient':
        return {
          title: t.rolePatient,
          desc: lang === 'mr' 
            ? '५० प्राथमिक आरोग्य केंद्र शोध, थेट डॉक्टर उपस्थिती व ओपीडी टोकन' 
            : lang === 'hi'
            ? '५० प्राथमिक स्वास्थ्य केंद्र खोज, डॉक्टर उपस्थिति एवं ओपीडी टोकन'
            : '50 PHC Locator, Live Doctor Duty & OPD Tokens',
          badge: '50 PHC',
          icon: <MapPin className="w-4 h-4 text-[#0A3871]" />,
          colorClass: 'border-[#0A3871] bg-blue-50/70',
        };
      case 'asha':
        return {
          title: t.roleAsha,
          desc: lang === 'mr'
            ? 'घरोघरी तपासणी, शारीरिक व्हायटल्स व १००% ऑफलाइन एआय ट्रायज'
            : lang === 'hi'
            ? 'घर-घर जांच, शारीरिक वाइटल्स एवं १००% ऑफलाइन एआई ट्राइएज'
            : 'Doorstep Screening, Vitals & 100% Offline AI Triage',
          badge: lang === 'mr' ? 'ऑफलाइन ॲप' : lang === 'hi' ? 'ऑफलाइन ऐप' : 'Offline AI',
          icon: <HeartHandshake className="w-4 h-4 text-amber-600" />,
          colorClass: 'border-amber-500 bg-amber-50/70',
        };
      case 'doctor':
        return {
          title: t.roleDoctor,
          desc: lang === 'mr'
            ? 'थेट टेलीमेट्री, साथीचे रोग नियंत्रण, औषध साठा व टेलिकन्सल्टेशन'
            : lang === 'hi'
            ? 'लाइव टेलीमेट्री, महामारी निगरानी, दवा स्टॉक व टेलीकंसल्टेशन'
            : 'Morbidity Trends, Epidemic Heatmap & EDL Supply Chain',
          badge: lang === 'mr' ? 'नियंत्रण कक्ष' : lang === 'hi' ? 'कमांड सेंटर' : 'Command Center',
          icon: <Stethoscope className="w-4 h-4 text-emerald-700" />,
          colorClass: 'border-emerald-600 bg-emerald-50/70',
        };
    }
  };

  const currentDashboard = getDashboardDetails(role);

  return (
    <header className="w-full bg-white shadow-md sticky top-0 z-50 border-b border-slate-200">
      {/* Official Indian Tricolor Top Ribbon */}
      <div className="h-1.5 w-full flex">
        <div className="h-full w-1/3 bg-[#FF9933]"></div>
        <div className="h-full w-1/3 bg-white"></div>
        <div className="h-full w-1/3 bg-[#138808]"></div>
      </div>

      {/* Top Utility Ribbon for Accessibility, Helplines & Network */}
      <div className="bg-slate-900 text-white text-xs px-3 py-1.5 sm:px-6 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-amber-300 font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {lang === 'mr' 
              ? 'राष्ट्रीय आरोग्य अभियान (NHM) महाराष्ट्र' 
              : lang === 'hi'
              ? 'राष्ट्रीय स्वास्थ्य मिशन (NHM) महाराष्ट्र'
              : 'National Health Mission (NHM) Maharashtra'}
          </span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden md:inline text-slate-300">
            {lang === 'mr' 
              ? 'आरोग्यम् धनसंपदा • गडचिरोली व नंदुरबार' 
              : lang === 'hi'
              ? 'आरोग्यम् धनसंपदा • गडचिरोली व नंदुरबार'
              : 'Aarogyam Dhansampada • Tribal Health Mission'}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          {/* Offline / Online Simulation Toggle */}
          <button
            id="network-toggle-btn"
            onClick={() => setIsOffline(!isOffline)}
            title={t.toggleOffline}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold transition-all ${
              isOffline 
                ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-300' 
                : 'bg-emerald-700/80 text-emerald-100 hover:bg-emerald-600'
            }`}
          >
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span>{isOffline ? t.offlineStatus : t.onlineStatus}</span>
            {unsyncedCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-bold px-1 rounded-full ml-1">
                {unsyncedCount}
              </span>
            )}
          </button>

          {/* Audio Narration for Semi-literate patients */}
          <button
            id="audio-narration-btn"
            onClick={onToggleSpeech}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
              isSpeaking ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title={t.audioGuide}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5 animate-bounce" /> : <Volume2 className="w-3.5 h-3.5 text-amber-300" />}
            <span className="hidden sm:inline">{isSpeaking ? t.audioPlaying : t.audioGuide}</span>
          </button>

          {/* Accessibility: Font Size Adjuster */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded">
            <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Font</span>
            <button
              id="font-normal-btn"
              onClick={() => setFontSize('normal')}
              className={`px-1.5 text-xs rounded font-bold ${fontSize === 'normal' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'}`}
            >
              A
            </button>
            <button
              id="font-large-btn"
              onClick={() => setFontSize('large')}
              className={`px-1.5 text-sm rounded font-bold ${fontSize === 'large' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'}`}
            >
              A+
            </button>
            <button
              id="font-xl-btn"
              onClick={() => setFontSize('xl')}
              className={`px-1.5 text-base rounded font-bold ${fontSize === 'xl' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'}`}
            >
              A++
            </button>
          </div>

          {/* High Contrast Toggle */}
          <button
            id="high-contrast-btn"
            onClick={() => setHighContrast(!highContrast)}
            className={`px-2 py-0.5 rounded text-xs font-semibold ${
              highContrast ? 'bg-yellow-400 text-black font-extrabold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={t.highContrast}
          >
            <Sliders className="w-3 h-3 inline mr-1" />
            <span className="hidden sm:inline">{t.highContrast}</span>
          </button>

          {/* Marathi / Hindi / English Language Selector */}
          <div className="flex items-center rounded overflow-hidden border border-slate-700 shadow-inner">
            <button
              id="lang-mr-btn"
              onClick={() => setLang('mr')}
              className={`px-2 py-0.5 text-xs font-bold transition-colors ${
                lang === 'mr' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              मराठी
            </button>
            <button
              id="lang-hi-btn"
              onClick={() => setLang('hi')}
              className={`px-2 py-0.5 text-xs font-bold transition-colors ${
                lang === 'hi' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              हिंदी
            </button>
            <button
              id="lang-en-btn"
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 text-xs font-bold transition-colors ${
                lang === 'en' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              English
            </button>
          </div>

          {/* Emergency 108 SOS Quick Trigger */}
          <button
            id="sos-header-btn"
            onClick={onOpenSos}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white font-extrabold px-2.5 py-0.5 rounded text-xs shadow-sm hover:shadow-red-500/50 transition-all animate-pulse"
          >
            <PhoneCall className="w-3 h-3" />
            <span>108 SOS</span>
          </button>
        </div>
      </div>

      {/* Main Government Portal Header */}
      <div className="bg-gradient-to-r from-[#0A3871] via-[#104382] to-[#0A3871] text-white px-4 py-3 sm:px-8 border-b-4 border-amber-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Official Emblem & Titles */}
          <div className="flex items-center gap-3.5 text-center md:text-left">
            {/* Govt of Maharashtra & Ashoka Pillar Emblem Badge */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white p-1 shadow-lg border-2 border-amber-400 flex items-center justify-center">
                {/* Government of Maharashtra Seal Graphics */}
                <svg viewBox="0 0 100 100" className="w-full h-full" aria-label="Govt of Maharashtra Emblem">
                  <circle cx="50" cy="50" r="46" fill="#0A3871" />
                  <circle cx="50" cy="50" r="41" fill="#FFFFFF" />
                  <circle cx="50" cy="50" r="37" fill="#0A3871" />
                  {/* Sunburst and Sanskrit Script Symbol */}
                  <g fill="#FF9933" stroke="#FF9933">
                    <circle cx="50" cy="38" r="7" fill="#FF9933" />
                    <rect x="47" y="47" width="6" height="18" rx="2" fill="#FF9933" />
                    <rect x="36" y="52" width="28" height="5" rx="2" fill="#FF9933" />
                    <circle cx="50" cy="54" r="5" fill="#FFFFFF" />
                    <circle cx="50" cy="54" r="2" fill="#0A3871" />
                  </g>
                  {/* Sanskrit text arc */}
                  <path id="curve" d="M 20 50 A 30 30 0 0 1 80 50" fill="none" />
                  <text fill="#FF9933" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                    <textPath href="#curve" startOffset="50%">
                      महाराष्ट्र शासन
                    </textPath>
                  </text>
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#FF9933" strokeWidth="1.5" strokeDasharray="2,2" />
                </svg>
              </div>
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1 rounded-full border border-white">
                Maha
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="text-[11px] sm:text-xs font-semibold text-amber-300 tracking-wider uppercase">
                  {t.govtDept}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight flex items-center justify-center md:justify-start gap-2">
                <span className="text-amber-400 font-black">{lang === 'mr' || lang === 'hi' ? 'आरोग्य' : 'Aarogya'}</span>
                <span className="text-white">{lang === 'mr' || lang === 'hi' ? 'धाम' : 'Dham'}</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-medium ml-1">
                  Rural Health Connect
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 font-medium">
                {lang === 'mr' 
                  ? 'गडचिरोली व नंदुरबार आदिवासी व ग्रामीण आरोग्य संपर्क प्रणाली' 
                  : lang === 'hi'
                  ? 'गडचिरोली एवं नंदुरबार आदिवासी व ग्रामीण स्वास्थ्य संपर्क प्रणाली'
                  : 'Tele-Triage, PHC Mapping & Supply Chain for Gadchiroli & Nandurbar'}
              </p>
            </div>
          </div>

          {/* Quick Stats Banner / Live Ticker */}
          <div className="flex items-center gap-2 sm:gap-4 bg-[#06244a] border border-blue-400/30 rounded-lg p-2 sm:px-3 text-xs">
            <div className="text-center px-2 border-r border-blue-400/30">
              <span className="block text-[10px] text-slate-300 uppercase font-bold">PHCs Active</span>
              <span className="text-sm sm:text-base font-extrabold text-amber-400">50</span>
            </div>
            <div className="text-center px-2 border-r border-blue-400/30">
              <span className="block text-[10px] text-slate-300 uppercase font-bold">ASV Stock</span>
              <span className="text-sm sm:text-base font-extrabold text-emerald-400">820+ Vials</span>
            </div>
            <div className="text-center px-2">
              <span className="block text-[10px] text-slate-300 uppercase font-bold">24x7 Helpline</span>
              <span className="text-sm sm:text-base font-extrabold text-white">108 / 104</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upper Dashboard Bar with Dropdown List */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          
          {/* Dashboard Selector Container (Dropdown List) */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
              <LayoutDashboard className="w-4 h-4 text-[#0A3871]" />
              <span>{t.selectDashboard}:</span>
            </div>

            {/* Custom Interactive Dropdown Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                id="upper-dashboard-dropdown-btn"
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
                className="flex items-center gap-2.5 bg-white border-2 border-[#0A3871] hover:border-amber-500 px-3.5 py-1.5 rounded-lg shadow-sm font-bold text-xs sm:text-sm text-slate-900 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <span className="p-1 rounded bg-slate-100 border border-slate-200">
                  {currentDashboard.icon}
                </span>
                <span className="font-extrabold text-[#0A3871] text-xs sm:text-sm">
                  {currentDashboard.title}
                </span>
                <span className="text-[10px] bg-amber-400/90 text-slate-950 font-black px-2 py-0.5 rounded-full">
                  {currentDashboard.badge}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Floating Dropdown List Popover */}
              {isDropdownOpen && (
                <div 
                  id="upper-dashboard-dropdown-menu"
                  role="listbox"
                  className="absolute left-0 mt-1.5 w-72 sm:w-84 bg-white rounded-xl shadow-2xl border-2 border-[#0A3871] z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] font-black tracking-wider text-slate-500 uppercase">
                      {t.selectDashboard}
                    </span>
                    <span className="text-[10px] text-amber-600 font-bold">
                      {role === 'patient' ? '1/3' : role === 'asha' ? '2/3' : '3/3'}
                    </span>
                  </div>

                  {/* Option 1: Citizen / Patient */}
                  <button
                    id="dropdown-opt-patient"
                    type="button"
                    role="option"
                    aria-selected={role === 'patient'}
                    onClick={() => {
                      setRole('patient');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left p-3 flex items-start gap-3 transition-colors hover:bg-blue-50/80 ${
                      role === 'patient' ? 'bg-blue-50 border-l-4 border-[#0A3871]' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0A3871] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                          {t.rolePatient}
                        </span>
                        <span className="text-[10px] bg-[#0A3871] text-white font-bold px-1.5 py-0.2 rounded-full">
                          50 PHC
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {lang === 'mr' 
                          ? '५० प्राथमिक आरोग्य केंद्र नकाशा, थेट डॉक्टर उपस्थिती व ओपीडी टोकन' 
                          : lang === 'hi'
                          ? '५० प्राथमिक स्वास्थ्य केंद्र नक्शा, डॉक्टर उपस्थिति एवं ओपीडी टोकन'
                          : '50 PHC Locator, Live Doctor Duty & OPD Tokens'}
                      </p>
                    </div>
                    {role === 'patient' && (
                      <Check className="w-4 h-4 text-[#0A3871] mt-1 flex-shrink-0" />
                    )}
                  </button>

                  {/* Option 2: ASHA Field Worker */}
                  <button
                    id="dropdown-opt-asha"
                    type="button"
                    role="option"
                    aria-selected={role === 'asha'}
                    onClick={() => {
                      setRole('asha');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left p-3 flex items-start gap-3 transition-colors hover:bg-amber-50/80 ${
                      role === 'asha' ? 'bg-amber-50 border-l-4 border-amber-600' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                          {t.roleAsha}
                        </span>
                        <span className="text-[10px] bg-amber-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                          {lang === 'mr' ? 'ऑफलाइन ॲप' : lang === 'hi' ? 'ऑफलाइन ऐप' : 'Offline AI'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {lang === 'mr'
                          ? 'घरोघरी तपासणी, शारीरिक व्हायटल्स व १००% ऑफलाइन एआय ट्रायज'
                          : lang === 'hi'
                          ? 'घर-घर जांच, शारीरिक वाइटल्स एवं १००% ऑफलाइन एआई ट्राइएज'
                          : 'Doorstep Screening, Vitals & 100% Offline AI Triage'}
                      </p>
                    </div>
                    {role === 'asha' && (
                      <Check className="w-4 h-4 text-amber-600 mt-1 flex-shrink-0" />
                    )}
                  </button>

                  {/* Option 3: Doctor & Health Admin */}
                  <button
                    id="dropdown-opt-doctor"
                    type="button"
                    role="option"
                    aria-selected={role === 'doctor'}
                    onClick={() => {
                      setRole('doctor');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left p-3 flex items-start gap-3 transition-colors hover:bg-emerald-50/80 ${
                      role === 'doctor' ? 'bg-emerald-50 border-l-4 border-emerald-600' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                          {t.roleDoctor}
                        </span>
                        <span className="text-[10px] bg-emerald-700 text-white font-bold px-1.5 py-0.2 rounded-full">
                          {lang === 'mr' ? 'नियंत्रण कक्ष' : lang === 'hi' ? 'कमांड सेंटर' : 'Command Center'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {lang === 'mr'
                          ? 'थेट टेलीमेट्री, साथीचे रोग नियंत्रण, औषध साठा व टेलिकन्सल्टेशन'
                          : lang === 'hi'
                          ? 'लाइव टेलीमेट्री, महामारी निगरानी, दवा स्टॉक व टेलीकंसल्टेशन'
                          : 'Morbidity Trends, Epidemic Heatmap & EDL Supply Chain'}
                      </p>
                    </div>
                    {role === 'doctor' && (
                      <Check className="w-4 h-4 text-emerald-700 mt-1 flex-shrink-0" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Native Select element for accessibility / mobile quick pick */}
            <div className="flex items-center">
              <select
                id="upper-dashboard-select"
                aria-label={t.selectDashboard}
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-lg px-2.5 py-1.5 shadow-sm focus:ring-2 focus:ring-amber-400 focus:border-[#0A3871] cursor-pointer hover:bg-slate-50"
              >
                <option value="patient">🏥 {t.rolePatient} (50 PHC Map & Tokens)</option>
                <option value="asha">🩺 {t.roleAsha} ({lang === 'mr' ? 'ऑफलाइन एआय ट्रायज' : lang === 'hi' ? 'ऑफलाइन एआई ट्राइएज' : 'Offline AI Triage'})</option>
                <option value="doctor">📊 {t.roleDoctor} ({lang === 'mr' ? 'नियंत्रण कक्ष व औषध साठा' : lang === 'hi' ? 'कमांड सेंटर एवं दवा स्टॉक' : 'Command Center & Drug Supply'})</option>
              </select>
            </div>
          </div>

          {/* Right side: Emergency Alert Hotline pill */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-sm">
            <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
            <span className="hidden sm:inline">{t.emergencyHelplines}</span>
            <span className="sm:hidden font-bold text-red-600">108 / 104</span>
          </div>
        </div>
      </div>
    </header>
  );
};
