import { Pipe, PipeTransform } from '@angular/core';

export interface StatusMetadata {
  labelAr: string;
  badgeClass: string;
  icon: string;
}

@Pipe({
  name: 'statusBadge',
  standalone: true
})
export class StatusBadgePipe implements PipeTransform {
  private readonly map: Record<string, StatusMetadata> = {
    // Appointment / Queue
    scheduled: { labelAr: 'مجدول', badgeClass: 'badge bg-secondary', icon: 'bi-clock' },
    confirmed: { labelAr: 'مؤكد', badgeClass: 'badge bg-primary', icon: 'bi-check-circle' },
    waiting: { labelAr: 'في الانتظار', badgeClass: 'badge bg-warning text-dark', icon: 'bi-hourglass-split' },
    'in-consultation': { labelAr: 'في العيادة مع الطبيب', badgeClass: 'badge bg-info text-dark', icon: 'bi-stethoscope' },
    completed: { labelAr: 'مكتمل الزيارة', badgeClass: 'badge bg-success', icon: 'bi-check-all' },
    cancelled: { labelAr: 'ملغي', badgeClass: 'badge bg-danger', icon: 'bi-x-circle' },
    'no-show': { labelAr: 'لم يحضر', badgeClass: 'badge bg-dark', icon: 'bi-person-x' },

    // Triage Priority
    routine: { labelAr: 'اعتيادي', badgeClass: 'badge bg-light text-dark border', icon: 'bi-circle' },
    urgent: { labelAr: 'عاجل', badgeClass: 'badge bg-warning text-dark', icon: 'bi-exclamation-triangle' },
    emergency: { labelAr: 'طوارئ قصوى 🚨', badgeClass: 'badge bg-danger text-white pulse-badge', icon: 'bi-lightning-fill' },

    // Lab Status
    ordered: { labelAr: 'تم طلب الفحص', badgeClass: 'badge bg-secondary', icon: 'bi-file-earmark-medical' },
    'sample-collected': { labelAr: 'تم سحب العينة', badgeClass: 'badge bg-info text-dark', icon: 'bi-droplet' },
    processing: { labelAr: 'قيد التحليل المعملي', badgeClass: 'badge bg-warning text-dark', icon: 'bi-gear-wide-connected' },
    ready: { labelAr: 'النتائج معتمدة وجاهزة', badgeClass: 'badge bg-success', icon: 'bi-check2-circle' },

    // Payment Status
    unpaid: { labelAr: 'غير مسدد', badgeClass: 'badge bg-danger', icon: 'bi-dash-circle' },
    'partially-paid': { labelAr: 'سداد جزئي', badgeClass: 'badge bg-warning text-dark', icon: 'bi-pie-chart' },
    paid: { labelAr: 'مسدد بالكامل', badgeClass: 'badge bg-success', icon: 'bi-receipt' }
  };

  transform(status: string | null | undefined, returnField: 'label' | 'class' | 'icon' | 'all' = 'label'): any {
    if (!status) return returnField === 'class' ? 'badge bg-secondary' : '-';

    const normalized = String(status).toLowerCase();
    const meta = this.map[normalized] || {
      labelAr: normalized,
      badgeClass: 'badge bg-secondary',
      icon: 'bi-tag'
    };

    if (returnField === 'class') return meta.badgeClass;
    if (returnField === 'icon') return meta.icon;
    if (returnField === 'all') return meta;
    return meta.labelAr;
  }
}
