import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDatabaseService } from '../../core/repositories/mock-database.service';
import { AppointmentEngineService } from '../../services/appointment-engine.service';
import { NotificationService } from '../../core/services/notification.service';
import { Doctor, DepartmentInfo } from '../../core/models/doctor.model';
import { Appointment, TriagePriority, VitalSigns } from '../../core/models/appointment.model';
import { Patient } from '../../core/models/patient.model';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { InputMaskDirective } from '../../shared/directives/input-mask.directive';

@Component({
  selector: 'app-check-in-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, InputMaskDirective],
  template: `
    <app-modal
      [isOpen]="isOpen"
      title="تسجيل مريض فوري (Walk-in Instant Check-in)"
      subtitle="تسجيل الحضور المباشر وتخصيص تذكرة طابور فورية بدون الحاجة لـ OTP"
      headerIcon="bi-person-plus-fill"
      size="lg"
      (closed)="onClose()"
    >
      <div class="row g-3">
        <!-- Patient Type Selection -->
        <div class="col-12">
          <div class="btn-group w-100 mb-2" role="group">
            <input type="radio" class="btn-check" name="ptType" id="ptNew" [value]="true" [(ngModel)]="isNewPatient">
            <label class="btn btn-outline-primary" for="ptNew">
              <i class="bi bi-person-plus me-1"></i> مريض جديد
            </label>

            <input type="radio" class="btn-check" name="ptType" id="ptExisting" [value]="false" [(ngModel)]="isNewPatient">
            <label class="btn btn-outline-primary" for="ptExisting">
              <i class="bi bi-search me-1"></i> مريض مسجل مسبقاً
            </label>
          </div>
        </div>

        @if (!isNewPatient) {
          <!-- Existing Patient Search -->
          <div class="col-12">
            <label class="form-label small fw-bold">اختر المريض من السجلات:</label>
            <select class="form-select" [(ngModel)]="selectedExistingPatientId" (change)="onExistingPatientChange()">
              <option value="">-- اختر مريضاً مسجلاً --</option>
              @for (pt of allPatients; track pt.id) {
                <option [value]="pt.id">
                  {{ pt.fullName }} ({{ pt.phone }}) - ملف: {{ pt.fileNumber }}
                </option>
              }
            </select>
          </div>
        }

        <!-- Patient Demographics -->
        <div class="col-md-6">
          <label class="form-label small fw-bold">الاسم الرباعي للمريض <span class="text-danger">*</span></label>
          <input
            type="text"
            class="form-control"
            placeholder="الاسم الكامل"
            [(ngModel)]="formData.fullName"
            [disabled]="!isNewPatient && !!selectedExistingPatientId"
          />
        </div>

        <div class="col-md-6">
          <label class="form-label small fw-bold">رقم الهاتف (واتساب) <span class="text-danger">*</span></label>
          <input
            type="tel"
            class="form-control dir-ltr text-end"
            placeholder="01012345678"
            appInputMask="phone"
            [(ngModel)]="formData.phone"
            [disabled]="!isNewPatient && !!selectedExistingPatientId"
          />
        </div>

        <!-- Clinic & Doctor Routing -->
        <div class="col-md-6">
          <label class="form-label small fw-bold">العيادة المحول إليها <span class="text-danger">*</span></label>
          <select class="form-select" [(ngModel)]="formData.departmentId" (change)="onDeptChange()">
            @for (dept of departments; track dept.id) {
              <option [value]="dept.id">{{ dept.nameAr }}</option>
            }
          </select>
        </div>

        <div class="col-md-6">
          <label class="form-label small fw-bold">الطبيب المعالج <span class="text-danger">*</span></label>
          <select class="form-select" [(ngModel)]="formData.doctorId">
            @for (doc of filteredDoctors; track doc.id) {
              <option [value]="doc.id">{{ doc.name }} (غرفة {{ doc.roomNumber }})</option>
            }
          </select>
        </div>

        <!-- Triage Priority -->
        <div class="col-md-6">
          <label class="form-label small fw-bold">أولوية الطوارئ (Triage Severity) <span class="text-danger">*</span></label>
          <select class="form-select" [(ngModel)]="formData.priority">
            <option value="routine">كشف اعتيادي (Routine)</option>
            <option value="urgent">حالة عاجلة (Urgent)</option>
            <option value="emergency">🚨 طوارئ قصوى (Emergency)</option>
          </select>
        </div>

        <div class="col-md-6">
          <label class="form-label small fw-bold">الشكوى الأولية السريعة</label>
          <input
            type="text"
            class="form-control"
            placeholder="ألم شديد، ضيق تنفس، خلع ضرس..."
            [(ngModel)]="formData.symptoms"
          />
        </div>

        <!-- Quick Triage Vitals Check -->
        <div class="col-12">
          <div class="p-3 rounded-3 bg-light border">
            <h6 class="fw-bold small text-primary mb-2">
              <i class="bi bi-heart-pulse-fill me-1"></i>
              القياسات الحيوية الأولية عند الوصول (اختياري بالاستقبال)
            </h6>
            <div class="row g-2">
              <div class="col-6 col-md-3">
                <label class="form-label x-small text-muted mb-1">ضغط الدم (انقباضي/انبساطي)</label>
                <div class="input-group input-group-sm">
                  <input type="number" class="form-control" placeholder="120" [(ngModel)]="vitals.systolicBp" />
                  <span class="input-group-text">/</span>
                  <input type="number" class="form-control" placeholder="80" [(ngModel)]="vitals.diastolicBp" />
                </div>
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label x-small text-muted mb-1">النبض (bpm)</label>
                <input type="number" class="form-control form-control-sm" placeholder="72" [(ngModel)]="vitals.pulseRate" />
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label x-small text-muted mb-1">الحرارة (°C)</label>
                <input type="number" step="0.1" class="form-control form-control-sm" placeholder="37.0" [(ngModel)]="vitals.temperature" />
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label x-small text-muted mb-1">تشبع الأكسجين SpO2 (%)</label>
                <input type="number" class="form-control form-control-sm" placeholder="98" [(ngModel)]="vitals.oxygenSaturation" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div footer class="d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-light" (click)="onClose()">إلغاء</button>
        <button
          type="button"
          class="btn btn-primary fw-bold px-4"
          [disabled]="!formData.fullName || !formData.phone || !formData.doctorId"
          (click)="submitWalkIn()"
        >
          <i class="bi bi-ticket-perforated-fill me-1"></i>
          إصدار التذكرة وإدراج بالطابور
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .x-small { font-size: 0.72rem; }
  `]
})
export class CheckInModalComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() patientRegistered = new EventEmitter<Appointment>();

  private readonly db = inject(MockDatabaseService);
  private readonly slotEngine = inject(AppointmentEngineService);
  private readonly notifications = inject(NotificationService);

  isNewPatient = true;
  selectedExistingPatientId = '';
  allPatients: Patient[] = [];
  departments: DepartmentInfo[] = [];
  filteredDoctors: Doctor[] = [];

  formData = {
    fullName: '',
    phone: '',
    departmentId: 'general',
    doctorId: '',
    priority: 'routine' as TriagePriority,
    symptoms: ''
  };

  vitals: Partial<VitalSigns> = {
    systolicBp: 120,
    diastolicBp: 80,
    pulseRate: 75,
    temperature: 37.0,
    oxygenSaturation: 98
  };

  ngOnInit(): void {
    this.allPatients = this.db.patients.getAll();
    this.departments = this.db.getDepartments();
    if (this.departments.length > 0) {
      this.formData.departmentId = this.departments[0].id;
      this.onDeptChange();
    }
  }

  onDeptChange(): void {
    this.filteredDoctors = this.db.doctors.query(d => d.department === this.formData.departmentId);
    if (this.filteredDoctors.length > 0) {
      this.formData.doctorId = this.filteredDoctors[0].id;
    }
  }

  onExistingPatientChange(): void {
    if (!this.selectedExistingPatientId) return;
    const pt = this.db.patients.getById(this.selectedExistingPatientId);
    if (pt) {
      this.formData.fullName = pt.fullName;
      this.formData.phone = pt.phone;
    }
  }

  submitWalkIn(): void {
    let patient: Patient;

    if (!this.isNewPatient && this.selectedExistingPatientId) {
      patient = this.db.patients.getById(this.selectedExistingPatientId)!;
    } else {
      // Find or create
      const existing = this.db.patients.query(p => p.phone === this.formData.phone)[0];
      if (existing) {
        patient = existing;
      } else {
        const fileNum = 'PT-2026-' + (this.db.patients.getAll().length + 101);
        patient = this.db.patients.create({
          id: 'pt_' + Math.random().toString(36).substring(2, 9),
          fileNumber: fileNum,
          nationalId: 'WALK-' + Math.floor(100000000 + Math.random() * 900000000),
          fullName: this.formData.fullName,
          phone: this.formData.phone,
          email: `${this.formData.phone}@carepoint.local`,
          dateOfBirth: '1990-01-01',
          gender: 'male',
          bloodGroup: 'O+',
          chronicDiseases: [],
          allergies: [],
          currentMedications: [],
          emergencyContact: { name: 'مرافق', relation: 'أسرة', phone: this.formData.phone },
          registeredVia: 'walk-in',
          createdAt: new Date().toISOString()
        });
      }
    }

    const doctor = this.db.doctors.getById(this.formData.doctorId)!;
    const dept = this.departments.find(d => d.id === this.formData.departmentId)!;
    const ticketNumber = this.slotEngine.generateTicketNumber(this.formData.departmentId);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeSlotStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newApt: Appointment = {
      id: 'apt_' + Math.random().toString(36).substring(2, 9),
      ticketNumber,
      patientId: patient.id,
      patientName: patient.fullName,
      patientPhone: patient.phone,
      patientEmail: patient.email,
      doctorId: doctor.id,
      doctorName: doctor.name,
      department: dept.id,
      departmentArabic: dept.nameAr,
      roomNumber: doctor.roomNumber,
      date: todayStr,
      timeSlot: timeSlotStr,
      status: 'waiting', // Immediately waiting in queue
      priority: this.formData.priority,
      intake: {
        symptoms: this.formData.symptoms || 'تسجيل دخول فوري بالاستقبال',
        chronicDiseases: patient.chronicDiseases || [],
        currentMedications: patient.currentMedications || [],
        triageSeverity: this.formData.priority === 'emergency' ? 5 : this.formData.priority === 'urgent' ? 4 : 2,
        uploadedLabPhotos: []
      },
      vitals: {
        systolicBp: this.vitals.systolicBp || 120,
        diastolicBp: this.vitals.diastolicBp || 80,
        pulseRate: this.vitals.pulseRate || 75,
        temperature: this.vitals.temperature || 37.0,
        oxygenSaturation: this.vitals.oxygenSaturation || 98,
        weightKg: 75,
        heightCm: 170,
        bmi: 26.0,
        bmiCategoryAr: 'وزن زائد (Overweight)',
        measuredAt: todayStr + ' ' + timeSlotStr
      },
      isWalkIn: true,
      bookedAt: now.toISOString(),
      checkedInAt: now.toISOString(),
      otpVerified: true
    };

    this.db.appointments.create(newApt);
    this.notifications.success(
      'تم تسجيل الدخول الفوري',
      `تم إصدار التذكرة [ ${ticketNumber} ] للمريض ${patient.fullName} وإدراجه في طابور الانتظار.`
    );

    this.patientRegistered.emit(newApt);
    this.onClose();
  }

  onClose(): void {
    this.isOpen = false;
    this.closed.emit();
  }
}
