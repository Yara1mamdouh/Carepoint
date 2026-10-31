import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDatabaseService } from '../../core/repositories/mock-database.service';
import { WhatsappDispatchService } from '../../services/whatsapp-dispatch.service';
import { NotificationService } from '../../core/services/notification.service';
import { SpeechChimeService } from '../../services/speech-chime.service';
import { Appointment, AppointmentStatus, TriagePriority } from '../../core/models/appointment.model';
import { DepartmentInfo, Doctor } from '../../core/models/doctor.model';
import { StatusBadgePipe } from '../../shared/pipes/status-badge.pipe';
import { MedicalDatePipe } from '../../shared/pipes/medical-date.pipe';
import { CheckInModalComponent } from './check-in-modal.component';

@Component({
  selector: 'app-live-queue-board',
  standalone: true,
  imports: [CommonModule, FormsModule, CheckInModalComponent],
  template: `
    <div class="queue-board-container p-3 p-md-4">
      <!-- Top Control Bar -->
      <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-surface">
        <div class="row g-3 align-items-center justify-content-between">
          <div class="col-lg-5">
            <div class="d-flex align-items-center gap-3">
              <div class="queue-icon-badge">
                <i class="bi bi-display text-primary"></i>
              </div>
              <div>
                <h4 class="fw-bold mb-0">لوحة الطابور والفرز الطبي (Live Queue Board)</h4>
                <p class="text-muted small mb-0">إدارة حركة المرضى، الاستدعاء الصوتي، وتصعيد الحالات الطارئة</p>
              </div>
            </div>
          </div>

          <div class="col-lg-7 d-flex flex-wrap align-items-center justify-content-lg-end gap-2">
            <!-- Department Filter -->
            <select class="form-select form-select-sm w-auto" [(ngModel)]="selectedDeptFilter">
              <option value="all">جميع العيادات</option>
              @for (dept of departments; track dept.id) {
                <option [value]="dept.id">{{ dept.nameAr }}</option>
              }
            </select>

            <!-- Sound Chime Toggle -->
            <button
              class="btn btn-sm"
              [class.btn-outline-primary]="soundEnabled"
              [class.btn-light]="!soundEnabled"
              (click)="toggleSound()"
              title="تفعيل التنبيه الصوتي عند استدعاء المريض"
            >
              <i [class]="soundEnabled ? 'bi bi-volume-up-fill text-primary' : 'bi bi-volume-mute text-muted'"></i>
              <span class="ms-1 d-none d-sm-inline">التنبيه الصوتي</span>
            </button>

            <!-- Instant Walk-in Check-in Button -->
            <button class="btn btn-primary btn-sm fw-bold px-3" (click)="isCheckInModalOpen = true">
              <i class="bi bi-person-plus-fill me-1"></i>
              تسجيل مريض فوري
            </button>
          </div>
        </div>

        <!-- Metrics Strip -->
        <div class="row g-2 mt-3 pt-3 border-top">
          <div class="col-6 col-sm-4 col-md-2">
            <div class="metric-pill bg-light p-2 rounded-3 text-center">
              <div class="metric-num fw-bold text-dark">{{ getAppointmentsForToday().length }}</div>
              <div class="metric-lbl x-small text-muted">إجمالي اليوم</div>
            </div>
          </div>

          <div class="col-6 col-sm-4 col-md-2">
            <div class="metric-pill bg-warning-subtle p-2 rounded-3 text-center">
              <div class="metric-num fw-bold text-warning-emphasis">{{ waitingList.length }}</div>
              <div class="metric-lbl x-small text-warning-emphasis">في صالة الانتظار</div>
            </div>
          </div>

          <div class="col-6 col-sm-4 col-md-2">
            <div class="metric-pill bg-info-subtle p-2 rounded-3 text-center">
              <div class="metric-num fw-bold text-info-emphasis">{{ inConsultationList.length }}</div>
              <div class="metric-lbl x-small text-info-emphasis">داخل العيادات الآن</div>
            </div>
          </div>

          <div class="col-6 col-sm-4 col-md-2">
            <div class="metric-pill bg-success-subtle p-2 rounded-3 text-center">
              <div class="metric-num fw-bold text-success-emphasis">{{ completedList.length }}</div>
              <div class="metric-lbl x-small text-success-emphasis">تم إتمام الكشف</div>
            </div>
          </div>

          <div class="col-6 col-sm-4 col-md-2">
            <div class="metric-pill bg-danger-subtle p-2 rounded-3 text-center">
              <div class="metric-num fw-bold text-danger">{{ emergencyCount }}</div>
              <div class="metric-lbl x-small text-danger">طوارئ قصوى 🚨</div>
            </div>
          </div>

          <div class="col-6 col-sm-4 col-md-2">
            <div class="metric-pill bg-secondary-subtle p-2 rounded-3 text-center">
              <div class="metric-num fw-bold text-secondary">{{ scheduledList.length }}</div>
              <div class="metric-lbl x-small text-secondary">حجوزات قادمة</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3-Lane Kanban Queue Board -->
      <div class="row g-3">
        <!-- LANE 1: Waiting Room (صالة الانتظار) -->
        <div class="col-lg-4">
          <div class="lane-column p-3 rounded-4 shadow-sm border bg-surface h-100">
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div class="d-flex align-items-center gap-2">
                <span class="lane-badge bg-warning text-dark">{{ waitingList.length }}</span>
                <h6 class="fw-bold mb-0">صالة الانتظار (Waiting)</h6>
              </div>
              <small class="text-muted">الاستدعاء للعيادة</small>
            </div>

            <div class="cards-list d-flex flex-column gap-2">
              @for (apt of waitingList; track apt.id) {
                <div
                  class="queue-ticket-card p-3 rounded-3 border"
                  [class.emergency-card]="apt.priority === 'emergency'"
                  [class.urgent-card]="apt.priority === 'urgent'"
                >
                  <div class="d-flex align-items-start justify-content-between mb-2">
                    <span class="ticket-badge fw-bold">{{ apt.ticketNumber }}</span>
                    <div class="d-flex align-items-center gap-1">
                      @if (apt.priority === 'emergency') {
                        <span class="badge bg-danger pulse-badge">طوارئ 🚨</span>
                      } @else if (apt.priority === 'urgent') {
                        <span class="badge bg-warning text-dark">عاجل</span>
                      }
                      <span class="badge bg-light text-muted border">{{ apt.timeSlot }}</span>
                    </div>
                  </div>

                  <h6 class="patient-name fw-bold mb-1">{{ apt.patientName }}</h6>
                  <p class="doctor-sub mb-2 small text-muted">
                    <i class="bi bi-hospital me-1"></i>{{ apt.departmentArabic }} - د. {{ apt.doctorName }} (غرفة {{ apt.roomNumber }})
                  </p>

                  @if (apt.vitals) {
                    <div class="vitals-strip p-1 px-2 rounded-2 bg-light mb-2 small text-muted d-flex justify-content-between">
                      <span>ضغط: <strong>{{ apt.vitals.systolicBp }}/{{ apt.vitals.diastolicBp }}</strong></span>
                      <span>نبض: <strong>{{ apt.vitals.pulseRate }}</strong></span>
                      <span>حرارة: <strong>{{ apt.vitals.temperature }}°C</strong></span>
                    </div>
                  }

                  <!-- Actions -->
                  <div class="d-flex align-items-center justify-content-between pt-2 border-top gap-1">
                    <div class="d-flex gap-1">
                      <button
                        class="btn btn-sm btn-outline-success py-1 px-2"
                        title="إرسال تذكرة الموعد عبر واتساب"
                        (click)="sendWhatsAppVoucher(apt)"
                      >
                        <i class="bi bi-whatsapp"></i>
                      </button>

                      <button
                        class="btn btn-sm py-1 px-2"
                        [class.btn-outline-danger]="apt.priority !== 'emergency'"
                        [class.btn-danger]="apt.priority === 'emergency'"
                        (click)="toggleEmergency(apt)"
                        title="تصعيد إلى طوارئ قصوى"
                      >
                        <i class="bi bi-lightning-fill"></i>
                      </button>
                    </div>

                    <button
                      class="btn btn-primary btn-sm fw-bold py-1 px-3"
                      (click)="callPatientToRoom(apt)"
                    >
                      <i class="bi bi-door-open-fill me-1"></i>
                      استدعاء للغرفة
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="empty-lane text-center text-muted py-5">
                  <i class="bi bi-check2-circle fs-2 d-block mb-2 text-success opacity-50"></i>
                  لا يوجد مرضى في صالة الانتظار حالياً
                </div>
              }
            </div>
          </div>
        </div>

        <!-- LANE 2: In Consultation (داخل العيادة مع الطبيب) -->
        <div class="col-lg-4">
          <div class="lane-column p-3 rounded-4 shadow-sm border bg-surface h-100">
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div class="d-flex align-items-center gap-2">
                <span class="lane-badge bg-info text-dark">{{ inConsultationList.length }}</span>
                <h6 class="fw-bold mb-0">داخل العيادات (In Consultation)</h6>
              </div>
              <small class="text-muted">جلسات الكشف الجارية</small>
            </div>

            <div class="cards-list d-flex flex-column gap-2">
              @for (apt of inConsultationList; track apt.id) {
                <div class="queue-ticket-card p-3 rounded-3 border in-room-card">
                  <div class="d-flex align-items-start justify-content-between mb-2">
                    <span class="ticket-badge fw-bold text-info-emphasis">{{ apt.ticketNumber }}</span>
                    <span class="badge bg-info text-dark d-flex align-items-center gap-1">
                      <span class="spinner-grow spinner-grow-sm" role="status"></span>
                      الكشف جارٍ
                    </span>
                  </div>

                  <h6 class="patient-name fw-bold mb-1">{{ apt.patientName }}</h6>
                  <p class="doctor-sub mb-2 small text-muted">
                    <i class="bi bi-stethoscope me-1"></i>{{ apt.doctorName }} - غرفة ({{ apt.roomNumber }})
                  </p>

                  <div class="alert alert-light p-2 small mb-2 text-muted">
                    <i class="bi bi-chat-left-dots me-1"></i>
                    الشكوى: {{ apt.intake.symptoms || 'كشف استشاري' }}
                  </div>

                  <!-- Actions -->
                  <div class="d-flex align-items-center justify-content-between pt-2 border-top">
                    <button class="btn btn-outline-secondary btn-sm py-1" (click)="revertToWaiting(apt)">
                      <i class="bi bi-arrow-right me-1"></i> إعادة للانتظار
                    </button>
                    <button class="btn btn-success btn-sm fw-bold py-1 px-3" (click)="completeAppointment(apt)">
                      <i class="bi bi-check-lg me-1"></i> إتمام الكشف
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="empty-lane text-center text-muted py-5">
                  <i class="bi bi-door-closed fs-2 d-block mb-2 opacity-50"></i>
                  لا توجد جلسات كشف نشطة في هذه اللحظة
                </div>
              }
            </div>
          </div>
        </div>

        <!-- LANE 3: Completed (مكتمل الكشف) -->
        <div class="col-lg-4">
          <div class="lane-column p-3 rounded-4 shadow-sm border bg-surface h-100">
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div class="d-flex align-items-center gap-2">
                <span class="lane-badge bg-success text-white">{{ completedList.length }}</span>
                <h6 class="fw-bold mb-0">الكشوفات المكتملة (Completed)</h6>
              </div>
              <small class="text-muted">جاهز للصيدلية / الحسابات</small>
            </div>

            <div class="cards-list d-flex flex-column gap-2">
              @for (apt of completedList; track apt.id) {
                <div class="queue-ticket-card p-3 rounded-3 border completed-card opacity-90">
                  <div class="d-flex align-items-start justify-content-between mb-2">
                    <span class="ticket-badge fw-bold text-success">{{ apt.ticketNumber }}</span>
                    <span class="badge bg-success-subtle text-success">تمت الزيارة</span>
                  </div>

                  <h6 class="patient-name fw-bold mb-1">{{ apt.patientName }}</h6>
                  <p class="doctor-sub mb-2 small text-muted">
                    {{ apt.departmentArabic }} - د. {{ apt.doctorName }}
                  </p>

                  <div class="d-flex align-items-center justify-content-between pt-2 border-top small text-muted">
                    <span>وقت الإتمام: {{ apt.completedAt || 'اليوم' }}</span>
                    <button class="btn btn-sm btn-link text-decoration-none p-0" (click)="sendFollowupWhatsApp(apt)">
                      <i class="bi bi-whatsapp text-success me-1"></i> إرسال متابعة
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="empty-lane text-center text-muted py-5">
                  <i class="bi bi-clipboard2-check fs-2 d-block mb-2 opacity-50"></i>
                  لم تكتمل أي زيارة بعد لليوم
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Instant Walk-in Modal -->
      <app-check-in-modal
        [isOpen]="isCheckInModalOpen"
        (closed)="isCheckInModalOpen = false"
        (patientRegistered)="onPatientRegistered($event)"
      >
      </app-check-in-modal>
    </div>
  `,
  styles: [`
    .queue-icon-badge {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: rgba(14, 165, 233, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .metric-num {
      font-size: 1.35rem;
      line-height: 1.2;
    }
    .x-small { font-size: 0.72rem; }

    .lane-column {
      background: var(--cp-surface, #ffffff);
      min-height: 520px;
    }
    .lane-badge {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.82rem;
      font-weight: 700;
    }

    .queue-ticket-card {
      background: var(--cp-surface, #ffffff);
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .queue-ticket-card:hover {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }
    .ticket-badge {
      font-family: monospace;
      font-size: 1rem;
      color: #0284c7;
      background: rgba(14, 165, 233, 0.08);
      padding: 2px 8px;
      border-radius: 6px;
    }
    .emergency-card {
      border: 2px solid #ef4444 !important;
      background: #fff5f5;
    }
    .urgent-card {
      border: 1px solid #f59e0b !important;
    }
    .in-room-card {
      border-left: 4px solid #0ea5e9;
    }
    .completed-card {
      border-left: 4px solid #10b981;
    }

    .pulse-badge {
      animation: pulse-ring 1.8s infinite cubic-bezier(0.45, 0, 0.55, 1);
    }
    @keyframes pulse-ring {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
      70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
  `]
})
export class LiveQueueBoardComponent implements OnInit {
  private readonly db = inject(MockDatabaseService);
  private readonly whatsapp = inject(WhatsappDispatchService);
  private readonly notifications = inject(NotificationService);
  private readonly speech = inject(SpeechChimeService);

