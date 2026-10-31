import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDatabaseService } from '../../core/repositories/mock-database.service';
import { PharmacyInventoryService } from '../../services/pharmacy-inventory.service';
import { NotificationService } from '../../core/services/notification.service';
import { MedicationInventory, StockTransaction } from '../../core/models/inventory.model';
import { Prescription } from '../../core/models/prescription.model';
import { CurrencyEgpPipe } from '../../shared/pipes/currency-egp.pipe';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-medication-stock-table',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyEgpPipe, ModalComponent],
  template: `
    <div class="pharmacy-container p-3 p-md-4">
      <!-- Section Header -->
      <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-surface">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div class="d-flex align-items-center gap-3">
            <div class="pharmacy-icon-box">
              <i class="bi bi-capsule text-primary"></i>
            </div>
            <div>
              <h4 class="fw-bold mb-0">صيدلية العيادات الداخلية والمخزون الدوائي</h4>
              <p class="text-muted small mb-0">صرف الروشتات الفوري، خصم الأرصدة التلقائي، وتتبع نواقص الأدوية</p>
            </div>
          </div>

          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-outline-primary btn-sm fw-bold" (click)="isRestockModalOpen = true">
              <i class="bi bi-box-arrow-in-down me-1"></i> توريد كمية جديدة
            </button>
          </div>
        </div>

        <!-- Pharmacy Metrics Strip -->
        <div class="row g-2 mt-3 pt-3 border-top">
          <div class="col-6 col-md-3">
            <div class="p-2 rounded-3 bg-light text-center">
              <div class="fw-bold fs-5 text-dark">{{ inventoryList.length }}</div>
              <div class="x-small text-muted">إجمالي الأصناف بالمستودع</div>
            </div>
          </div>

          <div class="col-6 col-md-3">
            <div class="p-2 rounded-3 bg-warning-subtle text-center">
              <div class="fw-bold fs-5 text-warning-emphasis">{{ lowStockCount }}</div>
              <div class="x-small text-warning-emphasis">أصناف قاربت على النفاد ⚠️</div>
            </div>
          </div>

          <div class="col-6 col-md-3">
            <div class="p-2 rounded-3 bg-info-subtle text-center">
              <div class="fw-bold fs-5 text-info-emphasis">{{ pendingPrescriptions.length }}</div>
              <div class="x-small text-info-emphasis">روشتات في انتظار الصرف</div>
            </div>
          </div>

          <div class="col-6 col-md-3">
            <div class="p-2 rounded-3 bg-success-subtle text-center">
              <div class="fw-bold fs-5 text-success">{{ dispensedPrescriptions.length }}</div>
              <div class="x-small text-success">روشتات صُرفت اليوم</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Prescriptions Queue for Dispensing -->
      <div class="card border-0 shadow-sm rounded-4 p-4 bg-surface mb-4">
        <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
          <h5 class="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            <i class="bi bi-receipt-cutoff text-primary"></i>
            طابور صرف الروشتات الإلكترونية (Prescription Dispense Queue)
          </h5>
          <span class="badge bg-warning text-dark">{{ pendingPrescriptions.length }} روشتات معلقة</span>
        </div>

        @if (pendingPrescriptions.length > 0) {
          <div class="row g-3">
            @for (rx of pendingPrescriptions; track rx.id) {
              <div class="col-md-6">
                <div class="p-3 rounded-3 border bg-light">
                  <div class="d-flex align-items-start justify-content-between mb-2">
                    <span class="fw-bold text-primary font-monospace">{{ rx.prescriptionNumber }}</span>
                    <span class="badge bg-warning text-dark">جاهز للصرف</span>
                  </div>

                  <strong class="d-block text-dark">{{ rx.patientName }}</strong>
                  <div class="x-small text-muted mb-2">
                    <span>الطبيب: {{ rx.doctorName }}</span>
                    <span class="mx-1">•</span>
                    <span>العيادة: {{ rx.departmentArabic }}</span>
                  </div>

                  <!-- Medicine Items Mini List -->
                  <div class="p-2 rounded bg-white border mb-3 small">
                    <strong class="x-small text-muted d-block mb-1">الأدوية المطلوبة:</strong>
                    @for (item of rx.items; track item.id) {
                      <div class="d-flex justify-content-between align-items-center mb-1">
                        <span>• {{ item.tradeName }} ({{ item.dosage }})</span>
                        <span class="badge bg-light text-dark border">{{ item.quantityToDispense }} عبوة</span>
                      </div>
                    }
                  </div>

                  <div class="text-end">
                    <button class="btn btn-primary btn-sm fw-bold px-3" (click)="dispenseRx(rx)">
                      <i class="bi bi-capsule me-1"></i>
                      صرف الأدوية وخصم المخزون
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="text-center text-muted py-4 small">
            <i class="bi bi-check2-all fs-2 d-block mb-1 text-success"></i>
            لا توجد روشتات معلقة للصرف. جميع الروشتات تم صرفها.
          </div>
        }
      </div>

      <!-- Inventory Table -->
      <div class="card border-0 shadow-sm rounded-4 p-4 bg-surface">
        <div class="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
          <h5 class="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            <i class="bi bi-boxes text-primary"></i>
            جدول أرصدة الأدوية الحالية (Stock Inventory)
          </h5>

          <!-- Search & Filter -->
          <div class="d-flex flex-wrap gap-2">
            <select class="form-select form-select-sm w-auto" [(ngModel)]="selectedBranchId">
              <option value="">جميع الفروع والخزائن ({{ inventoryList.length }})</option>
              @for (b of branches; track b.id) {
                <option [value]="b.id">{{ b.nameAr }}</option>
              }
            </select>
            <input
              type="text"
              class="form-control form-control-sm"
              style="width: 220px;"
              placeholder="بحث بالاسم التجاري أو العلمي..."
              [(ngModel)]="searchQuery"
            />
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-hover align-middle border mb-0">
            <thead class="table-light small text-muted">
              <tr>
                <th>#</th>
                <th>الدواء / الاسم التجاري</th>
                <th>الفرع / الخزانة</th>
                <th>الاسم العلمي والتركيز</th>
                <th>الشكل الصيدلي</th>
                <th>سعر الوحدة</th>
                <th>الرصيد المتوفر</th>
                <th>حالة المخزون</th>
                <th>تاريخ الصلاحية</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              @for (med of filteredInventory; track med.id; let i = $index) {
                <tr>
                  <td class="fw-bold">{{ i + 1 }}</td>
                  <td>
                    <strong class="text-dark d-block">{{ med.tradeName }}</strong>
                    <span class="x-small text-muted font-monospace">تشغيلة: {{ med.batchNumber }}</span>
                  </td>
                  <td>
                    <span class="badge bg-light text-secondary border small">{{ getBranchName(med.pharmacyBranchId) }}</span>
                  </td>
                  <td>
                    <div class="small">{{ med.genericName }}</div>
                    <span class="badge bg-light text-dark border">{{ med.strength }}</span>
                  </td>
                  <td><span class="small">{{ med.dosageFormArabic }}</span></td>
                  <td class="fw-bold text-success">{{ med.unitPriceEgp | currencyEgp }}</td>
                  <td>
                    <span class="fw-bold fs-6">{{ med.currentStock }}</span>
                    <span class="x-small text-muted ms-1">عبوة</span>
                  </td>
                  <td>
                    @if (med.currentStock === 0) {
                      <span class="badge bg-danger">نفد بالكامل 🚨</span>
                    } @else if (med.currentStock <= med.minThreshold) {
                      <span class="badge bg-warning text-dark">مخزون حرج ({{ med.currentStock }}/{{ med.minThreshold }})</span>
                    } @else {
                      <span class="badge bg-success-subtle text-success">متوفر ومستقر</span>
                    }
                  </td>
                  <td>
                    <span class="small font-monospace">{{ med.expiryDate }}</span>
                  </td>
                  <td>
                    <button class="btn btn-outline-primary btn-sm py-0 px-2" (click)="openQuickRestock(med)">
                      <i class="bi bi-plus-lg me-1"></i> توريد
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Restock Modal -->
      <app-modal
        [isOpen]="isRestockModalOpen"
        title="توريد شحنة أدوية جديدة"
        subtitle="إضافة كميات واردة إلى المستودع وتحديث الرصيد"
        headerIcon="bi-box-arrow-in-down"
        (closed)="isRestockModalOpen = false"
      >
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label small fw-bold">اختر الصنف الدوائي <span class="text-danger">*</span></label>
            <select class="form-select" [(ngModel)]="restockMedId">
              @for (m of inventoryList; track m.id) {
                <option [value]="m.id">{{ m.tradeName }} (رصيد حالي: {{ m.currentStock }})</option>
              }
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label small fw-bold">الكمية المضافة (عبوات) <span class="text-danger">*</span></label>
            <input type="number" class="form-control" min="1" [(ngModel)]="restockQuantity" />
          </div>

          <div class="col-md-6">
            <label class="form-label small fw-bold">رقم التشغيلة (Batch No.)</label>
            <input type="text" class="form-control font-monospace" placeholder="e.g. BATCH-2026-X01" [(ngModel)]="restockBatch" />
          </div>
        </div>

        <div footer class="d-flex justify-content-end gap-2">
          <button class="btn btn-light" (click)="isRestockModalOpen = false">إلغاء</button>
          <button class="btn btn-primary fw-bold px-4" [disabled]="!restockMedId || restockQuantity <= 0" (click)="confirmRestock()">
            تأكيد إضافة الرصيد
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .pharmacy-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: rgba(14, 165, 233, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .x-small { font-size: 0.72rem; }
  `]
})
export class MedicationStockTableComponent implements OnInit {
  private readonly db = inject(MockDatabaseService);
  private readonly pharmacyService = inject(PharmacyInventoryService);
  private readonly notifications = inject(NotificationService);

