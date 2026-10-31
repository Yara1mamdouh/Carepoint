import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDatabaseService } from '../../core/repositories/mock-database.service';
import { NotificationService } from '../../core/services/notification.service';
import { MedicationInventory, PharmacyBranch, DosageForm } from '../../core/models/inventory.model';
import { CurrencyEgpPipe } from '../../shared/pipes/currency-egp.pipe';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-multi-pharmacy-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyEgpPipe, ModalComponent],
  template: `
    <div class="multi-pharmacy-container">
      <!-- Section 1: Internal Pharmacy Branches Bar -->
      <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-surface">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <div class="d-flex align-items-center gap-2">
            <div class="icon-circle bg-primary-subtle text-primary">
              <i class="bi bi-shop fs-5"></i>
            </div>
            <div>
              <h5 class="fw-bold mb-0 text-dark">الفروع الصيدلانية وخزائن الأدوية الداخلية</h5>
              <p class="text-muted small mb-0">إدارة المستودعات الفرعية، صيدلية الطوارئ، وتوزيع الأرصدة</p>
            </div>
          </div>

          <button class="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold" (click)="openAddBranchModal()">
            <i class="bi bi-plus-lg me-1"></i>
            إضافة فرع / خزانة صيدلانية
          </button>
        </div>

        <!-- Branches Cards Strip -->
        <div class="row g-2">
          @for (branch of branches; track branch.id) {
            <div class="col-md-4">
              <div
                class="branch-card p-3 rounded-3 border cursor-pointer position-relative h-100"
                [class.selected-branch]="selectedBranchFilter === branch.id"
                (click)="selectedBranchFilter = branch.id"
              >
                <div class="d-flex align-items-start justify-content-between mb-1">
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-secondary-subtle text-secondary font-monospace">{{ branch.code }}</span>
                    @if (branch.isDefault) {
                      <span class="badge bg-success-subtle text-success x-small">الرئيسي</span>
                    }
                  </div>
                  <div class="d-flex align-items-center gap-1">
                    <button class="btn btn-light btn-xs rounded-circle" (click)="$event.stopPropagation(); openEditBranchModal(branch)" title="تعديل">
                      <i class="bi bi-pencil text-primary"></i>
                    </button>
                    @if (!branch.isDefault) {
                      <button class="btn btn-light btn-xs rounded-circle" (click)="$event.stopPropagation(); confirmDeleteBranch(branch)" title="حذف">
                        <i class="bi bi-trash text-danger"></i>
                      </button>
                    }
                  </div>
                </div>

                <strong class="d-block text-dark small mb-1">{{ branch.nameAr }}</strong>
                <div class="text-muted x-small mb-1">{{ branch.location }}</div>
                <div class="d-flex justify-content-between align-items-center x-small mt-2 pt-2 border-top">
                  <span class="text-muted">الأصناف المسجلة:</span>
                  <span class="badge bg-primary text-white rounded-pill">{{ getBranchMedCount(branch.id) }} صنف</span>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Section 2: Drug Inventory Management -->
      <div class="card border-0 shadow-sm rounded-4 p-4 bg-surface">
        <!-- Filter Controls -->
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 border-bottom pb-3">
          <div class="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
            <!-- Search -->
            <div class="search-input-box position-relative">
              <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
              <input
                type="text"
                class="form-control form-control-sm ps-5 rounded-pill"
                placeholder="بحث بالاسم التجاري، العلمي، أو الباركود SKU..."
                [(ngModel)]="searchMedQuery"
              />
            </div>

            <!-- Branch Filter -->
            <select class="form-select form-select-sm rounded-pill w-auto" [(ngModel)]="selectedBranchFilter">
              <option value="">جميع الفروع والخزائن ({{ inventory.length }})</option>
              @for (branch of branches; track branch.id) {
                <option [value]="branch.id">{{ branch.nameAr }} ({{ getBranchMedCount(branch.id) }})</option>
              }
            </select>

            <!-- Category Filter -->
            <select class="form-select form-select-sm rounded-pill w-auto" [(ngModel)]="filterCategory">
              <option value="">جميع المجموعات الدوائية</option>
              @for (cat of categories; track cat) {
                <option [value]="cat">{{ cat }}</option>
              }
            </select>
          </div>

          <button class="btn btn-primary btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-2" (click)="openAddMedModal()">
            <i class="bi bi-capsule-pill"></i>
            <span>إضافة دواء جديد</span>
          </button>
        </div>

        <!-- Inventory Table -->
        <div class="table-responsive">
          <table class="table table-hover align-middle border mb-0">
            <thead class="table-light small text-muted">
              <tr>
                <th>اسم الدواء / المادة الفعالة</th>
                <th>الباركود SKU</th>
                <th>الفرع / الخزانة</th>
                <th>الشكل الصيدلاني</th>
                <th class="text-center">الرصيد الحالي</th>
                <th class="text-center">حد الأمان</th>
                <th class="text-end">سعر الجمهور</th>
                <th>تاريخ الصلاحية</th>
                <th class="text-center" style="width: 130px;">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              @for (med of filteredInventory; track med.id) {
                <tr>
                  <td>
                    <div class="fw-bold text-dark">{{ med.tradeName }}</div>
                    <div class="x-small text-muted">{{ med.genericName }} • {{ med.strength }}</div>
                  </td>
                  <td>
                    <span class="badge bg-light text-secondary border font-monospace">{{ med.skuBarcode || med.batchNumber }}</span>
                  </td>
                  <td>
                    <span class="badge bg-secondary-subtle text-secondary small">{{ getBranchName(med.pharmacyBranchId) }}</span>
                  </td>
                  <td>
                    <span class="small text-dark">{{ med.dosageFormArabic || med.dosageForm }}</span>
                  </td>
                  <td class="text-center">
                    <span [class]="getStockBadgeClass(med.currentStock, med.minThreshold)">
                      {{ med.currentStock }} وحدة
                    </span>
                  </td>
                  <td class="text-center text-muted small">
                    {{ med.minThreshold }}
                  </td>
                  <td class="text-end fw-bold text-dark">
                    {{ med.unitPriceEgp | currencyEgp }}
                  </td>
                  <td>
                    <span [class]="getExpiryBadgeClass(med.expiryDate)">
                      {{ med.expiryDate }}
                    </span>
                  </td>
                  <td>
                    <div class="d-flex align-items-center justify-content-center gap-1">
                      <button
                        class="btn btn-light btn-xs rounded-circle"
                        (click)="openAdjustStockModal(med)"
                        title="تعديل المخزون / توريد"
                      >
                        <i class="bi bi-arrow-left-right text-success"></i>
                      </button>
                      <button
                        class="btn btn-light btn-xs rounded-circle"
                        (click)="openEditMedModal(med)"
                        title="تعديل الصنف"
                      >
                        <i class="bi bi-pencil-fill text-primary"></i>
                      </button>
                      <button
                        class="btn btn-light btn-xs rounded-circle"
                        (click)="confirmDeleteMed(med)"
                        title="حذف الصنف"
                      >
                        <i class="bi bi-trash-fill text-danger"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" class="text-center text-muted py-4 small">
                    لا توجد أصناف دوائية مطابقة للبحث أو التصفية الحالية.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL 1: Add / Edit Branch -->
      <app-modal
        [isOpen]="isBranchModalOpen"
        [title]="editingBranchId ? 'تعديل بيانات الفرع الصيدلاني' : 'إضافة فرع صيدلاني / خزانة جديدة'"
        size="md"
        (closed)="isBranchModalOpen = false"
      >
        <form (ngSubmit)="saveBranch()" #brForm="ngForm" class="p-2">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label small fw-bold">اسم الفرع / الخزانة بالعربية <span class="text-danger">*</span></label>
              <input type="text" class="form-control" placeholder="مثال: صيدلية العمليات والعناية" required name="brNameAr" [(ngModel)]="branchForm.nameAr" />
            </div>

            <div class="col-md-6">
              <label class="form-label small fw-bold">الاسم بالإنجليزية</label>
              <input type="text" class="form-control" placeholder="OR Pharmacy Unit" name="brNameEn" [(ngModel)]="branchForm.nameEn" />
            </div>

            <div class="col-md-6">
              <label class="form-label small fw-bold">كود الفرع المختصر <span class="text-danger">*</span></label>
              <input type="text" class="form-control font-monospace" placeholder="OR-STOCK" required name="brCode" [(ngModel)]="branchForm.code" />
            </div>

            <div class="col-12">
              <label class="form-label small fw-bold">الموقع داخل المركز <span class="text-danger">*</span></label>
              <input type="text" class="form-control" placeholder="الطابق الثاني - جناح العمليات" required name="brLoc" [(ngModel)]="branchForm.location" />
            </div>

            <div class="col-12">
              <label class="form-label small fw-bold">الوصف والغرض</label>
              <textarea class="form-control" rows="2" placeholder="ملاحظات حول صلاحيات الصرف واستخدام الخزانة..." name="brDesc" [(ngModel)]="branchForm.description"></textarea>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" class="btn btn-light" (click)="isBranchModalOpen = false">إلغاء</button>
            <button type="submit" class="btn btn-primary fw-bold px-4" [disabled]="!brForm.form.valid">
              {{ editingBranchId ? 'حفظ التعديلات' : 'إضافة الفرع' }}
            </button>
          </div>
        </form>
      </app-modal>

      <!-- MODAL 2: Add / Edit Medication -->
      <app-modal
        [isOpen]="isMedModalOpen"
        [title]="editingMedId ? 'تعديل صنف دوائي' : 'إضافة صنف دوائي جديد للمستودع'"
        size="lg"
        (closed)="isMedModalOpen = false"
      >
        <form (ngSubmit)="saveMedication()" #mForm="ngForm" class="p-2">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label small fw-bold">الاسم التجاري للدواء <span class="text-danger">*</span></label>
              <input type="text" class="form-control" placeholder="مثال: Augmentin 1g" required name="tradeName" [(ngModel)]="medForm.tradeName" />
            </div>

            <div class="col-md-6">
              <label class="form-label small fw-bold">المادة الفعالة / الاسم العلمي <span class="text-danger">*</span></label>
              <input type="text" class="form-control" placeholder="Amoxicillin + Clavulanic Acid" required name="genericName" [(ngModel)]="medForm.genericName" />
            </div>

            <div class="col-md-4">
              <label class="form-label small fw-bold">الفرع الصيدلاني المخصص <span class="text-danger">*</span></label>
              <select class="form-select" required name="pharmacyBranchId" [(ngModel)]="medForm.pharmacyBranchId">
                @for (br of branches; track br.id) {
                  <option [value]="br.id">{{ br.nameAr }}</option>
                }
              </select>
            </div>

            <div class="col-md-4">
              <label class="form-label small fw-bold">الشكل الدوائي <span class="text-danger">*</span></label>
              <select class="form-select" required name="dosageForm" [(ngModel)]="medForm.dosageForm" (change)="onDosageFormChange()">
                <option value="tablets">أقراص (Tablets)</option>
                <option value="capsules">كبسولات (Capsules)</option>
                <option value="syrup">شراب (Syrup)</option>
                <option value="injection">حقن (Injection)</option>
                <option value="ointment">مرهم / كريم (Ointment)</option>
                <option value="inhaler">بخاخ استنشاق (Inhaler)</option>
                <option value="drops">نقط (Drops)</option>
              </select>
            </div>

            <div class="col-md-4">
              <label class="form-label small fw-bold">التركيز / القوة <span class="text-danger">*</span></label>
              <input type="text" class="form-control" placeholder="1000 mg" required name="strength" [(ngModel)]="medForm.strength" />
            </div>

            <div class="col-md-4">
              <label class="form-label small fw-bold">الباركود SKU / الكود</label>
              <input type="text" class="form-control font-monospace" placeholder="MED-622-001" name="skuBarcode" [(ngModel)]="medForm.skuBarcode" />
            </div>

            <div class="col-md-4">
              <label class="form-label small fw-bold">رقم التشغيلة (Batch Number)</label>
              <input type="text" class="form-control font-monospace" placeholder="BATCH-2026-X" name="batchNumber" [(ngModel)]="medForm.batchNumber" />
            </div>

            <div class="col-md-4">
              <label class="form-label small fw-bold">المجموعة الدوائية / التصنيف <span class="text-danger">*</span></label>
              <input type="text" class="form-control" placeholder="مضاد حيوي" required name="category" [(ngModel)]="medForm.category" />
            </div>

            <div class="col-md-3">
              <label class="form-label small fw-bold">الرصيد المتاح حالياً <span class="text-danger">*</span></label>
              <input type="number" class="form-control text-center fw-bold" min="0" required name="currentStock" [(ngModel)]="medForm.currentStock" />
            </div>

            <div class="col-md-3">
              <label class="form-label small fw-bold">حد الأمان الأدنى <span class="text-danger">*</span></label>
              <input type="number" class="form-control text-center" min="1" required name="minThreshold" [(ngModel)]="medForm.minThreshold" />
            </div>

            <div class="col-md-3">
              <label class="form-label small fw-bold">سعر الجمهور (ج.م) <span class="text-danger">*</span></label>
              <input type="number" class="form-control text-end fw-bold" min="0" step="0.5" required name="unitPriceEgp" [(ngModel)]="medForm.unitPriceEgp" />
            </div>

            <div class="col-md-3">
              <label class="form-label small fw-bold">تاريخ انتهاء الصلاحية <span class="text-danger">*</span></label>
              <input type="date" class="form-control text-center" required name="expiryDate" [(ngModel)]="medForm.expiryDate" />
            </div>

            <div class="col-12">
              <label class="form-label small fw-bold">الشركة المصنعة / المورد</label>
              <input type="text" class="form-control" placeholder="GSK, Novartis, Pfizer, EIPICO..." name="manufacturer" [(ngModel)]="medForm.manufacturer" />
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" class="btn btn-light" (click)="isMedModalOpen = false">إلغاء</button>
            <button type="submit" class="btn btn-primary fw-bold px-4" [disabled]="!mForm.form.valid">
              {{ editingMedId ? 'حفظ التعديلات' : 'إضافة الدواء للمستودع' }}
            </button>
          </div>
        </form>
      </app-modal>

      <!-- MODAL 3: Rapid Stock Adjustment -->
      <app-modal
        [isOpen]="isAdjustModalOpen"
        [title]="'تعديل رصيد المخزون: ' + (activeAdjustMed?.tradeName || '')"
        size="md"
        (closed)="isAdjustModalOpen = false"
      >
        @if (activeAdjustMed) {
          <div class="p-2">
            <div class="p-3 rounded-3 bg-light border mb-3">
              <div class="d-flex justify-content-between mb-1 small">
                <span class="text-muted">الرصيد الحالي:</span>
                <strong class="text-primary fs-5">{{ activeAdjustMed.currentStock }} وحدة</strong>
              </div>
              <div class="d-flex justify-content-between x-small text-muted">
                <span>حد الأمان: {{ activeAdjustMed.minThreshold }}</span>
                <span>الفرع: {{ getBranchName(activeAdjustMed.pharmacyBranchId) }}</span>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label small fw-bold">نوع التعديل:</label>
              <div class="btn-group w-100" role="group">
                <button
                  type="button"
                  class="btn btn-sm"
                  [class.btn-success]="adjustForm.type === 'add'"
                  [class.btn-outline-success]="adjustForm.type !== 'add'"
                  (click)="adjustForm.type = 'add'"
                >
                  <i class="bi bi-plus-lg me-1"></i> توريد / إضافة (+)
                </button>
                <button
                  type="button"
                  class="btn btn-sm"
                  [class.btn-danger]="adjustForm.type === 'subtract'"
                  [class.btn-outline-danger]="adjustForm.type !== 'subtract'"
                  (click)="adjustForm.type = 'subtract'"
                >
                  <i class="bi bi-dash-lg me-1"></i> تسوية نقص / تالف (-)
                </button>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label small fw-bold">الكمية المراد تعديلها:</label>
              <input
                type="number"
                class="form-control text-center fs-5 fw-bold"
                min="1"
                [(ngModel)]="adjustForm.quantity"
              />
              <div class="mt-1 text-center small text-muted">
                الرصيد الناتج بعد الحفظ:
                <strong class="text-dark">
                  {{ adjustForm.type === 'add' ? (activeAdjustMed.currentStock + adjustForm.quantity) : Math.max(0, activeAdjustMed.currentStock - adjustForm.quantity) }} وحدة
                </strong>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label small fw-bold">سبب التعديل / البيان الرقابي <span class="text-danger">*</span></label>
              <select class="form-select form-select-sm mb-2" [(ngModel)]="adjustForm.reasonPreset" (change)="onReasonPresetChange()">
                <option value="توريد فاتورة جديدة من المورد">توريد فاتورة جديدة من المورد</option>
                <option value="تصحيح جرد دوري">تصحيح جرد دوري</option>
                <option value="إتلاف عبوات منتهية الصلاحية">إتلاف عبوات منتهية الصلاحية</option>
                <option value="استهلاك طوارئ مباشر">استهلاك طوارئ مباشر</option>
                <option value="other">سبب مخصص...</option>
              </select>
              <input
                type="text"
                class="form-control form-control-sm"
                placeholder="اكتب سبب التعديل بالتفصيل..."
                [(ngModel)]="adjustForm.reason"
              />
            </div>

            <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <button type="button" class="btn btn-light" (click)="isAdjustModalOpen = false">إلغاء</button>
              <button type="button" class="btn btn-primary fw-bold px-4" (click)="saveStockAdjustment()">
                <i class="bi bi-check2-circle me-1"></i> اعتماد التعديل
              </button>
            </div>
          </div>
        }
      </app-modal>
    </div>
  `,
  styles: [`
    .icon-circle {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .branch-card {
      background: var(--cp-surface, #ffffff);
      transition: all 0.2s ease;
    }
    .branch-card:hover {
      border-color: #0ea5e9;
      transform: translateY(-2px);
    }
    .selected-branch {
      border-color: #0ea5e9 !important;
      background: rgba(14, 165, 233, 0.05) !important;
      box-shadow: 0 0 0 2px #0ea5e9;
    }
    .search-input-box input {
      min-width: 260px;
    }
    .btn-xs {
      width: 24px;
      height: 24px;
      padding: 0;
      font-size: 11px;
      line-height: 24px;
    }
  `]
})
export class MultiPharmacyManagerComponent implements OnInit {
  private readonly db = inject(MockDatabaseService);
  private readonly notifications = inject(NotificationService);

