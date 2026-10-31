export type DepartmentType =
  | 'dental'
  | 'cardiology'
  | 'pediatrics'
  | 'orthopedics'
  | 'general'
  | 'dermatology'
  | string;

export interface Doctor {
  id: string;
  name: string;
  title: string;
  department: DepartmentType;
  departmentArabic: string;
  roomNumber: string;
  consultationFee: number;
  rating: number;
  reviewsCount: number;
  avatarUrl: string;
  workingDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  shiftStart: string; // e.g. "09:00"
  shiftEnd: string; // e.g. "21:00"
  slotDurationMinutes: number; // 15, 20, 30, 45, 60 mins
  lunchInterval?: {
    start: string; // e.g. "14:00"
    end: string;   // e.g. "15:00"
  };
  vacationDays: string[]; // ['2026-09-25', '2026-09-26']
  licenseNumber: string;
  bio: string;
  phone: string;
  email: string;
}

export interface DepartmentInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  descriptionAr: string;
  accentColor: string;
  isActive?: boolean;
}

