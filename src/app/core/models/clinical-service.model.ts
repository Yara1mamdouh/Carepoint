export type ServiceCategory = 'consultation' | 'procedure' | 'lab-test' | 'radiology';

export interface ClinicalService {
  id: string;
  code: string; // e.g. "SRV-CONS-01", "LAB-CBC", "RAD-XRAY-01"
  nameAr: string;
  nameEn: string;
  category: ServiceCategory;
  departmentId?: string;
  departmentNameAr?: string;
  priceEgp: number;
  normalRange?: string; // e.g. "13 - 17 g/dL", "< 5.7 %"
  unit?: string;        // e.g. "mg/dL", "U/L", "%"
  descriptionAr?: string;
  isActive: boolean;
  createdAt: string;
}
