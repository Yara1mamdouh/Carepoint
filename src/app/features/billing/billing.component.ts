import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceGeneratorComponent } from './invoice-generator.component';
import { DailyRevenueSummaryComponent } from './daily-revenue-summary.component';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, InvoiceGeneratorComponent, DailyRevenueSummaryComponent],
  template: `
    <div class="billing-wrapper">
      <div class="px-3 px-md-4 pt-3">
        <ul class="nav nav-tabs border-bottom mb-0" role="tablist">
          <li class="nav-item" role="presentation">
            <button
              class="nav-link fw-bold"
              [class.active]="activeTab === 'invoicing'"
              (click)="activeTab = 'invoicing'"
            >
              <i class="bi bi-receipt me-1 text-primary"></i>
              إنشاء وتحصيل فاتورة
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button
              class="nav-link fw-bold"
              [class.active]="activeTab === 'revenue'"
              (click)="activeTab = 'revenue'"
            >
              <i class="bi bi-graph-up-arrow me-1 text-success"></i>
              تقارير ومؤشرات الإيرادات
            </button>
          </li>
        </ul>
      </div>

      <div>
        @if (activeTab === 'invoicing') {
          <app-invoice-generator></app-invoice-generator>
        } @else {
          <app-daily-revenue-summary></app-daily-revenue-summary>
        }
      </div>
    </div>
  `,
  styles: [`
    .nav-tabs .nav-link {
      color: var(--cp-text-muted, #64748b);
      padding: 0.75rem 1.25rem;
      border-radius: 12px 12px 0 0;
    }
    .nav-tabs .nav-link.active {
      color: var(--cp-text, #0f172a);
      background: var(--cp-surface, #ffffff);
      border-color: var(--cp-border, #e2e8f0) var(--cp-border, #e2e8f0) transparent;
    }
  `]
})
export class BillingComponent {
  activeTab: 'invoicing' | 'revenue' = 'invoicing';
}