  readonly Math = Math;

  searchMedQuery = '';
  selectedBranchFilter = '';
  filterCategory = '';

  // Modals state
  isBranchModalOpen = false;
  editingBranchId: string | null = null;
  branchForm = {
    nameAr: '',
    nameEn: '',
    code: '',
    location: '',
    description: '',
    isDefault: false
  };

  isMedModalOpen = false;
  editingMedId: string | null = null;
  medForm = {
    tradeName: '',
    genericName: '',
    dosageForm: 'tablets' as DosageForm,
    dosageFormArabic: 'أقراص',
    strength: '',
    batchNumber: '',
    skuBarcode: '',
    currentStock: 50,
    minThreshold: 15,
    unitPriceEgp: 50,
    expiryDate: '2027-12-31',
    category: 'عام',
    manufacturer: '',
    pharmacyBranchId: 'pb_main'
  };

  isAdjustModalOpen = false;
  activeAdjustMed: MedicationInventory | null = null;
  adjustForm = {
    type: 'add' as 'add' | 'subtract',
    quantity: 10,
    reasonPreset: 'توريد فاتورة جديدة من المورد',
    reason: 'توريد فاتورة جديدة من المورد'
  };

  ngOnInit(): void {
    // Check if branch exists
    if (this.branches.length > 0) {
      this.medForm.pharmacyBranchId = this.branches[0].id;
    }
  }

