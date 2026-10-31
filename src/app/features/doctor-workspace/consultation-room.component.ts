import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDatabaseService } from '../../core/repositories/mock-database.service';
import { EmrService, BmiAnalysis } from '../../services/emr.service';
import { NotificationService } from '../../core/services/notification.service';
import { SpeechChimeService } from '../../services/speech-chime.service';
import { Doctor } from '../../core/models/doctor.model';
import { Appointment, VitalSigns } from '../../core/models/appointment.model';
import { Patient } from '../../core/models/patient.model';
import { LabOrder, LabOrderItem } from '../../core/models/lab-test.model';
import { PrescriptionWriterComponent } from './prescription-writer.component';
import { EmrTimelineComponent } from './emr-timeline.component';
import { StatusBadgePipe } from '../../shared/pipes/status-badge.pipe';

@Component({
  selector: 'app-consultation-room',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PrescriptionWriterComponent,
    EmrTimelineComponent
  ],
  template: `
    <div class="consultation-cockpit p-3 p-md-4">
      <!-- Doctor Header Selector -->
      <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-surface">
        <div class="row g-3 align-items-center justify-content-between">
          <div class="col-md-7">
            <div class="d-flex align-items-center gap-3">
              <img [src]="currentDoctor?.avatarUrl" [alt]="currentDoctor?.name" class="doctor-avatar rounded-circle border" />
              <div>
                <div class="d-flex align-items-center gap-2">
                  <h5 class="fw-bold mb-0 text-dark">{{ currentDoctor?.name }}</h5>
                  <span class="badge bg-primary-subtle text-primary">غرفة ({{ currentDoctor?.roomNumber }})</span>
                </div>
                <p class="text-muted small mb-0">{{ currentDoctor?.title }} - {{ currentDoctor?.departmentArabic }}</p>
              </div>
            </div>
          </div>

          <div class="col-md-5 d-flex align-items-center justify-content-md-end gap-2">
            <label class="form-label small text-muted m-0 text-nowrap">تبديل الطبيب:</label>
            <select class="form-select form-select-sm w-auto" [(ngModel)]="selectedDoctorId" (change)="onDoctorChange()">
              @for (doc of allDoctors; track doc.id) {
                <option [value]="doc.id">{{ doc.name }} ({{ doc.departmentArabic }})</option>
              }
            </select>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <!-- LEFT: Active Patient & Clinical Cockpit (8 Cols) -->
        <div class="col-lg-8">
          @if (activeAppointment) {
            <div class="card border-0 shadow-sm rounded-4 p-4 bg-surface mb-3">
              <!-- Patient Bar -->
              <div class="d-flex flex-wrap align-items-center justify-content-between pb-3 border-bottom mb-3 gap-2">
                <div class="d-flex align-items-center gap-3">
                  <div class="active-badge-pulse">
                    <i class="bi bi-person-check-fill text-white"></i>
                  </div>
                  <div>
                    <div class="d-flex align-items-center gap-2">
                      <h5 class="fw-bold mb-0 text-dark">{{ activePatient?.fullName }}</h5>
                      <span class="badge bg-primary font-monospace">{{ activeAppointment.ticketNumber }}</span>
                      @if (activeAppointment.priority === 'emergency') {
                        <span class="badge bg-danger pulse-badge">طوارئ 🚨</span>
                      }
                    </div>
                    <div class="text-muted small mt-1">
                      <span>الهاتف: <strong class="dir-ltr text-dark">{{ activePatient?.phone }}</strong></span>
                      <span class="mx-2">•</span>
                      <span>الملف: <strong class="font-monospace text-primary">{{ activePatient?.fileNumber }}</strong></span>
                    </div>
                  </div>
                </div>

                <div class="d-flex gap-2">
                  <button class="btn btn-outline-success btn-sm fw-bold" (click)="completeConsultation()">
                    <i class="bi bi-check-all me-1"></i> إنهاء الكشف
                  </button>
                </div>
              </div>

              <!-- Cockpit Tabs -->
              <ul class="nav nav-pills mb-3 border-bottom pb-2 gap-1" role="tablist">
                <li class="nav-item" role="presentation">
                  <button
                    class="nav-link"
                    [class.active]="activeTab === 'vitals'"
                    (click)="activeTab = 'vitals'"
                  >
                    <i class="bi bi-activity me-1"></i> الفحص والعلامات الحيوية
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button
                    class="nav-link"
                    [class.active]="activeTab === 'rx'"
                    (click)="activeTab = 'rx'"
                  >
                    <i class="bi bi-prescription2 me-1"></i> الروشتة الذكية (E-Rx)
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button
                    class="nav-link"
                    [class.active]="activeTab === 'labs'"
                    (click)="activeTab = 'labs'"
                  >
                    <i class="bi bi-eyedropper me-1"></i> طلب فحوصات معملية
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button
                    class="nav-link"
                    [class.active]="activeTab === 'timeline'"
                    (click)="activeTab = 'timeline'"
                  >
                    <i class="bi bi-clock-history me-1"></i> السجل الطبي الشامل
                  </button>
                </li>
              </ul>

              <!-- TAB 1: Vitals & Clinical Notes -->
              @if (activeTab === 'vitals') {
                <div class="tab-pane-vitals animate-fade-in">
                  <!-- Chief Complaint & Intake -->
                  <div class="alert alert-light border p-3 rounded-3 mb-4">
                    <div class="fw-bold small text-primary mb-1">
                      <i class="bi bi-chat-left-quote me-1"></i>
                      الشكوى السريرية وأعراض المريض المسجلة:
                    </div>
                    <p class="mb-1 text-dark">{{ activeAppointment.intake.symptoms || 'كشف روتيني' }}</p>

                    @if (activeAppointment.intake.uploadedLabPhotos.length) {
                      <div class="mt-2 pt-2 border-top">
                        <div class="x-small text-muted mb-1">مرفقات وصور رفعها المريض:</div>
                        <div class="d-flex gap-2">
                          @for (img of activeAppointment.intake.uploadedLabPhotos; track $index) {
                            <a [href]="img" target="_blank">
                              <img [src]="img" alt="Report" class="rounded border" style="width: 55px; height: 55px; object-fit: cover;" />
                            </a>
                          }
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Vital Signs Input Matrix -->
                  <h6 class="fw-bold small text-primary mb-3">
                    <i class="bi bi-heart-pulse-fill me-1"></i>
                    القياسات الحيوية وحساب مؤشر كتلة الجسم (BMI):
                  </h6>

                  <div class="row g-3 mb-3">
                    <div class="col-6 col-md-3">
                      <label class="form-label x-small fw-bold">ضغط الدم (mmHg):</label>
                      <div class="input-group input-group-sm">
                        <input type="number" class="form-control" placeholder="انقباضي" [(ngModel)]="vitalsForm.systolicBp" />
                        <span class="input-group-text">/</span>
                        <input type="number" class="form-control" placeholder="انبساطي" [(ngModel)]="vitalsForm.diastolicBp" />
                      </div>
                    </div>

                    <div class="col-6 col-md-3">
                      <label class="form-label x-small fw-bold">النبض (bpm):</label>
                      <input type="number" class="form-control form-control-sm" [(ngModel)]="vitalsForm.pulseRate" />
                    </div>

                    <div class="col-6 col-md-3">
                      <label class="form-label x-small fw-bold">الحرارة (°C):</label>
                      <input type="number" step="0.1" class="form-control form-control-sm" [(ngModel)]="vitalsForm.temperature" />
                    </div>

                    <div class="col-6 col-md-3">
                      <label class="form-label x-small fw-bold">سكر الدم (mg/dL):</label>
                      <input type="number" class="form-control form-control-sm" [(ngModel)]="vitalsForm.bloodGlucose" />
                    </div>

                    <div class="col-6 col-md-3">
                      <label class="form-label x-small fw-bold">تشبع الأكسجين SpO2 (%):</label>
                      <input type="number" class="form-control form-control-sm" [(ngModel)]="vitalsForm.oxygenSaturation" />
                    </div>

                    <div class="col-6 col-md-3">
                      <label class="form-label x-small fw-bold">الوزن (kg):</label>
                      <input type="number" class="form-control form-control-sm" [(ngModel)]="vitalsForm.weightKg" (ngModelChange)="computeBmi()" />
                    </div>

                    <div class="col-6 col-md-3">
                      <label class="form-label x-small fw-bold">الطول (cm):</label>
                      <input type="number" class="form-control form-control-sm" [(ngModel)]="vitalsForm.heightCm" (ngModelChange)="computeBmi()" />
                    </div>

                    <!-- Computed BMI Display -->
                    <div class="col-6 col-md-3">
                      <label class="form-label x-small fw-bold">مؤشر كتلة الجسم BMI:</label>
                      <div class="p-1 px-2 rounded bg-light border text-center">
                        @if (bmiResult) {
                          <span class="fw-bold fs-6">{{ bmiResult.bmi }}</span>
                          <span [class]="'badge ms-1 ' + bmiResult.badgeClass">{{ bmiResult.categoryAr }}</span>
                        } @else {
                          <span class="text-muted small">أدخل الوزن والطول</span>
                        }
                      </div>
                    </div>
                  </div>

                  @if (bmiResult) {
                    <div class="alert alert-light border small py-2 px-3 mb-3 text-muted">
                      <i class="bi bi-info-circle me-1 text-primary"></i>
                      <strong>إرشاد طبي:</strong> {{ bmiResult.recommendation }}
                    </div>
                  }

                  <!-- Clinical Progress Notes -->
                  <div class="mb-3">
                    <label class="form-label small fw-bold">ملاحظات الكشف السريري والتشخيص النهائي:</label>
                    <textarea
                      class="form-control"
                      rows="3"
                      placeholder="نتائج الفحص بالأجهزة، أصوات الصدر والقلب، التوصيات الطبية..."
                      [(ngModel)]="clinicalNotes"
                    ></textarea>
                  </div>

                  <div class="text-end">
                    <button class="btn btn-primary btn-sm fw-bold" (click)="saveVitalsAndNotes()">
                      <i class="bi bi-save me-1"></i> حفظ القياسات والملاحظات
                    </button>
                  </div>
                </div>
              }

              <!-- TAB 2: Smart Prescription Writer -->
              @if (activeTab === 'rx') {
                <app-prescription-writer
                  [patient]="activePatient"
                  [doctor]="currentDoctor"
                  [appointmentId]="activeAppointment.id"
                  (prescriptionSaved)="onPrescriptionSaved()"
                >
                </app-prescription-writer>
              }

              <!-- TAB 3: Diagnostic Lab Orders -->
              @if (activeTab === 'labs') {
                <div class="tab-pane-labs animate-fade-in">
                  <div class="d-flex align-items-center justify-content-between mb-3">
                    <h6 class="fw-bold small text-primary m-0">
                      <i class="bi bi-clipboard2-pulse me-1"></i>
                      طلب تحاليل وفحوصات معملية فورية للمريض:
                    </h6>
                  </div>

                  <div class="row g-2 mb-4">
                    @for (panel of standardLabPanels; track panel.testId) {
                      <div class="col-md-6">
                        <div
                          class="panel-chip p-2 rounded-3 border bg-light d-flex align-items-center justify-content-between cursor-pointer"
                          [class.selected-panel]="isPanelSelected(panel)"
                          (click)="togglePanelSelection(panel)"
                        >
                          <div>
                            <strong class="d-block small">{{ panel.testNameAr }}</strong>
                            <span class="x-small text-muted">{{ panel.testNameEn }}</span>
                          </div>
                          <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-secondary-subtle text-secondary small">{{ panel.priceEgp }} ج.م</span>
                            <i [class]="isPanelSelected(panel) ? 'bi bi-check-circle-fill text-primary' : 'bi bi-circle text-muted'"></i>
                          </div>
                        </div>
                      </div>
                    }
                  </div>

                  <div class="text-end">
                    <button
                      class="btn btn-primary fw-bold"
                      [disabled]="selectedLabPanels.length === 0"
                      (click)="dispatchLabOrder()"
                    >
                      <i class="bi bi-send-check me-1"></i>
                      إرسال أمر الفحص إلى المعمل ({{ selectedLabPanels.length }} فحص)
                    </button>
                  </div>
                </div>
              }

              <!-- TAB 4: Longitudinal History -->
              @if (activeTab === 'timeline') {
                <app-emr-timeline [patient]="activePatient"></app-emr-timeline>
              }
            </div>
          } @else {
            <div class="card border-0 shadow-sm rounded-4 p-5 text-center bg-surface">
              <i class="bi bi-stethoscope fs-1 text-primary opacity-50 mb-3 d-block"></i>
              <h5 class="fw-bold text-dark mb-1">لا يوجد مريض حالياً داخل غرفة الكشف</h5>
              <p class="text-muted small mb-4">اختر مريضاً من قائمة الانتظار على اليسار واستدعه لبدء جلسة الاستشارة الطبية.</p>
              @if (doctorQueue.length > 0) {
                <div>
                  <button class="btn btn-primary fw-bold px-4" (click)="callNextPatient()">
                    <i class="bi bi-door-open me-1"></i> استدعاء المريض التالي ({{ doctorQueue[0].patientName }})
                  </button>
                </div>
              }
            </div>
          }
        </div>

        <!-- RIGHT: Clinic Queue & Next Patients (4 Cols) -->
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm rounded-4 p-3 bg-surface">
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <h6 class="fw-bold m-0 d-flex align-items-center gap-2">
                <i class="bi bi-people-fill text-primary"></i>
                طابور العيادة ({{ doctorQueue.length }})
              </h6>
              <span class="badge bg-light text-muted border">غرفة {{ currentDoctor?.roomNumber }}</span>
            </div>

            <div class="d-flex flex-column gap-2">
              @for (apt of doctorQueue; track apt.id; let i = $index) {
                <div class="p-3 rounded-3 border bg-light position-relative">
                  <div class="d-flex align-items-start justify-content-between mb-1">
                    <span class="fw-bold text-primary font-monospace">{{ apt.ticketNumber }}</span>
                    <span [class]="'badge ' + (apt.priority === 'emergency' ? 'bg-danger pulse-badge' : 'bg-secondary')">
                      {{ apt.priority === 'emergency' ? 'طوارئ' : apt.timeSlot }}
                    </span>
                  </div>

                  <strong class="d-block text-dark">{{ apt.patientName }}</strong>
                  <p class="x-small text-muted mb-2 text-truncate">{{ apt.intake.symptoms || 'كشف استشاري' }}</p>

                  <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                    <span class="x-small text-muted">ترتيب: #{{ i + 1 }}</span>
                    <button class="btn btn-primary btn-xs fw-bold px-2" (click)="callSpecificPatient(apt)">
                      <i class="bi bi-door-open me-1"></i> استدعاء للغرفة
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="text-center text-muted py-4 small">
                  <i class="bi bi-emoji-smile fs-3 d-block mb-1 opacity-50"></i>
                  لا يوجد مرضى في انتظار عيادة {{ currentDoctor?.name }} حالياً.
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .doctor-avatar {
      width: 58px;
      height: 58px;
      object-fit: cover;
    }
    .active-badge-pulse {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #0ea5e9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
    }
    .x-small { font-size: 0.72rem; }
    .btn-xs { font-size: 0.75rem; padding: 0.25rem 0.6rem; }
    .cursor-pointer { cursor: pointer; }
    .panel-chip {
      transition: all 0.2s ease;
    }
    .panel-chip:hover {
      border-color: #0ea5e9;
    }
    .selected-panel {
      border-color: #0ea5e9 !important;
      background: rgba(14, 165, 233, 0.08) !important;
    }
    .nav-pills .nav-link {
      color: var(--cp-text-muted, #64748b);
      font-weight: 600;
      font-size: 0.85rem;
      border-radius: 10px;
      padding: 0.5rem 0.85rem;
    }
    .nav-pills .nav-link.active {
      background: #0ea5e9;
      color: #ffffff;
    }
  `]
})
export class ConsultationRoomComponent implements OnInit {
  private readonly db = inject(MockDatabaseService);
  private readonly emrService = inject(EmrService);
  private readonly notifications = inject(NotificationService);
  private readonly speech = inject(SpeechChimeService);

