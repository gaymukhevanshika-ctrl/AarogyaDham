import React, { useState } from 'react';
import { PHCLocation, Language } from '../types';
import { translations } from '../data/translations';
import { Search, Compass, MapPin, Navigation, ArrowUpDown, Check } from 'lucide-react';
import { GeoCoordinate } from '../utils/geoUtils';

interface BottomNearMeBarProps {
  phcs: PHCLocation[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userLocation: GeoCoordinate | null;
  onTriggerLocation: () => void;
  isWatchingLocation: boolean;
  onSelectPhc: (phc: PHCLocation) => void;
  lang: Language;
  sortByNearest: boolean;
  onToggleSortNearest: () => void;
  maxDistanceKm: number | 'all';
  onMaxDistanceChange: (dist: number | 'all') => void;
}

export const BottomNearMeBar: React.FC<BottomNearMeBarProps> = ({
  phcs,
  searchQuery,
  onSearchChange,
  userLocation,
  onTriggerLocation,
  isWatchingLocation,
  onSelectPhc,
  lang,
  sortByNearest,
  onToggleSortNearest,
  maxDistanceKm,
  onMaxDistanceChange,
}) => {
  const t = translations[lang];
  const [showQuickResults, setShowQuickResults] = useState(false);

  // Find the single nearest PHC if userLocation is available
  const nearestPhc = userLocation && phcs.length > 0
    ? [...phcs].sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999))[0]
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 p-4 sm:p-5 mt-4 transition-all">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[#0A3871]" />
          </div>
          <input
            id="search-phc-near-me-input"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setShowQuickResults(true);
            }}
            onFocus={() => setShowQuickResults(true)}
            placeholder={
              lang === 'mr'
                ? 'माझ्या जवळील आरोग्य केंद्र शोधा (उदा. भामरागड, धडगाव, अहेरी)...'
                : lang === 'hi'
                ? 'मेरे पास स्वास्थ्य केंद्र खोजें (उदा. भामरागड, धडगाव, अहेरी)...'
                : 'Search PHC near me (e.g. Bhamragad, Dhadgaon, Aheri)...'
            }
            className="w-full pl-11 pr-24 py-3 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 placeholder-slate-400 font-medium text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A3871] focus:border-transparent transition-all shadow-inner"
          />

          {/* Quick Clear or Count */}
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 text-xs bg-slate-200 hover:bg-slate-300 rounded-full w-5 h-5 flex items-center justify-center font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Action Buttons: "Near Me" GPS Button & Sort Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Near Me GPS Trigger */}
          <button
            id="trigger-near-me-gps-btn"
            type="button"
            onClick={onTriggerLocation}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-extrabold text-xs sm:text-sm shadow-md transition-all whitespace-nowrap ${
              isWatchingLocation
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300'
                : 'bg-[#0A3871] hover:bg-[#104382] text-white'
            }`}
          >
            <Compass className={`w-4 h-4 ${isWatchingLocation ? 'animate-spin' : ''}`} />
            <span>
              {isWatchingLocation
                ? (lang === 'mr' ? 'जीपीएस सुरू 📍' : 'GPS Tracking 📍')
                : (lang === 'mr' ? 'माझ्या जवळ शोधा' : lang === 'hi' ? 'मेरे पास खोजें' : 'Search PHC Near Me')}
            </span>
          </button>

          {/* Sort by Nearest PHC Toggle */}
          <button
            id="toggle-sort-nearest-btn"
            type="button"
            onClick={onToggleSortNearest}
            className={`flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl font-bold text-xs border transition-all ${
              sortByNearest
                ? 'bg-blue-50 text-[#0A3871] border-[#0A3871] ring-1 ring-[#0A3871]'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="Sort Nearest First"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {lang === 'mr' ? 'जवळचे केंद्र प्रथम' : lang === 'hi' ? 'निकटतम पहले' : 'Nearest First'}
            </span>
          </button>
        </div>
      </div>

      {/* Distance Radius Quick Filters & Live Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
        {/* Distance Range Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 font-bold text-[11px] mr-1">
            {lang === 'mr' ? 'कमाल अंतर मर्यादा:' : lang === 'hi' ? 'अधिकतम दूरी सीमा:' : 'Distance Filter:'}
          </span>
          {[
            { label: lang === 'mr' ? 'सर्व' : 'All', val: 'all' as const },
            { label: '< 15 km', val: 15 },
            { label: '< 30 km', val: 30 },
            { label: '< 50 km', val: 50 },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onMaxDistanceChange(item.val)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                maxDistanceKm === item.val
                  ? 'bg-[#0A3871] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Live Distance Notice */}
        {nearestPhc && nearestPhc.distanceKm !== undefined ? (
          <div 
            onClick={() => onSelectPhc(nearestPhc)}
            className="flex items-center gap-1.5 text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg border border-blue-200 cursor-pointer font-bold text-[11px] transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-red-600" />
            <span>
              {lang === 'mr' ? 'सर्वात जवळचे केंद्र:' : lang === 'hi' ? 'निकटतम स्वास्थ्य केंद्र:' : 'Nearest PHC:'}{' '}
              <b className="text-[#0A3871]">{lang === 'mr' ? nearestPhc.marathiName : nearestPhc.name}</b> ({nearestPhc.distanceKm} km)
            </span>
          </div>
        ) : (
          <span className="text-slate-400 text-[11px]">
            {lang === 'mr'
              ? '💡 थेट अंतर मोजण्यासाठी "माझ्या जवळ शोधा" बटणावर क्लिक करा.'
              : '💡 Click "Search PHC Near Me" to calculate realtime distance in KM.'}
          </span>
        )}
      </div>
    </div>
  );
};