  departments: DepartmentInfo[] = [];
  selectedDeptFilter = 'all';
  soundEnabled = true;
  isCheckInModalOpen = false;

  ngOnInit(): void {
    this.departments = this.db.getDepartments();
  }

  getAppointmentsForToday(): Appointment[] {
    // Re-evaluate on changes
    this.db.appointmentsVersion();
    const today = new Date().toISOString().split('T')[0];
    let list = this.db.appointments.query(a => a.date === today || a.status === 'waiting' || a.status === 'in-consultation');

    if (this.selectedDeptFilter !== 'all') {
      list = list.filter(a => a.department === this.selectedDeptFilter);
    }
    return list;
  }

  get waitingList(): Appointment[] {
    return this.getAppointmentsForToday()
      .filter(a => a.status === 'waiting')
      .sort((a, b) => {
        // Emergency first, then urgent, then routine
        const pOrder: Record<TriagePriority, number> = { emergency: 3, urgent: 2, routine: 1 };
        return pOrder[b.priority] - pOrder[a.priority];
      });
  }

  get inConsultationList(): Appointment[] {
    return this.getAppointmentsForToday().filter(a => a.status === 'in-consultation');
  }

  get completedList(): Appointment[] {
    return this.getAppointmentsForToday().filter(a => a.status === 'completed');
  }

