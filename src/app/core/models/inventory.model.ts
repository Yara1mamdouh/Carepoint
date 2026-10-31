export type DosageForm =
  | 'tablets'
  | 'capsules'
  | 'syrup'
  | 'injection'
  | 'ointment'
  | 'inhaler'
  | 'drops';

export interface PharmacyBranch {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string; // e.g. "MAIN", "ER", "OR"
  isDefault: boolean;
  location: string;
  description?: string;
}

export interface MedicationInventory {
  id: string;
  tradeName: string;
  genericName: string;
  dosageForm: DosageForm;
  dosageFormArabic: string;
  strength: string; // e.g. "500 mg", "10 mg/ml"
  batchNumber: string;
  skuBarcode?: string; // Barcode / SKU for rapid scanning
  currentStock: number;
  minThreshold: number; // Low stock alert threshold
  unitPriceEgp: number;
  expiryDate: string; // YYYY-MM-DD
  category: string;
  manufacturer: string;
  lastRestockedAt: string;
  pharmacyBranchId?: string; // Optional linkage to specific pharmacy branch
  branchName?: string;
}

export interface StockTransaction {
  id: string;
  medicationId: string;
  medicationName: string;
  pharmacyBranchId?: string;
  type: 'dispense' | 'restock' | 'adjustment' | 'disposal';
  quantityChange: number;
  resultingStock: number;
  prescriptionId?: string;
  reason: string;
  timestamp: string;
  performedBy: string;
}

