import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDatabaseService } from '../../core/repositories/mock-database.service';
import { NotificationService } from '../../core/services/notification.service';
import { Invoice, InvoiceItem, PaymentMethod, PaymentStatus, InsuranceDetails } from '../../core/models/invoice.model';
import { ClinicalService } from '../../core/models/clinical-service.model';
import { Patient } from '../../core/models/patient.model';
import { Appointment } from '../../core/models/appointment.model';
import { CurrencyEgpPipe } from '../../shared/pipes/currency-egp.pipe';
import { PrintableReceiptComponent } from './printable-receipt.component';

@Component({
  selector: 'app-invoice-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyEgpPipe, PrintableReceiptComponent],
  template: `
    <div class="invoice-generator-container p-3 p-md-4">
      @if (activeGeneratedInvoice) {
        <app-printable-receipt
          [invoice]="activeGeneratedInvoice"
          (close)="activeGeneratedInvoice = null"
        >
        </app-printable-receipt>
      } @else {
        <div class="card border-0 shadow-sm rounded-4 p-4 bg-surface max-w-950 mx-auto">
          <!-- Header -->
          <div class="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
            <div class="d-flex align-items-center gap-3">
              <div class="billing-icon-box">
                <i class="bi bi-receipt text-primary"></i>
              </div>
              <div>
                <h4 class="fw-bold mb-0">إنشاء فاتورة طبية مجمعة (Dynamic Invoice Engine)</h4>
                <p class="text-muted small mb-0">تجميع الكشف والأدوية والتحاليل والإجراءات في مطالبة مالية واحدة</p>
              </div>
            </div>
          </div>

          <!-- Step 1: Select Patient / Appointment -->
          <div class="row g-3 mb-4">
            <div class="col-md-6">
              <label class="form-label small fw-bold">اختر المريض أو الزيارة الحالية <span class="text-danger">*</span></label>
              <select class="form-select" [(ngModel)]="selectedPatientId" (change)="onPatientChange()">
                <option value="">-- حدد المريض لإصدار الفاتورة --</option>
                @for (pt of allPatients; track pt.id) {
                  <option [value]="pt.id">{{ pt.fullName }} ({{ pt.phone }}) - ملف: {{ pt.fileNumber }}</option>
                }
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label small fw-bold">طريقة السداد <span class="text-danger">*</span></label>
              <select class="form-select" [(ngModel)]="paymentMethod">
                <option value="cash">نقداً في الخزينة (Cash)</option>
                <option value="card">بطاقة ائتمانية / Visa / Meeza (Card)</option>
                <option value="insurance">تأمين صحي / تعاقدات (Insurance Co-pay)</option>
              </select>
            </div>

            <!-- Insurance Fields if selected -->
            @if (paymentMethod === 'insurance') {
              <div class="col-12 p-3 rounded-3 bg-light border">
                <div class="row g-2">
                  <div class="col-md-4">
                    <label class="form-label x-small text-muted mb-1">شركة التأمين:</label>
                    <input type="text" class="form-control form-control-sm" placeholder="e.g. AXA, Bupa, MetLife" [(ngModel)]="insuranceCompany" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label x-small text-muted mb-1">رقم البوليصة / الكارنيه:</label>
                    <input type="text" class="form-control form-control-sm font-monospace" placeholder="POL-84920" [(ngModel)]="insurancePolicyNumber" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label x-small text-muted mb-1">نسبة التغطية التأمينية (%):</label>
                    <input type="number" class="form-control form-control-sm" min="0" max="100" [(ngModel)]="insuranceCoveragePercent" (ngModelChange)="recalculate()" />
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Quick Bundle Buttons -->
          @if (selectedPatientId) {
            <div class="mb-4">
              <label class="form-label small fw-bold">إضافة بنود طبية سريعة للفاتورة:</label>
              <div class="d-flex flex-wrap gap-2">
                <button type="button" class="btn btn-outline-primary btn-sm" (click)="addConsultationItem()">
                  <i class="bi bi-plus-circle me-1"></i> كشف استشاري (500 ج.م)
                </button>
                <button type="button" class="btn btn-outline-info btn-sm" (click)="addLabBundleItem()">
                  <i class="bi bi-plus-circle me-1"></i> باقة تحاليل معملية (450 ج.م)
                </button>
                <button type="button" class="btn btn-outline-success btn-sm" (click)="addMedicationBundleItem()">
                  <i class="bi bi-plus-circle me-1"></i> أدوية روشتة منصرفة (280 ج.م)
                </button>
                <button type="button" class="btn btn-outline-secondary btn-sm" (click)="addProcedureItem()">
                  <i class="bi bi-plus-circle me-1"></i> جلسة ليزر / علاج طبيعي (400 ج.م)
                </button>
              </div>

              <!-- Dynamic Medical Services Catalog Dropdown -->
              <div class="row g-2 align-items-center mt-2 p-2 rounded-3 bg-light border">
                <div class="col-md-8">
                  <select class="form-select form-select-sm" [(ngModel)]="selectedCatalogServiceId" (change)="addServiceFromCatalog()">
                    <option value="">-- إضافة من دليل الخدمات والتحاليل المعتمدة ({{ catalogServices.length }} خدمة مفعلة) --</option>
                    @for (srv of catalogServices; track srv.id) {
                      <option [value]="srv.id">[{{ srv.code }}] {{ srv.nameAr }} - {{ srv.priceEgp | currencyEgp }} ({{ srv.category }})</option>
                    }
                  </select>
                </div>
                <div class="col-md-4">
                  <button type="button" class="btn btn-outline-primary btn-sm w-100" (click)="addBlankItem()">
                    <i class="bi bi-plus-lg me-1"></i> إضافة بند يدوي مخصص
                  </button>
                </div>
              </div>
            </div>
          }

          <!-- Items Table -->
          <div class="table-responsive mb-4">
            <table class="table table-hover align-middle border mb-0">
              <thead class="table-light small text-muted">
                <tr>
                  <th>البند والبيان الطبي</th>
                  <th>التصنيف</th>
                  <th style="width: 100px;">الكمية</th>
                  <th style="width: 130px;">سعر الوحدة</th>
                  <th style="width: 130px;">الإجمالي</th>
                  <th style="width: 50px;"></th>
                </tr>
              </thead>
              <tbody>
                @for (item of items; track item.id; let i = $index) {
                  <tr>
                    <td>
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="item.description" />
                    </td>
                    <td>
                      <select class="form-select form-select-sm" [(ngModel)]="item.category" (change)="onCategoryChange(item)">
                        <option value="consultation">كشف طبي</option>
                        <option value="medication">صيدلية</option>
                        <option value="lab-test">تحاليل</option>
                        <option value="procedure">إجراءات</option>
                        <option value="radiology">أشعة وتصوير</option>
                      </select>
                    </td>
                    <td>
                      <input type="number" class="form-control form-control-sm text-center" min="1" [(ngModel)]="item.quantity" (ngModelChange)="recalculate()" />
                    </td>
                    <td>
                      <input type="number" class="form-control form-control-sm text-end" min="0" [(ngModel)]="item.unitPriceEgp" (ngModelChange)="recalculate()" />
                    </td>
                    <td class="fw-bold text-end text-dark">
                      {{ (item.quantity * item.unitPriceEgp) | currencyEgp }}
                    </td>
                    <td>
                      <button class="btn btn-outline-danger btn-sm py-0 px-2" (click)="removeItem(i)">
                        <i class="bi bi-x"></i>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="text-center text-muted py-4 small">
                      لا توجد بنود بالفاتورة حتى الآن. استخدم أزرار الإضافة السريعة أعلاه.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Totals, Discount and Checkout -->
          <div class="row g-3 justify-content-between align-items-start pt-3 border-top">
            <!-- Discount Code Box -->
            <div class="col-md-5">
              <label class="form-label small fw-bold">كوبون أو كود الخصم الطبي:</label>
              <div class="input-group input-group-sm">
                <input
                  type="text"
                  class="form-control font-monospace text-uppercase"
                  placeholder="e.g. CARE10, VIP20"
                  [(ngModel)]="discountCode"
                />
                <button class="btn btn-outline-primary" type="button" (click)="applyDiscount()">
                  تطبيق الخصم
                </button>
              </div>
              <div class="x-small text-muted mt-1">أكواد تجريبية: CARE10 (خصم 10%) | VIP20 (خصم 20%)</div>
            </div>

            <!-- Totals Card -->
            <div class="col-md-6">
              <div class="p-3 rounded-3 bg-light border small">
                <div class="d-flex justify-content-between mb-1">
                  <span class="text-muted">المجموع الفرعي:</span>
                  <strong class="text-dark">{{ subtotal | currencyEgp }}</strong>
                </div>

                @if (discountAmount > 0) {
                  <div class="d-flex justify-content-between mb-1 text-danger">
                    <span>خصم الكوبون:</span>
                    <strong>- {{ discountAmount | currencyEgp }}</strong>
                  </div>
                }

                <div class="d-flex justify-content-between mb-1">
                  <span class="text-muted">ضريبة القيمة المضافة (14% VAT):</span>
                  <strong class="text-dark">+ {{ taxAmount | currencyEgp }}</strong>
                </div>

                @if (insuranceCoverageAmount > 0) {
                  <div class="d-flex justify-content-between mb-1 text-primary">
                    <span>تغطية التأمين ({{ insuranceCoveragePercent }}%):</span>
                    <strong>- {{ insuranceCoverageAmount | currencyEgp }}</strong>
                  </div>
                }

                <div class="d-flex justify-content-between border-top pt-2 mt-2 fs-5 fw-bold">
                  <span class="text-dark">المبلغ النهائي للدفع:</span>
                  <span class="text-success">{{ patientPayable | currencyEgp }}</span>
                </div>
              </div>

              <!-- Issue & Pay Button -->
              <div class="d-grid mt-3">
                <button
                  class="btn btn-primary btn-lg fw-bold"
                  [disabled]="items.length === 0 || !selectedPatientId"
                  (click)="generateInvoice()"
                >
                  <i class="bi bi-check2-circle me-1"></i>
                  إصدار الفاتورة وتأكيد التحصيل
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .billing-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: rgba(14, 165, 233, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .max-w-950 { max-width: 950px; }
    .x-small { font-size: 0.72rem; }
  `]
})
export class InvoiceGeneratorComponent implements OnInit {
  private readonly db = inject(MockDatabaseService);
  private readonly notifications = inject(NotificationService);

