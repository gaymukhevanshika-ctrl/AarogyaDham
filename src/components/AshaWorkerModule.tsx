import React, { useState } from 'react';
import { 
  AshaPatientRecord, 
  Language, 
  District, 
  TriageLevel, 
  TriageResult 
} from '../types';
import { translations } from '../data/translations';
import { 
  HeartPulse, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Sparkles, 
  ShieldAlert, 
  Plus, 
  FileText, 
  Pill, 
  Save, 
  UserCheck, 
  Baby, 
  Thermometer, 
  Stethoscope 
} from 'lucide-react';

interface AshaWorkerModuleProps {
  records: AshaPatientRecord[];
  onSaveRecord: (record: AshaPatientRecord) => void;
  onSyncRecords: () => void;
  isOffline: boolean;
  setIsOffline: (o: boolean) => void;
  lang: Language;
  onOpenSos: () => void;
}

export const AshaWorkerModule: React.FC<AshaWorkerModuleProps> = ({
  records,
  onSaveRecord,
  onSyncRecords,
  isOffline,
  setIsOffline,
  lang,
  onOpenSos,
}) => {
  const t = translations[lang];

  // Active Tab: Form or Registry
  const [activeTab, setActiveTab] = useState<'form' | 'registry'>('form');

  // Form State
  const [abhaId, setAbhaId] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [village, setVillage] = useState('');
  const [pada, setPada] = useState('');
  const [taluka, setTaluka] = useState('Bhamragad');
  const [district, setDistrict] = useState<District>('Gadchiroli');
  const [contact, setContact] = useState('');
  
  // High risk flags
  const [isPregnant, setIsPregnant] = useState(false);
  const [pregnancyTrimester, setPregnancyTrimester] = useState(2);
  const [isChild, setIsChild] = useState(false);
  const [hasSickleCell, setHasSickleCell] = useState(false);
  const [snakebiteSuspect, setSnakebiteSuspect] = useState(false);

  // Vitals State
  const [bpSystolic, setBpSystolic] = useState('120');
  const [bpDiastolic, setBpDiastolic] = useState('80');
  const [pulse, setPulse] = useState('74');
  const [spO2, setSpO2] = useState('98');
  const [bloodSugar, setBloodSugar] = useState('105');
  const [temp, setTemp] = useState('98.6');
  const [hemoglobin, setHemoglobin] = useState('11.5');
  const [weight, setWeight] = useState('52');
  const [height, setHeight] = useState('158');

  // Symptoms Checklist
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  // AI Triage State
  const [isTriaging, setIsTriaging] = useState(false);
  const [triageOutput, setTriageOutput] = useState<TriageResult | null>(null);
  const [triageSource, setTriageSource] = useState<string>('');
  const [syncToast, setSyncToast] = useState(false);

  // Filter for registry
  const [triageFilter, setTriageFilter] = useState<'ALL' | TriageLevel>('ALL');

  const commonSymptomsList = [
    { en: "High Fever with Chills", mr: "थंडी वाजून तीव्र ताप (मलेरिया शंका)", hi: "कंपकंपी के साथ तेज बुखार (मलेरिया की आशंका)" },
    { en: "Severe Breathlessness", mr: "श्वास घेण्यास तीव्र अडचण (Hypoxia)", hi: "सांस लेने में अत्यधिक कठिनाई (हाइपोक्सिया)" },
    { en: "Watery Loose Motions / Vomiting", mr: "वारंवार जुलाब किंवा उलट्या (अतिसार)", hi: "लगातार दस्त या उल्टी (डायरिया/अतिसार)" },
    { en: "Severe Joint Pain / Sickle Crisis", mr: "हाडे व सांध्यांमध्ये असह्य वेदना (सिकलसेल)", hi: "हड्डियों व जोड़ों में असहनीय दर्द (सिकल सेल)" },
    { en: "Bleeding / Severe Pallor", mr: "रक्तस्त्राव / डोळे व नखे पांढरी पडणे (अति-ॲनिमिया)", hi: "रक्तस्राव / आंखें व नाखून अत्यधिक पीले-सफेद (एनीमिया)" },
    { en: "Swelling in Feet / Edema", mr: "पायांवर सूज (गरोदरपणातील धोका)", hi: "पैरों में सूजन (गर्भावस्था में जोखिम)" },
    { en: "Drowsiness / Altered Sensorium", mr: "गुंगी येणे / चक्कर येणे / बेशुद्धी", hi: "चक्कर आना / अत्यधिक उनींदापन / बेहोशी" },
    { en: "Suspected Snakebite / Fang Mark", mr: "सर्पदंश / शेतात कीटकांचा दंश", hi: "सर्पदंश / खेत में जहरीले जीव का काटना" },
  ];

  const handleToggleSymptom = (symptomEn: string) => {
    if (selectedSymptoms.includes(symptomEn)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptomEn));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptomEn]);
    }
  };

  // Run AI Triage Engine
  const handleRunAiTriage = async () => {
    setIsTriaging(true);
    setTriageOutput(null);

    const payload = {
      patient: {
        name: name.trim() || 'Anonymous Resident',
        age: parseInt(age) || 30,
        gender,
        village,
        pada,
        taluka,
        district,
        isPregnant,
        pregnancyTrimester,
        isChild,
        hasSickleCell,
      },
      vitals: {
        bpSystolic: parseFloat(bpSystolic) || 120,
        bpDiastolic: parseFloat(bpDiastolic) || 80,
        pulse: parseFloat(pulse) || 72,
        spO2: parseFloat(spO2) || 98,
        bloodSugar: parseFloat(bloodSugar) || 100,
        temp: parseFloat(temp) || 98.6,
        hemoglobin: parseFloat(hemoglobin) || 12,
        weight: parseFloat(weight) || 50,
        height: parseFloat(height) || 160,
      },
      symptoms: selectedSymptoms,
      language: lang,
    };

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setTriageOutput(data.triage);
      setTriageSource(data.source);
    } catch {
      // Offline rule evaluation fallback
      setTriageOutput(evaluateLocalRuleEngine(payload.vitals, selectedSymptoms));
      setTriageSource('offline_fallback');
    } finally {
      setIsTriaging(false);
    }
  };

  const evaluateLocalRuleEngine = (vitals: any, symptoms: string[]): TriageResult => {
    const isRed = vitals.spO2 < 90 || vitals.hemoglobin < 7 || vitals.bpSystolic >= 160 || vitals.bpDiastolic >= 100 || symptoms.includes("Suspected Snakebite / Fang Mark") || symptoms.includes("Severe Breathlessness");
    if (isRed) {
      return {
        triageLevel: "RED",
        score: 95,
        primaryConcern: "Immediate Life-Threatening Emergency",
        clinicalRationale: `Critical vitals detected (SpO2: ${vitals.spO2}%, Hb: ${vitals.hemoglobin}g/dL, BP: ${vitals.bpSystolic}/${vitals.bpDiastolic}). Immediate emergency transport needed.`,
        ashaAction: "Call 108 Ambulance immediately. Keep patient in recovery position. Do not give oral intake.",
        referralNeeded: true,
        recommendedFacility: "Sub-District Hospital / District Civil Hospital",
        ashaKitMedicines: ["Ensure airway clearance", "Oxygen support on ambulance"],
        marathiInstructions: "तातडीने १०८ रुग्णवाहिकेला फोन करा! रुग्णाचे व्हायटल्स अतिधोकादायक पातळीवर आहेत. त्वरित मोठ्या रुग्णालयात दाखल करा.",
        dangerSigns: ["SpO2 < 90%", "गंभीर रक्तक्षय (Hb < 7)", "सर्पदंश लक्षणे"],
      };
    }
    const isYellow = vitals.spO2 < 95 || vitals.hemoglobin < 10 || vitals.bpSystolic >= 140 || vitals.temp >= 101 || symptoms.length > 0;
    if (isYellow) {
      return {
        triageLevel: "YELLOW",
        score: 60,
        primaryConcern: "Urgent Medical Review Needed",
        clinicalRationale: `Abnormal vitals: Temp: ${vitals.temp}°F, Hb: ${vitals.hemoglobin}g/dL. Medical Officer consultation recommended within 24 hours.`,
        ashaAction: "Refer to nearest PHC or schedule priority Telemedicine. Monitor vitals twice daily.",
        referralNeeded: true,
        recommendedFacility: "Primary Health Centre (PHC)",
        ashaKitMedicines: ["Paracetamol 500mg if fever", "ORS packets for hydration", "Iron Folic Acid"],
        marathiInstructions: "२४ तासांत नजीकच्या प्राथमिक आरोग्य केंद्रात (PHC) डॉक्टरांचा सल्ला घ्या. ताप असल्यास पॅरासिटामॉल द्या आणि ओआरएस द्या.",
        dangerSigns: ["ताप न उतरणे", "उलट्या वाढणे"],
      };
    }
    return {
      triageLevel: "GREEN",
      score: 20,
      primaryConcern: "Routine / Stable Vitals",
      clinicalRationale: "Physiological vitals within normal range. Low risk of acute deterioration.",
      ashaAction: "Dispense ASHA kit supportive medicines. Counsel regarding hygiene, hydration, and nutrition.",
      referralNeeded: false,
      recommendedFacility: "Village Sub-Centre / Home Monitoring",
      ashaKitMedicines: ["ORS packets", "Zinc tablets", "Vitamin C"],
      marathiInstructions: "प्रकृती सामान्य आहे. विश्रांती, उकळलेले पाणी व संतुलित आहार घेण्यास सांगा. ३ दिवसांनी पुन्हा तपासणी करा.",
      dangerSigns: ["अचानक तीव्र ताप", "श्वास घेण्यास त्रास"],
    };
  };

  // Save Record
  const handleSaveResident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter patient name.");
      return;
    }

    const currentTriage = triageOutput || evaluateLocalRuleEngine({
      bpSystolic: parseFloat(bpSystolic) || 120,
      bpDiastolic: parseFloat(bpDiastolic) || 80,
      pulse: parseFloat(pulse) || 72,
      spO2: parseFloat(spO2) || 98,
      bloodSugar: parseFloat(bloodSugar) || 100,
      temp: parseFloat(temp) || 98.6,
      hemoglobin: parseFloat(hemoglobin) || 12,
    }, selectedSymptoms);

    const record: AshaPatientRecord = {
      id: `asha-rec-${Date.now()}`,
      abhaId: abhaId.trim() || undefined,
      name: name.trim(),
      age: parseInt(age) || 30,
      gender,
      village: village.trim() || 'Forest Hamlet',
      pada: pada.trim() || 'Central Pada',
      taluka,
      district,
      contact: contact || '+91 9400000000',
      isPregnant,
      pregnancyTrimester: isPregnant ? pregnancyTrimester : undefined,
      isChild,
      hasSickleCell,
      vitals: {
        bpSystolic: parseFloat(bpSystolic) || 120,
        bpDiastolic: parseFloat(bpDiastolic) || 80,
        pulse: parseFloat(pulse) || 72,
        spO2: parseFloat(spO2) || 98,
        bloodSugar: parseFloat(bloodSugar) || 100,
        temp: parseFloat(temp) || 98.6,
        hemoglobin: parseFloat(hemoglobin) || 12,
        weight: parseFloat(weight) || 50,
        height: parseFloat(height) || 160,
      },
      symptoms: selectedSymptoms,
      triage: currentTriage,
      syncedToCloud: !isOffline,
      recordedAt: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onSaveRecord(record);
    // Reset Form
    setName('');
    setAge('');
    setContact('');
    setAbhaId('');
    setSelectedSymptoms([]);
    setTriageOutput(null);
    setActiveTab('registry');
  };

  const handleTriggerSync = () => {
    onSyncRecords();
    setSyncToast(true);
    setTimeout(() => setSyncToast(false), 4000);
  };

  const filteredRecords = records.filter(r => {
    if (triageFilter === 'ALL') return true;
    return r.triage.triageLevel === triageFilter;
  });

  const unsyncedCount = records.filter(r => !r.syncedToCloud).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Offline Status & Field Worker Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl shadow-sm border transition-colors ${
        isOffline 
          ? 'bg-amber-50 border-amber-300 text-amber-950' 
          : 'bg-emerald-50 border-emerald-300 text-emerald-950'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isOffline ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white'
            }`}>
              {isOffline ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base">
                  {isOffline ? t.offlineStatus : t.onlineStatus}
                </span>
                <span className="text-[11px] bg-white px-2 py-0.5 rounded-full font-bold border border-slate-300">
                  {unsyncedCount} {t.pendingSyncCount}
                </span>
              </div>
              <p className="text-xs mt-0.5 opacity-90">
                {t.offlineNotice}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="asha-toggle-offline-btn"
              onClick={() => setIsOffline(!isOffline)}
              className="bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs px-3 py-2 rounded-lg border border-slate-300 shadow-sm"
            >
              {isOffline ? (lang === 'mr' ? 'ऑनलाइन स्विच करा' : 'Go Online') : (lang === 'mr' ? 'ऑफलाइन टेस्ट करा' : 'Test Offline')}
            </button>

            <button
              id="asha-sync-records-btn"
              onClick={handleTriggerSync}
              className="bg-[#0A3871] hover:bg-[#104382] text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-md transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>{t.syncNowBtn}</span>
            </button>
          </div>
        </div>

        {syncToast && (
          <div className="mt-3 bg-emerald-600 text-white text-xs font-bold p-2.5 rounded-lg flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{t.syncSuccess}</span>
          </div>
        )}
      </div>

      {/* Mode Switcher: Screening Form vs Screened Resident Registry */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          <button
            id="tab-new-screening-btn"
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-colors ${
              activeTab === 'form' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{t.addNewPatient}</span>
          </button>
          <button
            id="tab-registry-btn"
            onClick={() => setActiveTab('registry')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-colors ${
              activeTab === 'registry' ? 'bg-[#0A3871] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{t.savedPatientsList} ({records.length})</span>
          </button>
        </div>

        {/* Quick Vitals Presets / Demo Helper */}
        {activeTab === 'form' && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-bold">{lang === 'mr' ? 'नमुना चाचणी भरा:' : 'Quick Demo Data:'}</span>
            <button
              onClick={() => {
                setName("Bapurao Atram");
                setAge("45");
                setVillage("Bhamragad");
                setPada("Koyar");
                setDistrict("Gadchiroli");
                setSpO2("88");
                setHemoglobin("6.5");
                setBpSystolic("165");
                setBpDiastolic("102");
                setSelectedSymptoms(["Severe Breathlessness", "High Fever with Chills"]);
              }}
              className="bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded font-bold border border-red-200"
            >
              RED (Critical)
            </button>
            <button
              onClick={() => {
                setName("Manjula Pawara");
                setAge("24");
                setVillage("Dhadgaon");
                setPada("Bijry");
                setDistrict("Nandurbar");
                setSpO2("93");
                setHemoglobin("9.2");
                setTemp("102.1");
                setIsPregnant(true);
                setSelectedSymptoms(["High Fever with Chills"]);
              }}
              className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-1 rounded font-bold border border-amber-200"
            >
              YELLOW (Urgent)
            </button>
            <button
              onClick={() => {
                setName("Jeevan Valvi");
                setAge("32");
                setVillage("Molgi");
                setPada("Bhil Pada");
                setDistrict("Nandurbar");
                setSpO2("98");
                setHemoglobin("12.5");
                setBpSystolic("118");
                setBpDiastolic("78");
                setSelectedSymptoms([]);
              }}
              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-2 py-1 rounded font-bold border border-emerald-200"
            >
              GREEN (Routine)
            </button>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      {activeTab === 'form' ? (
        /* Vitals Registration & AI Triage Form */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Patient Details & Vitals Form */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base sm:text-lg font-black text-[#0A3871] flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-amber-500" />
                <span>{lang === 'mr' ? 'रुग्ण माहिती व शारीरिक व्हायटल्स नोंद' : 'Resident Demographics & Vitals Form'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'mr' ? 'सर्व माहिती स्थानिक पातळीवर सुरक्षित साठवली जाते' : 'Direct Field Entry with Instant National Health Mission AI Validation'}
              </p>
            </div>

            {/* Demographics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.patientName} *
                </label>
                <input
                  id="asha-patient-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === 'mr' ? 'उदा. सुनिता रमेश उसेंडी' : 'e.g. Sunita Ramesh Usendi'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#0A3871] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.abhaId}
                </label>
                <input
                  id="asha-abha-id"
                  type="text"
                  value={abhaId}
                  onChange={(e) => setAbhaId(e.target.value)}
                  placeholder="91-XXXX-XXXX-XXXX"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#0A3871] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.patientAge} *</label>
                  <input
                    id="asha-patient-age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="26"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#0A3871] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.patientGender}</label>
                  <select
                    id="asha-patient-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#0A3871] focus:outline-none"
                  >
                    <option value="Female">{t.female}</option>
                    <option value="Male">{t.male}</option>
                    <option value="Other">{t.other}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.mobileNumber}</label>
                <input
                  id="asha-patient-contact"
                  type="tel"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="94031XXXXX"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#0A3871] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.filterDistrict}</label>
                  <select
                    id="asha-patient-district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value as District)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-[#0A3871] focus:outline-none"
                  >
                    <option value="Gadchiroli">Gadchiroli (गडचिरोली)</option>
                    <option value="Nandurbar">Nandurbar (नंदुरबार)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.filterTaluka}</label>
                  <input
                    id="asha-patient-taluka"
                    type="text"
                    value={taluka}
                    onChange={(e) => setTaluka(e.target.value)}
                    placeholder="Bhamragad / Dhadgaon"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#0A3871] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'mr' ? 'गाव' : 'Village'}</label>
                  <input
                    id="asha-patient-village"
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder={lang === 'mr' ? 'उदा. नेलगोंडा' : 'e.g. Nelgonda'}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#0A3871] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'mr' ? 'पाडा' : 'Pada (Hamlet)'}</label>
                  <input
                    id="asha-patient-pada"
                    type="text"
                    value={pada}
                    onChange={(e) => setPada(e.target.value)}
                    placeholder={lang === 'mr' ? 'उदा. कोयर पाडा' : 'e.g. Koyar Pada'}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#0A3871] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Special High Risk Conditions */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2.5">
              <span className="text-xs font-extrabold text-amber-900 block uppercase tracking-wider">
                {t.riskFactors}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium text-slate-800">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPregnant}
                    onChange={(e) => setIsPregnant(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>🤰 {t.pregnantWoman}</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChild}
                    onChange={(e) => setIsChild(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>👶 {t.childUnder5}</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasSickleCell}
                    onChange={(e) => setHasSickleCell(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>🩸 {t.sickleCellRisk}</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={snakebiteSuspect}
                    onChange={(e) => {
                      setSnakebiteSuspect(e.target.checked);
                      if (e.target.checked && !selectedSymptoms.includes("Suspected Snakebite / Fang Mark")) {
                        setSelectedSymptoms([...selectedSymptoms, "Suspected Snakebite / Fang Mark"]);
                      }
                    }}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span>🐍 {t.snakebiteSuspicion}</span>
                </label>
              </div>

              {isPregnant && (
                <div className="flex items-center gap-3 pt-2 text-xs border-t border-amber-200">
                  <span className="font-bold text-amber-900">{t.trimester}:</span>
                  {[1, 2, 3].map((tri) => (
                    <label key={tri} className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="trimester"
                        checked={pregnancyTrimester === tri}
                        onChange={() => setPregnancyTrimester(tri)}
                      />
                      <span>T{tri} ({tri === 1 ? '1-3m' : tri === 2 ? '4-6m' : '7-9m'})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Vitals Numeric Inputs Grid */}
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-red-500" />
                <span>{t.vitalsSection}</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Blood Pressure Systolic */}
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-600">BP Systolic</label>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      id="vitals-bp-systolic"
                      type="number"
                      value={bpSystolic}
                      onChange={(e) => setBpSystolic(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-900 text-sm"
                    />
                    <span className="text-[10px] text-slate-400">mmHg</span>
                  </div>
                </div>

                {/* Blood Pressure Diastolic */}
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-600">BP Diastolic</label>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      id="vitals-bp-diastolic"
                      type="number"
                      value={bpDiastolic}
                      onChange={(e) => setBpDiastolic(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-900 text-sm"
                    />
                    <span className="text-[10px] text-slate-400">mmHg</span>
                  </div>
                </div>

                {/* SpO2 Blood Oxygen */}
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-600">SpO2 Oxygen</label>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      id="vitals-spo2"
                      type="number"
                      value={spO2}
                      onChange={(e) => setSpO2(e.target.value)}
                      className={`w-full bg-white border rounded px-2 py-1 font-bold text-sm ${
                        parseFloat(spO2) < 90 ? 'border-red-500 text-red-600' : 'border-slate-300 text-slate-900'
                      }`}
                    />
                    <span className="text-[10px] text-slate-400">%</span>
                  </div>
                </div>

                {/* Hemoglobin */}
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-600">Hemoglobin (Hb)</label>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      id="vitals-hemoglobin"
                      type="number"
                      step="0.1"
                      value={hemoglobin}
                      onChange={(e) => setHemoglobin(e.target.value)}
                      className={`w-full bg-white border rounded px-2 py-1 font-bold text-sm ${
                        parseFloat(hemoglobin) < 7 ? 'border-red-500 text-red-600' : 'border-slate-300 text-slate-900'
                      }`}
                    />
                    <span className="text-[10px] text-slate-400">g/dL</span>
                  </div>
                </div>

                {/* Pulse Rate */}
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-600">Pulse Rate</label>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      id="vitals-pulse"
                      type="number"
                      value={pulse}
                      onChange={(e) => setPulse(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-900 text-sm"
                    />
                    <span className="text-[10px] text-slate-400">bpm</span>
                  </div>
                </div>

                {/* Temperature */}
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-600">Temperature</label>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      id="vitals-temp"
                      type="number"
                      step="0.1"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-900 text-sm"
                    />
                    <span className="text-[10px] text-slate-400">°F</span>
                  </div>
                </div>

                {/* Blood Sugar */}
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-600">Blood Sugar</label>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      id="vitals-blood-sugar"
                      type="number"
                      value={bloodSugar}
                      onChange={(e) => setBloodSugar(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-900 text-sm"
                    />
                    <span className="text-[10px] text-slate-400">mg/dL</span>
                  </div>
                </div>

                {/* Weight */}
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-600">Weight</label>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      id="vitals-weight"
                      type="number"
                      step="0.5"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-900 text-sm"
                    />
                    <span className="text-[10px] text-slate-400">kg</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Observed Symptoms Checklist */}
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                {t.symptomsChecklist}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {commonSymptomsList.map((symp) => {
                  const isChecked = selectedSymptoms.includes(symp.en);
                  return (
                    <div
                      key={symp.en}
                      onClick={() => handleToggleSymptom(symp.en)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-colors flex items-start gap-2 ${
                        isChecked 
                          ? 'bg-amber-100/70 border-amber-400 text-amber-950 font-bold' 
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-amber-600"
                      />
                      <div>
                        <div>{lang === 'mr' ? symp.mr : lang === 'hi' ? symp.hi : symp.en}</div>
                        {(lang === 'mr' || lang === 'hi') && (
                          <div className="text-[10px] text-slate-500 font-normal">{symp.en}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons: Run AI Triage & Save */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
              <button
                id="run-triage-button"
                type="button"
                disabled={isTriaging}
                onClick={handleRunAiTriage}
                className="flex-1 bg-gradient-to-r from-[#0A3871] to-[#104382] hover:from-[#104382] hover:to-[#0A3871] text-white font-extrabold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{isTriaging ? t.triageRunning : t.runAiTriageBtn}</span>
              </button>

              <button
                id="save-patient-record-btn"
                type="button"
                onClick={handleSaveResident}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm py-3 px-5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{t.savePatientRecord}</span>
              </button>
            </div>
          </div>

          {/* Right Column: AI Triage Result Card & ASHA Guidelines */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-500" />
                  <span>{t.triageResultsTitle}</span>
                </h3>
                {triageSource && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                    {triageSource === 'gemini_ai' ? '🤖 Gemini Clinical AI' : '📋 NHM Offline Protocol'}
                  </span>
                )}
              </div>

              {triageOutput ? (
                <div className="mt-4 space-y-4 animate-in fade-in">
                  {/* Triage Level Banner */}
                  <div className={`p-4 rounded-xl text-white font-black shadow-md flex items-center justify-between ${
                    triageOutput.triageLevel === 'RED'
                      ? 'bg-red-600 ring-4 ring-red-200'
                      : triageOutput.triageLevel === 'YELLOW'
                      ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-200'
                      : 'bg-emerald-600 ring-4 ring-emerald-200'
                  }`}>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider block opacity-80">
                        {lang === 'mr' ? 'वर्गीकरण स्तर' : 'Triage Status'}
                      </span>
                      <span className="text-lg sm:text-xl font-black">
                        {triageOutput.triageLevel === 'RED'
                          ? t.redTriageBadge
                          : triageOutput.triageLevel === 'YELLOW'
                          ? t.yellowTriageBadge
                          : t.greenTriageBadge}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider block opacity-80">
                        Severity
                      </span>
                      <span className="text-2xl font-black">{triageOutput.score}/100</span>
                    </div>
                  </div>

                  {/* Primary Concern & Clinical Rationale */}
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
                    <div>
                      <span className="font-extrabold text-slate-900 block text-sm">
                        {triageOutput.primaryConcern}
                      </span>
                      <p className="text-slate-600 mt-1 leading-relaxed">
                        {triageOutput.clinicalRationale}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <span className="font-bold text-[#0A3871] block">
                        🏥 {lang === 'mr' ? 'शिफारस केलेले केंद्र:' : 'Referral Destination:'}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {triageOutput.recommendedFacility}
                      </span>
                    </div>
                  </div>

                  {/* Immediate ASHA Action Plan */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs">
                    <span className="font-bold text-[#0A3871] flex items-center gap-1.5 mb-1 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-[#0A3871]" />
                      <span>{t.ashaActionPlan}</span>
                    </span>
                    <p className="text-slate-800 leading-relaxed font-medium">
                      {triageOutput.ashaAction}
                    </p>
                  </div>

                  {/* Marathi Instructions for Field Worker */}
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs">
                    <span className="font-bold text-amber-900 block mb-1">
                      🗣️ {t.marathiGuidelines}:
                    </span>
                    <p className="text-amber-950 font-semibold leading-relaxed">
                      {triageOutput.marathiInstructions}
                    </p>
                  </div>

                  {/* Medicines from ASHA Drug Kit */}
                  {triageOutput.ashaKitMedicines && triageOutput.ashaKitMedicines.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                        <Pill className="w-4 h-4 text-emerald-600" />
                        <span>{t.ashaKitDispense}</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {triageOutput.ashaKitMedicines.map((med, idx) => (
                          <span key={idx} className="bg-white border border-slate-300 text-slate-800 px-2 py-1 rounded-md text-[11px] font-medium">
                            ✓ {med}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Red Alert Emergency 108 Dispatch Button */}
                  {triageOutput.triageLevel === 'RED' && (
                    <button
                      id="asha-sos-trigger-btn"
                      onClick={onOpenSos}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-sm py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 animate-bounce"
                    >
                      <ShieldAlert className="w-5 h-5" />
                      <span>{lang === 'mr' ? '१०८ रुग्णवाहिका तात्काळ बोलवा' : 'DISPATCH 108 AMBULANCE NOW'}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <HeartPulse className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">
                    {lang === 'mr' ? 'तपासणी सुरू करण्यासाठी डावीकडे माहिती भरा' : 'Fill patient vitals and click "Run AI Clinical Triage"'}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    {lang === 'mr'
                      ? 'एआय प्रणाली स्पायरोमेट्री, हिमोग्लोबिन व रक्तदाब तपासून लाल, पिवळा किंवा हिरवा ट्रायज निश्चित करेल.'
                      : 'Evaluates vitals against NHM tribal health protocols for Sickle Cell, Malaria & Maternal risks.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Screened Resident Registry Tab */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Registry Filters */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
            <div>
              <h3 className="font-extrabold text-[#0A3871] text-base">
                {lang === 'mr' ? 'आदिवासी पाड्यांवरील तपासणी केलेल्या ग्रामस्थांची नोंदवही' : 'Tribal Resident Health Screening Registry'}
              </h3>
              <p className="text-xs text-slate-500">
                {records.length} {lang === 'mr' ? 'ग्रामस्थांची तपासणी पूर्ण झाली आहे' : 'residents recorded in local device storage'}
              </p>
            </div>

            {/* Filter by Triage Level */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-slate-600">{lang === 'mr' ? 'ट्रायज फिल्टर:' : 'Filter:'}</span>
              <button
                onClick={() => setTriageFilter('ALL')}
                className={`px-2.5 py-1 rounded font-bold ${triageFilter === 'ALL' ? 'bg-[#0A3871] text-white' : 'bg-white border text-slate-700'}`}
              >
                All
              </button>
              <button
                onClick={() => setTriageFilter('RED')}
                className={`px-2.5 py-1 rounded font-bold ${triageFilter === 'RED' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 border border-red-200'}`}
              >
                RED ({records.filter(r => r.triage.triageLevel === 'RED').length})
              </button>
              <button
                onClick={() => setTriageFilter('YELLOW')}
                className={`px-2.5 py-1 rounded font-bold ${triageFilter === 'YELLOW' ? 'bg-amber-500 text-slate-950' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}
              >
                YELLOW ({records.filter(r => r.triage.triageLevel === 'YELLOW').length})
              </button>
              <button
                onClick={() => setTriageFilter('GREEN')}
                className={`px-2.5 py-1 rounded font-bold ${triageFilter === 'GREEN' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}
              >
                GREEN ({records.filter(r => r.triage.triageLevel === 'GREEN').length})
              </button>
            </div>
          </div>

          {/* Registry Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Triage</th>
                  <th className="p-3">Resident Details</th>
                  <th className="p-3">Village / Pada</th>
                  <th className="p-3">Vitals (BP/SpO2/Hb)</th>
                  <th className="p-3">Primary Diagnosis / Concern</th>
                  <th className="p-3">Sync Status</th>
                  <th className="p-3 text-right">Recorded At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      {lang === 'mr' ? 'या वर्गवारीत कोणतीही नोंद आढळली नाही.' : 'No records found matching triage filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      {/* Triage Badge */}
                      <td className="p-3 font-bold">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider ${
                          rec.triage.triageLevel === 'RED'
                            ? 'bg-red-600 text-white animate-pulse'
                            : rec.triage.triageLevel === 'YELLOW'
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'bg-emerald-600 text-white'
                        }`}>
                          {rec.triage.triageLevel} ({rec.triage.score})
                        </span>
                      </td>

                      {/* Resident Info */}
                      <td className="p-3">
                        <span className="font-extrabold text-slate-900 block text-xs">{rec.name}</span>
                        <span className="text-slate-500 text-[11px]">
                          {rec.age}y / {rec.gender} {rec.isPregnant ? '• 🤰 ANC' : ''} {rec.hasSickleCell ? '• 🩸 SCD' : ''}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="p-3 text-slate-700">
                        <span className="font-semibold block">{rec.village}</span>
                        <span className="text-slate-500 text-[11px]">{rec.pada} ({rec.taluka})</span>
                      </td>

                      {/* Vitals Summary */}
                      <td className="p-3 font-mono text-[11px]">
                        <div>BP: <b>{rec.vitals.bpSystolic}/{rec.vitals.bpDiastolic}</b></div>
                        <div className="text-slate-600">
                          SpO2: <b className={rec.vitals.spO2 < 90 ? 'text-red-600' : ''}>{rec.vitals.spO2}%</b> • Hb: <b className={rec.vitals.hemoglobin < 7 ? 'text-red-600' : ''}>{rec.vitals.hemoglobin}g</b>
                        </div>
                      </td>

                      {/* Primary Concern */}
                      <td className="p-3 max-w-[200px]">
                        <span className="text-slate-800 font-semibold block truncate">
                          {rec.triage.primaryConcern}
                        </span>
                        <span className="text-slate-500 text-[10px] block truncate">
                          {rec.triage.recommendedFacility}
                        </span>
                      </td>

                      {/* Sync Status */}
                      <td className="p-3">
                        {rec.syncedToCloud ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Synced</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold">
                            <Save className="w-3 h-3" />
                            <span>On Device</span>
                          </span>
                        )}
                      </td>

                      {/* Time */}
                      <td className="p-3 text-right text-slate-500 text-[11px]">
                        {rec.recordedAt}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
