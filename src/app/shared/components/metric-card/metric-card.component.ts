import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="metric-card" [class]="'variant-' + variant">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <span class="metric-title">{{ title }}</span>
        <div class="metric-icon-box">
          <i [class]="icon"></i>
        </div>
      </div>
      <div class="metric-value-row">
        <span class="metric-value">{{ value }}</span>
        @if (unit) {
          <span class="metric-unit">{{ unit }}</span>
        }
      </div>
      @if (subtext) {
        <div class="metric-subtext mt-2">
          @if (trendIcon) {
            <i [class]="trendIcon + ' me-1'" [class.text-success]="trendPositive" [class.text-danger]="!trendPositive"></i>
          }
          <span>{{ subtext }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .metric-card {
      background: var(--cp-surface, #ffffff);
      border: 1px solid var(--cp-border, #e2e8f0);
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
    }
    .metric-title {
      font-size: 0.85rem;
      color: var(--cp-text-muted, #64748b);
      font-weight: 600;
    }
    .metric-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .metric-value-row {
      display: flex;
      align-items: baseline;
      gap: 0.35rem;
    }
    .metric-value {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--cp-text, #0f172a);
      line-height: 1.1;
      letter-spacing: -0.02em;
    }
    .metric-unit {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--cp-text-muted, #64748b);
    }
    .metric-subtext {
      font-size: 0.78rem;
      color: var(--cp-text-muted, #64748b);
      display: flex;
      align-items: center;
    }

    /* Variants */
    .variant-primary .metric-icon-box { background: rgba(14, 165, 233, 0.12); color: #0284c7; }
    .variant-primary { border-top: 4px solid #0ea5e9; }

    .variant-success .metric-icon-box { background: rgba(16, 185, 129, 0.12); color: #059669; }
    .variant-success { border-top: 4px solid #10b981; }

    .variant-warning .metric-icon-box { background: rgba(245, 158, 11, 0.12); color: #d97706; }
    .variant-warning { border-top: 4px solid #f59e0b; }

    .variant-danger .metric-icon-box { background: rgba(239, 68, 68, 0.12); color: #dc2626; }
    .variant-danger { border-top: 4px solid #ef4444; }

    .variant-indigo .metric-icon-box { background: rgba(99, 102, 241, 0.12); color: #4f46e5; }
    .variant-indigo { border-top: 4px solid #6366f1; }
  `]
})
export class MetricCardComponent {
  @Input() title = '';
  @Input() value: string | number = '';
  @Input() unit?: string;
  @Input() icon = 'bi-activity';
  @Input() variant: 'primary' | 'success' | 'warning' | 'danger' | 'indigo' = 'primary';
  @Input() subtext?: string;
  @Input() trendIcon?: string;
  @Input() trendPositive = true;
}