  allPatients: Patient[] = [];
  selectedPatientId = '';
  paymentMethod: PaymentMethod = 'cash';

  // Insurance details
  insuranceCompany = 'شركة مصر للتأمين التكافلي';
  insurancePolicyNumber = 'POL-2026-990';
  insuranceCoveragePercent = 80;

  // Invoice Items
  items: InvoiceItem[] = [];

  // Totals
  discountCode = '';
  discountAmount = 0;
  subtotal = 0;
  taxAmount = 0;
  insuranceCoverageAmount = 0;
  patientPayable = 0;

  activeGeneratedInvoice: Invoice | null = null;
  selectedCatalogServiceId = '';

  get catalogServices(): ClinicalService[] {
    this.db.servicesVersion();
    return this.db.servicesCatalog.query(s => s.isActive !== false);
  }

  addServiceFromCatalog(): void {
    if (!this.selectedCatalogServiceId) return;
    const srv = this.db.servicesCatalog.getById(this.selectedCatalogServiceId);
    if (srv) {
      const catMap: Record<string, string> = {
        consultation: 'كشف واستشارة',
        procedure: 'إجراء طبي',
        'lab-test': 'تحاليل معملية',
        radiology: 'أشعة وتصوير'
      };

      this.items.push({
        id: 'item_' + Math.random().toString(36).substring(2, 9),
        category: srv.category,
        categoryArabic: catMap[srv.category] || srv.category,
        description: `${srv.nameAr} (${srv.code})`,
        quantity: 1,
        unitPriceEgp: srv.priceEgp,
        totalPriceEgp: srv.priceEgp
      });
      this.recalculate();
      this.notifications.success('تمت الإضافة', `تمت إضافة [${srv.nameAr}] للفاتورة.`);
      this.selectedCatalogServiceId = '';
    }
  }

