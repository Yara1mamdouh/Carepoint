import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDatabaseService } from '../../core/repositories/mock-database.service';
import { EmrService } from '../../services/emr.service';
import { NotificationService } from '../../core/services/notification.service';
import { Prescription, PrescriptionItem, DiagnosticCode, DrugInteractionAlert } from '../../core/models/prescription.model';
import { MedicationInventory } from '../../core/models/inventory.model';
import { Patient } from '../../core/models/patient.model';
import { Doctor } from '../../core/models/doctor.model';
import { QrCodeComponent } from '../../shared/components/qr-code/qr-code.component';
import { MedicalDatePipe } from '../../shared/pipes/medical-date.pipe';

@Component({
  selector: 'app-prescription-writer',
  standalone: true,
  imports: [CommonModule, FormsModule, QrCodeComponent, MedicalDatePipe],
  template: `
    <div class="prescription-writer-wrap">
      <!-- Edit Mode Form -->
      @if (!isPrintPreview) {
        <div class="card border-0 shadow-sm rounded-4 p-4 bg-surface">
          <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
            <div>
              <h5 class="fw-bold mb-1 text-primary d-flex align-items-center gap-2">
                <i class="bi bi-prescription2"></i>
                محرر الروشتة الطبية الإلكترونية (Smart E-Rx)
              </h5>
              <small class="text-muted">للمريض: <strong>{{ patient?.fullName }}</strong> | الطبيب: {{ doctor?.name }}</small>
            </div>

            @if (prescriptionItems.length > 0) {
              <button class="btn btn-outline-primary btn-sm fw-bold" (click)="togglePrintPreview()">
                <i class="bi bi-eye me-1"></i> معاينة وطباعة الروشتة
              </button>
            }
          </div>

          <!-- ICD-10 Diagnoses Selector -->
          <div class="mb-4">
            <label class="form-label small fw-bold">التشخيص السريري (رموز ICD-10 المعتمدة):</label>
            <div class="d-flex flex-wrap gap-1 mb-2">
              @for (diag of emrService.icdCatalog; track diag.code) {
                <button
                  type="button"
                  class="btn btn-xs rounded-pill"
                  [class.btn-primary]="isDiagSelected(diag)"
                  [class.btn-light]="!isDiagSelected(diag)"
                  [class.border]="!isDiagSelected(diag)"
                  (click)="toggleDiag(diag)"
                >
                  <strong class="font-monospace me-1">{{ diag.code }}</strong>
                  <span>{{ diag.descriptionAr }}</span>
                </button>
              }
            </div>
          </div>

          <!-- Drug-Drug Interaction Alerts Box -->
          @if (activeInteractionAlerts.length > 0) {
            <div class="alert alert-danger p-3 rounded-3 mb-4 shadow-sm">
              <div class="d-flex align-items-center gap-2 fw-bold mb-2 text-danger">
                <i class="bi bi-exclamation-octagon-fill fs-5"></i>
                <span>تحذير تعارض دوائي مرصود (Drug-Drug Interaction Alert):</span>
              </div>
              @for (alert of activeInteractionAlerts; track alert.drugA + alert.drugB) {
                <div class="interaction-item p-2 mb-2 rounded bg-white border border-danger border-opacity-50 small">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <strong class="text-danger">{{ alert.drugA }} ⚡ {{ alert.drugB }}</strong>
                    <span class="badge bg-danger">{{ alert.severity === 'severe' ? 'خطورة مرتفعة' : 'تفاعل متوسط' }}</span>
                  </div>
                  <p class="mb-1 text-dark">{{ alert.descriptionAr }}</p>
                  <div class="text-muted x-small">
                    <strong>الإجراء المقترح:</strong> {{ alert.actionRecommendation }}
                  </div>
                </div>
              }
            </div>
          }

          <!-- Drug Catalog Search & Add Form -->
          <div class="add-drug-box p-3 rounded-3 bg-light border mb-4">
            <h6 class="fw-bold small mb-2 text-dark">
              <i class="bi bi-plus-circle-fill text-success me-1"></i>
              إضافة صنف دوائي من كتالوج الصيدلية
            </h6>

            <div class="row g-2 align-items-end">
              <div class="col-md-4">
                <label class="form-label x-small text-muted mb-1">اختر الدواء:</label>
                <select class="form-select form-select-sm" [(ngModel)]="selectedMedId" (change)="onMedSelect()">
                  <option value="">-- ابحث في دليل الأدوية --</option>
                  @for (med of availableMedications; track med.id) {
                    <option [value]="med.id">
                      {{ med.tradeName }} ({{ med.strength }}) - [رصيد: {{ med.currentStock }}]
                    </option>
                  }
                </select>
              </div>

              <div class="col-md-2">
                <label class="form-label x-small text-muted mb-1">الجرعة المحددة:</label>
                <input type="text" class="form-control form-control-sm" [(ngModel)]="currentDosage" placeholder="مثال: 500mg" />
              </div>

              <div class="col-md-3">
                <label class="form-label x-small text-muted mb-1">التكرار اليومي:</label>
                <select class="form-select form-select-sm" [(ngModel)]="currentFrequencyCode">
                  <option value="OD">مرة واحدة يومياً (OD)</option>
                  <option value="BID">مرتين يومياً بعد الأكل (BID)</option>
                  <option value="TID">3 مرات يومياً كل 8 ساعات (TID)</option>
                  <option value="QID">4 مرات يومياً (QID)</option>
                  <option value="PRN">عند اللزوم / عند الألم (PRN)</option>
                </select>
              </div>

              <div class="col-md-1">
                <label class="form-label x-small text-muted mb-1">المدة (أيام):</label>
                <input type="number" class="form-control form-control-sm" [(ngModel)]="currentDurationDays" min="1" max="90" />
              </div>

              <div class="col-md-2">
                <button
                  type="button"
                  class="btn btn-primary btn-sm w-100 fw-bold"
                  [disabled]="!selectedMedId"
                  (click)="addItemToPrescription()"
                >
                  <i class="bi bi-plus-lg me-1"></i> إضافة
                </button>
              </div>

              <div class="col-12 mt-2">
                <input
                  type="text"
                  class="form-control form-control-sm"
                  placeholder="تعليمات إضافية للمريض (مثال: يؤخذ بعد الغداء مع وفرة من السوائل)..."
                  [(ngModel)]="currentInstructions"
                />
              </div>
            </div>
          </div>

          <!-- Current Prescription Items Table -->
          @if (prescriptionItems.length > 0) {
            <div class="table-responsive mb-4">
              <table class="table table-hover align-middle border mb-0">
                <thead class="table-light">
                  <tr class="small text-muted">
                    <th>#</th>
                    <th>اسم الدواء والتركيز</th>
                    <th>التكرار ومواعيد الجرعة</th>
                    <th>المدة</th>
                    <th>تعليمات الاستخدام</th>
                    <th>الكمية</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of prescriptionItems; track item.id; let i = $index) {
                    <tr>
                      <td class="fw-bold">{{ i + 1 }}</td>
                      <td>
                        <strong class="text-dark d-block">{{ item.tradeName }}</strong>
                        <small class="text-muted">{{ item.genericName }} ({{ item.dosage }})</small>
                      </td>
                      <td><span class="badge bg-light text-dark border">{{ item.frequency }}</span></td>
                      <td>{{ item.durationDays }} يوم</td>
                      <td class="small text-muted">{{ item.instructions || '-' }}</td>
                      <td><span class="badge bg-secondary">{{ item.quantityToDispense }} عبوة</span></td>
                      <td>
                        <button class="btn btn-outline-danger btn-sm py-0 px-2" (click)="removeItem(i)">
                          <i class="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="alert alert-secondary text-center small text-muted py-3">
              لم تتم إضافة أدوية للروشتة بعد. اختر الدواء من القائمة أعلاه واضغط "إضافة".
            </div>
          }

          <!-- Doctor Clinical Notes -->
          <div class="mb-4">
            <label class="form-label small fw-bold">إرشادات الطبيب العامة للمريض وتوصيات المتابعة:</label>
            <textarea
              class="form-control"
              rows="2"
              placeholder="نصائح تغذية، مواعيد التحاليل القادمة، تجنب المجهود الشاق..."
              [(ngModel)]="doctorNotes"
            ></textarea>
          </div>

          <!-- Actions -->
          <div class="d-flex justify-content-between align-items-center pt-3 border-top">
            <button class="btn btn-light" (click)="cancelled.emit()">إلغاء</button>
            <div class="d-flex gap-2">
              <button
                class="btn btn-outline-primary"
                [disabled]="prescriptionItems.length === 0"
                (click)="togglePrintPreview()"
              >
                <i class="bi bi-printer me-1"></i> معاينة الطباعة (Print View)
              </button>
              <button
                class="btn btn-success fw-bold px-4"
                [disabled]="prescriptionItems.length === 0"
                (click)="saveAndIssuePrescription()"
              >
                <i class="bi bi-check-circle me-1"></i> حفظ واعتماد الروشتة
              </button>
            </div>
          </div>
        </div>
      }

      <!-- PRINTABLE BRANDED PRESCRIPTION VIEW -->
      @if (isPrintPreview) {
        <div class="card border-0 shadow-lg rounded-4 p-4 bg-surface printable-rx-card mx-auto" id="printable-prescription">
          <!-- Official Clinic Header -->
          <div class="rx-header d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
            <div class="d-flex align-items-center gap-3">
              <div class="rx-logo-box text-primary">
                <i class="bi bi-hospital fs-1"></i>
              </div>
              <div>
                <h4 class="fw-bold mb-0 text-dark">مجمع كير بوينت الطبي التخصصي</h4>
                <div class="text-muted small">CarePoint Pro Specialized Medical Complex</div>
                <div class="x-small text-muted">ترخيص وزارة الصحة: 48920/2026 - ت: 19850</div>
              </div>
            </div>

            <div class="text-end">
              <h6 class="fw-bold text-primary mb-1">{{ doctor?.name }}</h6>
              <div class="small text-muted">{{ doctor?.title }}</div>
              <div class="x-small text-muted">ترخيص مزاولة: {{ doctor?.licenseNumber }}</div>
            </div>
          </div>

          <!-- Patient Header Meta -->
          <div class="patient-rx-meta p-2 px-3 rounded-3 bg-light border mb-4 d-flex flex-wrap justify-content-between align-items-center small">
            <div>اسم المريض: <strong class="text-dark">{{ patient?.fullName }}</strong></div>
            <div>رقم الملف: <strong class="font-monospace text-dark">{{ patient?.fileNumber }}</strong></div>
            <div>التاريخ: <strong class="text-dark">{{ todayDate | medicalDate:'short' }}</strong></div>
            <div>رقم الروشتة: <strong class="font-monospace text-primary">{{ rxNumber }}</strong></div>
          </div>

          <!-- Diagnoses Tags -->
          @if (selectedDiagnoses.length > 0) {
            <div class="mb-3 small">
              <span class="text-muted fw-bold me-2">التشخيص المبدئي:</span>
              @for (diag of selectedDiagnoses; track diag.code) {
                <span class="badge bg-light text-dark border me-1">{{ diag.code }} - {{ diag.descriptionAr }}</span>
              }
            </div>
          }

          <!-- Rx Symbol & Medicines List -->
          <div class="rx-body my-3">
            <div class="rx-symbol text-primary fw-bold mb-3 fs-2 font-monospace">℞</div>

            <div class="px-3">
              @for (item of prescriptionItems; track item.id; let i = $index) {
                <div class="rx-item mb-3 pb-2 border-bottom">
                  <div class="d-flex align-items-baseline justify-content-between">
                    <div>
                      <strong class="fs-6 text-dark">{{ i + 1 }}. {{ item.tradeName }}</strong>
                      <span class="text-muted ms-2 small">({{ item.genericName }} - {{ item.dosage }})</span>
                    </div>
                    <span class="small fw-bold text-muted">{{ item.quantityToDispense }} عبوة</span>
                  </div>
                  <div class="text-primary small mt-1 ps-3">
                    <i class="bi bi-arrow-left-short"></i>
                    <strong>الجرعة:</strong> {{ item.frequency }} لمدة {{ item.durationDays }} يوم
                    @if (item.instructions) {
                      <span class="text-muted">({{ item.instructions }})</span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          @if (doctorNotes) {
            <div class="alert alert-light border small text-muted my-3">
              <strong>تعليمات الطبيب:</strong> {{ doctorNotes }}
            </div>
          }

          <!-- Prescription Footer: Signature & QR Verification -->
          <div class="rx-footer mt-4 pt-3 border-top d-flex align-items-center justify-content-between">
            <div>
              <app-qr-code
                [value]="getRxQrPayload()"
                [size]="85"
                caption="التحقق الإلكتروني">
              </app-qr-code>
            </div>

            <div class="text-center">
              <div class="digital-stamp p-2 rounded border border-primary border-opacity-25 bg-light mb-1">
                <div class="x-small text-primary fw-bold">CarePoint Verified E-Prescription</div>
                <div class="x-small text-muted font-monospace">{{ rxNumber }}</div>
              </div>
              <small class="text-muted">الختم والتوقيع الرقمي المعتمد</small>
            </div>

            <div class="text-end">
              <div class="signature-line border-bottom pb-1 mb-1 fw-bold text-dark font-monospace" style="min-width: 140px;">
                {{ doctor?.name }}
              </div>
              <small class="text-muted">توقيع الطبيب المعالج</small>
            </div>
          </div>

          <!-- Screen Actions (Hidden in Print) -->
          <div class="d-print-none mt-4 pt-3 border-top d-flex justify-content-between">
            <button class="btn btn-outline-secondary btn-sm" (click)="togglePrintPreview()">
              <i class="bi bi-pencil me-1"></i> العودة للتعديل
            </button>
            <div class="d-flex gap-2">
              <button class="btn btn-primary btn-sm fw-bold px-3" (click)="printPrescription()">
                <i class="bi bi-printer me-1"></i> طباعة الروشتة الآن
              </button>
              <button class="btn btn-success btn-sm fw-bold px-3" (click)="saveAndIssuePrescription()">
                <i class="bi bi-check2-circle me-1"></i> تأكيد وإرسال للصيدلية
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .btn-xs {
      font-size: 0.72rem;
      padding: 0.2rem 0.6rem;
    }
    .x-small { font-size: 0.7rem; }
    .printable-rx-card {
      max-width: 780px;
    }
    .rx-logo-box {
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .rx-symbol {
      font-style: italic;
      font-family: serif;
      line-height: 1;
    }

    @media print {
      body * {
        visibility: hidden;
      }
      #printable-prescription, #printable-prescription * {
        visibility: visible;
      }
      #printable-prescription {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        max-width: 100% !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
      }
    }
  `]
})
export class PrescriptionWriterComponent implements OnInit {
  @Input() patient: Patient | null = null;
  @Input() doctor: Doctor | null = null;
  @Input() appointmentId?: string;