  get branches(): PharmacyBranch[] {
    this.db.pharmacyBranchesVersion();
    return this.db.pharmacyBranches.getAll();
  }

  get inventory(): MedicationInventory[] {
    this.db.inventoryVersion();
    return this.db.inventory.getAll();
  }

  get categories(): string[] {
    const cats = new Set<string>();
    this.inventory.forEach(m => {
      if (m.category) cats.add(m.category);
    });
    return Array.from(cats);
  }

  get filteredInventory(): MedicationInventory[] {
    return this.inventory.filter(m => {
      const matchSearch =
        !this.searchMedQuery.trim() ||
        m.tradeName.toLowerCase().includes(this.searchMedQuery.toLowerCase()) ||
        m.genericName.toLowerCase().includes(this.searchMedQuery.toLowerCase()) ||
        m.skuBarcode?.toLowerCase().includes(this.searchMedQuery.toLowerCase()) ||
        m.batchNumber.toLowerCase().includes(this.searchMedQuery.toLowerCase());

      const matchBranch = !this.selectedBranchFilter || m.pharmacyBranchId === this.selectedBranchFilter;
      const matchCat = !this.filterCategory || m.category === this.filterCategory;

      return matchSearch && matchBranch && matchCat;
    });
  }

  getBranchMedCount(branchId: string): number {
    return this.inventory.filter(m => m.pharmacyBranchId === branchId).length;
  }

