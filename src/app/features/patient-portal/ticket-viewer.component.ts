import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../core/models/appointment.model';
import { QrCodeComponent } from '../../shared/components/qr-code/qr-code.component';
import { StatusBadgePipe } from '../../shared/pipes/status-badge.pipe';
import { MedicalDatePipe } from '../../shared/pipes/medical-date.pipe';
import { WhatsappDispatchService } from '../../services/whatsapp-dispatch.service';

@Component({
  selector: 'app-ticket-viewer',
  standalone: true,
  imports: [CommonModule, QrCodeComponent, StatusBadgePipe],
  template: `
    @if (appointment) {
      <div class="ticket-card shadow-lg mx-auto" id="printable-ticket">
        <!-- Ticket Header Banner -->
        <div class="ticket-header p-4 text-white">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <div class="d-flex align-items-center gap-2">
              <div class="clinic-brand-icon">
                <i class="bi bi-hospital text-white"></i>
              </div>
              <div>
                <h5 class="m-0 fw-bold">CarePoint Pro</h5>
                <small class="opacity-75">مجمع كير بوينت الطبي التخصصي</small>
              </div>
            </div>
            <span class="badge bg-white text-primary fw-bold px-3 py-2 rounded-pill shadow-sm">
              {{ appointment.status | statusBadge:'label' }}
            </span>
          </div>

          <div class="ticket-number-box text-center p-3 rounded-4 bg-white bg-opacity-10 border border-white border-opacity-25 backdrop-blur">
            <div class="small opacity-75 mb-1">رقم تذكرة الانتظار الرقمية</div>
            <div class="ticket-digits">{{ appointment.ticketNumber }}</div>
          </div>
        </div>

        <!-- Ticket Body Details -->
        <div class="ticket-body p-4">
          <div class="row g-3">
            <div class="col-6">
              <div class="info-label">اسم المريض</div>
              <div class="info-value fw-bold text-truncate">{{ appointment.patientName }}</div>
            </div>
            <div class="col-6">
              <div class="info-label">رقم الهاتف</div>
              <div class="info-value dir-ltr text-end fw-bold">{{ appointment.patientPhone }}</div>
            </div>

            <div class="col-6">
              <div class="info-label">العيادة التخصصية</div>
              <div class="info-value fw-bold text-primary">{{ appointment.departmentArabic }}</div>
            </div>
            <div class="col-6">
              <div class="info-label">غرفة الكشف</div>
              <div class="info-value fw-bold">عيادة ({{ appointment.roomNumber }})</div>
            </div>

            <div class="col-6">
              <div class="info-label">الطبيب المعالج</div>
              <div class="info-value">{{ appointment.doctorName }}</div>
            </div>
            <div class="col-6">
              <div class="info-label">الموعد المحدد</div>
              <div class="info-value fw-bold text-success">{{ appointment.timeSlot }} - {{ appointment.date }}</div>
            </div>

            <div class="col-12">
              <div class="info-label">الأعراض المسجلة عند الحجز</div>
              <div class="info-value text-muted small bg-light p-2 rounded-2">
                {{ appointment.intake.symptoms || 'كشف روتيني' }}
              </div>
            </div>
          </div>

          <!-- Perforated Line with Cut-outs -->
          <div class="perforated-separator my-4">
            <div class="notch notch-left"></div>
            <div class="dashed-line"></div>
            <div class="notch notch-right"></div>
          </div>

          <!-- QR & Instructions -->
          <div class="d-flex align-items-center justify-content-between gap-3">
            <div class="small text-muted flex-grow-1">
              <div class="fw-bold text-dark mb-1">تعليمات الحضور:</div>
              <ul class="p-0 m-0 ps-3 small">
                <li>يرجى التواجد قبل الموعد بـ 15 دقيقة.</li>
                <li>أظهر رمز الـ QR لموظف الاستقبال عند الدخول.</li>
              </ul>
            </div>
            <div class="text-center">
              <app-qr-code
                [value]="getQrPayload()"
                [size]="90"
                caption="مسح للتحقق">
              </app-qr-code>
            </div>
          </div>

          <!-- Actions (Hidden in Print) -->
          <div class="d-print-none mt-4 pt-3 border-top d-flex flex-wrap gap-2 justify-content-between">
            <div class="d-flex gap-2">
              <button class="btn btn-outline-primary btn-sm d-flex align-items-center gap-1" (click)="printTicket()">
                <i class="bi bi-printer"></i>
                <span>طباعة التذكرة</span>
              </button>
              <button class="btn btn-outline-success btn-sm d-flex align-items-center gap-1" (click)="sendViaWhatsApp()">
                <i class="bi bi-whatsapp"></i>
                <span>إرسال للواتساب</span>
              </button>
            </div>
            @if (showNewBookingBtn) {
              <button class="btn btn-primary btn-sm" (click)="newBooking.emit()">
                <i class="bi bi-plus-circle me-1"></i>
                حجز موعد جديد
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .ticket-card {
      max-width: 480px;
      border-radius: 24px;
      background: var(--cp-surface, #ffffff);
      overflow: hidden;
      border: 1px solid var(--cp-border, #e2e8f0);
    }
    .ticket-header {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
    }
    .clinic-brand-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .ticket-digits {
      font-size: 2.2rem;
      font-weight: 800;
      letter-spacing: 2px;
      line-height: 1.2;
    }
    .info-label {
      font-size: 0.76rem;
      color: var(--cp-text-muted, #64748b);
      margin-bottom: 2px;
    }
    .info-value {
      font-size: 0.92rem;
      color: var(--cp-text, #0f172a);
    }
    .perforated-separator {
      position: relative;
      display: flex;
      align-items: center;
    }
    .dashed-line {
      width: 100%;
      border-top: 2px dashed var(--cp-border, #cbd5e1);
    }
    .notch {
      position: absolute;
      width: 20px;
      height: 20px;
      background: var(--cp-bg, #f8fafc);
      border-radius: 50%;
      top: 50%;
      transform: translateY(-50%);
    }
    .notch-left { left: -34px; }
    .notch-right { right: -34px; }

    @media print {
      body * {
        visibility: hidden;
      }
      #printable-ticket, #printable-ticket * {
        visibility: visible;
      }
      #printable-ticket {
        position: absolute;
        left: 50%;
        top: 20px;
        transform: translateX(-50%);
        box-shadow: none !important;
        border: 1px solid #000 !important;
      }
    }
  `]
})
export class TicketViewerComponent {
  @Input() appointment: Appointment | null = null;
  @Input() showNewBookingBtn = true;
  @Output() newBooking = new EventEmitter<void>();

  private readonly whatsappService = inject(WhatsappDispatchService);

  getQrPayload(): string {
    if (!this.appointment) return '';
    return JSON.stringify({
      t: this.appointment.ticketNumber,
      p: this.appointment.patientName,
      d: this.appointment.date,
      s: this.appointment.timeSlot,
      r: this.appointment.roomNumber
    });
  }

  printTicket(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  sendViaWhatsApp(): void {
    if (!this.appointment) return;
    const text = this.whatsappService.buildVisitVoucherMessage(this.appointment);
    this.whatsappService.dispatch({
      recipientPhone: this.appointment.patientPhone,
      text,
      messageType: 'voucher'
    });
  }
}