  selectedDoctorId = '';
  currentDoctor: Doctor | null = null;

  get allDoctors(): Doctor[] {
    this.db.doctorsVersion();
    return this.db.doctors.getAll();
  }

  activeAppointment: Appointment | null = null;
  activePatient: Patient | null = null;
  activeTab: 'vitals' | 'rx' | 'labs' | 'timeline' = 'vitals';

  // Vitals form
  vitalsForm: Partial<VitalSigns> = {
    systolicBp: 125,
    diastolicBp: 82,
    pulseRate: 74,
    temperature: 37.0,
    bloodGlucose: 110,
    oxygenSaturation: 98,
    weightKg: 78,
    heightCm: 172
  };
  bmiResult: BmiAnalysis | null = null;
  clinicalNotes = '';

  // Dynamic Lab panels catalog from database services catalog
  get standardLabPanels(): LabOrderItem[] {
    this.db.servicesVersion();
    const catalog = this.db.servicesCatalog.query(
      s => (s.category === 'lab-test' || s.category === 'radiology') && s.isActive !== false
    );
    if (catalog.length > 0) {
      return catalog.map(s => ({
        testId: s.id,
        testNameAr: s.nameAr,
        testNameEn: s.nameEn,
        category: s.category === 'radiology' ? 'radiology' : 'biochemistry',
        normalRange: s.normalRange || 'ضمن المعدل الطبيعي',
        priceEgp: s.priceEgp
      }));
    }
    return [
      { testId: 't_cbc', testNameAr: 'صورة دم كاملة (CBC with Differential)', testNameEn: 'Complete Blood Count', category: 'hematology', normalRange: 'الهيموجلوبين: 13-17 g/dL', priceEgp: 180 },
      { testId: 't_hba1c', testNameAr: 'تحليل السكر التراكمي (HbA1c)', testNameEn: 'Glycated Hemoglobin', category: 'biochemistry', normalRange: '< 5.7 %', priceEgp: 220 },
      { testId: 't_lipid', testNameAr: 'لوحة الدهون الكاملة (Lipid Profile)', testNameEn: 'Lipid Panel', category: 'biochemistry', normalRange: 'كولسترول < 200 mg/dL', priceEgp: 300 }
    ];
  }
  selectedLabPanels: LabOrderItem[] = [];

