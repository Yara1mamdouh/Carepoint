import { Injectable, signal, inject } from '@angular/core';
import { NotificationService } from '../core/services/notification.service';
import emailjs from '@emailjs/browser';

export interface OtpRecord {
  recipientEmail: string;
  recipientPhone: string;
  code: string;
  expiresAt: number; // Unix timestamp
  attemptsUsed: number;
  maxAttempts: number;
  isLocked: boolean;
  lockoutUntil?: number;
  dispatchedAt: number;
  deliveryMethod: 'emailjs' | 'simulated';
}

export interface EmailJsConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

@Injectable({
  providedIn: 'root'
})
export class OtpSecurityService {
  private readonly notifications = inject(NotificationService);

  private readonly STORAGE_CONFIG_KEY = 'carepoint_emailjs_config';
  private currentOtpRecord = signal<OtpRecord | null>(null);

  // Read-only signal for simulation / audit overlay
  readonly activeOtp = this.currentOtpRecord.asReadonly();

  // EmailJS configuration
  private config: EmailJsConfig = this.loadConfig();

  private loadConfig(): EmailJsConfig {
    if (typeof window === 'undefined') {
      return { serviceId: '', templateId: '', publicKey: '' };
    }
    const saved = localStorage.getItem(this.STORAGE_CONFIG_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      serviceId: '',
      templateId: '',
      publicKey: ''
    };
  }

  saveConfig(config: EmailJsConfig): void {
    this.config = config;
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_CONFIG_KEY, JSON.stringify(config));
    }
    this.notifications.success('تم الحفظ', 'تم تحديث إعدادات بوابة البريد الإلكتروني بنجاح.');
  }

  getConfig(): EmailJsConfig {
    return { ...this.config };
  }

  /**
   * Generates a 6-digit cryptographic PIN
   */
  private generateSecurePin(): string {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      const pin = 100000 + (array[0] % 900000);
      return pin.toString();
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generates and dispatches an OTP with 5-minute expiry and 3 attempts
   */
  async dispatchOtp(email: string, phone: string, patientName: string): Promise<{ success: boolean; simulatedCode?: string }> {
    const existing = this.currentOtpRecord();
    const now = Date.now();

    if (existing && existing.isLocked && existing.lockoutUntil && existing.lockoutUntil > now) {
      const waitSeconds = Math.ceil((existing.lockoutUntil - now) / 1000);
      this.notifications.error(
        'تم تعليق المحاولات',
        `تم استنفاد المحاولات السابقة. يرجى الانتظار ${waitSeconds} ثانية قبل طلب رمز جديد.`
      );
      return { success: false };
    }

    const pin = this.generateSecurePin();
    const durationMs = 5 * 60 * 1000; // 5 minutes

    const record: OtpRecord = {
      recipientEmail: email,
      recipientPhone: phone,
      code: pin,
      expiresAt: now + durationMs,
      attemptsUsed: 0,
      maxAttempts: 3,
      isLocked: false,
      dispatchedAt: now,
      deliveryMethod: this.hasLiveEmailJsCredentials() ? 'emailjs' : 'simulated'
    };

    this.currentOtpRecord.set(record);

    // Attempt delivery via EmailJS if configured
    if (this.hasLiveEmailJsCredentials()) {
      try {
        await emailjs.send(
          this.config.serviceId,
          this.config.templateId,
          {
            to_name: patientName,
            to_email: email,
            otp_code: pin,
            expiry_minutes: '5',
            clinic_name: 'CarePoint Pro Medical Center'
          },
          this.config.publicKey
        );
        this.notifications.success(
          'تم إرسال رمز التحقق',
          `تم إرسال رمز الأمان المكون من 6 أرقام إلى بريدك الإلكتروني (${email}).`
        );
        return { success: true };
      } catch (err) {
        console.warn('[OtpSecurityService] EmailJS dispatch failed, falling back to simulated display:', err);
      }
    }

    // Interactive fallback with copyable simulation toast
    this.notifications.info(
      'رمز التحقق السريع (وضع المحاكاة)',
      `رمز التأكيد الخاص بك هو [ ${pin} ] - صالح لمدة 5 دقائق. (انقر للنسخ أو استخدامه مباشرة)`,
      8000
    );

    return { success: true, simulatedCode: pin };
  }

  /**
   * Verifies an entered PIN against active OTP
   */
  verifyOtp(enteredCode: string): { success: boolean; message: string; remainingAttempts?: number } {
    const record = this.currentOtpRecord();
    const now = Date.now();

    if (!record) {
      return {
        success: false,
        message: 'لم يتم العثور على رمز تحقق نشط. يرجى طلب رمز جديد.'
      };
    }

    if (record.isLocked && record.lockoutUntil && record.lockoutUntil > now) {
      const waitSec = Math.ceil((record.lockoutUntil - now) / 1000);
      return {
        success: false,
        message: `تم حظر المحاولات مؤقتاً لتجاوز الحد المسموح. يرجى المحاولة بعد ${waitSec} ثانية.`
      };
    }

    if (now > record.expiresAt) {
      this.currentOtpRecord.set(null);
      return {
        success: false,
        message: 'انتهت صلاحية رمز التحقق (5 دقائق). يرجى طلب رمز جديد.'
      };
    }

    if (enteredCode.trim() === record.code) {
      // Success: clear record
      this.currentOtpRecord.set(null);
      return {
        success: true,
        message: 'تم التحقق من الرمز بنجاح.'
      };
    }

    // Increment attempts
    const newAttempts = record.attemptsUsed + 1;
    const remaining = record.maxAttempts - newAttempts;

    if (remaining <= 0) {
      // Lock for 5 minutes
      const lockoutUntil = now + 5 * 60 * 1000;
      this.currentOtpRecord.set({
        ...record,
        attemptsUsed: newAttempts,
        isLocked: true,
        lockoutUntil
      });
      return {
        success: false,
        remainingAttempts: 0,
        message: 'تم استنفاد 3 محاولات خاطئة. تم قفل التحقق لمدة 5 دقائق لأسباب أمنية.'
      };
    }

    this.currentOtpRecord.set({
      ...record,
      attemptsUsed: newAttempts
    });

    return {
      success: false,
      remainingAttempts: remaining,
      message: `رمز التحقق غير صحيح. متبقي لديك ${remaining} ${remaining === 1 ? 'محاولة واحدة' : 'محاولات'}.`
    };
  }

  private hasLiveEmailJsCredentials(): boolean {
    return !!(
      this.config.serviceId &&
      this.config.templateId &&
      this.config.publicKey
    );
  }
}