  addBlankItem(): void {
    this.items.push({
      id: 'item_' + Math.random().toString(36).substring(2, 9),
      category: 'procedure',
      categoryArabic: 'إجراء طبي',
      description: 'بند طبي مخصص',
      quantity: 1,
      unitPriceEgp: 200,
      totalPriceEgp: 200
    });
    this.recalculate();
  }

  ngOnInit(): void {
    this.allPatients = this.db.patients.getAll();
    if (this.allPatients.length > 0) {
      this.selectedPatientId = this.allPatients[0].id;
      this.onPatientChange();
    }
  }

  onPatientChange(): void {
    this.items = [];
    this.addConsultationItem();
    this.recalculate();
  }

  addConsultationItem(): void {
    this.items.push({
      id: 'item_' + Math.random().toString(36).substring(2, 9),
      category: 'consultation',
      categoryArabic: 'كشف استشاري',
      description: 'كشف استشاري فحص سريري تخصصي شامل',
      quantity: 1,
      unitPriceEgp: 500,
      totalPriceEgp: 500
    });
    this.recalculate();
  }

  addLabBundleItem(): void {
    this.items.push({
      id: 'item_' + Math.random().toString(36).substring(2, 9),
      category: 'lab-test',
      categoryArabic: 'تحاليل معملية',
      description: 'باقة فحوصات مخبرية شاملة (CBC + سكر تراكمي + وظائف كلى)',
      quantity: 1,
      unitPriceEgp: 450,
      totalPriceEgp: 450
    });
    this.recalculate();
  }