  ngOnInit(): void {
    if (this.allDoctors.length > 0) {
      this.selectedDoctorId = this.allDoctors[0].id;
      this.onDoctorChange();
    }
    this.computeBmi();
  }

  onDoctorChange(): void {
    this.currentDoctor = this.allDoctors.find(d => d.id === this.selectedDoctorId) || null;
    this.refreshActiveSession();
  }

  refreshActiveSession(): void {
    if (!this.currentDoctor) return;
    // Find if there is an in-consultation appointment for this doctor
    const inRoom = this.db.appointments.query(
      a => a.doctorId === this.currentDoctor!.id && a.status === 'in-consultation'
    )[0];

    if (inRoom) {
      this.activeAppointment = inRoom;
      this.activePatient = this.db.patients.getById(inRoom.patientId) || null;
      if (inRoom.vitals) {
        this.vitalsForm = { ...inRoom.vitals };
      }
      this.clinicalNotes = inRoom.consultationNotes || '';
      this.computeBmi();
    } else {
      this.activeAppointment = null;
      this.activePatient = null;
    }
  }

  get doctorQueue(): Appointment[] {
    if (!this.currentDoctor) return [];
    this.db.appointmentsVersion();
    return this.db.appointments.query(
      a => a.doctorId === this.currentDoctor!.id && a.status === 'waiting'
    ).sort((a, b) => (a.priority === 'emergency' ? -1 : 1));
  }

