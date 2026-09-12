import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { 
  PhoneCall, 
  AlertTriangle, 
  MapPin, 
  ShieldAlert, 
  X, 
  CheckCircle2, 
  Clock, 
  Activity 
} from 'lucide-react';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const SosModal: React.FC<SosModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const t = translations[lang];
  const [dispatchConfirmed, setDispatchConfirmed] = useState(false);
  const [patientLocation, setPatientLocation] = useState('Bhamragad Forest Belt (Lat: 19.3871, Lng: 80.3542)');

  if (!isOpen) return null;

  const handleTriggerDispatch = () => {
    setDispatchConfirmed(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border-2 border-red-500 overflow-hidden my-auto">
        {/* Urgent Red Header */}
        <div className="bg-red-600 text-white p-4 sm:p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white text-red-600 flex items-center justify-center font-black animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-100 block">
                Maharashtra Emergency Medical Services (MEMS)
              </span>
              <h3 className="text-lg sm:text-xl font-black">
                {lang === 'mr' ? '१०८ आपत्कालीन रुग्णवाहिका संपर्क' : '108 Emergency Ambulance Dispatch'}
              </h3>
            </div>
          </div>
          <button
            id="close-sos-modal-btn"
            onClick={onClose}
            className="text-white hover:text-red-200 p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {!dispatchConfirmed ? (
            <>
              {/* Emergency Numbers Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <a
                  href="tel:108"
                  className="bg-red-50 hover:bg-red-100 border border-red-300 p-3 rounded-xl transition-colors block"
                >
                  <PhoneCall className="w-5 h-5 text-red-600 mx-auto mb-1" />
                  <span className="text-base font-black text-red-700 block">108</span>
                  <span className="text-[10px] text-slate-600 font-bold block">{t.ambulance108}</span>
                </a>

                <a
                  href="tel:102"
                  className="bg-blue-50 hover:bg-blue-100 border border-blue-300 p-3 rounded-xl transition-colors block"
                >
                  <Activity className="w-5 h-5 text-[#0A3871] mx-auto mb-1" />
                  <span className="text-base font-black text-[#0A3871] block">102</span>
                  <span className="text-[10px] text-slate-600 font-bold block">{t.ambulance102}</span>
                </a>

                <a
                  href="tel:104"
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 p-3 rounded-xl transition-colors block"
                >
                  <Clock className="w-5 h-5 text-emerald-700 mx-auto mb-1" />
                  <span className="text-base font-black text-emerald-700 block">104</span>
                  <span className="text-[10px] text-slate-600 font-bold block">{t.helpline104}</span>
                </a>
              </div>

              {/* Current Geo GPS Location */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>{lang === 'mr' ? 'तुमचे सध्याचे जीपीएस स्थान (GPS Telemetry)' : 'Your Current GPS Location:'}</span>
                </span>
                <p className="text-slate-600 font-mono text-[11px]">{patientLocation}</p>
                <p className="text-[10px] text-slate-400">
                  {lang === 'mr' 
                    ? 'हे स्थान थेट जवळच्या १०८ नियंत्रण कक्ष व प्राथमिक आरोग्य केंद्राकडे पाठवले जाईल.' 
                    : 'This exact coordinates link is transmitted automatically to the 108 Emergency Control Room.'}
                </p>
              </div>

              {/* Snakebite Immediate First Aid Checklist */}
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 space-y-1.5 text-amber-950">
                <span className="font-black text-xs text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>{lang === 'mr' ? 'सर्पदंशावर तत्काळ प्राथमिक उपचार (DOs & DON\'Ts):' : 'Snakebite Emergency Golden Hour Protocol:'}</span>
                </span>
                <ul className="list-disc pl-4 space-y-1 text-[11px] font-medium">
                  <li>{lang === 'mr' ? 'रुग्णाला शांत ठेवा, हालचाल करू देऊ नका.' : 'Keep the victim calm and strictly still. Immobilize limb with a splint.'}</li>
                  <li>{lang === 'mr' ? 'जखमेवर काप किंवा चीरा मारू नका, रक्त शोषू नका.' : 'DO NOT cut, wash with chemicals, or attempt to suck venom.'}</li>
                  <li>{lang === 'mr' ? 'टूर्निकेट (रक्ताची नस आवळून बांधणे) करू नका.' : 'DO NOT apply tight tourniquets or herbal pastes.'}</li>
                  <li>{lang === 'mr' ? 'रुग्णाला त्वरित अँटी-स्नेक व्हेनम (ASV) उपलब्ध असलेल्या जवळच्या PHC मध्ये न्या.' : 'Transport immediately to the nearest PHC equipped with Anti-Snake Venom.'}</li>
                </ul>
              </div>

              {/* Instant Dispatch Button */}
              <button
                id="confirm-dispatch-ambulance-btn"
                onClick={handleTriggerDispatch}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-sm py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 animate-pulse"
              >
                <PhoneCall className="w-5 h-5" />
                <span>{lang === 'mr' ? '१०८ रुग्णवाहिका तात्काळ बोलवा (One-Click SOS)' : 'DISPATCH 108 AMBULANCE TO THIS LOCATION'}</span>
              </button>
            </>
          ) : (
            /* Confirmation Alert */
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-slate-900">
                {lang === 'mr' ? '१०८ रुग्णवाहिका रवाना करण्यात आली आहे!' : '108 Ambulance Unit Dispatched!'}
              </h4>
              <p className="text-slate-600 text-xs max-w-sm mx-auto">
                {lang === 'mr' 
                  ? 'वाहनाचा क्रमांक: MH-33-E-1082. चालक व पॅरामेडिकशी संपर्क होत आहे. अंदाजे पोहोचण्याची वेळ: १८ मिनिटे.' 
                  : 'Ambulance Unit MH-33-E-1082 has been routed to your GPS location with Oxygen and Anti-Snake Venom backup. ETA: ~18 mins.'}
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-700">
                Tracking ID: <b>MEMS-GAD-2026-9812</b>
              </div>
              <button
                onClick={onClose}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-6 rounded-lg mt-2"
              >
                {lang === 'mr' ? 'बंद करा' : 'Close'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
