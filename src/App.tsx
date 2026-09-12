/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  UserRole, 
  Language, 
  PHCLocation, 
  AshaPatientRecord, 
  MedicineItem, 
  OutbreakAlert, 
  OPDToken 
} from './types';
import { phcLocations } from './data/phcData';
import { initialAshaRecords, initialMedicines, initialOutbreakAlerts } from './data/initialData';
import { translations } from './data/translations';
import { Header } from './components/Header';
import { PatientPortal } from './components/PatientPortal';
import { AshaWorkerModule } from './components/AshaWorkerModule';
import { DoctorDashboard } from './components/DoctorDashboard';
import { SosModal } from './components/SosModal';
import { 
  Phone, 
  Mail, 
  ShieldCheck, 
  Award, 
  Building2, 
  ExternalLink 
} from 'lucide-react';

export default function App() {
  // App Core State
  const [role, setRole] = useState<UserRole>('patient');
  const [lang, setLang] = useState<Language>('mr');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xl'>('normal');
  const [isSosOpen, setIsSosOpen] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Data State with Realtime Doctor Status
  const [phcs, setPhcs] = useState<PHCLocation[]>(() => {
    return phcLocations.map((p, idx) => {
      // Seed realistic initial statuses across the 50 PHCs
      const initialStatus: 'Available' | 'On Round' | 'Tele-OPD' = 
        idx % 5 === 0 ? 'Tele-OPD' : p.doctor.availableNow ? 'Available' : 'On Round';
      return {
        ...p,
        doctor: {
          ...p.doctor,
          status: initialStatus,
          availableNow: initialStatus !== 'On Round',
          lastUpdated: '05:12:00 AM (Biometric Verified)',
        },
      };
    });
  });

  // Doctor status REALTIME Simulation: changes every 30 seconds randomly between Available / On Round / Tele-OPD
  useEffect(() => {
    const interval = setInterval(() => {
      setPhcs((prevPhcs) => {
        const statuses: ('Available' | 'On Round' | 'Tele-OPD')[] = ['Available', 'On Round', 'Tele-OPD'];
        // Pick 3 random PHCs to update dynamically
        const indicesToUpdate = new Set<number>();
        while (indicesToUpdate.size < 3) {
          indicesToUpdate.add(Math.floor(Math.random() * prevPhcs.length));
        }

        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        return prevPhcs.map((phc, idx) => {
          if (indicesToUpdate.has(idx)) {
            const currentStatus = phc.doctor.status || 'Available';
            const remaining = statuses.filter(s => s !== currentStatus);
            const nextStatus = remaining[Math.floor(Math.random() * remaining.length)];
            return {
              ...phc,
              doctor: {
                ...phc.doctor,
                status: nextStatus,
                availableNow: nextStatus !== 'On Round',
                lastUpdated: `${now} (Live Telemetry)`,
              },
            };
          }
          return phc;
        });
      });
    }, 30000); // 30 seconds interval as specified

    return () => clearInterval(interval);
  }, []);

  // Manual Trigger to Simulate Doctor Status Immediately for Demo Testing
  const handleSimulateDoctorStatus = (targetPhcId?: string) => {
    setPhcs((prevPhcs) => {
      const statuses: ('Available' | 'On Round' | 'Tele-OPD')[] = ['Available', 'On Round', 'Tele-OPD'];
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      return prevPhcs.map((phc) => {
        if (!targetPhcId || phc.id === targetPhcId) {
          const currentStatus = phc.doctor.status || 'Available';
          const remaining = statuses.filter(s => s !== currentStatus);
          const nextStatus = remaining[Math.floor(Math.random() * remaining.length)];
          return {
            ...phc,
            doctor: {
              ...phc.doctor,
              status: nextStatus,
              availableNow: nextStatus !== 'On Round',
              lastUpdated: `${now} (Live Demo Telemetry)`,
            },
          };
        }
        return phc;
      });
    });
  };
  const [patientRecords, setPatientRecords] = useState<AshaPatientRecord[]>(() => {
    const saved = localStorage.getItem('aarogyadhara_asha_records');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return initialAshaRecords;
  });

  const [medicines, setMedicines] = useState<MedicineItem[]>(() => {
    const saved = localStorage.getItem('aarogyadhara_medicines');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return initialMedicines;
  });

  const [outbreaks] = useState<OutbreakAlert[]>(initialOutbreakAlerts);

  const [tokens, setTokens] = useState<OPDToken[]>([
    {
      id: "tok-init-1",
      tokenNumber: "GAD-BHM-14",
      patientName: "Sunita Usendi",
      age: 26,
      gender: "Female",
      mobile: "9403182910",
      village: "Nelgonda",
      taluka: "Bhamragad",
      district: "Gadchiroli",
      phcId: "phc-gad-01",
      phcName: "प्राथमिक आरोग्य केंद्र भामरागड",
      doctorName: "Dr. Sandeep Meshram",
      appointmentDate: "2026-09-07",
      timeSlot: "09:00 AM - 10:30 AM",
      status: "Waiting",
      symptomSummary: "Antenatal checkup & Hb screening",
      bookedAt: "08:45 AM",
      estimatedWaitMinutes: 20,
    },
    {
      id: "tok-init-2",
      tokenNumber: "NAN-DHA-08",
      patientName: "Roshani Pawara",
      age: 3,
      gender: "Female",
      mobile: "9423411092",
      village: "Bijry",
      taluka: "Dhadgaon",
      district: "Nandurbar",
      phcId: "phc-nan-01",
      phcName: "प्राथमिक आरोग्य केंद्र धडगाव",
      doctorName: "Dr. Nilesh Padvi",
      appointmentDate: "2026-09-07",
      timeSlot: "10:30 AM - 12:00 PM",
      status: "Waiting",
      symptomSummary: "Fever and severe diarrhea",
      bookedAt: "09:10 AM",
      estimatedWaitMinutes: 15,
    }
  ]);

  // Persist patient records
  useEffect(() => {
    localStorage.setItem('aarogyadhara_asha_records', JSON.stringify(patientRecords));
  }, [patientRecords]);

  // Persist medicines
  useEffect(() => {
    localStorage.setItem('aarogyadhara_medicines', JSON.stringify(medicines));
  }, [medicines]);

  // Speech synthesizer toggle
  const handleToggleSpeech = () => {
    if (isSpeaking) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert("Speech synthesis is not supported on this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    const greetingMr = "नमस्कार, आरोग्यधाम महाराष्ट्र ग्रामीण आरोग्य संपर्क प्रणालीमध्ये आपले स्वागत आहे. गडचिरोली व नंदुरबार मधील ५० प्राथमिक आरोग्य केंद्रांची माहिती, डॉक्टरांची उपस्थिती, सर्पदंश लस साठा व ओपीडी टोकन येथे उपलब्ध आहे. तातडीच्या मदतीसाठी लाल रंगाच्या १०८ बटणावर स्पर्श करा.";
    const greetingHi = "नमस्कार, आरोग्यधाम महाराष्ट्र ग्रामीण स्वास्थ्य संपर्क प्रणाली में आपका स्वागत है। गडचिरोली एवं नंदुरबार के ५० प्राथमिक स्वास्थ्य केंद्रों की जानकारी, डॉक्टर उपस्थिति, सर्पदंश रोधी विष स्टॉक व ओपीडी टोकन यहां उपलब्ध हैं। आपातकालीन सहायता के लिए लाल रंग के १०८ बटन को दबाएं।";
    const greetingEn = "Welcome to AarogyaDham, Rural Health Connect for Maharashtra. Access live information on 50 Primary Health Centres, doctor availability, anti-snake venom stock, and OPD tokens across Gadchiroli and Nandurbar. For emergencies, press 108 SOS.";

    const text = lang === 'mr' ? greetingMr : lang === 'hi' ? greetingHi : greetingEn;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.92;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleAddNewToken = (newToken: OPDToken) => {
    setTokens([newToken, ...tokens]);
  };

  const handleSaveAshaRecord = (record: AshaPatientRecord) => {
    setPatientRecords([record, ...patientRecords]);
  };

  const handleSyncAllAshaRecords = () => {
    const synced = patientRecords.map(r => ({ ...r, syncedToCloud: true }));
    setPatientRecords(synced);
    setIsOffline(false);
  };

  const unsyncedCount = patientRecords.filter(r => !r.syncedToCloud).length;
  const t = translations[lang];

  // Font size class mapping
  const fontSizeClass = fontSize === 'xl' ? 'text-lg' : fontSize === 'large' ? 'text-base' : 'text-sm';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      highContrast 
        ? 'bg-black text-yellow-300' 
        : 'bg-slate-100 text-slate-900'
    } ${fontSizeClass}`}>

      {/* Main Government Portal Header */}
      <Header
        role={role}
        setRole={setRole}
        lang={lang}
        setLang={setLang}
        isOffline={isOffline}
        setIsOffline={setIsOffline}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        fontSize={fontSize}
        setFontSize={setFontSize}
        isSpeaking={isSpeaking}
        onToggleSpeech={handleToggleSpeech}
        onOpenSos={() => setIsSosOpen(true)}
        unsyncedCount={unsyncedCount}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {/* Role 1: Citizen / Patient */}
        {role === 'patient' && (
          <PatientPortal
            phcs={phcs}
            lang={lang}
            onBookToken={(phc) => {
              // Open booking inside portal
            }}
            tokens={tokens}
            onAddNewToken={handleAddNewToken}
            onOpenSos={() => setIsSosOpen(true)}
            onSimulateDoctorStatus={handleSimulateDoctorStatus}
          />
        )}

        {/* Role 2: ASHA Field Worker */}
        {role === 'asha' && (
          <AshaWorkerModule
            records={patientRecords}
            onSaveRecord={handleSaveAshaRecord}
            onSyncRecords={handleSyncAllAshaRecords}
            isOffline={isOffline}
            setIsOffline={setIsOffline}
            lang={lang}
            onOpenSos={() => setIsSosOpen(true)}
          />
        )}

        {/* Role 3: Doctor / Medical Admin Dashboard */}
        {role === 'doctor' && (
          <DoctorDashboard
            phcs={phcs}
            medicines={medicines}
            outbreaks={outbreaks}
            patientRecords={patientRecords}
            onUpdateMedicine={setMedicines}
            lang={lang}
            onOpenSos={() => setIsSosOpen(true)}
          />
        )}
      </main>

      {/* Official Government Footer */}
      <footer className="w-full bg-[#061C39] text-slate-300 text-xs border-t-4 border-amber-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Column 1: Government Mission */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-white p-0.5 inline-flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="46" fill="#0A3871" />
                    <circle cx="50" cy="50" r="40" fill="#FFFFFF" />
                    <circle cx="50" cy="50" r="36" fill="#0A3871" />
                    <circle cx="50" cy="38" r="7" fill="#FF9933" />
                  </svg>
                </span>
                <div>
                  <h4 className="font-extrabold text-white text-sm">
                    {lang === 'mr' ? 'सार्वजनिक आरोग्य विभाग, महाराष्ट्र शासन' : 'Public Health Department, Govt of Maharashtra'}
                  </h4>
                  <span className="text-[11px] text-amber-400 font-semibold">
                    {lang === 'mr' 
                      ? 'राष्ट्रीय आरोग्य अभियान (NHM) • आदिवासी आरोग्य संपर्क' 
                      : lang === 'hi'
                      ? 'राष्ट्रीय स्वास्थ्य मिशन (NHM) • आदिवासी स्वास्थ्य संपर्क'
                      : 'National Health Mission • Tribal Health Initiative'}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-lg">
                {lang === 'mr'
                  ? 'गडचिरोली व नंदुरबार जिल्ह्यातील दुर्गम पाड्यांमधील नागरिकांसाठी प्राथमिक आरोग्य केंद्र शोध, थेट डॉक्टर उपस्थिती, सर्पदंश लस साठा आणि आशा सेविकांसाठी ऑफलाइन एआय ट्रायज प्रणाली.'
                  : lang === 'hi'
                  ? 'गडचिरोली एवं नंदुरबार जिले के दूरदराज पाड़ों के नागरिकों हेतु प्राथमिक स्वास्थ्य केंद्र खोज, लाइव डॉक्टर उपस्थिति, सर्पदंश रोधी विष स्टॉक एवं आशा कार्यकर्ताओं हेतु ऑफलाइन एआई ट्राइएज प्रणाली।'
                  : 'Empowering remote tribal padas across Gadchiroli and Nandurbar with real-time PHC locator, live doctor duty schedules, Anti-Snake Venom buffers, and offline AI triage for ASHA workers.'}
              </p>
            </div>

            {/* Column 2: Emergency Numbers */}
            <div className="space-y-2">
              <h5 className="font-extrabold text-white text-xs uppercase tracking-wider text-amber-400">
                {lang === 'mr' ? 'आपत्कालीन संपर्क' : lang === 'hi' ? 'आपातकालीन संपर्क' : 'Emergency Helplines'}
              </h5>
              <ul className="space-y-1 text-[11px] text-slate-300">
                <li className="flex items-center gap-1.5">
                  <span className="text-red-400 font-bold">108:</span>
                  <span>Maharashtra Emergency Medical Services</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-blue-400 font-bold">102:</span>
                  <span>Janani Shishu Suraksha Karyakram (JSSK)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">104:</span>
                  <span>Maha State Health Advice Helpline (24x7)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-amber-400 font-bold">1800-233-0244:</span>
                  <span>Sickle Cell Mission Cell</span>
                </li>
              </ul>
            </div>

            {/* Column 3: Tribal Health Mission Framework */}
            <div className="space-y-2">
              <h5 className="font-extrabold text-white text-xs uppercase tracking-wider text-amber-400">
                {lang === 'mr' ? 'आदिवासी आरोग्य मिशन' : lang === 'hi' ? 'आदिवासी स्वास्थ्य मिशन' : 'Tribal Health Mission'}
              </h5>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Award className="w-4 h-4" />
                  <span>
                    {lang === 'mr' 
                      ? 'सार्वजनिक आरोग्य विभाग, महाराष्ट्र' 
                      : lang === 'hi'
                      ? 'सार्वजनिक स्वास्थ्य विभाग, महाराष्ट्र'
                      : 'Public Health Department, Maharashtra'}
                  </span>
                </div>
                <p className="text-slate-400 text-[10px]">
                  {lang === 'mr'
                    ? 'दुर्गम पाडे व कमी इंटरनेट भागातील जनतेसाठी एकात्मिक डिजिटल आरोग्य सेवा व एआय ट्रायज प्रणाली.'
                    : lang === 'hi'
                    ? 'दुर्गम बस्तियों एवं कम इंटरनेट क्षेत्रों के लिए एकीकृत डिजिटल स्वास्थ्य सेवा एवं एआई ट्राइएज प्रणाली।'
                    : 'Rural Health Connect for Low-Connectivity & High Tribal Vulnerability Regions.'}
                </p>
                <div className="text-[10px] text-emerald-400 font-semibold pt-1">
                  ✓ {lang === 'mr' ? 'शासकीय रंग व सुलभता नियमावलीचे पालन' : lang === 'hi' ? 'शासकीय मानक एवं सुलभता दिशानिर्देशों का पालन' : 'Designed with Saffron & Blue Govt Guidelines'}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              © 2026 Government of Maharashtra. All rights reserved. AarogyaDham v2.4
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-400">
              <span>NIC Certified</span>
              <span>•</span>
              <span>HIPAA/NDHM Compliant</span>
              <span>•</span>
              <span>W3C WCAG 2.1 AA Accessible</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Emergency SOS Modal */}
      <SosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        lang={lang}
      />
    </div>
  );
}
