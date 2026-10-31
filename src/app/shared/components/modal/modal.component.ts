import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="modal-backdrop-custom" (click)="onBackdropClick($event)">
        <div class="modal-dialog-custom" [class.modal-lg]="size === 'lg'" [class.modal-xl]="size === 'xl'" [class.modal-sm]="size === 'sm'">
          <div class="modal-content-custom">
            <!-- Modal Header -->
            <div class="modal-header-custom">
              <div class="d-flex align-items-center gap-2">
                @if (headerIcon) {
                  <div class="header-icon-box">
                    <i [class]="headerIcon"></i>
                  </div>
                }
                <div>
                  <h5 class="modal-title-custom m-0">{{ title }}</h5>
                  @if (subtitle) {
                    <p class="modal-subtitle-custom m-0">{{ subtitle }}</p>
                  }
                </div>
              </div>
              <button type="button" class="btn-close-custom" aria-label="Close" (click)="close()">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <!-- Modal Body -->
            <div class="modal-body-custom">
              <ng-content select="[body]"></ng-content>
              <ng-content></ng-content>
            </div>

            <!-- Modal Footer -->
            @if (showFooter) {
              <div class="modal-footer-custom">
                <ng-content select="[footer]"></ng-content>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop-custom {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(4px);
      z-index: 1050;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      animation: fadeIn 0.2s ease-out;
    }
    .modal-dialog-custom {
      width: 100%;
      max-width: 550px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }
    .modal-dialog-custom.modal-sm { max-width: 400px; }
    .modal-dialog-custom.modal-lg { max-width: 800px; }
    .modal-dialog-custom.modal-xl { max-width: 1140px; }

    .modal-content-custom {
      background: var(--cp-surface, #ffffff);
      color: var(--cp-text, #0f172a);
      border-radius: 16px;
      border: 1px solid var(--cp-border, #e2e8f0);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .modal-header-custom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--cp-border, #e2e8f0);
      background: var(--cp-surface-header, #f8fafc);
    }
    .header-icon-box {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: rgba(14, 165, 233, 0.12);
      color: #0284c7;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .modal-title-custom {
      font-weight: 700;
      font-size: 1.15rem;
    }
    .modal-subtitle-custom {
      font-size: 0.85rem;
      color: var(--cp-text-muted, #64748b);
    }
    .btn-close-custom {
      background: transparent;
      border: none;
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--cp-text-muted, #64748b);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-close-custom:hover {
      background: rgba(0, 0, 0, 0.05);
      color: var(--cp-text, #0f172a);
    }
    .modal-body-custom {
      padding: 1.5rem;
      overflow-y: auto;
      max-height: calc(90vh - 150px);
    }
    .modal-footer-custom {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--cp-border, #e2e8f0);
      background: var(--cp-surface-header, #f8fafc);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleUp {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() headerIcon?: string;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() showFooter = true;
  @Input() closeOnBackdrop = true;

  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.isOpen = false;
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop && event.target === event.currentTarget) {
      this.close();
    }
  }
}
