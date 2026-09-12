import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  PHCLocation, 
  Language, 
  District, 
  OPDToken 
} from '../types';
import { translations } from '../data/translations';
import { PhcMap } from './PhcMap';
import { DoctorLiveStatusModal } from './DoctorLiveStatusModal';
import { BottomNearMeBar } from './BottomNearMeBar';
import { calculateDistanceKm, GeoCoordinate, DEFAULT_DEMO_LOCATION } from '../utils/geoUtils';
import { 
  Search, 
  MapPin, 
  Phone, 
  Clock, 
  ShieldCheck, 
  Ticket, 
  AlertTriangle, 
  HeartPulse, 
  CheckCircle2, 
  Share2, 
  Printer, 
  X, 
  Sparkles, 
  Send,
  Navigation,
  Compass,
  Radio,
  Activity
} from 'lucide-react';

interface PatientPortalProps {
  phcs: PHCLocation[];
  lang: Language;
  onBookToken: (phc: PHCLocation) => void;
  tokens: OPDToken[];
  onAddNewToken: (token: OPDToken) => void;
  onOpenSos: () => void;
  onSimulateDoctorStatus?: (targetPhcId?: string) => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  phcs,
  lang,
  tokens,
  onAddNewToken,
  onOpenSos,
  onSimulateDoctorStatus,
}) => {
  const t = translations[lang];

  // Filters State
  const [selectedDistrict, setSelectedDistrict] = useState<District | 'All'>('All');
  const [selectedTaluka, setSelectedTaluka] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyAvailableDoc, setOnlyAvailableDoc] = useState<boolean>(false);
  const [onlyAntivenom, setOnlyAntivenom] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
  const [selectedPhc, setSelectedPhc] = useState<PHCLocation | null>(null);

  // Live Geolocation & Distance State
  const [userLocation, setUserLocation] = useState<GeoCoordinate | null>(null);
  const [isWatchingLocation, setIsWatchingLocation] = useState<boolean>(false);
  const [sortByNearest, setSortByNearest] = useState<boolean>(false);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | 'all'>('all');
  const [doctorStatusPhc, setDoctorStatusPhc] = useState<PHCLocation | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Toggle or start live geolocation
  const handleToggleLocation = () => {
    if (isWatchingLocation) {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsWatchingLocation(false);
      setUserLocation(null);
      setSortByNearest(false);
    } else {
      setIsWatchingLocation(true);
      setSortByNearest(true);

      if ('geolocation' in navigator) {
        const id = navigator.geolocation.watchPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          },
          (error) => {
            console.warn('Geolocation denied or unavailable, using District Demo Location:', error.message);
            setUserLocation(DEFAULT_DEMO_LOCATION);
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
        );
        watchIdRef.current = id;
      } else {
        setUserLocation(DEFAULT_DEMO_LOCATION);
      }
    }
  };

  // Clean up geolocation on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // When userLocation arrives, automatically enable nearest sort
  useEffect(() => {
    if (userLocation) {
      setSortByNearest(true);
    }
  }, [userLocation]);

  // Booking Modal State
  const [bookingPhc, setBookingPhc] = useState<PHCLocation | null>(null);
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [mobileNumber, setMobileNumber] = useState('');
  const [villagePada, setVillagePada] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [timeSlot, setTimeSlot] = useState('09:00 AM - 10:30 AM');
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<OPDToken | null>(null);

  // Virtual AI symptom helper
  const [symptomQuery, setSymptomQuery] = useState('');
  const [symptomAnswer, setSymptomAnswer] = useState<string | null>(null);
  const [isAskingAi, setIsAskingAi] = useState(false);

  // Taluka list options based on district
  const availableTalukas = useMemo(() => {
    const list = new Set<string>();
    phcs.forEach(p => {
      if (selectedDistrict === 'All' || p.district === selectedDistrict) {
        list.add(lang === 'mr' ? p.marathiTaluka : p.taluka);
      }
    });
    return Array.from(list).sort();
  }, [phcs, selectedDistrict, lang]);

  // Filtered & Distance-Calculated PHCs (Sorted Nearest First)
  const filteredPhcs = useMemo(() => {
    let result = phcs.map((phc) => {
      const distanceKm = userLocation
        ? calculateDistanceKm(userLocation.lat, userLocation.lng, phc.lat, phc.lng)
        : undefined;
      return { ...phc, distanceKm };
    });

    result = result.filter((phc) => {
      if (selectedDistrict !== 'All' && phc.district !== selectedDistrict) return false;
      if (selectedTaluka !== 'All') {
        const talukaToMatch = lang === 'mr' ? phc.marathiTaluka : phc.taluka;
        if (talukaToMatch !== selectedTaluka) return false;
      }
      if (onlyAvailableDoc && !phc.doctor.availableNow) return false;
      if (onlyAntivenom && phc.antivenomStock < 20) return false;
      
      // Radius filter if distance is calculated
      if (maxDistanceKm !== 'all' && phc.distanceKm !== undefined) {
        if (phc.distanceKm > maxDistanceKm) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = phc.name.toLowerCase().includes(q) || phc.marathiName.toLowerCase().includes(q);
        const matchTaluka = phc.taluka.toLowerCase().includes(q) || phc.marathiTaluka.toLowerCase().includes(q);
        const matchAddress = phc.address.toLowerCase().includes(q) || phc.marathiAddress.toLowerCase().includes(q);
        const matchDoc = phc.doctor.name.toLowerCase().includes(q);
        if (!matchName && !matchTaluka && !matchAddress && !matchDoc) return false;
      }
      return true;
    });

    // Sort by "Nearest PHC first" if sortByNearest is enabled
    if (sortByNearest && userLocation) {
      result.sort((a, b) => (a.distanceKm ?? 999999) - (b.distanceKm ?? 999999));
    }

    return result;
  }, [phcs, selectedDistrict, selectedTaluka, onlyAvailableDoc, onlyAntivenom, searchQuery, userLocation, maxDistanceKm, sortByNearest, lang]);

  const handleOpenBooking = (phc: PHCLocation) => {
    setBookingPhc(phc);
    setNewlyCreatedToken(null);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingPhc || !patientName.trim()) return;

    // District Code
    const distCode = bookingPhc.district === 'Gadchiroli' ? 'GAD' : 'NAN';
    const talCode = bookingPhc.taluka.slice(0, 3).toUpperCase();
    const randomNum = Math.floor(10 + Math.random() * 90);
    const tokenNumber = `${distCode}-${talCode}-${randomNum}`;

    const token: OPDToken = {
      id: `tok-${Date.now()}`,
      tokenNumber,
      patientName: patientName.trim(),
      age: parseInt(patientAge) || 28,
      gender: patientGender,
      mobile: mobileNumber || '9422000000',
      village: villagePada || 'Central Pada',
      taluka: bookingPhc.taluka,
      district: bookingPhc.district,
      phcId: bookingPhc.id,
      phcName: lang === 'mr' ? bookingPhc.marathiName : bookingPhc.name,
      doctorName: bookingPhc.doctor.name,
      appointmentDate: new Date().toISOString().split('T')[0],
      timeSlot,
      status: 'Waiting',
      symptomSummary: symptoms || 'General Routine OPD Consultation',
      bookedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estimatedWaitMinutes: bookingPhc.activeTokensWaiting * 8 + 5,
    };

    onAddNewToken(token);
    setNewlyCreatedToken(token);
  };

  const handleAskSymptomAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomQuery.trim()) return;

    setIsAskingAi(true);
    setSymptomAnswer(null);

    try {
      const res = await fetch('/api/patient-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: symptomQuery,
          language: lang,
        }),
      });
      const data = await res.json();
      setSymptomAnswer(data.response || (lang === 'mr' ? 'जवळच्या आरोग्य केंद्राशी संपर्क साधा.' : 'Please visit nearest PHC.'));
    } catch {
      setSymptomAnswer(lang === 'mr'
        ? 'कृपया तात्काळ जवळच्या प्राथमिक आरोग्य केंद्रातील (PHC) वैद्यकीय अधिकाऱ्यांशी संपर्क साधा. आपत्कालीन स्थितीत १०८ वर फोन करा.'
        : 'Please consult your nearest Primary Health Centre doctor immediately. Dial 108 in case of emergency.');
    } finally {
      setIsAskingAi(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Search & Filter Header Panel */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0A3871] flex items-center gap-2">
              <MapPin className="w-6 h-6 text-amber-500" />
              <span>{t.findPhc}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {lang === 'mr' 
                ? 'गडचिरोली व नंदुरबार मधील ५० प्राथमिक आरोग्य केंद्रे व ग्रामीण रुग्णालयांची थेट माहिती' 
                : lang === 'hi'
                ? 'गडचिरोली एवं नंदुरबार के ५० प्राथमिक स्वास्थ्य केंद्रों व ग्रामीण अस्पतालों की लाइव जानकारी'
                : 'Live Doctor Duty, Bed Capacity, Anti-Snake Venom & OPD Tokens across 50 PHCs'}
            </p>
          </div>

          {/* View Toggles & SOS button */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                id="view-split-btn"
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  viewMode === 'split' ? 'bg-[#0A3871] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'mr' ? 'नकाशा + यादी' : lang === 'hi' ? 'मानचित्र + सूची' : 'Map & List'}
              </button>
              <button
                id="view-map-btn"
                onClick={() => setViewMode('map')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  viewMode === 'map' ? 'bg-[#0A3871] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.mapView}
              </button>
              <button
                id="view-list-btn"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-[#0A3871] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.listView}
              </button>
            </div>

            <button
              id="emergency-sos-trigger-btn"
              onClick={onOpenSos}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold px-3 py-2 rounded-lg text-xs shadow-md transition-all animate-pulse"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{lang === 'mr' ? 'तातडीची मदत (१०८)' : 'Emergency SOS (108)'}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {/* District Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.filterDistrict}
            </label>
            <select
              id="district-filter-select"
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value as District | 'All');
                setSelectedTaluka('All');
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#0A3871] focus:outline-none"
            >
              <option value="All">{t.allDistricts}</option>
              <option value="Gadchiroli">{t.gadchiroli} (25 PHCs)</option>
              <option value="Nandurbar">{t.nandurbar} (25 PHCs)</option>
            </select>
          </div>

          {/* Taluka Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.filterTaluka}
            </label>
            <select
              id="taluka-filter-select"
              value={selectedTaluka}
              onChange={(e) => setSelectedTaluka(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#0A3871] focus:outline-none"
            >
              <option value="All">{t.allTalukas}</option>
              {availableTalukas.map((tal) => (
                <option key={tal} value={tal}>{tal}</option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'mr' ? 'नाव किंवा डॉक्टर शोधा' : lang === 'hi' ? 'नाम या डॉक्टर खोजें' : 'Search by Name or Doctor'}
            </label>
            <div className="relative">
              <input
                id="phc-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-[#0A3871] focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Checkbox Chips */}
        <div className="flex items-center gap-3 mt-3 flex-wrap text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer select-none bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-full font-medium transition-colors">
            <input
              type="checkbox"
              checked={onlyAvailableDoc}
              onChange={(e) => setOnlyAvailableDoc(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>🩺 {lang === 'mr' ? 'केवळ डॉक्टर हजर असलेले केंद्र' : lang === 'hi' ? 'केवल डॉक्टर उपस्थित केंद्र' : 'Doctor Available Now'}</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1 rounded-full font-medium transition-colors">
            <input
              type="checkbox"
              checked={onlyAntivenom}
              onChange={(e) => setOnlyAntivenom(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>💉 {lang === 'mr' ? 'सर्पदंश लस (ASV > 20 vials)' : lang === 'hi' ? 'सर्पदंश रोधी विष (ASV > 20 वायल)' : 'High Anti-Snake Venom Stock'}</span>
          </label>

          <span className="text-slate-500 text-xs ml-auto">
            {filteredPhcs.length} {t.totalPhcsFound}
          </span>
        </div>
      </div>

      {/* Main Content Area: Map and PHC Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leaflet Map Column */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div className={`${viewMode === 'map' ? 'lg:col-span-12' : 'lg:col-span-7'} space-y-3`}>
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-[#0A3871] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  {lang === 'mr' ? 'थेट ५० आरोग्य केंद्र नकाशा' : lang === 'hi' ? 'लाइव ५० स्वास्थ्य केंद्र मानचित्र' : 'Live Interactive PHC Geo-Map'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {lang === 'mr' ? 'माहिती व टोकनसाठी चिन्हांवर क्लिक करा' : lang === 'hi' ? 'विवरण व टोकन हेतु मार्कर पर क्लिक करें' : 'Click any marker for details & token booking'}
                </span>
              </div>
              <PhcMap
                phcs={filteredPhcs}
                selectedPhc={selectedPhc}
                onSelectPhc={(phc) => setSelectedPhc(phc)}
                onBookToken={(phc) => handleOpenBooking(phc)}
                lang={lang}
                userLocation={userLocation}
                setUserLocation={setUserLocation}
                isWatchingLocation={isWatchingLocation}
                setIsWatchingLocation={setIsWatchingLocation}
                onCheckDoctorStatus={(phc) => setDoctorStatusPhc(phc)}
              />

              {/* Requirement 5: Bottom Search Bar "Search PHC near me" */}
              <BottomNearMeBar
                phcs={filteredPhcs}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                userLocation={userLocation}
                onTriggerLocation={handleToggleLocation}
                isWatchingLocation={isWatchingLocation}
                onSelectPhc={(phc) => {
                  setSelectedPhc(phc);
                  const el = document.getElementById(`phc-card-${phc.id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }}
                lang={lang}
                sortByNearest={sortByNearest}
                onToggleSortNearest={() => setSortByNearest(prev => !prev)}
                maxDistanceKm={maxDistanceKm}
                onMaxDistanceChange={setMaxDistanceKm}
              />
            </div>
          </div>
        )}

        {/* PHC List / Cards Column */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <div className={`${viewMode === 'list' ? 'lg:col-span-12' : 'lg:col-span-5'} space-y-3`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
              <span>{lang === 'mr' ? 'आरोग्य केंद्रांची यादी' : lang === 'hi' ? 'स्वास्थ्य केंद्रों की सूची' : 'Centres Directory'} ({filteredPhcs.length})</span>
              <span className="text-[#0A3871] flex items-center gap-1 font-extrabold">
                {sortByNearest && userLocation ? (
                  <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <Compass className="w-3 h-3" />
                    {lang === 'mr' ? 'जवळचे केंद्र प्रथम' : 'Nearest First'}
                  </span>
                ) : (
                  <span className="text-slate-500">
                    {lang === 'mr' ? 'जिल्हा व तालुक्यानुसार' : 'Standard Order'}
                  </span>
                )}
              </span>
            </div>

            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {filteredPhcs.length === 0 ? (
                <div className="bg-white p-8 rounded-xl text-center text-slate-500 border border-slate-200">
                  <MapPin className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold">{lang === 'mr' ? 'कोणतेही आरोग्य केंद्र सापडले नाही' : lang === 'hi' ? 'कोई स्वास्थ्य केंद्र नहीं मिला' : 'No PHCs found matching filters'}</p>
                  <button
                    onClick={() => {
                      setSelectedDistrict('All');
                      setSelectedTaluka('All');
                      setSearchQuery('');
                      setOnlyAvailableDoc(false);
                      setOnlyAntivenom(false);
                      setMaxDistanceKm('all');
                    }}
                    className="mt-3 text-xs font-bold text-[#0A3871] hover:underline"
                  >
                    {lang === 'mr' ? 'सर्व फिल्टर पूर्ववत करा' : lang === 'hi' ? 'सभी फिल्टर रीसेट करें' : 'Reset All Filters'}
                  </button>
                </div>
              ) : (
                filteredPhcs.map((phc) => {
                  const isSelected = selectedPhc?.id === phc.id;
                  const docStatus = phc.doctor.status || (phc.doctor.availableNow ? 'Available' : 'On Round');

                  return (
                    <div
                      key={phc.id}
                      id={`phc-card-${phc.id}`}
                      onClick={() => setSelectedPhc(phc)}
                      className={`bg-white rounded-xl p-4 transition-all duration-200 cursor-pointer border ${
                        isSelected 
                          ? 'border-[#0A3871] ring-2 ring-blue-200 shadow-md bg-blue-50/30' 
                          : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              phc.district === 'Gadchiroli' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {phc.district}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500">
                              {lang === 'mr' ? phc.marathiTaluka : phc.taluka}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                              {phc.type}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 mt-1">
                            {lang === 'mr' ? phc.marathiName : phc.name}
                          </h3>

                          {/* Calculated Live Distance Badge */}
                          {phc.distanceKm !== undefined && (
                            <div className="flex items-center gap-1 text-[11px] font-black text-[#0A3871] bg-blue-50/90 border border-blue-200 px-2.5 py-0.5 rounded-full mt-1 w-fit shadow-2xs">
                              <MapPin className="w-3 h-3 text-red-500" />
                              <span>{phc.distanceKm} km {lang === 'mr' ? 'अंतरावर' : 'away'}</span>
                            </div>
                          )}
                        </div>

                        {/* Realtime Doctor Status Pill */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDoctorStatusPhc(phc);
                          }}
                          className={`flex-shrink-0 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 cursor-pointer shadow-2xs transition-transform hover:scale-105 ${
                            docStatus === 'Available'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : docStatus === 'Tele-OPD'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                          title="Click to view live doctor telemetry"
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            docStatus === 'Available' ? 'bg-emerald-600' : docStatus === 'Tele-OPD' ? 'bg-blue-600' : 'bg-amber-600'
                          } animate-pulse`}></span>
                          <span>
                            {docStatus === 'Available'
                              ? (lang === 'mr' ? 'हजर (Available)' : 'Available')
                              : docStatus === 'Tele-OPD'
                              ? (lang === 'mr' ? 'टेली-ओपीडी (Tele-OPD)' : 'Tele-OPD')
                              : (lang === 'mr' ? 'राऊंडवर (On Round)' : 'On Round')}
                          </span>
                        </div>
                      </div>

                      {/* Doctor Info */}
                      <div className="mt-3 bg-slate-50 rounded-lg p-2.5 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <span>🩺</span> {phc.doctor.name}
                          </span>
                          <span className="text-[11px] text-slate-500">{phc.doctor.qualification}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 flex items-center justify-between">
                          <span>{phc.doctor.specialization}</span>
                          <span className="text-slate-500">🕒 {phc.doctor.timing}</span>
                        </div>
                      </div>

                      {/* Facilities & Stock Chips */}
                      <div className="grid grid-cols-3 gap-2 mt-2.5 text-center text-[11px]">
                        <div className="bg-blue-50/70 p-1.5 rounded border border-blue-100">
                          <span className="block text-slate-500 text-[10px]">{lang === 'mr' ? 'खाटा' : 'Beds'}</span>
                          <span className="font-bold text-[#0A3871]">{phc.beds}</span>
                        </div>
                        <div className="bg-amber-50/70 p-1.5 rounded border border-amber-100">
                          <span className="block text-slate-500 text-[10px]">{lang === 'mr' ? 'सर्पदंश लस' : 'ASV Vials'}</span>
                          <span className="font-bold text-amber-800">{phc.antivenomStock}</span>
                        </div>
                        <div className="bg-emerald-50/70 p-1.5 rounded border border-emerald-100">
                          <span className="block text-slate-500 text-[10px]">{lang === 'mr' ? 'रांगेत रुग्ण' : 'Waiting'}</span>
                          <span className="font-bold text-emerald-800">{phc.activeTokensWaiting}</span>
                        </div>
                      </div>

                      {/* Actions: Directions, Check Doctor Status LIVE, Book Token, Call */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100">
                        {/* Requirement 3: Check Doctor Status LIVE */}
                        <button
                          id={`live-status-btn-${phc.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDoctorStatusPhc(phc);
                          }}
                          className="bg-blue-50 hover:bg-blue-100 text-[#0A3871] border border-blue-200 font-extrabold text-[11px] py-2 px-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                          <span>{lang === 'mr' ? 'डॉक्टर थेट स्थिती' : 'Check Doctor LIVE'}</span>
                        </button>

                        {/* Requirement 3: Get Directions */}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${phc.lat},${phc.lng}${userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-[11px] py-2 px-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 no-underline shadow-2xs"
                        >
                          <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{t.directions}</span>
                        </a>

                        {/* Book OPD Token */}
                        <button
                          id={`book-btn-${phc.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBooking(phc);
                          }}
                          className="bg-[#0A3871] hover:bg-[#104382] text-white font-extrabold text-[11px] py-2 px-2 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Ticket className="w-3 h-3 text-amber-400" />
                          <span>{t.bookTokenBtn}</span>
                        </button>

                        {/* Call */}
                        <a
                          href={`tel:${phc.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-slate-700 hover:bg-slate-800 text-white font-bold text-[11px] py-2 px-2 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 no-underline"
                          title={t.callPhc}
                        >
                          <Phone className="w-3 h-3 text-white" />
                          <span>{lang === 'mr' ? 'कॉल करा' : 'Call'}</span>
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Virtual AI Rural Health Assistant for Patient */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-[#0A3871] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-blue-800">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{lang === 'mr' ? 'आरोग्य मित्र - लक्षण मार्गदर्शन (AI Assist)' : 'Aarogya Mitra - Rural Health Advisor (AI Assist)'}</span>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300/30">
                  Gemini Powered
                </span>
              </h3>
              <p className="text-xs text-blue-200">
                {lang === 'mr'
                  ? 'तुमचा त्रास किंवा लक्षणे सांगा (उदा. २ दिवसांपासून थंडी वाजून ताप येतोय, काय करावे?)'
                  : 'Describe your symptoms in Marathi or English for verified first-aid guidance and nearest care recommendations'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleAskSymptomAi} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            id="symptom-query-input"
            type="text"
            value={symptomQuery}
            onChange={(e) => setSymptomQuery(e.target.value)}
            placeholder={
              lang === 'mr' 
                ? 'उदा. मला चक्कर येत असून अशक्तपणा जाणवत आहे...' 
                : 'e.g. My child has high fever with loose motions since yesterday...'
            }
            className="flex-1 bg-white/10 text-white placeholder-blue-300/70 border border-blue-400/30 rounded-lg px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            id="ask-symptom-ai-btn"
            type="submit"
            disabled={isAskingAi || !symptomQuery.trim()}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-lg shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isAskingAi ? (
              <span>{lang === 'mr' ? 'तपासत आहे...' : 'Analyzing...'}</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{lang === 'mr' ? 'सल्ला मिळवा' : 'Ask Guide'}</span>
              </>
            )}
          </button>
        </form>

        {symptomAnswer && (
          <div className="mt-4 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-blue-300/30 text-xs sm:text-sm text-blue-50 leading-relaxed">
            <span className="font-bold text-amber-300 block mb-1">
              🩺 {lang === 'mr' ? 'आरोग्यधाम सल्ला:' : lang === 'hi' ? 'आरोग्यधाम सलाह:' : 'AarogyaDham Advice:'}
            </span>
            <p>{symptomAnswer}</p>
          </div>
        )}
      </div>

      {/* Active Booked Tokens Carousel / List */}
      {tokens.length > 0 && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-extrabold text-[#0A3871] mb-3 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-amber-500" />
            <span>{lang === 'mr' ? 'तुमचे सक्रिय ओपीडी टोकन्स' : 'Your Active OPD Consultation Tokens'} ({tokens.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tokens.map((tok) => (
              <div key={tok.id} className="bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs relative">
                <div className="flex items-start justify-between">
                  <span className="bg-[#0A3871] text-white font-black text-sm px-2 py-0.5 rounded">
                    {tok.tokenNumber}
                  </span>
                  <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">
                    {tok.status}
                  </span>
                </div>
                <div className="mt-2 font-bold text-slate-900 text-sm">{tok.patientName}</div>
                <div className="text-slate-600 text-[11px]">{tok.phcName}</div>
                <div className="text-slate-500 text-[11px] mt-1">
                  📅 {tok.appointmentDate} • {tok.timeSlot}
                </div>
                <div className="mt-2 text-[10px] text-emerald-700 font-semibold bg-emerald-50 p-1 rounded">
                  ⏳ {lang === 'mr' ? 'अंदाजे वेळ:' : 'Est Wait:'} {tok.estimatedWaitMinutes} mins
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OPD Token Booking Modal */}
      {bookingPhc && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0A3871] to-[#104382] text-white p-4 sm:p-5 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                  {lang === 'mr' ? 'महाराष्ट्र शासन • सार्वजनिक आरोग्य विभाग' : 'Government of Maharashtra • OPD Token'}
                </span>
                <h3 className="text-base sm:text-lg font-black mt-0.5">
                  {t.bookOpdTitle}
                </h3>
                <p className="text-xs text-slate-200 mt-0.5">
                  {lang === 'mr' ? bookingPhc.marathiName : bookingPhc.name} ({bookingPhc.district})
                </p>
              </div>
              <button
                id="close-booking-modal-btn"
                onClick={() => setBookingPhc(null)}
                className="text-slate-300 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 max-h-[75vh] overflow-y-auto">
              {!newlyCreatedToken ? (
                <form onSubmit={handleConfirmBooking} className="space-y-4">
                  {/* Doctor preview strip */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">🩺 {bookingPhc.doctor.name}</span>
                      <span className="text-slate-600 text-[11px]">{bookingPhc.doctor.specialization}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-700 font-extrabold text-[11px] block">
                        {bookingPhc.doctor.availableNow ? (lang === 'mr' ? 'हजर आहेत' : 'Available Now') : (lang === 'mr' ? 'ऑन-कॉल' : 'On Call')}
                      </span>
                      <span className="text-slate-500 text-[10px]">{bookingPhc.activeTokensWaiting} {t.patientsAhead}</span>
                    </div>
                  </div>

                  {/* Patient Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.patientName} *
                    </label>
                    <input
                      id="patient-name-input"
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder={lang === 'mr' ? 'उदा. अनिता विजय मडावी' : 'e.g. Anita Vijay Madavi'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#0A3871] focus:outline-none"
                    />
                  </div>

                  {/* Age & Gender */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t.patientAge} *
                      </label>
                      <input
                        id="patient-age-input"
                        type="number"
                        min="1"
                        max="110"
                        required
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        placeholder="28"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#0A3871] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t.patientGender}
                      </label>
                      <select
                        id="patient-gender-select"
                        value={patientGender}
                        onChange={(e) => setPatientGender(e.target.value as any)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#0A3871] focus:outline-none bg-white"
                      >
                        <option value="Female">{t.female}</option>
                        <option value="Male">{t.male}</option>
                        <option value="Other">{t.other}</option>
                      </select>
                    </div>
                  </div>

                  {/* Mobile & Village */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t.mobileNumber}
                      </label>
                      <input
                        id="patient-mobile-input"
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="94220XXXXX"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#0A3871] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t.villagePada}
                      </label>
                      <input
                        id="patient-village-input"
                        type="text"
                        value={villagePada}
                        onChange={(e) => setVillagePada(e.target.value)}
                        placeholder={lang === 'mr' ? 'उदा. कोयूर पाडा' : 'e.g. Koyar Pada'}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#0A3871] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Preferred Time Slot */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.preferredSlot}
                    </label>
                    <select
                      id="time-slot-select"
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#0A3871] focus:outline-none bg-white font-medium"
                    >
                      <option value="09:00 AM - 10:30 AM">09:00 AM - 10:30 AM (Morning Slot 1)</option>
                      <option value="10:30 AM - 12:00 PM">10:30 AM - 12:00 PM (Morning Slot 2)</option>
                      <option value="12:00 PM - 01:30 PM">12:00 PM - 01:30 PM (Midday Slot)</option>
                      <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM (Evening OPD)</option>
                    </select>
                  </div>

                  {/* Symptoms */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.primarySymptoms}
                    </label>
                    <textarea
                      id="patient-symptoms-textarea"
                      rows={2}
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder={t.symptomPlaceholder}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#0A3871] focus:outline-none"
                    ></textarea>
                  </div>

                  {/* Emergency Warning */}
                  <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-lg text-[11px] text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <span>{t.emergencyWarning}</span>
                  </div>

                  {/* Confirm Button */}
                  <div className="pt-2">
                    <button
                      id="confirm-token-btn"
                      type="submit"
                      className="w-full bg-[#0A3871] hover:bg-[#104382] text-white font-black text-sm py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Ticket className="w-4 h-4 text-amber-400" />
                      <span>{t.generateTokenBtn}</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Success Generated Token Card */
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">{t.tokenSuccessTitle}</h4>
                    <p className="text-xs text-slate-500">{t.smsSentNotice}</p>
                  </div>

                  {/* Printable Token Slip Badge */}
                  <div className="bg-slate-50 border-2 border-dashed border-[#0A3871] rounded-xl p-4 text-left space-y-3 relative">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {t.govtDept}
                      </span>
                      <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        VALID FOR TODAY
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-500 uppercase font-semibold">{t.tokenNumberLabel}</span>
                        <div className="text-2xl sm:text-3xl font-black text-[#0A3871] tracking-wider">
                          {newlyCreatedToken.tokenNumber}
                        </div>
                      </div>

                      {/* Simulated QR Code */}
                      <div className="w-16 h-16 bg-white p-1 rounded border border-slate-300 flex flex-col items-center justify-center text-[9px] font-mono text-center">
                        <div className="w-full h-full bg-slate-900/10 flex items-center justify-center font-bold text-slate-700">
                          [QR CODE]
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-200 pt-2">
                      <div>
                        <span className="text-slate-500 text-[10px] block">{t.patientName}</span>
                        <span className="font-bold text-slate-800">{newlyCreatedToken.patientName} ({newlyCreatedToken.age}y/{newlyCreatedToken.gender[0]})</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">{lang === 'mr' ? 'आरोग्य केंद्र' : 'Health Centre'}</span>
                        <span className="font-bold text-slate-800 truncate block">{newlyCreatedToken.phcName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">{t.preferredSlot}</span>
                        <span className="font-semibold text-slate-800">{newlyCreatedToken.timeSlot}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">{t.estimatedWait}</span>
                        <span className="font-extrabold text-emerald-700">~{newlyCreatedToken.estimatedWaitMinutes} mins</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      id="download-slip-btn"
                      onClick={() => alert(`Token ${newlyCreatedToken.tokenNumber} slip printed/saved successfully.`)}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{t.downloadSlip}</span>
                    </button>
                    <button
                      id="finish-booking-btn"
                      onClick={() => setBookingPhc(null)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg"
                    >
                      {lang === 'mr' ? 'पूर्ण झाले' : 'Done'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Requirement 3 & 4: Doctor Status LIVE Modal */}
      {doctorStatusPhc && (
        <DoctorLiveStatusModal
          phc={doctorStatusPhc}
          onClose={() => setDoctorStatusPhc(null)}
          lang={lang}
          onBookToken={(phc) => {
            handleOpenBooking(phc);
            setDoctorStatusPhc(null);
          }}
          userLocation={userLocation}
          onSimulateStatusChange={onSimulateDoctorStatus}
        />
      )}
    </div>
  );
};