  @Output() prescriptionSaved = new EventEmitter<Prescription>();
  @Output() cancelled = new EventEmitter<void>();

  readonly emrService = inject(EmrService);
  private readonly db = inject(MockDatabaseService);
  private readonly notifications = inject(NotificationService);

  isPrintPreview = false;
  todayDate = new Date().toISOString();
  rxNumber = 'RX-2026-' + Math.floor(1000 + Math.random() * 9000);

  availableMedications: MedicationInventory[] = [];
  selectedDiagnoses: DiagnosticCode[] = [];
  prescriptionItems: PrescriptionItem[] = [];
  activeInteractionAlerts: DrugInteractionAlert[] = [];
  doctorNotes = '';

  // Form helpers
  selectedMedId = '';
  currentDosage = '';
  currentFrequencyCode: PrescriptionItem['frequencyCode'] = 'BID';
  currentDurationDays = 7;
  currentInstructions = '';

  ngOnInit(): void {
    this.availableMedications = this.db.inventory.getAll();
    // Default diagnosis if empty
    if (this.emrService.icdCatalog.length > 0) {
      this.selectedDiagnoses = [this.emrService.icdCatalog[0]];
    }
  }

  isDiagSelected(diag: DiagnosticCode): boolean {
    return this.selectedDiagnoses.some(d => d.code === diag.code);
  }

