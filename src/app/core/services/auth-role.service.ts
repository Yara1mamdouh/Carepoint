import { Injectable, signal } from '@angular/core';

export type UserRole = 'admin' | 'receptionist' | 'doctor' | 'pharmacist' | 'patient';

export interface UserSession {
  id: string;
  name: string;
  role: UserRole;
  roleTitleAr: string;
  avatar: string;
  assignedDoctorId?: string; // If role is doctor
}

@Injectable({
  providedIn: 'root'
})
export class AuthRoleService {
  readonly currentRole = signal<UserRole>('receptionist');

  readonly availableRoles: { role: UserRole; titleAr: string; icon: string; description: string }[] = [
    { role: 'receptionist', titleAr: 'موظف الاستقبال والطوارئ', icon: 'bi-headset', description: 'إدارة طابور الانتظار، الحجز الفوري، وإرسال قسائم الواتساب' },
    { role: 'doctor', titleAr: 'طبيب استشاري (العيادة)', icon: 'bi-stethoscope', description: 'فحص العلامات الحيوية، السجل الطبي، وكتابة الروشتات الإلكترونية' },
    { role: 'pharmacist', titleAr: 'الصيدلي والمختبر', icon: 'bi-capsule', description: 'صرف الأدوية، تتبع الأرصدة، واعتماد نتائج التحاليل' },
    { role: 'admin', titleAr: 'مدير النظام المالي والإداري', icon: 'bi-shield-lock', description: 'الفواتير والحسابات، مؤشرات الإيراد اليومي، والإعدادات' },
    { role: 'patient', titleAr: 'بوابة المريض (حجز إلكتروني)', icon: 'bi-person-heart', description: 'حجز المواعيد عبر الإنترنت، التحقق برمز OTP، واستعراض التذكرة' }
  ];

  setRole(role: UserRole): void {
    this.currentRole.set(role);
  }

  hasRole(roles: UserRole[]): boolean {
    const current = this.currentRole();
    if (current === 'admin') return true; // Admin has universal access
    return roles.includes(current);
  }
}