  getBranchName(branchId?: string): string {
    if (!branchId) return 'الصيدلية الرئيسية';
    const br = this.branches.find(b => b.id === branchId);
    return br ? br.nameAr : 'الصيدلية الرئيسية';
  }

  // Branch CRUD
  openAddBranchModal(): void {
    this.editingBranchId = null;
    this.branchForm = {
      nameAr: '',
      nameEn: '',
      code: 'BR-' + (this.branches.length + 1),
      location: '',
      description: '',
      isDefault: false
    };
    this.isBranchModalOpen = true;
  }

  openEditBranchModal(br: PharmacyBranch): void {
    this.editingBranchId = br.id;
    this.branchForm = {
      nameAr: br.nameAr,
      nameEn: br.nameEn,
      code: br.code,
      location: br.location,
      description: br.description || '',
      isDefault: br.isDefault
    };
    this.isBranchModalOpen = true;
  }

  saveBranch(): void {
    if (!this.branchForm.nameAr.trim()) return;

    if (this.editingBranchId) {
      this.db.updatePharmacyBranch(this.editingBranchId, {
        nameAr: this.branchForm.nameAr,
        nameEn: this.branchForm.nameEn,
        code: this.branchForm.code.toUpperCase(),
        location: this.branchForm.location,
        description: this.branchForm.description
      });
      this.notifications.success('تم التحديث', `تم تحديث فرع "${this.branchForm.nameAr}" بنجاح.`);
    } else {
      const newBranch: PharmacyBranch = {
        id: 'pb_' + Math.random().toString(36).substring(2, 9),
        nameAr: this.branchForm.nameAr,
        nameEn: this.branchForm.nameEn,
        code: this.branchForm.code.toUpperCase(),
        location: this.branchForm.location,
        description: this.branchForm.description,
        isDefault: false
      };
      this.db.createPharmacyBranch(newBranch);
      this.notifications.success('فرع جديد', `تمت إضافة الفرع الصيدلاني "${newBranch.nameAr}" بنجاح.`);
    }

    this.isBranchModalOpen = false;
  }

