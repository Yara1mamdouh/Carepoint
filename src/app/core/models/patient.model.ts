export type Gender = 'male' | 'female';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface Patient {
  id: string;
  fileNumber: string; // e.g. "PT-2026-0042"
  nationalId: string;
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: Gender;
  bloodGroup: BloodGroup;
  chronicDiseases: string[];
  allergies: string[];
  currentMedications: string[];
  emergencyContact: EmergencyContact;
  medicalHistoryNotes?: string;
  registeredVia: 'online' | 'walk-in';
  createdAt: string;
}
