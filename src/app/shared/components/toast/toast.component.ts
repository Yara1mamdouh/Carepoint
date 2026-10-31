import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, ToastMessage } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container-fixed">
      @for (toast of notificationService.toasts(); track toast.id) {
        <div class="toast-card-custom" [class]="'toast-' + toast.type">
          <div class="toast-icon-wrapper">
            @switch (toast.type) {
              @case ('success') { <i class="bi bi-check-circle-fill"></i> }
              @case ('danger') { <i class="bi bi-exclamation-octagon-fill"></i> }
              @case ('warning') { <i class="bi bi-exclamation-triangle-fill"></i> }
              @case ('info') { <i class="bi bi-info-circle-fill"></i> }
            }
          </div>
          <div class="toast-content-wrapper">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
            @if (toast.actionText && toast.actionCallback) {
              <button class="btn btn-sm btn-outline-light mt-2 py-0 px-2" (click)="toast.actionCallback()">
                {{ toast.actionText }}
              </button>
            }
          </div>
          <button class="toast-close-btn" (click)="notificationService.dismiss(toast.id)">
            <i class="bi bi-x"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container-fixed {
      position: fixed;
      top: 1.5rem;
      left: 1.5rem;
      z-index: 1090;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 420px;
      width: calc(100vw - 3rem);
      pointer-events: none;
    }
    .toast-card-custom {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      padding: 1rem 1.25rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25);
      border: 1px solid transparent;
      animation: slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      backdrop-filter: blur(8px);
    }
    .toast-success { background: #064e3b; color: #ecfdf5; border-color: #059669; }
    .toast-danger { background: #7f1d1d; color: #fef2f2; border-color: #dc2626; }
    .toast-warning { background: #78350f; color: #fffbeb; border-color: #d97706; }
    .toast-info { background: #1e1b4b; color: #eef2ff; border-color: #4f46e5; }

    .toast-icon-wrapper {
      font-size: 1.35rem;
      line-height: 1;
      margin-top: 2px;
    }
    .toast-content-wrapper {
      flex: 1;
    }
    .toast-title {
      font-weight: 700;
      font-size: 0.95rem;
      margin-bottom: 0.2rem;
    }
    .toast-message {
      font-size: 0.84rem;
      opacity: 0.92;
      line-height: 1.4;
    }
    .toast-close-btn {
      background: transparent;
      border: none;
      color: inherit;
      opacity: 0.7;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
    .toast-close-btn:hover {
      opacity: 1;
    }
    @keyframes slideInLeft {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastContainerComponent {
  readonly notificationService = inject(NotificationService);
}