  confirmDeleteBranch(br: PharmacyBranch): void {
    const medCount = this.getBranchMedCount(br.id);
    if (medCount > 0) {
      this.notifications.warning('تعذر الحذف', `لا يمكن حذف هذا الفرع لأنه يحتوي على ${medCount} صنف دوائي مسجل.`);
      return;
    }

    if (confirm(`هل أنت متأكد من حذف الفرع "${br.nameAr}"؟`)) {
      this.db.deletePharmacyBranch(br.id);
      this.notifications.info('تم الحذف', `تم حذف الفرع "${br.nameAr}".`);
    }
  }

  // Medication CRUD
  openAddMedModal(): void {
    this.editingMedId = null;
    const defaultBranchId = this.selectedBranchFilter || this.branches[0]?.id || 'pb_main';
    this.medForm = {
      tradeName: '',
      genericName: '',
      dosageForm: 'tablets',
      dosageFormArabic: 'أقراص',
      strength: '500 mg',
      batchNumber: 'BAT-' + Math.floor(1000 + Math.random() * 9000),
      skuBarcode: 'MED-' + Math.floor(10000 + Math.random() * 90000),
      currentStock: 40,
      minThreshold: 15,
      unitPriceEgp: 45,
      expiryDate: '2028-06-30',
      category: 'مسكنات ومضادات التهاب',
      manufacturer: 'EIPICO',
      pharmacyBranchId: defaultBranchId
    };
    this.isMedModalOpen = true;
  }