  computeBmi(): void {
    if (this.vitalsForm.weightKg && this.vitalsForm.heightCm) {
      this.bmiResult = this.emrService.calculateBmi(this.vitalsForm.weightKg, this.vitalsForm.heightCm);
    }
  }

  saveVitalsAndNotes(): void {
    if (!this.activeAppointment) return;

    this.computeBmi();
    const updatedVitals: VitalSigns = {
      systolicBp: this.vitalsForm.systolicBp || 120,
      diastolicBp: this.vitalsForm.diastolicBp || 80,
      pulseRate: this.vitalsForm.pulseRate || 72,
      bloodGlucose: this.vitalsForm.bloodGlucose,
      temperature: this.vitalsForm.temperature || 37.0,
      oxygenSaturation: this.vitalsForm.oxygenSaturation || 98,
      weightKg: this.vitalsForm.weightKg || 70,
      heightCm: this.vitalsForm.heightCm || 170,
      bmi: this.bmiResult?.bmi,
      bmiCategoryAr: this.bmiResult?.categoryAr,
      measuredAt: new Date().toISOString()
    };

    this.db.appointments.update(this.activeAppointment.id, {
      vitals: updatedVitals,
      consultationNotes: this.clinicalNotes
    });

    this.notifications.success('تم الحفظ', 'تم تحديث القياسات الحيوية والملاحظات الطبية بنجاح.');
  }

