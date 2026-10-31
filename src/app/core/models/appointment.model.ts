export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'waiting'
  | 'in-consultation'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export type TriagePriority = 'routine' | 'urgent' | 'emergency';

export interface VitalSigns {
  systolicBp: number; // mmHg (e.g. 120)
  diastolicBp: number; // mmHg (e.g. 80)
  pulseRate: number; // bpm (e.g. 72)
  bloodGlucose?: number; // mg/dL (e.g. 110)
  temperature: number; // Celsius (e.g. 37.1)
  oxygenSaturation: number; // % (e.g. 98)
  weightKg: number; // kg
  heightCm: number; // cm
  bmi?: number; // computed
  bmiCategoryAr?: string;
  measuredAt?: string;
}

export interface MedicalIntake {
  symptoms: string;
  chronicDiseases: string[];
  currentMedications: string[];
  triageSeverity: 1 | 2 | 3 | 4 | 5; // 1 = mildest, 5 = severe
  uploadedLabPhotos: string[]; // Base64 strings
}

export interface Appointment {
  id: string;
  ticketNumber: string; // e.g. "CARD-102"
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  department: string;
  departmentArabic: string;
  roomNumber: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:mm
  status: AppointmentStatus;
  priority: TriagePriority;
  intake: MedicalIntake;
  vitals?: VitalSigns;
  isWalkIn: boolean;
  bookedAt: string;
  checkedInAt?: string;
  completedAt?: string;
  otpVerified: boolean;
  consultationNotes?: string;
  prescriptionId?: string;
  invoiceId?: string;
}