  get scheduledList(): Appointment[] {
    return this.getAppointmentsForToday().filter(a => a.status === 'scheduled' || a.status === 'confirmed');
  }

  get emergencyCount(): number {
    return this.getAppointmentsForToday().filter(a => a.priority === 'emergency').length;
  }

  toggleSound(): void {
    this.soundEnabled = !this.soundEnabled;
    this.notifications.info(
      'التنبيه الصوتي',
      this.soundEnabled ? 'تم تفعيل التنبيه الصوتي للاستدعاء.' : 'تم كتم التنبيه الصوتي.'
    );
  }

  playChime(): void {
    if (!this.soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch {
      // ignore
    }
  }

  callPatientToRoom(apt: Appointment): void {
    this.speech.announcePatient(apt.ticketNumber, apt.patientName, apt.roomNumber, apt.departmentArabic);
    this.db.appointments.update(apt.id, {
      status: 'in-consultation'
    });

    this.notifications.success(
      'استدعاء مريض',
      `تم استدعاء المريض ${apt.patientName} (${apt.ticketNumber}) إلى غرفة رقم (${apt.roomNumber}).`
    );
  }

  revertToWaiting(apt: Appointment): void {
    this.db.appointments.update(apt.id, {
      status: 'waiting'
    });
  }

  completeAppointment(apt: Appointment): void {
    const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    this.db.appointments.update(apt.id, {
      status: 'completed',
      completedAt: nowTime
    });

    this.notifications.success(
      'اكتمال الزيارة',
      `تم إتمام كشف المريض ${apt.patientName} بنجاح. ملف المريض جاهز للصرف والتحاسب.`
    );
  }

  toggleEmergency(apt: Appointment): void {
    const nextPriority: TriagePriority = apt.priority === 'emergency' ? 'urgent' : 'emergency';
    this.db.appointments.update(apt.id, {
      priority: nextPriority
    });

    if (nextPriority === 'emergency') {
      this.playChime();
      this.notifications.warning(
        '🚨 تصعيد طوارئ قصوى',
        `تم تصعيد تذكرة ${apt.ticketNumber} (${apt.patientName}) كأولوية طوارئ قصوى!`
      );
    }
  }

  sendWhatsAppVoucher(apt: Appointment): void {
    const text = this.whatsapp.buildVisitVoucherMessage(apt);
    this.whatsapp.dispatch({
      recipientPhone: apt.patientPhone,
      text,
      messageType: 'voucher'
    });
  }

  sendFollowupWhatsApp(apt: Appointment): void {
    const text = `🏥 *مجمع كير بوينت الطبي | CarePoint Pro*
----------------------------------------
عزيزنا المريض/ *${apt.patientName}*
نتمنى أن تكون زيارتك اليوم مع د. *${apt.doctorName}* موفقة ومريحة.
نحرص دوماً على صحتك وسلامتك، ونرجو منك الالتزام بتعليمات الروشتة ومواعيد العلاج بدقة.

لأي استفسار أو طلب استشارة لا تتردد في مراسلتنا هنا.
دُمتم بصحة وعافية.`;

    this.whatsapp.dispatch({
      recipientPhone: apt.patientPhone,
      text,
      messageType: 'followup'
    });
  }

  onPatientRegistered(apt: Appointment): void {
    // Already added to database in modal
  }
}
