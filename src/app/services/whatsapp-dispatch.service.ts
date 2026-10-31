import { Injectable, inject } from '@angular/core';
import { NotificationService } from '../core/services/notification.service';
import { Appointment } from '../core/models/appointment.model';
import { LabOrder } from '../core/models/lab-test.model';

export interface UltraMsgConfig {
  instanceId: string;
  token: string;
  enabled: boolean;
}

export interface WhatsAppMessagePayload {
  recipientPhone: string;
  text: string;
  messageType: 'voucher' | 'reminder' | 'lab_ready' | 'followup';
}

@Injectable({
  providedIn: 'root'
})
export class WhatsappDispatchService {
  private readonly notifications = inject(NotificationService);
  private readonly CONFIG_KEY = 'carepoint_ultramsg_config';

  private config: UltraMsgConfig = this.loadConfig();

  private loadConfig(): UltraMsgConfig {
    if (typeof window === 'undefined') {
      return { instanceId: '', token: '', enabled: false };
    }
    const saved = localStorage.getItem(this.CONFIG_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return { instanceId: '', token: '', enabled: false };
  }

  saveConfig(config: UltraMsgConfig): void {
    this.config = config;
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
    }
    this.notifications.success('تم الحفظ', 'تم تحديث بيانات بوابة UltraMsg بنجاح.');
  }

  getConfig(): UltraMsgConfig {
    return { ...this.config };
  }

  /**
   * Sanitizes phone number to international format (e.g. 201019876543)
   */
  private sanitizePhone(phone: string): string {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('01')) {
      clean = '2' + clean; // Egyptian local format 010... -> 2010...
    }
    return clean;
  }

  /**
   * Dispatches WhatsApp message using UltraMsg API if configured; otherwise opens wa.me fallback
   */
  async dispatch(payload: WhatsAppMessagePayload): Promise<{ dispatchedVia: 'ultramsg' | 'wa_me'; success: boolean }> {
    const cleanPhone = this.sanitizePhone(payload.recipientPhone);
    const encodedText = encodeURIComponent(payload.text);
    const waMeUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

    if (this.config.enabled && this.config.instanceId && this.config.token) {
      try {
        const url = `https://api.ultramsg.com/${this.config.instanceId}/messages/chat`;
        const body = new URLSearchParams({
          token: this.config.token,
          to: '+' + cleanPhone,
          body: payload.text
        });

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString()
        });

        if (response.ok) {
          this.notifications.success(
            'تم إرسال رسالة واتساب',
            `تم الإرسال بنجاح عبر بوابة UltraMsg إلى الرقم ${payload.recipientPhone}.`
          );
          return { dispatchedVia: 'ultramsg', success: true };
        }
      } catch (e) {
        console.warn('[WhatsappDispatchService] UltraMsg API failed, falling back to wa.me:', e);
      }
    }

    // Fallback: open wa.me in new window
    if (typeof window !== 'undefined') {
      window.open(waMeUrl, '_blank');
      this.notifications.info(
        'فتح واتساب للمريض',
        `تم فتح محادثة WhatsApp مباشرة لتسليم الإشعار للرقم ${payload.recipientPhone}.`
      );
    }

    return { dispatchedVia: 'wa_me', success: true };
  }

  /**
   * Generates Visit Voucher Message for WhatsApp
   */
  buildVisitVoucherMessage(appointment: Appointment): string {
    return `🏥 *مجمع كير بوينت الطبي التخصصي | CarePoint Pro*
----------------------------------------
مرحباً بك أ/ *${appointment.patientName}*
تم تأكيد حجز موعدك بنجاح. فيما يلي تفاصيل تذكرة الدخول:

🎫 *رقم التذكرة:* [ ${appointment.ticketNumber} ]
👨‍⚕️ *الطبيب المعالج:* ${appointment.doctorName}
🏢 *العيادة:* ${appointment.departmentArabic}
🚪 *غرفة الكشف:* رقم (${appointment.roomNumber})
📅 *تاريخ الزيارة:* ${appointment.date}
⏰ *الموعد:* ${appointment.timeSlot}

📌 *تعليمات الحضور:*
• يُرجى الحضور قبل الموعد بـ 15 دقيقة لإتمام إجراءات القياسات الحيوية في مكتب الاستقبال.
• يُرجى إظهار هذه الرسالة أو رمز QR لموظف الاستقبال عند الوصول.

📍 العنوان: شارع التحرير - مجمع كير بوينت الطبي، القاهرة.
📞 هاتف الطوارئ والاستعلام: 19850`;
  }

  /**
   * Generates Lab Test Ready Notification Message
   */
  buildLabReadyMessage(labOrder: LabOrder): string {
    const testNames = labOrder.items.map(i => `• ${i.testNameAr}`).join('\n');
    return `🧪 *مختبرات كير بوينت التخصصية | CarePoint Labs*
----------------------------------------
عزيزنا المريض/ *${labOrder.patientName}*
نحيطكم علماً بأن نتائج التحاليل والفحوصات الطبية التالية أصبحت *جاهزة ومعتمدة الآن*:

📋 *الفحوصات المنجزة:*
${testNames}

🔖 *رقم أمر الفحص:* ${labOrder.orderNumber}
👨‍⚕️ *الطبيب الطالب:* ${labOrder.doctorName}

يمكنكم مراجعة النتائج مباشرة مع الطبيب المعالج أثناء استشارتكم أو استلام النسخة الورقية المعتمدة من قسم الاستقبال.

نتمنى لكم دوام الصحة والعافية.`;
  }

  /**
   * Generates Appointment Reminder Alert
   */
  buildReminderMessage(appointment: Appointment): string {
    return `⏰ *تذكير بموعد العيادة | CarePoint Pro*
----------------------------------------
مرحباً أ/ *${appointment.patientName}*
نود تذكيركم بموعدكم القادم غداً:
👨‍⚕️ *${appointment.doctorName}* (${appointment.departmentArabic})
⏰ الساعة: *${appointment.timeSlot}* - غرفة (${appointment.roomNumber})

لتأكيد الحضور أو الاعتذار يرجى الرد على هذه الرسالة. دمت بصحة جيدة.`;
  }
}
