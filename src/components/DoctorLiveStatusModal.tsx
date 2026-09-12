import React from 'react';
import { PHCLocation, Language } from '../types';
import { translations } from '../data/translations';
import { 
  X, 
  Stethoscope, 
  Clock, 
  Phone, 
  Navigation, 
  Ticket, 
  Activity, 
  ShieldCheck, 
  Radio, 
  RefreshCw,
  Video,
  UserCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { GeoCoordinate } from '../utils/geoUtils';

interface DoctorLiveStatusModalProps {
  phc: PHCLocation | null;
  onClose: () => void;
  lang: Language;
  onBookToken: (phc: PHCLocation) => void;
  userLocation: GeoCoordinate | null;
  onSimulateStatusChange?: (phcId: string) => void;
}

export const DoctorLiveStatusModal: React.FC<DoctorLiveStatusModalProps> = ({
  phc,
  onClose,
  lang,
  onBookToken,
  userLocation,
  onSimulateStatusChange,
}) => {
  if (!phc) return null;

  const t = translations[lang];
  const doctor = phc.doctor;
  const currentStatus = doctor.status || (doctor.availableNow ? 'Available' : 'On Round');

  // Status styling & translation
  const getStatusDetails = () => {
    switch (currentStatus) {
      case 'Available':
        return {
          label: lang === 'mr' ? 'कर्तव्यावर हजर (Available Now)' : lang === 'hi' ? 'ड्यूटी पर उपस्थित (Available Now)' : 'Available on Duty',
          badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          dotClass: 'bg-emerald-500 animate-pulse',
          description: lang === 'mr' 
            ? `डॉ. ${doctor.name} सध्या ओपीडी कक्षामध्ये प्रत्यक्ष रुग्ण तपासणीसाठी उपलब्ध आहेत.`
            : lang === 'hi'
            ? `डॉ. ${doctor.name} वर्तमान में ओपीडी कक्ष में मरीज परामर्श हेतु उपस्थित हैं।`
            : `Dr. ${doctor.name} is currently seated in the OPD consulting chamber attending patients.`,
          icon: UserCheck
        };
      case 'On Round':
        return {
          label: lang === 'mr' ? 'फेरीवर / वॉर्ड तपासणी (On Round)' : lang === 'hi' ? 'दौरे पर / वार्ड जांच (On Round)' : 'On Ward / Field Round',
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
          dotClass: 'bg-amber-500 animate-pulse',
          description: lang === 'mr' 
            ? `डॉ. ${doctor.name} सध्या आंतररुग्ण विभाग (IPD) / तातडीच्या प्रसूती कक्षात फेरीवर आहेत. थोड्याच वेळात ओपीडीत परत येतील.`
            : lang === 'hi'
            ? `डॉ. ${doctor.name} वर्तमान में आईपीडी वार्ड या आपातकालीन प्रसूति राउंड पर हैं। शीघ्र ही ओपीडी में लौटेंगे।`
            : `Dr. ${doctor.name} is currently conducting emergency ward rounds in the IPD/Maternity wing. Returning to OPD shortly.`,
          icon: Activity
        };
      case 'Tele-OPD':
        return {
          label: lang === 'mr' ? 'टेलि-ओपीडी सुरू (Tele-Consultation)' : lang === 'hi' ? 'टेली-ओपीडी सक्रिय (Tele-Consultation)' : 'Active on Tele-OPD',
          badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
          dotClass: 'bg-blue-500 animate-pulse',
          description: lang === 'mr' 
            ? `डॉ. ${doctor.name} जिल्हा सामान्य रुग्णालयातील तज्ज्ञ डॉक्टरांसोबत टेलिमेडिसीन सल्लामसलत करत आहेत.`
            : lang === 'hi'
            ? `डॉ. ${doctor.name} जिला अस्पताल के विशेषज्ञ डॉक्टरों के साथ टेलीमेडिसिन परामर्श में जुड़े हैं।`
            : `Dr. ${doctor.name} is currently conducting a Telemedicine consultation with District Specialists.`,
          icon: Video
        };
    }
  };

  const statusInfo = getStatusDetails();
  const StatusIcon = statusInfo.icon;

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${phc.lat},${phc.lng}${
    userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : ''
  }`;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#0A3871] text-white p-4 sm:p-5 flex items-start justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1.5 bg-red-500/20 text-red-200 border border-red-400/40 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                <Radio className="w-3 h-3 animate-pulse text-red-400" />
                LIVE Telemetry 24x7
              </span>
              <span className="text-[10px] font-semibold text-slate-300">
                {phc.district} • {lang === 'mr' ? phc.marathiTaluka : phc.taluka}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black leading-tight text-white">
              {lang === 'mr' ? phc.marathiName : phc.name}
            </h3>
            <p className="text-xs text-blue-200 mt-0.5">{phc.type} • {phc.address}</p>
          </div>

          <button
            id="close-live-doctor-modal"
            onClick={onClose}
            className="text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors relative z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Live Status Highlight Card */}
          <div className={`p-4 rounded-xl border-2 ${statusInfo.badgeClass} flex items-start gap-3 shadow-sm`}>
            <div className="p-2.5 rounded-full bg-white shadow-sm border border-slate-200 flex-shrink-0">
              <StatusIcon className="w-6 h-6 text-[#0A3871]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${statusInfo.dotClass}`}></span>
                  <span className="font-extrabold text-sm sm:text-base text-slate-900">
                    {statusInfo.label}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-white/80 px-2 py-0.5 rounded-full border border-slate-200">
                  {lang === 'mr' ? 'थेट अपडेट:' : lang === 'hi' ? 'लाइव अपडेट:' : 'Last Synced:'} {doctor.lastUpdated || 'Just now'}
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-1.5 leading-relaxed font-medium">
                {statusInfo.description}
              </p>
            </div>
          </div>

          {/* Doctor Details Grid */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-600 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-[#0A3871]" />
                {lang === 'mr' ? 'वैद्यकीय अधिकारी:' : lang === 'hi' ? 'चिकित्सा अधिकारी:' : 'Medical Officer:'}
              </span>
              <span className="font-extrabold text-slate-900 text-sm">{doctor.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-500 block">{lang === 'mr' ? 'पदवी / पात्रता:' : 'Qualification:'}</span>
                <span className="font-bold text-slate-800">{doctor.qualification}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{lang === 'mr' ? 'विशेषज्ञता:' : 'Specialization:'}</span>
                <span className="font-bold text-slate-800">{doctor.specialization}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{lang === 'mr' ? 'ओपीडी वेळ:' : 'OPD Timing:'}</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {doctor.timing}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">{lang === 'mr' ? 'थेट संपर्क दूरध्वनी:' : 'Direct Phone:'}</span>
                <span className="font-bold text-slate-800">{doctor.phone}</span>
              </div>
            </div>
          </div>

          {/* Live Telemetry Indicators */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-blue-50/70 p-2 rounded-xl border border-blue-100">
              <span className="text-[10px] text-slate-500 block">{lang === 'mr' ? 'रांगेत रुग्ण' : 'Queue Waiting'}</span>
              <span className="text-base font-black text-[#0A3871]">{phc.activeTokensWaiting}</span>
              <span className="text-[9px] text-slate-500 block">~{phc.activeTokensWaiting * 8 + 5} mins wait</span>
            </div>
            <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-slate-500 block">{lang === 'mr' ? 'उपलब्ध खाटा' : 'Beds Available'}</span>
              <span className="text-base font-black text-emerald-800">{phc.beds}</span>
              <span className="text-[9px] text-emerald-600 block">24x7 IPD Ready</span>
            </div>
            <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-100">
              <span className="text-[10px] text-slate-500 block">{lang === 'mr' ? 'सर्पदंश लस साठा' : 'ASV Stock'}</span>
              <span className="text-base font-black text-amber-800">{phc.antivenomStock}</span>
              <span className="text-[9px] text-amber-700 block">Vials on Cold Chain</span>
            </div>
          </div>

          {/* Simulation Demo Banner */}
          <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>
                {lang === 'mr' 
                  ? 'डेमो: दर ३० सेकंदांनी थेट स्थिती बदलते' 
                  : lang === 'hi'
                  ? 'डेमो: हर ३० सेकंड में लाइव स्थिति बदलती है'
                  : 'Realtime Simulation: Auto-syncs status every 30s'}
              </span>
            </div>
            {onSimulateStatusChange && (
              <button
                type="button"
                onClick={() => onSimulateStatusChange(phc.id)}
                className="bg-white hover:bg-slate-200 text-slate-800 text-[10px] font-bold px-2 py-1 rounded border border-slate-300 shadow-sm transition-colors"
              >
                {lang === 'mr' ? 'आता बदला 🔄' : lang === 'hi' ? 'अभी बदलें 🔄' : 'Toggle Now 🔄'}
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 no-underline"
            >
              <Navigation className="w-4 h-4" />
              <span>{t.directions}</span>
            </a>

            <a
              href={`tel:${doctor.phone}`}
              className="bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 no-underline"
            >
              <Phone className="w-4 h-4" />
              <span>{t.callPhc}</span>
            </a>

            <button
              onClick={() => {
                onClose();
                onBookToken(phc);
              }}
              className="bg-[#0A3871] hover:bg-[#104382] text-white font-extrabold text-xs py-2.5 px-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <Ticket className="w-4 h-4 text-amber-400" />
              <span>{t.bookTokenBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