  openEditMedModal(med: MedicationInventory): void {
    this.editingMedId = med.id;
    this.medForm = {
      tradeName: med.tradeName,
      genericName: med.genericName,
      dosageForm: med.dosageForm,
      dosageFormArabic: med.dosageFormArabic,
      strength: med.strength,
      batchNumber: med.batchNumber,
      skuBarcode: med.skuBarcode || '',
      currentStock: med.currentStock,
      minThreshold: med.minThreshold,
      unitPriceEgp: med.unitPriceEgp,
      expiryDate: med.expiryDate,
      category: med.category,
      manufacturer: med.manufacturer,
      pharmacyBranchId: med.pharmacyBranchId || this.branches[0]?.id || 'pb_main'
    };
    this.isMedModalOpen = true;
  }

  onDosageFormChange(): void {
    const map: Record<DosageForm, string> = {
      tablets: 'أقراص',
      capsules: 'كبسولات',
      syrup: 'شراب',
      injection: 'حقن',
      ointment: 'مرهم / كريم',
      inhaler: 'بخاخ',
      drops: 'نقط'
    };
    this.medForm.dosageFormArabic = map[this.medForm.dosageForm] || this.medForm.dosageForm;
  }

  saveMedication(): void {
    if (!this.medForm.tradeName.trim()) return;

    const branch = this.branches.find(b => b.id === this.medForm.pharmacyBranchId);

    if (this.editingMedId) {
      this.db.updatePharmacyItem(this.editingMedId, {
        tradeName: this.medForm.tradeName,
        genericName: this.medForm.genericName,
        dosageForm: this.medForm.dosageForm,
        dosageFormArabic: this.medForm.dosageFormArabic,
        strength: this.medForm.strength,
        batchNumber: this.medForm.batchNumber,
        skuBarcode: this.medForm.skuBarcode,
        currentStock: this.medForm.currentStock,
        minThreshold: this.medForm.minThreshold,
        unitPriceEgp: this.medForm.unitPriceEgp,
        expiryDate: this.medForm.expiryDate,
        category: this.medForm.category,
        manufacturer: this.medForm.manufacturer,
        pharmacyBranchId: this.medForm.pharmacyBranchId,
        branchName: branch?.nameAr
      });
      this.notifications.success('تم التحديث', `تم تحديث بيانات "${this.medForm.tradeName}" بنجاح.`);
    } else {
      const newMed: MedicationInventory = {
        id: 'med_' + Math.random().toString(36).substring(2, 9),
        tradeName: this.medForm.tradeName,
        genericName: this.medForm.genericName,
        dosageForm: this.medForm.dosageForm,
        dosageFormArabic: this.medForm.dosageFormArabic,
        strength: this.medForm.strength,
        batchNumber: this.medForm.batchNumber,
        skuBarcode: this.medForm.skuBarcode,
        currentStock: this.medForm.currentStock,
        minThreshold: this.medForm.minThreshold,
        unitPriceEgp: this.medForm.unitPriceEgp,
        expiryDate: this.medForm.expiryDate,
        category: this.medForm.category,
        manufacturer: this.medForm.manufacturer,
        lastRestockedAt: new Date().toISOString().split('T')[0],
        pharmacyBranchId: this.medForm.pharmacyBranchId,
        branchName: branch?.nameAr
      };
      this.db.addPharmacyItem(newMed);
      this.notifications.success('صنف جديد', `تمت إضافة دواء "${newMed.tradeName}" للمستودع.`);
    }

    this.isMedModalOpen = false;
  }

