import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OtpSecurityService } from '../../services/otp-security.service';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="otp-card p-4 rounded-4 shadow-sm border bg-surface">
      <!-- Header -->
      <div class="text-center mb-4">
        <div class="otp-icon-circle mx-auto mb-3">
          <i class="bi bi-shield-check text-primary"></i>
        </div>
        <h5 class="fw-bold mb-1">التحقق من رقم الهاتف والبريد</h5>
        <p class="text-muted small mb-0">
          تم إرسال رمز الأمان المكون من 6 أرقام إلى:
          <br />
          <strong class="text-dark">{{ recipientEmail }}</strong>
          @if (recipientPhone) {
            - <span class="dir-ltr text-dark">{{ recipientPhone }}</span>
          }
        </p>
      </div>

      <!-- Quick Simulator Box if OTP is active -->
      @if (otpService.activeOtp(); as active) {
        <div class="alert alert-info py-2 px-3 mb-3 d-flex align-items-center justify-content-between rounded-3 border-info border-opacity-25 small">
          <div>
            <i class="bi bi-lightning-charge-fill text-warning me-1"></i>
            <span>رمز الأمان الحالي: <strong class="fs-6 font-monospace">{{ active.code }}</strong></span>
          </div>
          <button type="button" class="btn btn-sm btn-outline-info py-0 px-2" (click)="autoFillCode(active.code)">
            تعبئة تلقائية
          </button>
        </div>
      }

      <!-- 6-Digit Input Grid -->
      <div class="otp-inputs-grid dir-ltr mb-3">
        @for (digit of digits; track $index) {
          <input
            type="text"
            inputmode="numeric"
            maxlength="1"
            class="otp-digit-input"
            [id]="'otp-input-' + $index"
            [(ngModel)]="digits[$index]"
            (input)="onDigitInput($index, $event)"
            (keydown)="onKeyDown($index, $event)"
            [disabled]="isSubmitting || isLocked"
          />
        }
      </div>

      <!-- Error Message -->
      @if (errorMessage) {
        <div class="alert alert-danger py-2 px-3 small text-center mb-3 rounded-3">
          <i class="bi bi-exclamation-circle-fill me-1"></i>
          {{ errorMessage }}
        </div>
      }

      <!-- Expiry Countdown & Resend -->
      <div class="d-flex align-items-center justify-content-between small text-muted mb-4 px-2">
        <div class="d-flex align-items-center gap-1">
          <i class="bi bi-stopwatch"></i>
          <span>صلاحية الرمز:</span>
          <strong [class.text-danger]="remainingSeconds < 60" class="font-monospace">
            {{ formatCountdown() }}
          </strong>
        </div>

        <button
          type="button"
          class="btn btn-link btn-sm p-0 text-decoration-none"
          [disabled]="remainingSeconds > 240 || isSubmitting"
          (click)="onResend()"
        >
          إعادة إرسال الرمز
        </button>
      </div>

      <!-- Submit Action -->
      <div class="d-grid gap-2">
        <button
          type="button"
          class="btn btn-primary py-2 fw-bold"
          [disabled]="!isCodeComplete() || isSubmitting || isLocked"
          (click)="verifyCode()"
        >
          @if (isSubmitting) {
            <span class="spinner-border spinner-border-sm me-1" role="status"></span>
            جاري التحقق...
          } @else {
            تأكيد الحجز النهائي
            <i class="bi bi-arrow-left ms-1"></i>
          }
        </button>

        @if (onCancel.observed) {
          <button type="button" class="btn btn-light text-muted btn-sm" (click)="onCancel.emit()">
            العودة وتعديل البيانات
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .otp-card {
      max-width: 440px;
      margin: 0 auto;
      background: var(--cp-surface, #ffffff);
      border-color: var(--cp-border, #e2e8f0);
    }
    .otp-icon-circle {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(14, 165, 233, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
    }
    .otp-inputs-grid {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
    }
    .otp-digit-input {
      width: 48px;
      height: 54px;
      font-size: 1.5rem;
      font-weight: 700;
      text-align: center;
      border-radius: 12px;
      border: 1px solid var(--cp-border, #cbd5e1);
      background: var(--cp-surface-2, #f8fafc);
      color: var(--cp-text, #0f172a);
      transition: all 0.2s ease;
    }
    .otp-digit-input:focus {
      outline: none;
      border-color: #0ea5e9;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.15);
    }
  `]
})
export class OtpVerificationComponent implements OnInit, OnDestroy {
  @Input() recipientEmail = '';
  @Input() recipientPhone = '';
  @Input() patientName = '';

  @Output() verified = new EventEmitter<void>();
  @Output() resendRequested = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  readonly otpService = inject(OtpSecurityService);

  digits: string[] = ['', '', '', '', '', ''];
  errorMessage = '';
  isSubmitting = false;
  isLocked = false;

  remainingSeconds = 300; // 5 minutes
  private timerInterval: any = null;

  ngOnInit(): void {
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private startCountdown(): void {
    this.remainingSeconds = 300;
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
      } else {
        clearInterval(this.timerInterval);
        this.errorMessage = 'انتهت صلاحية رمز التحقق. يرجى النقر على إعادة الإرسال.';
      }
    }, 1000);
  }

  formatCountdown(): string {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  onDigitInput(index: number, event: any): void {
    const val = event.target.value;
    if (!/^\d*$/.test(val)) {
      this.digits[index] = '';
      return;
    }

    if (val && index < 5) {
      const nextInput = document.getElementById('otp-input-' + (index + 1));
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }

    if (this.isCodeComplete()) {
      this.verifyCode();
    }
  }

  onKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digits[index] && index > 0) {
      const prevInput = document.getElementById('otp-input-' + (index - 1));
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  }

  isCodeComplete(): boolean {
    return this.digits.every(d => d.length === 1 && /^\d$/.test(d));
  }

  autoFillCode(code: string): void {
    const chars = code.split('');
    for (let i = 0; i < 6; i++) {
      this.digits[i] = chars[i] || '';
    }
    this.verifyCode();
  }

  verifyCode(): void {
    if (!this.isCodeComplete() || this.isSubmitting) return;

    this.errorMessage = '';
    this.isSubmitting = true;

    const fullCode = this.digits.join('');
    const result = this.otpService.verifyOtp(fullCode);

    setTimeout(() => {
      this.isSubmitting = false;
      if (result.success) {
        this.verified.emit();
      } else {
        this.errorMessage = result.message;
        if (result.remainingAttempts === 0) {
          this.isLocked = true;
        }
      }
    }, 500);
  }

  onResend(): void {
    this.digits = ['', '', '', '', '', ''];
    this.errorMessage = '';
    this.isLocked = false;
    this.otpService.dispatchOtp(this.recipientEmail, this.recipientPhone, this.patientName);
    this.startCountdown();
    this.resendRequested.emit();
  }
}
