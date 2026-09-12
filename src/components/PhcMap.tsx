import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PHCLocation, Language, OutbreakAlert } from '../types';
import { translations } from '../data/translations';
import { calculateDistanceKm, GeoCoordinate, DEFAULT_DEMO_LOCATION } from '../utils/geoUtils';
import { Navigation, Stethoscope, Compass, Radio } from 'lucide-react';

interface PhcMapProps {
  phcs: PHCLocation[];
  selectedPhc: PHCLocation | null;
  onSelectPhc: (phc: PHCLocation) => void;
  onBookToken: (phc: PHCLocation) => void;
  onCheckDoctorStatus: (phc: PHCLocation) => void;
  lang: Language;
  outbreakAlerts?: OutbreakAlert[];
  showOutbreaks?: boolean;
  userLocation: GeoCoordinate | null;
  setUserLocation: (loc: GeoCoordinate | null) => void;
  isWatchingLocation: boolean;
  setIsWatchingLocation: (watching: boolean) => void;
}

export const PhcMap: React.FC<PhcMapProps> = ({
  phcs,
  selectedPhc,
  onSelectPhc,
  onBookToken,
  onCheckDoctorStatus,
  lang,
  outbreakAlerts = [],
  showOutbreaks = false,
  userLocation,
  setUserLocation,
  isWatchingLocation,
  setIsWatchingLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const circlesRef = useRef<L.Circle[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const hasInitiallyCenteredRef = useRef<boolean>(false);
  const [locationErrorNotice, setLocationErrorNotice] = useState<string | null>(null);

  const t = translations[lang];

  // Callback to toggle or activate live geolocation
  const handleToggleCurrentLocation = useCallback(() => {
    setLocationErrorNotice(null);

    if (isWatchingLocation) {
      // Turn off live tracking
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsWatchingLocation(false);
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current.remove();
        userAccuracyCircleRef.current = null;
      }
      setUserLocation(null);
      hasInitiallyCenteredRef.current = false;
      return;
    }

    setIsWatchingLocation(true);

    if ('geolocation' in navigator) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const newLoc: GeoCoordinate = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setUserLocation(newLoc);

          if (mapInstanceRef.current && !hasInitiallyCenteredRef.current) {
            mapInstanceRef.current.setView([newLoc.lat, newLoc.lng], 13, { animate: true });
            hasInitiallyCenteredRef.current = true;
          }
        },
        (error) => {
          console.warn('Geolocation warning, falling back to District HQ Demo GPS:', error.message);
          // Graceful fallback for iframe permission boundaries
          setUserLocation(DEFAULT_DEMO_LOCATION);
          setLocationErrorNotice(
            lang === 'mr' 
              ? 'ब्राउझर परवानगी मर्यादेमुळे गडचिरोली जिल्हा केंद्र थेट स्थान म्हणून दाखवले आहे.'
              : lang === 'hi'
              ? 'ब्राउज़र अनुमति सीमा के कारण गडचिरोली जिला केंद्र लाइव स्थान के रूप में दर्शाया गया है।'
              : 'Using District HQ Demo GPS (browser iframe permission fallback).'
          );

          if (mapInstanceRef.current && !hasInitiallyCenteredRef.current) {
            mapInstanceRef.current.setView([DEFAULT_DEMO_LOCATION.lat, DEFAULT_DEMO_LOCATION.lng], 12, { animate: true });
            hasInitiallyCenteredRef.current = true;
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 12000,
        }
      );
      watchIdRef.current = id;
    } else {
      setUserLocation(DEFAULT_DEMO_LOCATION);
      if (mapInstanceRef.current && !hasInitiallyCenteredRef.current) {
        mapInstanceRef.current.setView([DEFAULT_DEMO_LOCATION.lat, DEFAULT_DEMO_LOCATION.lng], 12, { animate: true });
        hasInitiallyCenteredRef.current = true;
      }
    }
  }, [isWatchingLocation, setIsWatchingLocation, setUserLocation, lang]);

  // Clean up watchPosition on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // Initialize Map Instance Once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center on Maharashtra Gadchiroli/Nandurbar
      const map = L.map(mapContainerRef.current, {
        center: [20.5, 76.5],
        zoom: 7,
        zoomControl: true,
      });

      // Free OpenStreetMap Standard Tiles (No API key required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
        subdomains: 'abc',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    
    // Invalidate size to ensure full tile rendering
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);
  }, []);

  // Update User Live Location Marker (Blue Pulsing Dot)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      const userDotHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-2 rounded-full bg-blue-500/40 animate-ping"></div>
          <div class="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-xl ring-4 ring-blue-300 flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-white"></div>
          </div>
          <div class="absolute -top-7 bg-[#0A3871] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md whitespace-nowrap border border-white/50 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            ${lang === 'mr' ? 'माझे थेट स्थान' : lang === 'hi' ? 'मेरा लाइव स्थान' : 'My Live Location'}
          </div>
        </div>
      `;

      const userIcon = L.divIcon({
        className: 'user-live-pin',
        html: userDotHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      if (!userMarkerRef.current) {
        const marker = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon,
          zIndexOffset: 1000,
        }).addTo(map);

        marker.bindTooltip(
          `<b>${lang === 'mr' ? 'तुमचे थेट स्थान' : 'Your Live Location'}</b><br/>Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}`,
          { direction: 'top', offset: [0, -12] }
        );

        userMarkerRef.current = marker;
      } else {
        // If user moves, move the dot smoothly
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
        userMarkerRef.current.setIcon(userIcon);
      }

      // Optional accuracy radius circle
      if (userLocation.accuracy && userLocation.accuracy > 20) {
        if (!userAccuracyCircleRef.current) {
          userAccuracyCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
            radius: Math.min(userLocation.accuracy, 2000),
            color: '#3B82F6',
            fillColor: '#60A5FA',
            fillOpacity: 0.12,
            weight: 1,
            dashArray: '4, 4',
          }).addTo(map);
        } else {
          userAccuracyCircleRef.current.setLatLng([userLocation.lat, userLocation.lng]);
          userAccuracyCircleRef.current.setRadius(Math.min(userLocation.accuracy, 2000));
        }
      }
    } else {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current.remove();
        userAccuracyCircleRef.current = null;
      }
    }
  }, [userLocation, lang]);

  // Update PHC Markers & Popups with Distance and the 2 Action Buttons
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    (Object.values(markersRef.current) as L.Marker[]).forEach(m => m.remove());
    markersRef.current = {};

    // Clear old outbreak circles
    circlesRef.current.forEach(c => c.remove());
    circlesRef.current = [];

    // Add PHC Markers
    phcs.forEach((phc) => {
      const isSelected = selectedPhc?.id === phc.id;
      const isRH = phc.type === 'Rural Hospital' || phc.type === 'Sub-District Hospital';
      const doctorStatus = phc.doctor.status || (phc.doctor.availableNow ? 'Available' : 'On Round');

      // Pin Color based on doctor status & PHC type
      // Green = Available, Amber = On Round, Blue = Tele-OPD, Navy = Rural Hospital, Red = Selected
      const pinColorClass = isSelected
        ? 'bg-red-600 ring-4 ring-red-300 animate-bounce'
        : doctorStatus === 'Tele-OPD'
        ? 'bg-blue-600 ring-2 ring-blue-300'
        : doctorStatus === 'Available'
        ? 'bg-emerald-600 ring-2 ring-emerald-300'
        : 'bg-amber-600 ring-2 ring-amber-300';

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transform -translate-x-1/2 -translate-y-full hover:scale-125 transition-transform duration-200">
          <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${pinColorClass}">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path>
            </svg>
          </div>
          <div class="absolute -bottom-1 w-2 h-2 bg-slate-900 rotate-45"></div>
          ${phc.antivenomStock > 25 ? `
            <span class="absolute -top-2 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] px-1 rounded-full border border-white">
              ASV
            </span>
          ` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-phc-pin',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([phc.lat, phc.lng], { icon: customIcon }).addTo(map);

      // Calculate distance from live user location if available
      const distance = userLocation
        ? calculateDistanceKm(userLocation.lat, userLocation.lng, phc.lat, phc.lng)
        : null;

      // Status text for popup
      const statusLabel = doctorStatus === 'Available'
        ? (lang === 'mr' ? 'हजर आहेत' : lang === 'hi' ? 'उपस्थित हैं' : 'Available Now')
        : doctorStatus === 'Tele-OPD'
        ? (lang === 'mr' ? 'टेलि-ओपीडी सुरू' : lang === 'hi' ? 'टेली-ओपीडी सक्रिय' : 'Tele-OPD Active')
        : (lang === 'mr' ? 'वॉर्ड फेरीवर' : lang === 'hi' ? 'वार्ड राउंड पर' : 'On Round');

      const statusBgClass = doctorStatus === 'Available'
        ? 'bg-emerald-100 text-emerald-800'
        : doctorStatus === 'Tele-OPD'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-amber-100 text-amber-800';

      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${phc.lat},${phc.lng}${
        userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : ''
      }`;

      // Build Leaflet Popup with the 2 explicit buttons:
      // 1. "Get Directions" (opens Google Maps with lat,lon)
      // 2. "Check Doctor Status LIVE"
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 min-w-[260px] text-slate-900 font-sans';
      popupContent.innerHTML = `
        <div class="border-b border-slate-200 pb-2 mb-2">
          <div class="flex items-center justify-between gap-1">
            <span class="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
              phc.district === 'Gadchiroli' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
            }">
              ${phc.district} • ${lang === 'mr' ? phc.marathiTaluka : phc.taluka}
            </span>
            ${distance !== null ? `
              <span class="text-[10px] font-extrabold text-[#0A3871] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                📍 <b>${distance} km</b>
              </span>
            ` : ''}
          </div>
          <h3 class="font-extrabold text-sm text-[#0A3871] mt-1 leading-tight">
            ${lang === 'mr' ? phc.marathiName : phc.name}
          </h3>
          <p class="text-[11px] text-slate-500">${phc.type}</p>
        </div>

        <div class="space-y-1.5 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-slate-600 font-medium">${lang === 'mr' ? 'डॉक्टर:' : lang === 'hi' ? 'डॉक्टर:' : 'Doctor:'}</span>
            <span class="font-bold text-slate-800">${phc.doctor.name}</span>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-slate-600 font-medium">${lang === 'mr' ? 'थेट स्थिती:' : lang === 'hi' ? 'लाइव स्थिति:' : 'Live Status:'}</span>
            <span class="font-extrabold px-2 py-0.5 rounded text-[10px] flex items-center gap-1 ${statusBgClass}">
              <span class="w-1.5 h-1.5 rounded-full ${doctorStatus === 'Available' ? 'bg-emerald-500' : doctorStatus === 'Tele-OPD' ? 'bg-blue-500' : 'bg-amber-500'} animate-pulse"></span>
              ${statusLabel}
            </span>
          </div>

          <div class="flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded">
            <span>💉 ${lang === 'mr' ? 'सर्पदंश लस:' : lang === 'hi' ? 'सर्पदंश रोधी विष:' : 'ASV Stock:'} <b>${phc.antivenomStock} vials</b></span>
            <span>🛏️ ${lang === 'mr' ? 'खाटा:' : lang === 'hi' ? 'बिस्तर:' : 'Beds:'} <b>${phc.beds}</b></span>
          </div>

          <div class="text-[10px] text-slate-500 flex items-center justify-between">
            <span>🕒 OPD: ${phc.doctor.timing}</span>
            <span>⏱️ ${phc.doctor.lastUpdated || 'Live Sync'}</span>
          </div>
        </div>

        <!-- 2 PRIMARY ACTION BUTTONS REQUIRED -->
        <div class="mt-3 pt-2 border-t border-slate-200 space-y-1.5">
          <div class="grid grid-cols-2 gap-1.5">
            <!-- 1. Get Directions Button -->
            <a 
              href="${googleMapsUrl}" 
              target="_blank" 
              rel="noopener noreferrer" 
              id="directions-popup-btn-${phc.id}" 
              class="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold py-1.5 px-2 rounded shadow-sm transition-colors text-center flex items-center justify-center gap-1 no-underline"
              title="${t.directions}"
            >
              🧭 <span>${t.directions}</span>
            </a>

            <!-- 2. Check Doctor Status LIVE Button -->
            <button 
              id="doctor-status-popup-btn-${phc.id}" 
              class="bg-[#0A3871] hover:bg-[#104382] text-white text-[11px] font-extrabold py-1.5 px-2 rounded shadow-sm transition-colors text-center flex items-center justify-center gap-1"
              title="${t.checkDoctorStatusLive}"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>${lang === 'mr' ? 'डॉक्टर थेट स्थिती' : lang === 'hi' ? 'डॉक्टर लाइव स्थिति' : 'Doctor Status LIVE'}</span>
            </button>
          </div>

          <!-- Quick Token Booking link -->
          <div class="flex items-center justify-between pt-1">
            <button id="book-token-link-${phc.id}" class="text-[11px] text-[#0A3871] font-bold hover:underline flex items-center gap-1">
              🎫 ${t.bookTokenBtn}
            </button>
            <a href="tel:${phc.phone}" class="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1">
              📞 ${lang === 'mr' ? 'फोन करा' : 'Call'}
            </a>
          </div>
        </div>
      `;

      // Attach button listeners after popup opens
      marker.bindPopup(popupContent, { maxWidth: 300 });

      marker.on('popupopen', () => {
        const docBtn = document.getElementById(`doctor-status-popup-btn-${phc.id}`);
        if (docBtn) {
          docBtn.onclick = (e) => {
            e.preventDefault();
            onCheckDoctorStatus(phc);
          };
        }

        const bookBtn = document.getElementById(`book-token-link-${phc.id}`);
        if (bookBtn) {
          bookBtn.onclick = (e) => {
            e.preventDefault();
            onBookToken(phc);
          };
        }
      });

      marker.on('click', () => {
        onSelectPhc(phc);
      });

      markersRef.current[phc.id] = marker;
    });

    // Add Outbreak Heatmap Circles if enabled
    if (showOutbreaks && outbreakAlerts.length > 0) {
      outbreakAlerts.forEach((alert) => {
        const circle = L.circle([alert.lat, alert.lng], {
          color: alert.alertLevel === 'High' ? '#DC2626' : '#EA580C',
          fillColor: alert.alertLevel === 'High' ? '#EF4444' : '#F97316',
          fillOpacity: 0.35,
          radius: alert.radiusKm * 1000,
          weight: 2,
        }).addTo(map);

        circle.bindTooltip(`
          <div class="text-xs font-bold p-1">
            <span class="text-red-700 uppercase">[Outbreak Alert]</span><br/>
            <b>${lang === 'mr' ? alert.marathiDisease : alert.disease}</b><br/>
            Cases: ${alert.activeCases} (${alert.trend} trend)<br/>
            Taluka: ${alert.taluka} (${alert.district})
          </div>
        `, { sticky: true });

        circlesRef.current.push(circle);
      });
    }

    // Zoom or pan if a PHC is selected
    if (selectedPhc && markersRef.current[selectedPhc.id]) {
      map.setView([selectedPhc.lat, selectedPhc.lng], 12, { animate: true });
      markersRef.current[selectedPhc.id].openPopup();
    } else if (phcs.length > 0 && !hasInitiallyCenteredRef.current && !userLocation) {
      const group = L.featureGroup(Object.values(markersRef.current));
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [phcs, selectedPhc, lang, showOutbreaks, outbreakAlerts, userLocation, onSelectPhc, onBookToken, onCheckDoctorStatus, t]);

  // Clean up Leaflet map instance on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[480px] sm:h-[540px] md:h-[600px] rounded-xl overflow-hidden shadow-md border border-slate-200">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* FLOATING "MY CURRENT LOCATION" BUTTON */}
      <div className="absolute top-3 left-14 z-20 flex flex-col gap-1.5">
        <button
          id="my-current-location-btn"
          type="button"
          onClick={handleToggleCurrentLocation}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-lg backdrop-blur-md transition-all border ${
            isWatchingLocation
              ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-300 animate-pulse'
              : 'bg-white/95 text-[#0A3871] border-slate-300 hover:bg-slate-50 hover:border-blue-400'
          }`}
          title={lang === 'mr' ? 'माझे थेट स्थान चालू करा' : 'Turn on Live GPS Location'}
        >
          <Compass className={`w-4 h-4 ${isWatchingLocation ? 'animate-spin text-white' : 'text-[#0A3871]'}`} />
          <span>
            {isWatchingLocation 
              ? (lang === 'mr' ? 'थेट जीपीएस सुरू 📍' : lang === 'hi' ? 'लाइव जीपीएस सक्रिय 📍' : 'GPS LIVE Tracking 📍')
              : (lang === 'mr' ? 'माझे थेट स्थान' : lang === 'hi' ? 'मेरा लाइव स्थान' : 'My Current Location')
            }
          </span>
          {isWatchingLocation && (
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
          )}
        </button>

        {/* Notice for iframe fallback if present */}
        {locationErrorNotice && (
          <div className="bg-amber-500/90 text-slate-950 font-bold text-[10px] px-2.5 py-1 rounded-lg shadow-md max-w-[280px] border border-amber-300">
            {locationErrorNotice}
          </div>
        )}
      </div>

      {/* Real-time simulation heartbeat indicator */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 px-2.5 py-1 rounded-full shadow-md text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>{lang === 'mr' ? 'थेट ओपीडी सिंक' : lang === 'hi' ? 'लाइव ओपीडी सिंक' : 'Live Doctor Sync'}</span>
          <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded font-mono">~30s</span>
        </div>

        {/* Outbreak Toggle Indicator if enabled */}
        {showOutbreaks && (
          <div className="bg-red-600 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white"></span>
            <span>{lang === 'mr' ? 'साथीचे रोग थर' : 'Disease Layer'}</span>
          </div>
        )}
      </div>

      {/* Map Legend Overlay (Preserving existing Maharashtra Shasan styling and adding new live indicators) */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-200 text-xs max-w-[320px]">
        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
          <span className="font-extrabold text-slate-900 text-[11px] uppercase tracking-wider">
            {lang === 'mr' ? 'नकाशा सूची (Map Legend)' : lang === 'hi' ? 'मानचित्र संकेत (Map Legend)' : 'Map Legend'}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">Maharashtra Shasan</span>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block border border-white shadow-xs"></span>
            <span>{lang === 'mr' ? 'डॉक्टर हजर' : lang === 'hi' ? 'डॉक्टर उपस्थित' : 'Doctor On Duty'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block border border-white shadow-xs"></span>
            <span>{lang === 'mr' ? 'वॉर्ड फेरीवर' : lang === 'hi' ? 'वार्ड राउंड पर' : 'On Round'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block border border-white shadow-xs"></span>
            <span>{lang === 'mr' ? 'टेलि-ओपीडी' : lang === 'hi' ? 'टेली-ओपीडी' : 'Tele-OPD'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#0A3871] inline-block border border-white shadow-xs"></span>
            <span>{lang === 'mr' ? 'ग्रामीण रुग्णालय' : lang === 'hi' ? 'ग्रामीण अस्पताल' : 'Rural Hospital'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block ring-2 ring-red-300"></span>
            <span>{lang === 'mr' ? 'निवडलेले केंद्र' : lang === 'hi' ? 'चयनित केंद्र' : 'Selected PHC'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block ring-2 ring-blue-300 animate-ping"></span>
            <span className="font-bold text-blue-800">{lang === 'mr' ? 'माझे थेट स्थान' : lang === 'hi' ? 'मेरा लाइव स्थान' : 'My Live Location'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