  searchQuery = '';
  selectedBranchId = '';
  isRestockModalOpen = false;
  restockMedId = '';
  restockQuantity = 20;
  restockBatch = '';

  ngOnInit(): void {
    if (this.inventoryList.length > 0) {
      this.restockMedId = this.inventoryList[0].id;
    }
  }

  get branches(): any[] {
    this.db.pharmacyBranchesVersion();
    return this.db.pharmacyBranches.getAll();
  }

  getBranchName(branchId?: string): string {
    if (!branchId) return 'الصيدلية الرئيسية';
    const br = this.branches.find(b => b.id === branchId);
    return br ? br.nameAr : 'الصيدلية الرئيسية';
  }

  get inventoryList(): MedicationInventory[] {
    this.db.inventoryVersion();
    return this.db.inventory.getAll();
  }

  get filteredInventory(): MedicationInventory[] {
    return this.inventoryList.filter(m => {
      const matchSearch =
        !this.searchQuery.trim() ||
        m.tradeName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        m.genericName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        m.batchNumber.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        m.skuBarcode?.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchBranch = !this.selectedBranchId || m.pharmacyBranchId === this.selectedBranchId;
      return matchSearch && matchBranch;
    });
  }

  get lowStockCount(): number {
    return this.inventoryList.filter(m => m.currentStock <= m.minThreshold).length;
  }

  get pendingPrescriptions(): Prescription[] {
    this.db.prescriptionsVersion();
    return this.db.prescriptions.query(p => !p.isDispensed);
  }

  get dispensedPrescriptions(): Prescription[] {
    this.db.prescriptionsVersion();
    return this.db.prescriptions.query(p => p.isDispensed);
  }

  dispenseRx(rx: Prescription): void {
    this.pharmacyService.dispensePrescription(rx.id);
  }

  openQuickRestock(med: MedicationInventory): void {
    this.restockMedId = med.id;
    this.restockBatch = med.batchNumber;
    this.restockQuantity = 25;
    this.isRestockModalOpen = true;
  }

  confirmRestock(): void {
    if (!this.restockMedId || this.restockQuantity <= 0) return;
    this.pharmacyService.restockMedication(this.restockMedId, this.restockQuantity, this.restockBatch);
    this.isRestockModalOpen = false;
  }
}
