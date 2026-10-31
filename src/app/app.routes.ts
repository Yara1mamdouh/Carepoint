import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'reception'
  },
  {
    path: 'booking',
    loadComponent: () =>
      import('./features/patient-portal/booking-stepper.component').then(
        m => m.BookingStepperComponent
      ),
    title: 'حجز موعد | CarePoint Pro'
  },
  {
    path: 'reception',
    loadComponent: () =>
      import('./features/reception-desk/live-queue-board.component').then(
        m => m.LiveQueueBoardComponent
      ),
    title: 'مكتب الاستقبال والطوارئ | CarePoint Pro'
  },
  {
    path: 'doctor',
    loadComponent: () =>
      import('./features/doctor-workspace/consultation-room.component').then(
        m => m.ConsultationRoomComponent
      ),
    title: 'عيادة الطبيب والسجل الطبي | CarePoint Pro'
  },
  {
    path: 'pharmacy-lab',
    loadComponent: () =>
      import('./features/pharmacy-lab/pharmacy-lab.component').then(
        m => m.PharmacyLabComponent
      ),
    title: 'الصيدلية والمختبر | CarePoint Pro'
  },
  {
    path: 'billing',
    loadComponent: () =>
      import('./features/billing/billing.component').then(
        m => m.BillingComponent
      ),
    title: 'الحسابات والفواتير | CarePoint Pro'
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin-engine/admin-suite.component').then(
        m => m.AdminSuiteComponent
      ),
    title: 'لوحة الإدارة الشاملة (Admin Engine) | CarePoint Pro'
  },
  {
    path: '**',
    redirectTo: 'reception'
  }
];
