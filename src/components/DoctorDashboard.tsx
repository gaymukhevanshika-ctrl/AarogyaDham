import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

import { 
  PHCLocation, 
  Language, 
  District, 
  MedicineItem, 
  OutbreakAlert, 
  AshaPatientRecord 
} from '../types';
import { translations } from '../data/translations';
import { PhcMap } from './PhcMap';
import { 
  BarChart3, 
  AlertTriangle, 
  Pill, 
  Flame, 
  TrendingUp, 
  Activity, 
  ShieldAlert, 
  PhoneCall, 
  Download, 
  Check, 
  Send, 
  RefreshCw, 
  PlusCircle, 
  Video 
} from 'lucide-react';

interface DoctorDashboardProps {
  phcs: PHCLocation[];
  medicines: MedicineItem[];
  outbreaks: OutbreakAlert[];
  patientRecords: AshaPatientRecord[];
  onUpdateMedicine: (medicines: MedicineItem[]) => void;
  lang: Language;
  onOpenSos: () => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  phcs,
  medicines,
  outbreaks,
  patientRecords,
  onUpdateMedicine,
  lang,
  onOpenSos,
}) => {
  const t = translations[lang];

  const [activeDistrict, setActiveDistrict] = useState<District | 'All'>('All');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'heatmap' | 'stock' | 'triage_queue'>('overview');
  const [selectedPhc, setSelectedPhc] = useState<PHCLocation | null>(null);
  const [restockModalItem, setRestockModalItem] = useState<MedicineItem | null>(null);
  const [restockQty, setRestockQty] = useState('100');
  const [activeTeleconsultPatient, setActiveTeleconsultPatient] = useState<AshaPatientRecord | null>(null);
  const [doctorPrescriptionNote, setDoctorPrescriptionNote] = useState('');

  // Filtered by district
  const filteredPhcs = phcs.filter(p => activeDistrict === 'All' || p.district === activeDistrict);
  const filteredMedicines = medicines.filter(m => activeDistrict === 'All' || m.district === activeDistrict);
  const filteredOutbreaks = outbreaks.filter(o => activeDistrict === 'All' || o.district === activeDistrict);
  const filteredRecords = patientRecords.filter(r => activeDistrict === 'All' || r.district === activeDistrict);

  // Key KPI metrics
  const totalBeds = filteredPhcs.reduce((sum, p) => sum + p.beds, 0);
  const totalAsv = filteredMedicines
    .filter(m => m.name.includes("Anti-Snake Venom"))
    .reduce((sum, m) => sum + m.currentStock, 0) + filteredPhcs.reduce((sum, p) => sum + p.antivenomStock, 0);
  const totalActiveTokens = filteredPhcs.reduce((sum, p) => sum + p.activeTokensWaiting, 0);
  const redAlertCases = filteredRecords.filter(r => r.triage.triageLevel === 'RED').length;
  const criticalStockoutCount = filteredMedicines.filter(m => m.status === 'Critical Stockout').length;

  // Chart 1: Disease Trend (Weekly Epidemic Surveillance)
  const diseaseTrendData = {
    labels: ['W1 Aug', 'W2 Aug', 'W3 Aug', 'W4 Aug', 'W1 Sep', 'Current (W2 Sep)'],
    datasets: [
      {
        label: 'Falciparum Malaria (मलेरिया)',
        data: [28, 35, 48, 62, 78, 92],
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Sickle Cell Crisis (सिकलसेल)',
        data: [42, 40, 45, 52, 58, 64],
        borderColor: '#D97706',
        backgroundColor: 'rgba(217, 119, 6, 0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Snakebites (सर्पदंश)',
        data: [12, 19, 24, 38, 42, 35],
        borderColor: '#0A3871',
        backgroundColor: 'rgba(10, 56, 113, 0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Child SAM/MAM Malnutrition',
        data: [55, 58, 62, 70, 84, 95],
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  // Chart 2: Triage Distribution Doughnut
  const redCount = filteredRecords.filter(r => r.triage.triageLevel === 'RED').length;
  const yellowCount = filteredRecords.filter(r => r.triage.triageLevel === 'YELLOW').length;
  const greenCount = filteredRecords.filter(r => r.triage.triageLevel === 'GREEN').length;

  const triageDoughnutData = {
    labels: ['RED (Critical Emergency)', 'YELLOW (Urgent Consult)', 'GREEN (Routine Stable)'],
    datasets: [
      {
        data: [redCount, yellowCount, greenCount],
        backgroundColor: ['#DC2626', '#F59E0B', '#10B981'],
        borderWidth: 2,
        borderColor: '#FFFFFF',
      },
    ],
  };

  // Chart 3: Taluka Patient Density Bar Chart
  const talukas = activeDistrict === 'Gadchiroli' 
    ? ['Bhamragad', 'Aheri', 'Kurkheda', 'Etapalli', 'Sironcha']
    : activeDistrict === 'Nandurbar'
    ? ['Dhadgaon', 'Akkalkuwa', 'Navapur', 'Shahada', 'Taloda']
    : ['Bhamragad', 'Aheri', 'Dhadgaon', 'Akkalkuwa', 'Kurkheda', 'Navapur'];

  const talukaDensityData = {
    labels: talukas,
    datasets: [
      {
        label: 'Active High-Risk Cases Screened',
        data: [42, 35, 64, 38, 29, 21],
        backgroundColor: '#0A3871',
        borderRadius: 6,
      },
      {
        label: 'Available Doctor Beds',
        data: [30, 80, 50, 40, 25, 45],
        backgroundColor: '#10B981',
        borderRadius: 6,
      },
    ],
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalItem) return;

    const qty = parseInt(restockQty) || 50;
    const updated = medicines.map(m => {
      if (m.id === restockModalItem.id) {
        const newStock = m.currentStock + qty;
        return {
          ...m,
          currentStock: newStock,
          status: (newStock >= m.minThreshold ? 'Adequate' : 'Low Stock') as any,
        };
      }
      return m;
    });

    onUpdateMedicine(updated);
    setRestockModalItem(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls & District Selection Strip */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                National Health Mission (NHM) • Integrated Health Analytics
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0A3871] flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-amber-500" />
              <span>{t.doctorDashboardTitle}</span>
            </h2>
            <p className="text-xs text-slate-600">
              {lang === 'mr' 
                ? 'साथीचे रोग नियंत्रण, अत्यावश्यक औषध साठा व टेलि-कन्सल्टेशन कक्ष' 
                : 'Epidemiological Surveillance, Essential Medicine Buffer & Clinical Triage Queue'}
            </p>
          </div>

          {/* District Filter & Sub Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* District Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                id="doc-district-all"
                onClick={() => setActiveDistrict('All')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeDistrict === 'All' ? 'bg-[#0A3871] text-white shadow-sm' : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                {t.allDistricts} (50 PHCs)
              </button>
              <button
                id="doc-district-gad"
                onClick={() => setActiveDistrict('Gadchiroli')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeDistrict === 'Gadchiroli' ? 'bg-[#0A3871] text-white shadow-sm' : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                {t.gadchiroli}
              </button>
              <button
                id="doc-district-nan"
                onClick={() => setActiveDistrict('Nandurbar')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeDistrict === 'Nandurbar' ? 'bg-[#0A3871] text-white shadow-sm' : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                {t.nandurbar}
              </button>
            </div>

            {/* Export Report Trigger */}
            <button
              onClick={() => alert(`NHM District Epidemiological Report generated and downloaded for ${activeDistrict}.`)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Report</span>
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200 overflow-x-auto">
          <button
            id="subtab-overview"
            onClick={() => setActiveSubTab('overview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeSubTab === 'overview' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{t.analyticsTab}</span>
          </button>

          <button
            id="subtab-heatmap"
            onClick={() => setActiveSubTab('heatmap')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeSubTab === 'heatmap' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>{t.diseaseHeatmapTab}</span>
            <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
              {filteredOutbreaks.length} Alerts
            </span>
          </button>

          <button
            id="subtab-stock"
            onClick={() => setActiveSubTab('stock')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeSubTab === 'stock' ? 'bg-[#0A3871] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Pill className="w-4 h-4" />
            <span>{t.medicineStockTab}</span>
            {criticalStockoutCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 animate-pulse">
                {criticalStockoutCount} Critical
              </span>
            )}
          </button>

          <button
            id="subtab-triage-queue"
            onClick={() => setActiveSubTab('triage_queue')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeSubTab === 'triage_queue' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{t.criticalAlerts} ({filteredRecords.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Active PHCs */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {lang === 'mr' ? 'आरोग्य केंद्रे' : 'Active PHC / RH'}
          </span>
          <div className="text-2xl font-black text-[#0A3871] mt-1">
            {filteredPhcs.length}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
            ✓ 100% Geo-Mapped
          </span>
        </div>

        {/* Card 2: Total Beds Available */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {lang === 'mr' ? 'एकूण उपलब्ध खाटा' : 'Total Bed Capacity'}
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {totalBeds}
          </div>
          <span className="text-[10px] text-slate-500 font-medium block mt-1">
            Includes Maternity Units
          </span>
        </div>

        {/* Card 3: Anti-Snake Venom Buffer */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {lang === 'mr' ? 'सर्पदंश लस (ASV)' : 'ASV Stock Buffer'}
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {totalAsv} Vials
          </div>
          <span className="text-[10px] text-amber-700 font-semibold block mt-1">
            Target: &gt;500 in Monsoon
          </span>
        </div>

        {/* Card 4: High-Risk RED Screenings */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {lang === 'mr' ? 'अतिधोकादायक रुग्ण' : 'Critical RED Triage'}
          </span>
          <div className="text-2xl font-black text-red-600 mt-1">
            {redAlertCases}
          </div>
          <span className="text-[10px] text-red-600 font-bold block mt-1">
            108 Dispatched / Monitored
          </span>
        </div>

        {/* Card 5: Critical EDL Shortage */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {lang === 'mr' ? 'औषध तुटवडा' : 'Medicine Shortages'}
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {criticalStockoutCount} Items
          </div>
          <span className="text-[10px] text-amber-800 font-semibold block mt-1">
            ORS & Malaria RDT kits
          </span>
        </div>
      </div>

      {/* Sub Tab 1: Analytical Graphs (Chart.js) */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Disease Trend Line Chart */}
            <div className="lg:col-span-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#0A3871]">
                    {lang === 'mr' ? 'आदिवासी भागातील साथीचे रोग कल (साप्ताहिक नोंद)' : 'Weekly Disease Outbreak Surveillance'}
                  </h3>
                  <p className="text-xs text-slate-500">Integrated IDSP (Integrated Disease Surveillance Programme) Telemetry</p>
                </div>
                <span className="text-xs bg-red-50 text-red-700 font-bold px-2 py-1 rounded-full border border-red-200">
                  Live Monsoon Wave
                </span>
              </div>
              <div className="h-[280px] sm:h-[320px] w-full">
                <Line
                  data={diseaseTrendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                    },
                    scales: {
                      y: { beginAtZero: true, grid: { color: '#F1F5F9' } },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              </div>
            </div>

            {/* AI Triage Distribution Doughnut */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-[#0A3871]">
                  {lang === 'mr' ? 'एआय ट्रायज विभागणी (फील्ड सर्व्हे)' : 'ASHA Field Triage Severity Breakdown'}
                </h3>
                <p className="text-xs text-slate-500 mb-3">Live algorithmic triage of screened villagers</p>
              </div>

              <div className="h-[220px] sm:h-[240px] flex items-center justify-center">
                <Doughnut
                  data={triageDoughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                    },
                  }}
                />
              </div>

              <div className="mt-3 bg-slate-50 p-2.5 rounded-lg text-xs space-y-1">
                <div className="flex justify-between font-bold text-red-700">
                  <span>Emergency (RED):</span>
                  <span>{redCount} patients</span>
                </div>
                <div className="flex justify-between font-bold text-amber-700">
                  <span>Urgent Review (YELLOW):</span>
                  <span>{yellowCount} patients</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Stable (GREEN):</span>
                  <span>{greenCount} patients</span>
                </div>
              </div>
            </div>
          </div>

          {/* Taluka Density Bar Chart */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-extrabold text-sm sm:text-base text-[#0A3871] mb-1">
              {lang === 'mr' ? 'तालुकानिहाय रुग्ण भार व खाटांची उपलब्धता' : 'Taluka-wise High-Risk Patient Load vs Active Bed Capacity'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Identifies under-resourced talukas requiring medical officer mobile deployment</p>
            <div className="h-[260px] sm:h-[300px] w-full">
              <Bar
                data={talukaDensityData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                  },
                  scales: {
                    y: { beginAtZero: true, grid: { color: '#F1F5F9' } },
                    x: { grid: { display: false } },
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab 2: Disease Heatmap & Cluster Detection */}
      {activeSubTab === 'heatmap' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div>
                <h3 className="font-extrabold text-base text-[#0A3871] flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-600" />
                  <span>{lang === 'mr' ? 'रोग उद्रेक व क्लस्टर नकाशा थर' : 'Epidemic Hotspot Heatmap & Containment Zones'}</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Red circular radius represents active field disease clusters in Bhamragad, Dhadgaon, Aheri, and Akkalkuwa
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="bg-red-100 text-red-800 font-extrabold px-3 py-1 rounded-full border border-red-200">
                  ● Red Hotspot: High Alert
                </span>
                <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full border border-amber-200">
                  ● Orange Hotspot: Medium Alert
                </span>
              </div>
            </div>

            {/* Map with Outbreaks overlay enabled */}
            <PhcMap
              phcs={filteredPhcs}
              selectedPhc={selectedPhc}
              onSelectPhc={(p) => setSelectedPhc(p)}
              onBookToken={() => {}}
              lang={lang}
              outbreakAlerts={filteredOutbreaks}
              showOutbreaks={true}
            />
          </div>

          {/* Active Outbreak Alerts Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
              {lang === 'mr' ? 'सक्रिय उद्रेक सूचना' : 'Active Epidemic Alerts Surveillance Feed'}
            </div>
            <div className="divide-y divide-slate-200 text-xs">
              {filteredOutbreaks.map((alert) => (
                <div key={alert.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg font-black text-xs ${
                      alert.alertLevel === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">
                        {lang === 'mr' ? alert.marathiDisease : alert.disease}
                      </h4>
                      <p className="text-slate-500 text-[11px]">
                        Taluka: <b>{alert.taluka}</b> • District: <b>{alert.district}</b> • Containment Radius: <b>{alert.radiusKm} km</b>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 block">
                        {alert.activeCases} active cases
                      </span>
                      <span className={`text-[10px] font-bold ${alert.trend === 'Rising' ? 'text-red-600' : 'text-slate-500'}`}>
                        Trend: {alert.trend}
                      </span>
                    </div>

                    <button
                      onClick={() => alert(`Medical dispatch team notified for containment in ${alert.taluka}.`)}
                      className="bg-[#0A3871] hover:bg-[#104382] text-white font-extrabold text-xs px-3 py-1.5 rounded-lg"
                    >
                      Deploy Response Team
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab 3: Essential Drug List (EDL) Medicine Stock */}
      {activeSubTab === 'stock' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
            <div>
              <h3 className="font-black text-[#0A3871] text-base sm:text-lg flex items-center gap-2">
                <Pill className="w-5 h-5 text-amber-500" />
                <span>{lang === 'mr' ? 'अत्यावश्यक औषध साठा व रिस्टॉक प्रणाली' : 'Essential Drug List (EDL) & Antidote Inventory'}</span>
              </h3>
              <p className="text-xs text-slate-600">
                Live buffer tracking for Snakebite, Malaria, Maternal Anemia & IV Fluids across PHC cold-chains
              </p>
            </div>

            <button
              onClick={() => alert("Bulk restocking indented via Maharashtra Medical Goods Procurement Authority (Haffkine Institute).")}
              className="bg-[#0A3871] hover:bg-[#104382] text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>{lang === 'mr' ? 'मध्यवर्ती गोदामातून मागणी' : 'Request Central Indent'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-black uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Medicine / Antidote Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">District Hub</th>
                  <th className="p-3">Current Stock</th>
                  <th className="p-3">Min Threshold</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Batch & Expiry</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredMedicines.map((med) => (
                  <tr key={med.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <span className="font-extrabold text-slate-900 block text-xs">{med.name}</span>
                      <span className="text-slate-500 text-[11px]">{med.marathiName}</span>
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        {med.category}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">
                      {med.district}
                    </td>
                    <td className="p-3 font-mono font-extrabold text-sm">
                      {med.currentStock} {med.unit}
                    </td>
                    <td className="p-3 text-slate-500 font-mono">
                      {med.minThreshold} {med.unit}
                    </td>
                    <td className="p-3 font-bold">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] ${
                        med.status === 'Critical Stockout'
                          ? 'bg-red-100 text-red-700 animate-pulse border border-red-300 font-extrabold'
                          : med.status === 'Low Stock'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {med.status}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] font-mono text-slate-600">
                      <div>{med.batchNumber}</div>
                      <div className="text-slate-400">Exp: {med.expiryDate}</div>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setRestockModalItem(med)}
                        className="bg-slate-100 hover:bg-[#0A3871] hover:text-white text-slate-800 font-bold text-[11px] px-2.5 py-1.5 rounded transition-colors"
                      >
                        {t.restockBtn}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub Tab 4: Critical Triage Patient Queue & Tele-consultation */}
      {activeSubTab === 'triage_queue' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-base text-[#0A3871]">
                {lang === 'mr' ? 'प्राथमिकता ट्रायज रुग्ण व टेलि-कन्सल्टेशन' : 'Emergency RED & Urgent YELLOW Patient Review'}
              </h3>
              <p className="text-xs text-slate-600">
                Real-time queue of cases submitted by ASHA workers across remote tribal padas
              </p>
            </div>
            <span className="bg-red-600 text-white font-extrabold text-xs px-3 py-1 rounded-full animate-pulse">
              {redAlertCases} Patients Require Urgent Doctor Review
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecords.map((rec) => (
              <div
                key={rec.id}
                className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${
                  rec.triage.triageLevel === 'RED'
                    ? 'border-red-400 ring-2 ring-red-100'
                    : rec.triage.triageLevel === 'YELLOW'
                    ? 'border-amber-400'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                    rec.triage.triageLevel === 'RED'
                      ? 'bg-red-600 text-white'
                      : rec.triage.triageLevel === 'YELLOW'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {rec.triage.triageLevel} ({rec.triage.score}/100)
                  </span>
                  <span className="text-[11px] text-slate-400">{rec.recordedAt}</span>
                </div>

                <h4 className="font-black text-sm text-slate-900 mt-2">{rec.name}</h4>
                <p className="text-xs text-slate-500">
                  {rec.age}y / {rec.gender} • {rec.village}, {rec.taluka}
                </p>

                {/* Vitals */}
                <div className="mt-2 bg-slate-50 p-2 rounded text-xs font-mono grid grid-cols-2 gap-1 text-slate-700">
                  <div>BP: <b>{rec.vitals.bpSystolic}/{rec.vitals.bpDiastolic}</b></div>
                  <div>SpO2: <b className={rec.vitals.spO2 < 90 ? 'text-red-600' : ''}>{rec.vitals.spO2}%</b></div>
                  <div>Hb: <b className={rec.vitals.hemoglobin < 7 ? 'text-red-600' : ''}>{rec.vitals.hemoglobin}g</b></div>
                  <div>Pulse: <b>{rec.vitals.pulse}bpm</b></div>
                </div>

                {/* Primary Concern */}
                <div className="mt-2 text-xs text-slate-800 font-semibold">
                  {rec.triage.primaryConcern}
                </div>

                {/* Action buttons */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => setActiveTeleconsultPatient(rec)}
                    className="flex-1 bg-[#0A3871] hover:bg-[#104382] text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1"
                  >
                    <Video className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tele-Consult</span>
                  </button>
                  <a
                    href={`tel:${rec.contact}`}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center"
                    title="Call ASHA / Patient"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h3 className="font-extrabold text-base text-[#0A3871] mb-1">
              Restock Medicine Inventory
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Dispatching from District Central Warehouse ({restockModalItem.district})
            </p>

            <form onSubmit={handleRestockSubmit} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[10px] block">Medicine</span>
                <span className="font-bold text-sm text-slate-900 block">{restockModalItem.name}</span>
                <span className="text-slate-500">Current Stock: <b>{restockModalItem.currentStock} {restockModalItem.unit}</b> (Min: {restockModalItem.minThreshold})</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantity to Add ({restockModalItem.unit})</label>
                <input
                  type="number"
                  required
                  min="10"
                  max="10000"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#0A3871] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockModalItem(null)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 rounded-lg"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tele-Consultation Modal */}
      {activeTeleconsultPatient && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#0A3871] to-[#104382] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-amber-400 animate-pulse" />
                <h3 className="font-black text-sm sm:text-base">
                  Rural Tele-Consultation: {activeTeleconsultPatient.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveTeleconsultPatient(null)}
                className="text-white hover:text-slate-300 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Simulated Video feed */}
              <div className="w-full h-48 bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center text-white">
                <div className="text-center">
                  <span className="w-12 h-12 rounded-full bg-slate-800 inline-flex items-center justify-center mb-2">
                    🩺
                  </span>
                  <div className="font-bold text-sm">ASHA Sangini Tablet Feed Connected</div>
                  <div className="text-emerald-400 text-xs mt-1">● 108Kbps Low-Bandwidth Pada Uplink Active</div>
                </div>
                <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-black">
                  LIVE
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">ASHA Triage Rationale:</span>
                <p className="text-slate-600">{activeTeleconsultPatient.triage.clinicalRationale}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Doctor Clinical Prescription & Dispatch Order
                </label>
                <textarea
                  rows={3}
                  value={doctorPrescriptionNote}
                  onChange={(e) => setDoctorPrescriptionNote(e.target.value)}
                  placeholder="Enter medical orders (e.g. Administer 10 vials ASV immediately; Arrange 108 transfer to Sub-District Hospital Aheri)..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-[#0A3871] focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    alert(`Prescription order dispatched to ASHA Sangini at ${activeTeleconsultPatient.village}.`);
                    setActiveTeleconsultPatient(null);
                    setDoctorPrescriptionNote('');
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-lg flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Order to ASHA & Sub-Centre</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