  addMedicationBundleItem(): void {
    this.items.push({
      id: 'item_' + Math.random().toString(36).substring(2, 9),
      category: 'medication',
      categoryArabic: 'أدوية علاجية',
      description: 'أدوية روشتة علاجية منصرفة من صيدلية المركز',
      quantity: 1,
      unitPriceEgp: 280,
      totalPriceEgp: 280
    });
    this.recalculate();
  }

  addProcedureItem(): void {
    this.items.push({
      id: 'item_' + Math.random().toString(36).substring(2, 9),
      category: 'procedure',
      categoryArabic: 'إجراءات تداخلية',
      description: 'جلسة علاجية متخصصة / رسم قلب ECG',
      quantity: 1,
      unitPriceEgp: 400,
      totalPriceEgp: 400
    });
    this.recalculate();
  }

  onCategoryChange(item: InvoiceItem): void {
    const map: Record<string, string> = {
      consultation: 'كشف طبي',
      medication: 'أدوية علاجية',
      'lab-test': 'تحاليل معملية',
      procedure: 'إجراءات تداخلية',
      radiology: 'أشعة وتصوير'
    };
    item.categoryArabic = map[item.category] || 'خدمات طبية';
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
    this.recalculate();
  }

  applyDiscount(): void {
    const code = this.discountCode.trim().toUpperCase();
    if (code === 'CARE10') {
      this.discountAmount = Number((this.subtotal * 0.1).toFixed(2));
      this.notifications.success('كوبون صحيح', 'تم تطبيق خصم 10% بنجاح.');
    } else if (code === 'VIP20') {
      this.discountAmount = Number((this.subtotal * 0.2).toFixed(2));
      this.notifications.success('كوبون صحيح', 'تم تطبيق خصم 20% بنجاح.');
    } else {
      this.discountAmount = 0;
      this.notifications.error('كود غير صالح', 'كود الخصم المدخل غير معتمد.');
    }
    this.recalculate();
  }

  recalculate(): void {
    this.subtotal = this.items.reduce((sum, i) => {
      i.totalPriceEgp = i.quantity * i.unitPriceEgp;
      return sum + i.totalPriceEgp;
    }, 0);

    const afterDiscount = Math.max(0, this.subtotal - this.discountAmount);
    this.taxAmount = Number((afterDiscount * 0.14).toFixed(2));
    const grandTotal = afterDiscount + this.taxAmount;

    if (this.paymentMethod === 'insurance') {
      this.insuranceCoverageAmount = Number((grandTotal * (this.insuranceCoveragePercent / 100)).toFixed(2));
      this.patientPayable = Math.max(0, Number((grandTotal - this.insuranceCoverageAmount).toFixed(2)));
    } else {
      this.insuranceCoverageAmount = 0;
      this.patientPayable = grandTotal;
    }
  }

  generateInvoice(): void {
    const patient = this.allPatients.find(p => p.id === this.selectedPatientId);
    if (!patient || this.items.length === 0) return;

    const invNum = 'INV-2026-' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date().toISOString();

    const insuranceDetails: InsuranceDetails | undefined =
      this.paymentMethod === 'insurance'
        ? {
            companyName: this.insuranceCompany,
            policyNumber: this.insurancePolicyNumber,
            coveragePercentage: this.insuranceCoveragePercent
          }
        : undefined;

    const newInvoice: Invoice = {
      id: 'inv_' + Math.random().toString(36).substring(2, 9),
      invoiceNumber: invNum,
      patientId: patient.id,
      patientName: patient.fullName,
      patientPhone: patient.phone,
      items: [...this.items],
      subtotalEgp: this.subtotal,
      taxRatePercent: 14,
      taxAmountEgp: this.taxAmount,
      discountCode: this.discountAmount > 0 ? this.discountCode : undefined,
      discountAmountEgp: this.discountAmount,
      grandTotalEgp: this.subtotal - this.discountAmount + this.taxAmount,
      insuranceCoverageAmountEgp: this.insuranceCoverageAmount,
      patientPayableEgp: this.patientPayable,
      amountPaidEgp: this.patientPayable,
      paymentMethod: this.paymentMethod,
      paymentStatus: 'paid',
      insuranceDetails,
      issuedAt: now,
      paidAt: now,
      qrPayload: `CAREPOINT-${invNum}-PAID-${this.patientPayable}`
    };

    this.db.invoices.create(newInvoice);

    this.notifications.success(
      'تم إصدار الفاتورة',
      `تم إصدار وتحصيل الفاتورة الضريبية رقم [ ${invNum} ] بنجاح.`
    );

    this.activeGeneratedInvoice = newInvoice;
  }
}
