import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'medicalDate',
  standalone: true
})
export class MedicalDatePipe implements PipeTransform {
  transform(
    value: string | Date | null | undefined,
    format: 'full' | 'short' | 'time' | 'relative' = 'full'
  ): string {
    if (!value) return '-';

    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) {
      // If simple YYYY-MM-DD string
      return String(value);
    }

    if (format === 'time') {
      return date.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    if (format === 'relative') {
      const diffMs = Date.now() - date.getTime();
      const diffMin = Math.round(diffMs / 60000);
      if (diffMin < 1) return 'الآن';
      if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
      const diffHours = Math.round(diffMin / 60);
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      const diffDays = Math.round(diffHours / 24);
      return `منذ ${diffDays} يوم`;
    }

    if (format === 'short') {
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    return date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
