export type Language = 'mr' | 'en' | 'hi';

export type UserRole = 'patient' | 'asha' | 'doctor';

export type TriageLevel = 'RED' | 'YELLOW' | 'GREEN';

export type District = 'Gadchiroli' | 'Nandurbar';

export interface DoctorInfo {
  name: string;
  specialization: string;
  qualification: string;
  phone: string;
  availableNow: boolean;
  status?: 'Available' | 'On Round' | 'Tele-OPD';
  lastUpdated?: string;
  timing: string;
  telemedicineActive: boolean;
}

export interface PHCLocation {
  id: string;
  name: string;
  marathiName: string;
  district: District;
  taluka: string;
  marathiTaluka: string;
  lat: number;
  lng: number;
  type: 'PHC' | 'Rural Hospital' | 'Sub-District Hospital';
  doctor: DoctorInfo;
  secondaryDoctor?: DoctorInfo;
  beds: number;
  ambulanceAvailable: boolean;
  teleMedicineEnabled: boolean;
  antivenomStock: number; // vials
  deliveryAvailable24x7: boolean;
  activeTokensWaiting: number;
  phone: string;
  address: string;
  marathiAddress: string;
  distanceKm?: number;
  rating: number;
}

export interface OPDToken {
  id: string;
  tokenNumber: string;
  patientName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  village: string;
  taluka: string;
  district: District;
  phcId: string;
  phcName: string;
  doctorName: string;
  appointmentDate: string;
  timeSlot: string;
  status: 'Waiting' | 'In Consultation' | 'Completed' | 'Emergency Priority';
  symptomSummary: string;
  bookedAt: string;
  estimatedWaitMinutes: number;
}

export interface VitalsData {
  bpSystolic: number;
  bpDiastolic: number;
  pulse: number;
  spO2: number;
  bloodSugar: number;
  temp: number;
  hemoglobin: number;
  weight: number;
  height: number;
}

export interface TriageResult {
  triageLevel: TriageLevel;
  score: number;
  primaryConcern: string;
  clinicalRationale: string;
  ashaAction: string;
  referralNeeded: boolean;
  recommendedFacility: string;
  ashaKitMedicines: string[];
  marathiInstructions: string;
  dangerSigns: string[];
}

export interface AshaPatientRecord {
  id: string;
  abhaId?: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  village: string;
  pada: string;
  taluka: string;
  district: District;
  contact: string;
  isPregnant: boolean;
  pregnancyTrimester?: number;
  isChild: boolean;
  hasSickleCell: boolean;
  vitals: VitalsData;
  symptoms: string[];
  triage: TriageResult;
  syncedToCloud: boolean;
  recordedAt: string;
  notes?: string;
}

export interface MedicineItem {
  id: string;
  name: string;
  marathiName: string;
  category: 'Critical Antidote' | 'Antimalarial' | 'Antibiotic' | 'IV Fluid' | 'Maternal/Child' | 'General Analgesic';
  currentStock: number;
  minThreshold: number;
  unit: string;
  status: 'Adequate' | 'Low Stock' | 'Critical Stockout';
  batchNumber: string;
  expiryDate: string;
  district: District;
  phcId?: string;
}

export interface OutbreakAlert {
  id: string;
  disease: string;
  marathiDisease: string;
  district: District;
  taluka: string;
  activeCases: number;
  trend: 'Rising' | 'Stable' | 'Decreasing';
  alertLevel: 'High' | 'Medium' | 'Low';
  lat: number;
  lng: number;
  radiusKm: number;
  reportedDate: string;
}
