import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicationStockTableComponent } from './medication-stock-table.component';
import { LabOrderManagerComponent } from './lab-order-manager.component';

@Component({
  selector: 'app-pharmacy-lab',
  standalone: true,
  imports: [CommonModule, MedicationStockTableComponent, LabOrderManagerComponent],
  template: `
    <div class="pharmacy-lab-wrapper">
      <div class="px-3 px-md-4 pt-3">
        <ul class="nav nav-tabs border-bottom mb-0" role="tablist">
          <li class="nav-item" role="presentation">
            <button
              class="nav-link fw-bold"
              [class.active]="activeTab === 'pharmacy'"
              (click)="activeTab = 'pharmacy'"
            >
              <i class="bi bi-capsule me-1 text-primary"></i>
              الصيدلية والمخزون الدوائي
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button
              class="nav-link fw-bold"
              [class.active]="activeTab === 'lab'"
              (click)="activeTab = 'lab'"
            >
              <i class="bi bi-eyedropper me-1 text-info"></i>
              مختبر التحاليل والفحوصات
            </button>
          </li>
        </ul>
      </div>

      <div>
        @if (activeTab === 'pharmacy') {
          <app-medication-stock-table></app-medication-stock-table>
        } @else {
          <app-lab-order-manager></app-lab-order-manager>
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
export class PharmacyLabComponent {
  activeTab: 'pharmacy' | 'lab' = 'pharmacy';
}
