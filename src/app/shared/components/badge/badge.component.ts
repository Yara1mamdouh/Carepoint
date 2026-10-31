import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="'badge-pill ' + variantClass" [class.pulse]="pulse">
      @if (icon) {
        <i [class]="icon + ' me-1'"></i>
      }
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.785rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      transition: all 0.2s ease-in-out;
    }
    .badge-primary { background: rgba(14, 165, 233, 0.15); color: #0284c7; border: 1px solid rgba(14, 165, 233, 0.3); }
    .badge-success { background: rgba(16, 185, 129, 0.15); color: #059669; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-warning { background: rgba(245, 158, 11, 0.15); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-danger { background: rgba(239, 68, 68, 0.15); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.3); }
    .badge-info { background: rgba(99, 102, 241, 0.15); color: #4f46e5; border: 1px solid rgba(99, 102, 241, 0.3); }
    .badge-neutral { background: var(--cp-surface-2, #f1f5f9); color: var(--cp-text-muted, #64748b); border: 1px solid var(--cp-border, #e2e8f0); }

    .pulse {
      animation: pulse-ring 1.8s infinite cubic-bezier(0.45, 0, 0.55, 1);
    }
    @keyframes pulse-ring {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
      70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
  `]
})
export class BadgeComponent {
  @Input() variant: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'primary';
  @Input() icon?: string;
  @Input() pulse = false;

  get variantClass(): string {
    return `badge-${this.variant}`;
  }
}
