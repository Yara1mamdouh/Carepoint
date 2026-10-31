import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'danger' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  timestamp: Date;
  durationMs?: number;
  actionText?: string;
  actionCallback?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly _toasts = signal<ToastMessage[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(toast: Omit<ToastMessage, 'id' | 'timestamp'>): string {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    const duration = toast.durationMs ?? 4500;
    const newToast: ToastMessage = {
      ...toast,
      id,
      timestamp: new Date()
    };

    this._toasts.update(current => [newToast, ...current]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  success(title: string, message: string, durationMs = 4500): string {
    return this.show({ type: 'success', title, message, durationMs });
  }

  error(title: string, message: string, durationMs = 6000): string {
    return this.show({ type: 'danger', title, message, durationMs });
  }

  warning(title: string, message: string, durationMs = 5000): string {
    return this.show({ type: 'warning', title, message, durationMs });
  }

  info(title: string, message: string, durationMs = 4500): string {
    return this.show({ type: 'info', title, message, durationMs });
  }

  dismiss(id: string): void {
    this._toasts.update(current => current.filter(t => t.id !== id));
  }

  clearAll(): void {
    this._toasts.set([]);
  }
}