  callNextPatient(): void {
    if (this.doctorQueue.length > 0) {
      this.callSpecificPatient(this.doctorQueue[0]);
    }
  }

  callSpecificPatient(apt: Appointment): void {
    // If someone was in room, prompt or auto complete
    if (this.activeAppointment) {
      this.completeConsultation();
    }

    this.speech.announcePatient(
      apt.ticketNumber,
      apt.patientName,
      this.currentDoctor?.roomNumber || apt.roomNumber,
      this.currentDoctor?.departmentArabic || apt.departmentArabic
    );

    this.db.appointments.update(apt.id, {
      status: 'in-consultation'
    });

    this.notifications.success('استدعاء', `تم استدعاء ${apt.patientName} إلى الغرفة.`);
    this.refreshActiveSession();
  }

  completeConsultation(): void {
    if (!this.activeAppointment) return;

    this.saveVitalsAndNotes();

    const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    this.db.appointments.update(this.activeAppointment.id, {
      status: 'completed',
      completedAt: nowTime
    });

    this.notifications.success(
      'اكتمل الكشف',
      `تم إتمام زيارة المريض ${this.activeAppointment.patientName} بنجاح.`
    );

    this.activeAppointment = null;
    this.activePatient = null;
    this.refreshActiveSession();
  }