  confirmDeleteMed(med: MedicationInventory): void {
    if (confirm(`هل أنت متأكد من حذف الدواء "${med.tradeName}" من المخزون؟`)) {
      this.db.deletePharmacyItem(med.id);
      this.notifications.warning('تم الحذف', `تم حذف صنف "${med.tradeName}".`);
    }
  }

  // Rapid Stock Adjustment
  openAdjustStockModal(med: MedicationInventory): void {
    this.activeAdjustMed = med;
    this.adjustForm = {
      type: 'add',
      quantity: 20,
      reasonPreset: 'توريد فاتورة جديدة من المورد',
      reason: 'توريد فاتورة جديدة من المورد'
    };
    this.isAdjustModalOpen = true;
  }

  onReasonPresetChange(): void {
    if (this.adjustForm.reasonPreset !== 'other') {
      this.adjustForm.reason = this.adjustForm.reasonPreset;
    } else {
      this.adjustForm.reason = '';
    }
  }

  saveStockAdjustment(): void {
    if (!this.activeAdjustMed) return;
    const qtyChange = this.adjustForm.type === 'add' ? this.adjustForm.quantity : -this.adjustForm.quantity;
    const reasonText = this.adjustForm.reason.trim() || 'تعديل مخزون إداري';

    this.db.adjustStock(this.activeAdjustMed.id, qtyChange, reasonText, 'مدير الصيدلية');
    this.notifications.success(
      'تم تعديل الرصيد',
      `تم تحديث رصيد "${this.activeAdjustMed.tradeName}" وتسجيل قيد الحركة بنجاح.`
    );
    this.isAdjustModalOpen = false;
  }

  getStockBadgeClass(stock: number, minThreshold: number): string {
    if (stock <= 0) return 'badge bg-danger text-white';
    if (stock <= minThreshold) return 'badge bg-warning text-dark';
    return 'badge bg-success-subtle text-success';
  }

  getExpiryBadgeClass(expiryDate: string): string {
    const exp = new Date(expiryDate).getTime();
    const now = new Date().getTime();
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;

    if (exp < now) return 'badge bg-danger text-white';
    if (exp - now < ninetyDays) return 'badge bg-warning text-dark';
    return 'badge bg-light text-muted border';
  }
}
