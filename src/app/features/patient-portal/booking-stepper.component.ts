import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDatabaseService } from '../../core/repositories/mock-database.service';
import { AppointmentEngineService, DayAvailability, TimeSlotOption } from '../../services/appointment-engine.service';
import { OtpSecurityService } from '../../services/otp-security.service';
import { NotificationService } from '../../core/services/notification.service';
import { DepartmentInfo, Doctor } from '../../core/models/doctor.model';
import { Appointment, TriagePriority } from '../../core/models/appointment.model';
import { Patient } from '../../core/models/patient.model';
import { CurrencyEgpPipe } from '../../shared/pipes/currency-egp.pipe';
import { InputMaskDirective } from '../../shared/directives/input-mask.directive';
import { OtpVerificationComponent } from './otp-verification.component';
import { TicketViewerComponent } from './ticket-viewer.component';

@Component({
  selector: 'app-booking-stepper',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyEgpPipe,
    InputMaskDirective,
    OtpVerificationComponent,
    TicketViewerComponent
  ],
  template: `
    <div class="booking-portal py-4 px-2 px-md-4">
      <!-- Stepper Progress Header -->
      @if (currentStep < 5) {
        <div class="stepper-header mb-4 max-w-750 mx-auto">
          <div class="d-flex align-items-center justify-content-between position-relative">
            <div class="stepper-progress-bar" [style.width.%]="(currentStep - 1) * 33.3"></div>

            <div class="step-node" [class.active]="currentStep === 1" [class.completed]="currentStep > 1">
              <div class="node-circle">1</div>
              <span class="node-label">العيادة والطبيب</span>
            </div>

            <div class="step-node" [class.active]="currentStep === 2" [class.completed]="currentStep > 2">
              <div class="node-circle">2</div>
              <span class="node-label">الموعد الذكي</span>
            </div>

            <div class="step-node" [class.active]="currentStep === 3" [class.completed]="currentStep > 3">
              <div class="node-circle">3</div>
              <span class="node-label">البيانات السريرية</span>
            </div>

            <div class="step-node" [class.active]="currentStep === 4" [class.completed]="currentStep > 4">
              <div class="node-circle">4</div>
              <span class="node-label">رمز الأمان OTP</span>
            </div>
          </div>
        </div>
      }

      <!-- STEP 1: Department & Doctor Selection -->
      @if (currentStep === 1) {
        <div class="step-container max-w-950 mx-auto">
          <div class="text-center mb-4">
            <h4 class="fw-bold mb-1">اختر التخصص الطبي المناسب لحالتك</h4>
            <p class="text-muted small">نخبة من الاستشاريين والأخصائيين المعتمدين في خدمتكم</p>
          </div>

          <!-- Departments Grid -->
          <div class="row g-3 mb-4">
            @for (dept of departments; track dept.id) {
              <div class="col-6 col-md-4 col-lg-2">
                <div
                  class="dept-card p-3 text-center rounded-4 h-100 cursor-pointer"
                  [class.selected]="selectedDepartment?.id === dept.id"
                  (click)="onSelectDepartment(dept)"
                >
                  <div class="dept-icon-box mx-auto mb-2" [style.color]="dept.accentColor">
                    <i [class]="'bi ' + dept.icon"></i>
                  </div>
                  <h6 class="dept-title mb-0">{{ dept.nameAr }}</h6>
                </div>
              </div>
            }
          </div>

          <!-- Doctors for Selected Department -->
          @if (selectedDepartment) {
            <div class="doctors-section mt-4 animate-fade-in">
              <h5 class="fw-bold mb-3 d-flex align-items-center gap-2">
                <i class="bi bi-person-badge text-primary"></i>
                أطباء قسم {{ selectedDepartment.nameAr }}
              </h5>

              <div class="row g-3">
                @for (doc of availableDoctors; track doc.id) {
                  <div class="col-md-6">
                    <div
                      class="doctor-card p-3 rounded-4 border bg-surface d-flex gap-3 cursor-pointer"
                      [class.selected]="selectedDoctor?.id === doc.id"
                      (click)="onSelectDoctor(doc)"
                    >
                      <img [src]="doc.avatarUrl" [alt]="doc.name" class="doctor-avatar rounded-circle" />
                      <div class="flex-grow-1">
                        <div class="d-flex align-items-start justify-content-between mb-1">
                          <h6 class="fw-bold mb-0 text-dark">{{ doc.name }}</h6>
                          <span class="badge bg-warning-subtle text-warning-emphasis small">
                            <i class="bi bi-star-fill text-warning me-1"></i>
                            {{ doc.rating }} ({{ doc.reviewsCount }})
                          </span>
                        </div>
                        <p class="text-muted small mb-2">{{ doc.title }}</p>

                        <div class="d-flex flex-wrap gap-2 align-items-center text-muted small">
                          <span><i class="bi bi-door-open me-1"></i>غرفة {{ doc.roomNumber }}</span>
                          <span>•</span>
                          <span class="fw-bold text-success">
                            <i class="bi bi-cash-stack me-1"></i>{{ doc.consultationFee | currencyEgp }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Next Button -->
              <div class="text-end mt-4">
                <button
                  class="btn btn-primary px-4 py-2 fw-bold"
                  [disabled]="!selectedDoctor"
                  (click)="goToStep(2)"
                >
                  التالي: اختيار الموعد
                  <i class="bi bi-arrow-left ms-1"></i>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- STEP 2: Smart Slot Picker -->
      @if (currentStep === 2 && selectedDoctor) {
        <div class="step-container max-w-750 mx-auto animate-fade-in">
          <div class="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 class="fw-bold mb-1">تحديد اليوم والوقت المناسب</h4>
              <p class="text-muted small mb-0">مع {{ selectedDoctor.name }} - عيادة ({{ selectedDoctor.roomNumber }})</p>
            </div>
            <button class="btn btn-outline-secondary btn-sm" (click)="goToStep(1)">
              تغيير الطبيب
            </button>
          </div>

          <!-- Date Selector Chips (Next 7 days) -->
          <div class="mb-4">
            <label class="form-label fw-bold small text-muted">اختر اليوم المتاح:</label>
            <div class="d-flex gap-2 overflow-x-auto pb-2">
              @for (day of availableDays; track day.dateStr) {
                <button
                  type="button"
                  class="date-chip-btn rounded-3 p-2 text-center"
                  [class.active]="selectedDate === day.dateStr"
                  (click)="onSelectDate(day.dateStr)"
                >
                  <div class="day-name small">{{ day.dayName }}</div>
                  <div class="day-num fw-bold fs-5">{{ day.dayNumber }}</div>
                  <div class="day-month small text-muted">{{ day.monthName }}</div>
                </button>
              }
            </div>
          </div>

          <!-- Slot Chips Container -->
          <div class="slots-container p-4 rounded-4 bg-surface border mb-4">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <h6 class="fw-bold m-0">المواعيد المتاحة (فترات 30 دقيقة):</h6>
              @if (dayAvailability) {
                <span class="badge bg-primary-subtle text-primary">
                  متاح {{ dayAvailability.availableSlots }} من إجمالي {{ dayAvailability.totalSlots }} فترة
                </span>
              }
            </div>

            @if (dayAvailability && dayAvailability.isVacation) {
              <div class="alert alert-warning text-center my-3">
                <i class="bi bi-calendar-x me-1"></i>
                الطبيب في إجازة رسمية في هذا اليوم. يُرجى اختيار يوم آخر.
              </div>
            } @else if (dayAvailability && !dayAvailability.isWorkingDay) {
              <div class="alert alert-secondary text-center my-3">
                <i class="bi bi-moon me-1"></i>
                يوم عطلة أسبوعية للطبيب. يُرجى اختيار يوم عمل رسمي.
              </div>
            } @else if (dayAvailability && dayAvailability.slots.length > 0) {
              <div class="row g-2">
                @for (slot of dayAvailability.slots; track slot.time) {
                  <div class="col-6 col-sm-4 col-md-3">
                    <button
                      type="button"
                      class="slot-btn w-100 p-2 rounded-3 text-center border"
                      [class.selected]="selectedTimeSlot === slot.time"
                      [class.disabled-slot]="!slot.isAvailable"
                      [disabled]="!slot.isAvailable"
                      (click)="onSelectSlot(slot.time)"
                    >
                      <div class="fw-bold slot-time">{{ slot.label }}</div>
                      @if (!slot.isAvailable && slot.reasonLabelAr) {
                        <div class="slot-reason">{{ slot.reasonLabelAr }}</div>
                      }
                    </button>
                  </div>
                }
              </div>
            } @else {
              <div class="text-center text-muted py-4">
                لا توجد مواعيد متاحة في هذا اليوم.
              </div>
            }
          </div>

          <!-- Buttons -->
          <div class="d-flex justify-content-between">
            <button class="btn btn-light" (click)="goToStep(1)">
              <i class="bi bi-arrow-right me-1"></i> السابق
            </button>
            <button
              class="btn btn-primary px-4 fw-bold"
              [disabled]="!selectedTimeSlot"
              (click)="goToStep(3)"
            >
              التالي: استيفاء البيانات
              <i class="bi bi-arrow-left ms-1"></i>
            </button>
          </div>
        </div>
      }

      <!-- STEP 3: Medical Intake Form -->
      @if (currentStep === 3) {
        <div class="step-container max-w-750 mx-auto animate-fade-in">
          <div class="mb-4">
            <h4 class="fw-bold mb-1">البيانات الشخصية والتقييم السريري (Triage)</h4>
            <p class="text-muted small">يرجى تحري الدقة لضمان تحضير ملفك الطبي قبل مقابلة الطبيب</p>
          </div>

          <form #intakeForm="ngForm" class="bg-surface p-4 rounded-4 border shadow-sm mb-4">
            <!-- Patient Demographics -->
            <h6 class="fw-bold text-primary mb-3 border-bottom pb-2">
              <i class="bi bi-person-lines-fill me-1"></i>
              بيانات المريض الأساسية
            </h6>

            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <label class="form-label small fw-bold">الاسم الثلاثي أو الرباعي <span class="text-danger">*</span></label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="مثال: أحمد محمود رضوان"
                  required
                  name="fullName"
                  [(ngModel)]="formData.fullName"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label small fw-bold">رقم الهاتف المحمول (واتساب) <span class="text-danger">*</span></label>
                <input
                  type="tel"
                  class="form-control dir-ltr text-end"
                  placeholder="01012345678"
                  required
                  appInputMask="phone"
                  name="phone"
                  [(ngModel)]="formData.phone"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label small fw-bold">البريد الإلكتروني (لتأكيد الحجز برمز OTP) <span class="text-danger">*</span></label>
                <input
                  type="email"
                  class="form-control dir-ltr"
                  placeholder="patient@example.com"
                  required
                  email
                  name="email"
                  [(ngModel)]="formData.email"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label small fw-bold">الرقم القومي (14 رقم) <span class="text-danger">*</span></label>
                <input
                  type="text"
                  class="form-control dir-ltr text-end"
                  placeholder="29001011234567"
                  required
                  appInputMask="nationalId"
                  name="nationalId"
                  [(ngModel)]="formData.nationalId"
                />
              </div>

              <div class="col-md-4">
                <label class="form-label small fw-bold">تاريخ الميلاد</label>
                <input
                  type="date"
                  class="form-control"
                  name="dateOfBirth"
                  [(ngModel)]="formData.dateOfBirth"
                />
              </div>

              <div class="col-md-4">
                <label class="form-label small fw-bold">النوع</label>
                <select class="form-select" name="gender" [(ngModel)]="formData.gender">
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>

              <div class="col-md-4">
                <label class="form-label small fw-bold">فصيلة الدم</label>
                <select class="form-select dir-ltr" name="bloodGroup" [(ngModel)]="formData.bloodGroup">
                  <option value="O+">O+</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                  <option value="O-">O-</option>
                  <option value="A-">A-</option>
                  <option value="B-">B-</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <!-- Clinical Intake -->
            <h6 class="fw-bold text-primary mb-3 border-bottom pb-2">
              <i class="bi bi-clipboard2-pulse me-1"></i>
              التقييم الطبي والأعراض الحالية
            </h6>

            <!-- Chronic Diseases Badges Selector -->
            <div class="mb-3">
              <label class="form-label small fw-bold">الأمراض المزمنة (اختر ما ينطبق):</label>
              <div class="d-flex flex-wrap gap-2">
                @for (disease of commonDiseases; track disease) {
                  <button
                    type="button"
                    class="btn btn-sm"
                    [class.btn-primary]="isDiseaseSelected(disease)"
                    [class.btn-outline-secondary]="!isDiseaseSelected(disease)"
                    (click)="toggleDisease(disease)"
                  >
                    @if (isDiseaseSelected(disease)) {
                      <i class="bi bi-check2 me-1"></i>
                    }
                    {{ disease }}
                  </button>
                }
              </div>
            </div>

            <!-- Current Medications -->
            <div class="mb-3">
              <label class="form-label small fw-bold">الأدوية التي تتناولها حالياً:</label>
              <input
                type="text"
                class="form-control"
                placeholder="مثال: Concor 5mg, Lipitor 20mg (أو اكتب 'لا يوجد')"
                name="currentMedications"
                [(ngModel)]="formData.currentMedications"
              />
            </div>

            <!-- Chief Complaint -->
            <div class="mb-3">
              <label class="form-label small fw-bold">وصف الشكوى المرضية والأعراض <span class="text-danger">*</span></label>
              <textarea
                class="form-control"
                rows="3"
                placeholder="صف الأعراض التي تشعر بها ومتى بدأت..."
                required
                name="symptoms"
                [(ngModel)]="formData.symptoms"
              ></textarea>
            </div>

            <!-- Triage Severity Range Slider -->
            <div class="mb-4 p-3 rounded-3 bg-light border">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <label class="form-label small fw-bold m-0">تقييمك لشدة الألم أو الإلحاح (Triage Scale 1-5):</label>
                <span [class]="getTriageBadgeClass(formData.triageSeverity)">
                  {{ getTriageSeverityLabel(formData.triageSeverity) }}
                </span>
              </div>
              <input
                type="range"
                class="form-range"
                min="1"
                max="5"
                step="1"
                name="triageSeverity"
                [(ngModel)]="formData.triageSeverity"
              />
              <div class="d-flex justify-content-between text-muted x-small">
                <span>1: طفيف / استشارة عادية</span>
                <span>3: متوسط</span>
                <span class="text-danger fw-bold">5: طوارئ حرجة</span>
              </div>
            </div>

            <!-- Photo / Lab Reports Uploader -->
            <div class="mb-2">
              <label class="form-label small fw-bold">تحميل صور التحاليل أو الروشتات السابقة (اختياري):</label>
              <input
                type="file"
                class="form-control form-control-sm"
                accept="image/*,.pdf"
                (change)="onFileUpload($event)"
              />

              @if (formData.uploadedLabPhotos.length > 0) {
                <div class="d-flex flex-wrap gap-2 mt-2">
                  @for (photo of formData.uploadedLabPhotos; track $index) {
                    <div class="position-relative preview-thumbnail-box">
                      <img [src]="photo" alt="Lab upload" class="img-thumbnail" />
                      <button
                        type="button"
                        class="btn btn-danger btn-xs position-absolute top-0 end-0 rounded-circle"
                        (click)="removeUploadedPhoto($index)"
                      >
                        <i class="bi bi-x"></i>
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          </form>

          <!-- Buttons -->
          <div class="d-flex justify-content-between">
            <button class="btn btn-light" (click)="goToStep(2)">
              <i class="bi bi-arrow-right me-1"></i> السابق
            </button>
            <button
              class="btn btn-primary px-4 fw-bold"
              [disabled]="!intakeForm.form.valid"
              (click)="proceedToOtp()"
            >
              التالي: إرسال رمز الأمان OTP
              <i class="bi bi-arrow-left ms-1"></i>
            </button>
          </div>
        </div>
      }

      <!-- STEP 4: OTP Verification -->
      @if (currentStep === 4) {
        <div class="step-container max-w-550 mx-auto animate-fade-in">
          <app-otp-verification
            [recipientEmail]="formData.email"
            [recipientPhone]="formData.phone"
            [patientName]="formData.fullName"
            (verified)="onOtpVerifiedSuccess()"
            (onCancel)="goToStep(3)"
          >
          </app-otp-verification>
        </div>
      }

      <!-- STEP 5: Ticket Confirmation Screen -->
      @if (currentStep === 5 && confirmedAppointment) {
        <div class="step-container max-w-650 mx-auto animate-fade-in">
          <div class="alert alert-success text-center mb-4 rounded-4 shadow-sm border-0 py-3">
            <i class="bi bi-check-circle-fill fs-3 text-success d-block mb-1"></i>
            <h5 class="fw-bold mb-1">تم تأكيد حجز موعدك بنجاح!</h5>
            <p class="small mb-0 opacity-75">تم إنشاء تذكرتك الطبية وإرسال تفاصيل الموعد لهاتفك</p>
          </div>

          <app-ticket-viewer
            [appointment]="confirmedAppointment"
            (newBooking)="resetBooking()"
          >
          </app-ticket-viewer>
        </div>
      }
    </div>
  `,
  styles: [`
    .max-w-950 { max-width: 950px; }
    .max-w-750 { max-width: 750px; }
    .max-w-650 { max-width: 650px; }
    .max-w-550 { max-width: 550px; }
    .cursor-pointer { cursor: pointer; }
    .x-small { font-size: 0.72rem; }

    /* Stepper */
    .stepper-progress-bar {
      position: absolute;
      top: 18px;
      right: 0;
      height: 3px;
      background: #0ea5e9;
      transition: width 0.3s ease;
      z-index: 1;
    }
    .stepper-header::before {
      content: '';
      position: absolute;
      top: 18px;
      right: 0;
      left: 0;
      height: 3px;
      background: var(--cp-border, #e2e8f0);
      z-index: 0;
    }
    .step-node {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
    }
    .node-circle {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--cp-surface, #ffffff);
      border: 2px solid var(--cp-border, #cbd5e1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: var(--cp-text-muted, #64748b);
      transition: all 0.25s ease;
    }
    .step-node.active .node-circle {
      border-color: #0ea5e9;
      background: #0ea5e9;
      color: #ffffff;
      box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.2);
    }
    .step-node.completed .node-circle {
      border-color: #10b981;
      background: #10b981;
      color: #ffffff;
    }
    .node-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--cp-text-muted, #64748b);
    }
    .step-node.active .node-label {
      color: var(--cp-text, #0f172a);
      font-weight: 700;
    }

    /* Department Cards */
    .dept-card {
      background: var(--cp-surface, #ffffff);
      border: 1px solid var(--cp-border, #e2e8f0);
      transition: all 0.2s ease;
    }
    .dept-card:hover {
      border-color: #0ea5e9;
      transform: translateY(-2px);
    }
    .dept-card.selected {
      border-color: #0ea5e9;
      background: rgba(14, 165, 233, 0.08);
      box-shadow: 0 0 0 2px #0ea5e9;
    }
    .dept-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: var(--cp-surface-2, #f8fafc);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .dept-title {
      font-size: 0.85rem;
      font-weight: 700;
    }

    /* Doctor Card */
    .doctor-avatar {
      width: 64px;
      height: 64px;
      object-fit: cover;
    }
    .doctor-card {
      transition: all 0.2s ease;
    }
    .doctor-card:hover {
      border-color: #0ea5e9;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .doctor-card.selected {
      border-color: #0ea5e9;
      background: rgba(14, 165, 233, 0.05);
      box-shadow: 0 0 0 2px #0ea5e9;
    }

    /* Date Chips */
    .date-chip-btn {
      background: var(--cp-surface, #ffffff);
      border: 1px solid var(--cp-border, #e2e8f0);
      min-width: 80px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .date-chip-btn:hover {
      border-color: #0ea5e9;
    }
    .date-chip-btn.active {
      background: #0ea5e9;
      border-color: #0ea5e9;
      color: #ffffff;
    }
    .date-chip-btn.active .day-month,
    .date-chip-btn.active .day-name {
      color: rgba(255, 255, 255, 0.85) !important;
    }

    /* Slot Button */
    .slot-btn {
      background: var(--cp-surface, #ffffff);
      transition: all 0.15s ease;
      cursor: pointer;
    }
    .slot-btn:hover:not(:disabled) {
      border-color: #0ea5e9;
      background: rgba(14, 165, 233, 0.05);
    }
    .slot-btn.selected {
      background: #0ea5e9;
      border-color: #0ea5e9;
      color: #ffffff;
    }
    .disabled-slot {
      background: var(--cp-surface-2, #f1f5f9) !important;
      opacity: 0.6;
      cursor: not-allowed;
    }
    .slot-reason {
      font-size: 0.68rem;
      color: var(--cp-text-muted, #94a3b8);
    }
    .preview-thumbnail-box {
      width: 70px;
      height: 70px;
    }
    .preview-thumbnail-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .btn-xs {
      width: 18px;
      height: 18px;
      padding: 0;
      font-size: 10px;
      line-height: 18px;
    }
    .animate-fade-in {
      animation: fadeIn 0.25s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class BookingStepperComponent implements OnInit {
  private readonly db = inject(MockDatabaseService);
  private readonly slotEngine = inject(AppointmentEngineService);
  private readonly otpService = inject(OtpSecurityService);
  private readonly notifications = inject(NotificationService);

  currentStep = 1;

  // Step 1 Data
  departments: DepartmentInfo[] = [];
  selectedDepartment: DepartmentInfo | null = null;
  availableDoctors: Doctor[] = [];
  selectedDoctor: Doctor | null = null;

  // Step 2 Data
  availableDays: { dateStr: string; dayName: string; dayNumber: string; monthName: string }[] = [];
  selectedDate = '';
  dayAvailability: DayAvailability | null = null;
  selectedTimeSlot = '';

  // Step 3 Data
  readonly commonDiseases = [
    'السكري (Diabetes)',
    'ارتفاع ضغط الدم (Hypertension)',
    'حساسية الصدر والربو (Asthma)',
    'حساسية البنسلين (Penicillin Allergy)',
    'أمراض القلب والشرايين',
    'خشونة المفاصل'
  ];

  formData = {
    fullName: '',
    phone: '',
    email: '',
    nationalId: '',
    dateOfBirth: '1995-05-15',
    gender: 'male' as 'male' | 'female',
    bloodGroup: 'A+' as any,
    chronicDiseases: [] as string[],
    currentMedications: '',
    symptoms: '',
    triageSeverity: 2 as 1 | 2 | 3 | 4 | 5,
    uploadedLabPhotos: [] as string[]
  };

  confirmedAppointment: Appointment | null = null;

  constructor() {
    effect(() => {
      // Subscribe to signal changes
      this.db.departmentsVersion();
      this.db.doctorsVersion();
      this.refreshData();
    });
  }

  ngOnInit(): void {
    this.buildAvailableDays();
  }

  private refreshData(): void {
    this.departments = this.db.getDepartments();
    if (!this.selectedDepartment && this.departments.length > 0) {
      this.onSelectDepartment(this.departments[0]);
    } else if (this.selectedDepartment) {
      const exists = this.departments.find(d => d.id === this.selectedDepartment!.id);
      if (exists) {
        this.selectedDepartment = exists;
        this.availableDoctors = this.db.doctors.query(d => d.department === exists.id);
        if (this.selectedDoctor) {
          this.selectedDoctor = this.availableDoctors.find(d => d.id === this.selectedDoctor!.id) || this.availableDoctors[0] || null;
        }
      } else if (this.departments.length > 0) {
        this.onSelectDepartment(this.departments[0]);
      }
    }
  }

  onSelectDepartment(dept: DepartmentInfo): void {
    this.selectedDepartment = dept;
    this.availableDoctors = this.db.doctors.query(d => d.department === dept.id);
    this.selectedDoctor = this.availableDoctors[0] || null;
  }

  onSelectDoctor(doc: Doctor): void {
    this.selectedDoctor = doc;
  }

  private buildAvailableDays(): void {
    const days: { dateStr: string; dayName: string; dayNumber: string; monthName: string }[] = [];
    const now = new Date();

    for (let i = 0; i < 10; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('ar-EG', { weekday: 'short' });
      const dayNumber = d.getDate().toString();
      const monthName = d.toLocaleDateString('ar-EG', { month: 'short' });

      days.push({ dateStr, dayName, dayNumber, monthName });
    }

    this.availableDays = days;
    if (days.length > 0) {
      this.onSelectDate(days[0].dateStr);
    }
  }

  onSelectDate(dateStr: string): void {
    this.selectedDate = dateStr;
    this.selectedTimeSlot = '';
    if (this.selectedDoctor) {
      this.dayAvailability = this.slotEngine.getDoctorAvailability(this.selectedDoctor.id, dateStr);
    }
  }

  onSelectSlot(time: string): void {
    this.selectedTimeSlot = time;
  }

  goToStep(step: number): void {
    if (step === 2 && this.selectedDoctor && !this.dayAvailability) {
      this.onSelectDate(this.selectedDate || this.availableDays[0]?.dateStr);
    }
    this.currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  isDiseaseSelected(disease: string): boolean {
    return this.formData.chronicDiseases.includes(disease);
  }

  toggleDisease(disease: string): void {
    const index = this.formData.chronicDiseases.indexOf(disease);
    if (index > -1) {
      this.formData.chronicDiseases.splice(index, 1);
    } else {
      this.formData.chronicDiseases.push(disease);
    }
  }

  getTriageSeverityLabel(val: number): string {
    switch (val) {
      case 1: return '1 - بسيط جداً';
      case 2: return '2 - روتيني معتدل';
      case 3: return '3 - ألم متوسط ملحوظ';
      case 4: return '4 - عاجل يستلزم تدخل سريع';
      case 5: return '5 - طوارئ حرجة قصوى';
      default: return '';
    }
  }

  getTriageBadgeClass(val: number): string {
    if (val <= 2) return 'badge bg-success';
    if (val === 3) return 'badge bg-warning text-dark';
    return 'badge bg-danger';
  }

  onFileUpload(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          this.formData.uploadedLabPhotos.push(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  removeUploadedPhoto(index: number): void {
    this.formData.uploadedLabPhotos.splice(index, 1);
  }

  proceedToOtp(): void {
    this.otpService.dispatchOtp(this.formData.email, this.formData.phone, this.formData.fullName);
    this.goToStep(4);
  }

  onOtpVerifiedSuccess(): void {
    if (!this.selectedDoctor || !this.selectedDepartment) return;

    // 1. Create or Find Patient
    let patient = this.db.patients.query(p => p.phone === this.formData.phone)[0];
    if (!patient) {
      const nextFileNum = 'PT-2026-' + (this.db.patients.getAll().length + 101);
      patient = this.db.patients.create({
        id: 'pt_' + Math.random().toString(36).substring(2, 9),
        fileNumber: nextFileNum,
        nationalId: this.formData.nationalId,
        fullName: this.formData.fullName,
        phone: this.formData.phone,
        email: this.formData.email,
        dateOfBirth: this.formData.dateOfBirth,
        gender: this.formData.gender,
        bloodGroup: this.formData.bloodGroup,
        chronicDiseases: this.formData.chronicDiseases,
        allergies: [],
        currentMedications: this.formData.currentMedications ? [this.formData.currentMedications] : [],
        emergencyContact: { name: 'المرافق', relation: 'أسرة', phone: this.formData.phone },
        registeredVia: 'online',
        createdAt: new Date().toISOString()
      });
    }

    // 2. Generate Ticket & Create Appointment
    const ticketNumber = this.slotEngine.generateTicketNumber(this.selectedDepartment.id);
    const priority: TriagePriority = this.formData.triageSeverity >= 4 ? 'urgent' : 'routine';

    const newAppointment: Appointment = {
      id: 'apt_' + Math.random().toString(36).substring(2, 9),
      ticketNumber,
      patientId: patient.id,
      patientName: patient.fullName,
      patientPhone: patient.phone,
      patientEmail: patient.email,
      doctorId: this.selectedDoctor.id,
      doctorName: this.selectedDoctor.name,
      department: this.selectedDepartment.id,
      departmentArabic: this.selectedDepartment.nameAr,
      roomNumber: this.selectedDoctor.roomNumber,
      date: this.selectedDate,
      timeSlot: this.selectedTimeSlot,
      status: 'confirmed',
      priority,
      intake: {
        symptoms: this.formData.symptoms,
        chronicDiseases: this.formData.chronicDiseases,
        currentMedications: this.formData.currentMedications ? [this.formData.currentMedications] : [],
        triageSeverity: this.formData.triageSeverity,
        uploadedLabPhotos: this.formData.uploadedLabPhotos
      },
      isWalkIn: false,
      bookedAt: new Date().toISOString(),
      otpVerified: true
    };

    this.db.appointments.create(newAppointment);
    this.confirmedAppointment = newAppointment;

    this.notifications.success(
      'تأكيد الحجز',
      `تم حجز موعدك بنجاح. تذكرتك هي [ ${ticketNumber} ] لدى ${this.selectedDoctor.name}.`
    );

    this.goToStep(5);
  }

  resetBooking(): void {
    this.currentStep = 1;
    this.confirmedAppointment = null;
    this.selectedTimeSlot = '';
    this.formData.symptoms = '';
    this.formData.uploadedLabPhotos = [];
  }
}