  isPanelSelected(panel: LabOrderItem): boolean {
    return this.selectedLabPanels.some(p => p.testId === panel.testId);
  }

  togglePanelSelection(panel: LabOrderItem): void {
    const idx = this.selectedLabPanels.findIndex(p => p.testId === panel.testId);
    if (idx > -1) {
      this.selectedLabPanels.splice(idx, 1);
    } else {
      this.selectedLabPanels.push(panel);
    }
  }

  dispatchLabOrder(): void {
    if (!this.activePatient || !this.currentDoctor || this.selectedLabPanels.length === 0) return;

    const totalCost = this.selectedLabPanels.reduce((sum, item) => sum + item.priceEgp, 0);
    const orderNumber = 'LAB-2026-' + Math.floor(1000 + Math.random() * 9000);

    const order: LabOrder = {
      id: 'lab_' + Math.random().toString(36).substring(2, 9),
      orderNumber,
      appointmentId: this.activeAppointment?.id,
      patientId: this.activePatient.id,
      patientName: this.activePatient.fullName,
      patientPhone: this.activePatient.phone,
      patientEmail: this.activePatient.email,
      doctorId: this.currentDoctor.id,
      doctorName: this.currentDoctor.name,
      status: 'ordered',
      items: [...this.selectedLabPanels],
      orderedAt: new Date().toISOString(),
      uploadedReports: [],
      totalCostEgp: totalCost
    };

    this.db.labOrders.create(order);

    this.notifications.success(
      'تم إرسال طلب الفحوصات',
      `تم تحويل طلب الفحوصات رقم [ ${orderNumber} ] إلى مختبر المركز بنجاح.`
    );

    this.selectedLabPanels = [];
  }

  onPrescriptionSaved(): void {
    this.activeTab = 'vitals';
  }
}
