export interface PrescriptionItem {
  id: string;
  medicationId: string;
  tradeName: string;
  genericName: string;
  dosage: string; // e.g. "500 mg", "10 ml"
  frequency: string; // e.g. "مرة واحدة يومياً (OD)", "مرتين يومياً (BID)", "3 مرات يومياً (TID)", "عند اللزوم (PRN)"
  frequencyCode: 'OD' | 'BID' | 'TID' | 'QID' | 'PRN' | 'Q8H';
  durationDays: number; // e.g. 7
  instructions: string; // e.g. "بعد الوجبات مع كوب ماء وفير"
  quantityToDispense: number;
}

export interface DrugInteractionAlert {
  severity: 'low' | 'moderate' | 'severe';
  drugA: string;
  drugB: string;
  descriptionAr: string;
  actionRecommendation: string;
}

export interface DiagnosticCode {
  code: string; // ICD-10 e.g. "I10", "E11.9", "J06.9"
  descriptionAr: string;
  descriptionEn: string;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string; // e.g. "RX-2026-0891"
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  doctorId: string;
  doctorName: string;
  doctorLicense: string;
  departmentArabic: string;
  diagnoses: DiagnosticCode[];
  items: PrescriptionItem[];
  interactionsFound: DrugInteractionAlert[];
  clinicalNotes: string;
  issuedAt: string;
  isDispensed: boolean;
  dispensedAt?: string;
  dispensedBy?: string;
  qrHash: string;
}