  toggleDiag(diag: DiagnosticCode): void {
    const idx = this.selectedDiagnoses.findIndex(d => d.code === diag.code);
    if (idx > -1) {
      this.selectedDiagnoses.splice(idx, 1);
    } else {
      this.selectedDiagnoses.push(diag);
    }
  }

  onMedSelect(): void {
    const med = this.availableMedications.find(m => m.id === this.selectedMedId);
    if (med) {
      this.currentDosage = med.strength;
    }
  }

  addItemToPrescription(): void {
    const med = this.availableMedications.find(m => m.id === this.selectedMedId);
    if (!med) return;

    const freqMap: Record<string, string> = {
      OD: 'مرة واحدة يومياً (OD)',
      BID: 'مرتين يومياً (BID)',
      TID: '3 مرات يومياً (TID)',
      QID: '4 مرات يومياً (QID)',
      PRN: 'عند اللزوم (PRN)'
    };

    const newItem: PrescriptionItem = {
      id: 'item_' + Math.random().toString(36).substring(2, 9),
      medicationId: med.id,
      tradeName: med.tradeName,
      genericName: med.genericName,
      dosage: this.currentDosage || med.strength,
      frequency: freqMap[this.currentFrequencyCode] || this.currentFrequencyCode,
      frequencyCode: this.currentFrequencyCode,
      durationDays: this.currentDurationDays,
      instructions: this.currentInstructions,
      quantityToDispense: Math.max(1, Math.ceil(this.currentDurationDays / 15))
    };

    this.prescriptionItems.push(newItem);

    // Run Drug Interaction Checker
    this.checkInteractions();

    // Reset inputs
    this.selectedMedId = '';
    this.currentDosage = '';
    this.currentInstructions = '';
  }

