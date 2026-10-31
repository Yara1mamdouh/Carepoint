export type PaymentMethod = 'cash' | 'card' | 'insurance';
export type PaymentStatus = 'unpaid' | 'partially-paid' | 'paid';

export interface InvoiceItem {
  id: string;
  category: 'consultation' | 'medication' | 'lab-test' | 'procedure' | 'radiology';
  categoryArabic: string;
  description: string;
  quantity: number;
  unitPriceEgp: number;
  totalPriceEgp: number;
}

export interface InsuranceDetails {
  companyName: string;
  policyNumber: string;
  coveragePercentage: number; // e.g. 80 means insurance pays 80%, patient pays 20%
  approvalCode?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-2026-1049"
  appointmentId?: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId?: string;
  doctorName?: string;
  items: InvoiceItem[];
  subtotalEgp: number;
  taxRatePercent: number; // 14%
  taxAmountEgp: number;
  discountCode?: string;
  discountAmountEgp: number;
  grandTotalEgp: number;
  insuranceCoverageAmountEgp: number;
  patientPayableEgp: number;
  amountPaidEgp: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  insuranceDetails?: InsuranceDetails;
  issuedAt: string;
  paidAt?: string;
  qrPayload: string;
}
