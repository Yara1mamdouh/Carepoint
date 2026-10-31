export type LabStatus = 'ordered' | 'sample-collected' | 'processing' | 'ready';
export type LabCategory = 'hematology' | 'biochemistry' | 'radiology' | 'cardiac' | 'urinalysis';
export type InterpretationType = 'normal' | 'low' | 'high' | 'critical';

export interface LabOrderItem {
  testId: string;
  testNameAr: string;
  testNameEn: string;
  category: LabCategory;
  normalRange: string;
  priceEgp: number;
  resultValue?: string;
  resultUnit?: string;
  interpretation?: InterpretationType;
  labTechnicianNotes?: string;
}

export interface LabOrder {
  id: string;
  orderNumber: string; // e.g. "LAB-2026-0312"
  appointmentId?: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  status: LabStatus;
  items: LabOrderItem[];
  orderedAt: string;
  sampleCollectedAt?: string;
  resultsCompletedAt?: string;
  patientNotifiedAt?: string;
  uploadedReports: string[]; // Base64 or scanned attachments
  totalCostEgp: number;
}