  removeItem(index: number): void {
    this.prescriptionItems.splice(index, 1);
    this.checkInteractions();
  }

  private checkInteractions(): void {
    const prescribedGenerics = this.prescriptionItems.map(i => i.genericName);
    const patientMeds = this.patient?.currentMedications || [];
    const allergies = this.patient?.allergies || [];
    const chronic = this.patient?.chronicDiseases || [];
    this.activeInteractionAlerts = this.emrService.checkDrugInteractions(
      prescribedGenerics,
      patientMeds,
      allergies,
      chronic
    );
  }

  togglePrintPreview(): void {
    this.isPrintPreview = !this.isPrintPreview;
  }

  printPrescription(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  getRxQrPayload(): string {
    return JSON.stringify({
      rx: this.rxNumber,
      pt: this.patient?.fullName,
      doc: this.doctor?.name,
      dt: this.todayDate.split('T')[0],
      items: this.prescriptionItems.length
    });
  }

  saveAndIssuePrescription(): void {
    if (!this.patient || !this.doctor) return;

    const newPrescription: Prescription = {
      id: 'rx_' + Math.random().toString(36).substring(2, 9),
      prescriptionNumber: this.rxNumber,
      appointmentId: this.appointmentId || 'apt_direct',
      patientId: this.patient.id,
      patientName: this.patient.fullName,
      patientAge: 35,
      doctorId: this.doctor.id,
      doctorName: this.doctor.name,
      doctorLicense: this.doctor.licenseNumber,
      departmentArabic: this.doctor.departmentArabic,
      diagnoses: this.selectedDiagnoses,
      items: this.prescriptionItems,
      interactionsFound: this.activeInteractionAlerts,
      clinicalNotes: this.doctorNotes,
      issuedAt: new Date().toISOString(),
      isDispensed: false,
      qrHash: this.rxNumber + '-VERIFIED'
    };

    this.db.prescriptions.create(newPrescription);

    this.notifications.success(
      'تم اعتماد الروشتة',
      `تم حفظ الروشتة رقم ${this.rxNumber} وتحويلها آلياً إلى صيدلية العيادات لصرف الأدوية.`
    );

    this.prescriptionSaved.emit(newPrescription);
    this.isPrintPreview = false;
  }
}
