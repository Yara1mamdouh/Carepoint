import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDatabaseService } from '../../core/repositories/mock-database.service';
import { NotificationService } from '../../core/services/notification.service';
import { DepartmentInfo } from '../../core/models/doctor.model';
import { ClinicalService, ServiceCategory } from '../../core/models/clinical-service.model';
import { CurrencyEgpPipe } from '../../shared/pipes/currency-egp.pipe';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-clinic-configurator',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyEgpPipe, ModalComponent],
  template: `
    <div class="clinic-configurator-container">
      <!-- Section 1: Medical Departments & Specialties Configurator -->
      <div class="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-surface">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 border-bottom pb-3">
          <div class="d-flex align-items-center gap-3">
            <div class="icon-circle bg-primary-subtle text-primary">
              <i class="bi bi-diagram-3-fill fs-5"></i>
            </div>
            <div>
              <h5 class="fw-bold mb-0 text-dark">الأقسام والتخصصات الطبية بالمركز (Medical Specialties)</h5>
              <p class="text-muted small mb-0">تهيئة العيادات، الأيقونات، الألوان المميزة، وتفعيل أو إيقاف استقبال الحالات</p>
            </div>
          </div>

          <button class="btn btn-primary btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-2" (click)="openAddDeptModal()">
            <i class="bi bi-plus-circle-fill"></i>
            <span>إضافة تخصص / عيادة جديدة</span>
          </button>
        </div>

        <!-- Departments Grid -->
        <div class="row g-3">
          @for (dept of departments; track dept.id) {
            <div class="col-md-6 col-lg-4">
              <div class="dept-config-card p-3 rounded-4 border bg-surface h-100 position-relative">
                <!-- Header with Icon & Active Toggle -->
                <div class="d-flex align-items-start justify-content-between mb-3">
                  <div class="d-flex align-items-center gap-2">
                    <div class="dept-icon-box" [style.background-color]="dept.accentColor + '15'" [style.color]="dept.accentColor">
                      <i [class]="'bi ' + dept.icon"></i>
                    </div>
                    <div>
                      <h6 class="fw-bold text-dark mb-0">{{ dept.nameAr }}</h6>
                      <small class="text-muted x-small font-monospace">{{ dept.id }}</small>
                    </div>
                  </div>

                  <div class="form-check form-switch m-0" title="حالة استقبال الحالات">
                    <input
                      class="form-check-input cursor-pointer"
                      type="checkbox"
                      [checked]="dept.isActive !== false"
                      (change)="toggleDeptStatus(dept)"
                    />
                  </div>
                </div>

                <div class="small text-muted mb-2 text-truncate" [title]="dept.nameEn">{{ dept.nameEn }}</div>
                <p class="x-small text-secondary mb-3 description-clamp">{{ dept.descriptionAr }}</p>

                <!-- Footer info & Actions -->
                <div class="d-flex align-items-center justify-content-between pt-2 border-top mt-auto x-small">
                  <span class="badge bg-light text-dark border">
                    <i class="bi bi-person-fill me-1 text-primary"></i>
                    {{ getDoctorCount(dept.id) }} أطباء مسجلين
                  </span>

                  <div class="d-flex align-items-center gap-1">
                    <button class="btn btn-light btn-xs rounded-circle" (click)="openEditDeptModal(dept)" title="تعديل">
                      <i class="bi bi-pencil-fill text-primary"></i>
                    </button>
                    <button class="btn btn-light btn-xs rounded-circle" (click)="confirmDeleteDept(dept)" title="حذف">
                      <i class="bi bi-trash-fill text-danger"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Section 2: Clinical Services & Lab Panels Catalog -->
      <div class="card border-0 shadow-sm rounded-4 p-4 bg-surface">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 border-bottom pb-3">
          <div class="d-flex align-items-center gap-3">
            <div class="icon-circle bg-info-subtle text-info">
              <i class="bi bi-card-checklist fs-5"></i>
            </div>
            <div>
              <h5 class="fw-bold mb-0 text-dark">دليل الخدمات والفحوصات الطبية والتحاليل (Services & Lab Catalog)</h5>
              <p class="text-muted small mb-0">تسعير الكشوفات، الإجراءات والجراحات الصغرى، وباقات المختبر والأشعة</p>
            </div>
          </div>

          <button class="btn btn-primary btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-2" (click)="openAddServiceModal()">
            <i class="bi bi-plus-lg"></i>
            <span>إضافة خدمة / تحليل جديد</span>
          </button>
        </div>

        <!-- Filter Tabs & Search -->
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <ul class="nav nav-pills gap-1">
            <li class="nav-item">
              <button class="nav-link py-1 px-3 small rounded-pill fw-semibold" [class.active]="selectedCategory === 'all'" (click)="selectedCategory = 'all'">
                الكل ({{ services.length }})
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link py-1 px-3 small rounded-pill fw-semibold" [class.active]="selectedCategory === 'consultation'" (click)="selectedCategory = 'consultation'">
                الكشوفات
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link py-1 px-3 small rounded-pill fw-semibold" [class.active]="selectedCategory === 'procedure'" (click)="selectedCategory = 'procedure'">
                الإجراءات والجراحات
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link py-1 px-3 small rounded-pill fw-semibold" [class.active]="selectedCategory === 'lab-test'" (click)="selectedCategory = 'lab-test'">
                تحاليل المختبر
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link py-1 px-3 small rounded-pill fw-semibold" [class.active]="selectedCategory === 'radiology'" (click)="selectedCategory = 'radiology'">
                الأشعة والتصوير
              </button>
            </li>
          </ul>

          <div class="search-input-box position-relative">
            <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
            <input
              type="text"
              class="form-control form-control-sm ps-5 rounded-pill"
              placeholder="بحث باسم الخدمة أو الكود..."
              [(ngModel)]="searchServiceQuery"
            />
          </div>
        </div>

        <!-- Services Table -->
        <div class="table-responsive">
          <table class="table table-hover align-middle border mb-0">
            <thead class="table-light small text-muted">
              <tr>
                <th>كود الخدمة</th>
                <th>اسم الخدمة والبيان الطبي</th>
                <th>التصنيف الطبي</th>
                <th>القسم المربوط</th>
                <th class="text-end">السعر الرسمي</th>
                <th>المعدل الطبيعي (للمختبر)</th>
                <th class="text-center">الحالة</th>
                <th class="text-center" style="width: 100px;">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              @for (srv of filteredServices; track srv.id) {
                <tr>
                  <td>
                    <span class="badge bg-light text-secondary border font-monospace">{{ srv.code }}</span>
                  </td>
                  <td>
                    <strong class="text-dark d-block">{{ srv.nameAr }}</strong>
                    <span class="x-small text-muted">{{ srv.nameEn }}</span>
                  </td>
                  <td>
                    <span [class]="getCategoryBadgeClass(srv.category)">
                      {{ getCategoryLabelAr(srv.category) }}
                    </span>
                  </td>
                  <td>
                    <span class="small text-muted">{{ srv.departmentNameAr || 'عام / مركزي' }}</span>
                  </td>
                  <td class="text-end fw-bold text-dark">
                    {{ srv.priceEgp | currencyEgp }}
                  </td>
                  <td class="small text-muted">
                    @if (srv.normalRange) {
                      <span>{{ srv.normalRange }}</span>
                      @if (srv.unit) {
                        <span class="badge bg-secondary-subtle text-secondary ms-1 x-small">{{ srv.unit }}</span>
                      }
                    } @else {
                      <span class="text-muted">—</span>
                    }
                  </td>
                  <td class="text-center">
                    <span class="badge" [class.bg-success-subtle]="srv.isActive" [class.text-success]="srv.isActive" [class.bg-danger-subtle]="!srv.isActive" [class.text-danger]="!srv.isActive">
                      {{ srv.isActive ? 'مفعل' : 'معطل' }}
                    </span>
                  </td>
                  <td>
                    <div class="d-flex align-items-center justify-content-center gap-1">
                      <button class="btn btn-light btn-xs rounded-circle" (click)="openEditServiceModal(srv)" title="تعديل">
                        <i class="bi bi-pencil-fill text-primary"></i>
                      </button>
                      <button class="btn btn-light btn-xs rounded-circle" (click)="confirmDeleteService(srv)" title="حذف">
                        <i class="bi bi-trash-fill text-danger"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="text-center text-muted py-4 small">
                    لا توجد خدمات مطابقة للتصفية الحالية.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL 1: Add / Edit Department -->
      <app-modal
        [isOpen]="isDeptModalOpen"
        [title]="editingDeptId ? 'تعديل بيانات القسم الطبي' : 'إضافة تخصص / عيادة جديدة'"
        size="md"
        (closed)="isDeptModalOpen = false"
      >
        <form (ngSubmit)="saveDepartment()" #dForm="ngForm" class="p-2">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label small fw-bold">معرف القسم (Slug ID) <span class="text-danger">*</span></label>
              <input
                type="text"
                class="form-control font-monospace"
                placeholder="e.g. neurology"
                required
                [disabled]="!!editingDeptId"
                name="deptId"
                [(ngModel)]="deptForm.id"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label small fw-bold">الاسم بالعربية <span class="text-danger">*</span></label>
              <input
                type="text"
                class="form-control"
                placeholder="مثال: جراحة المخ والأعصاب"
                required
                name="deptNameAr"
                [(ngModel)]="deptForm.nameAr"
              />
            </div>

            <div class="col-12">
              <label class="form-label small fw-bold">الاسم بالإنجليزية <span class="text-danger">*</span></label>
              <input
                type="text"
                class="form-control"
                placeholder="Neurosurgery & Spine"
                required
                name="deptNameEn"
                [(ngModel)]="deptForm.nameEn"
              />
            </div>

            <!-- Icon Picker -->
            <div class="col-md-7">
              <label class="form-label small fw-bold">أيقونة القسم (Bootstrap Icons)</label>
              <div class="input-group">
                <span class="input-group-text"><i [class]="'bi ' + deptForm.icon"></i></span>
                <select class="form-select" name="deptIcon" [(ngModel)]="deptForm.icon">
                  <option value="bi-heart-pulse-fill">bi-heart-pulse-fill (قلب وأوعية)</option>
                  <option value="bi-gem">bi-gem (أسنان)</option>
                  <option value="bi-emoji-smile-fill">bi-emoji-smile-fill (أطفال)</option>
                  <option value="bi-bandaid-fill">bi-bandaid-fill (عظام ومفاصل)</option>
                  <option value="bi-capsule-pill">bi-capsule-pill (باطنة وعام)</option>
                  <option value="bi-flower1">bi-flower1 (جلدية وتجميل)</option>
                  <option value="bi-eye-fill">bi-eye-fill (عيون ورمد)</option>
                  <option value="bi-lungs-fill">bi-lungs-fill (صدر وجهاز تنفسي)</option>
                  <option value="bi-activity">bi-activity (مخ وأعصاب)</option>
                  <option value="bi-hospital">bi-hospital (مستشفى عام)</option>
                </select>
              </div>
            </div>

            <!-- Accent Color -->
            <div class="col-md-5">
              <label class="form-label small fw-bold">لون التمييز البصري</label>
              <div class="d-flex align-items-center gap-2">
                <input type="color" class="form-control form-control-color w-100" name="deptColor" [(ngModel)]="deptForm.accentColor" />
                <span class="font-monospace small text-muted">{{ deptForm.accentColor }}</span>
              </div>
            </div>

            <div class="col-12">
              <label class="form-label small fw-bold">وصف التخصص والخدمات المقدمة</label>
              <textarea
                class="form-control"
                rows="2"
                placeholder="شرح موجز لأهم الحالات التي تعالجها العيادة..."
                name="deptDesc"
                [(ngModel)]="deptForm.descriptionAr"
              ></textarea>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" class="btn btn-light" (click)="isDeptModalOpen = false">إلغاء</button>
            <button type="submit" class="btn btn-primary fw-bold px-4" [disabled]="!dForm.form.valid">
              {{ editingDeptId ? 'حفظ التعديلات' : 'إضافة القسم' }}
            </button>
          </div>
        </form>
      </app-modal>

      <!-- MODAL 2: Add / Edit Clinical Service -->
      <app-modal
        [isOpen]="isServiceModalOpen"
        [title]="editingServiceId ? 'تعديل خدمة / فحص طبي' : 'إضافة خدمة أو تحليل جديد للدليل'"
        size="lg"
        (closed)="isServiceModalOpen = false"
      >
        <form (ngSubmit)="saveService()" #sForm="ngForm" class="p-2">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label small fw-bold">كود الخدمة المختصر <span class="text-danger">*</span></label>
              <input type="text" class="form-control font-monospace" placeholder="SRV-CARD-02" required name="srvCode" [(ngModel)]="serviceForm.code" />
            </div>

            <div class="col-md-4">
              <label class="form-label small fw-bold">التصنيف الطبي <span class="text-danger">*</span></label>
              <select class="form-select" required name="srvCat" [(ngModel)]="serviceForm.category">
                <option value="consultation">كشف واستشارة طبية</option>
                <option value="procedure">إجراء طبي / جراحة صغرى</option>
                <option value="lab-test">تحليل / فحص معملي</option>
                <option value="radiology">أشعة / تصوير طبي</option>
              </select>
            </div>

            <div class="col-md-4">
              <label class="form-label small fw-bold">سعر الخدمة الرسمي (ج.م) <span class="text-danger">*</span></label>
              <input type="number" class="form-control text-end fw-bold" min="0" step="10" required name="srvPrice" [(ngModel)]="serviceForm.priceEgp" />
            </div>

            <div class="col-md-6">
              <label class="form-label small fw-bold">اسم الخدمة بالعربية <span class="text-danger">*</span></label>
              <input type="text" class="form-control" placeholder="مثال: رسم قلب بالمجهود" required name="srvNameAr" [(ngModel)]="serviceForm.nameAr" />
            </div>

            <div class="col-md-6">
              <label class="form-label small fw-bold">الاسم بالإنجليزية</label>
              <input type="text" class="form-control" placeholder="Stress ECG Test" name="srvNameEn" [(ngModel)]="serviceForm.nameEn" />
            </div>

            <div class="col-md-6">
              <label class="form-label small fw-bold">القسم الطبي المربوط (اختياري)</label>
              <select class="form-select" name="srvDept" [(ngModel)]="serviceForm.departmentId" (change)="onServiceDeptChange()">
                <option value="">-- عام لجميع العيادات --</option>
                @for (d of departments; track d.id) {
                  <option [value]="d.id">{{ d.nameAr }}</option>
                }
              </select>
            </div>

            <!-- Lab Test Specific Fields -->
            @if (serviceForm.category === 'lab-test' || serviceForm.category === 'radiology') {
              <div class="col-md-6">
                <label class="form-label small fw-bold">وحدة القياس</label>
                <input type="text" class="form-control" placeholder="e.g. mg/dL, %, g/dL, تقرير" name="srvUnit" [(ngModel)]="serviceForm.unit" />
              </div>

              <div class="col-12">
                <label class="form-label small fw-bold">المعدل المرجعي الطبيعي (Normal Reference Range)</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="مثال: الهيموجلوبين: 13-17 g/dL | كرات الدم البيضاء: 4000-11000"
                  name="srvRange"
                  [(ngModel)]="serviceForm.normalRange"
                />
              </div>
            }

            <div class="col-12">
              <label class="form-label small fw-bold">وصف الخدمة وشروط إجرائها</label>
              <textarea class="form-control" rows="2" placeholder="تعليمات التحضير (مثلاً صيام 8-12 ساعة)..." name="srvDesc" [(ngModel)]="serviceForm.descriptionAr"></textarea>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" class="btn btn-light" (click)="isServiceModalOpen = false">إلغاء</button>
            <button type="submit" class="btn btn-primary fw-bold px-4" [disabled]="!sForm.form.valid">
              {{ editingServiceId ? 'حفظ التعديلات' : 'إضافة الخدمة للدليل' }}
            </button>
          </div>
        </form>
      </app-modal>
    </div>
  `,
  styles: [`
    .icon-circle {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .dept-config-card {
      transition: all 0.2s ease;
    }
    .dept-config-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.06);
    }
    .dept-icon-box {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
    }
    .description-clamp {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 32px;
    }
    .search-input-box input {
      min-width: 250px;
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
export class ClinicConfiguratorComponent implements OnInit {
  private readonly db = inject(MockDatabaseService);
  private readonly notifications = inject(NotificationService);

  selectedCategory: 'all' | ServiceCategory = 'all';
  searchServiceQuery = '';

  // Department Modal
  isDeptModalOpen = false;
  editingDeptId: string | null = null;
  deptForm = {
    id: '',
    nameAr: '',
    nameEn: '',
    icon: 'bi-heart-pulse-fill',
    accentColor: '#0ea5e9',
    descriptionAr: ''
  };

  // Service Modal
  isServiceModalOpen = false;
  editingServiceId: string | null = null;
  serviceForm = {
    code: '',
    nameAr: '',
    nameEn: '',
    category: 'procedure' as ServiceCategory,
    departmentId: '',
    departmentNameAr: '',
    priceEgp: 300,
    normalRange: '',
    unit: '',
    descriptionAr: ''
  };

  ngOnInit(): void {}

  get departments(): DepartmentInfo[] {
    this.db.departmentsVersion();
    return this.db.departments.getAll();
  }

  get services(): ClinicalService[] {
    this.db.servicesVersion();
    return this.db.servicesCatalog.getAll();
  }

  get filteredServices(): ClinicalService[] {
    return this.services.filter(s => {
      const matchCat = this.selectedCategory === 'all' || s.category === this.selectedCategory;
      const matchSearch =
        !this.searchServiceQuery.trim() ||
        s.nameAr.toLowerCase().includes(this.searchServiceQuery.toLowerCase()) ||
        s.nameEn.toLowerCase().includes(this.searchServiceQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(this.searchServiceQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }

  getDoctorCount(deptId: string): number {
    return this.db.doctors.query(d => d.department === deptId).length;
  }

  toggleDeptStatus(dept: DepartmentInfo): void {
    const newStatus = dept.isActive === false ? true : false;
    this.db.updateDepartment(dept.id, { isActive: newStatus });
    this.notifications.info(
      'تحديث الحالة',
      `تم ${newStatus ? 'تفعيل' : 'إيقاف'} استقبال الحالات في قسم "${dept.nameAr}".`
    );
  }

  openAddDeptModal(): void {
    this.editingDeptId = null;
    this.deptForm = {
      id: '',
      nameAr: '',
      nameEn: '',
      icon: 'bi-heart-pulse-fill',
      accentColor: '#0ea5e9',
      descriptionAr: ''
    };
    this.isDeptModalOpen = true;
  }

  openEditDeptModal(dept: DepartmentInfo): void {
    this.editingDeptId = dept.id;
    this.deptForm = {
      id: dept.id,
      nameAr: dept.nameAr,
      nameEn: dept.nameEn,
      icon: dept.icon,
      accentColor: dept.accentColor,
      descriptionAr: dept.descriptionAr
    };
    this.isDeptModalOpen = true;
  }

  saveDepartment(): void {
    if (!this.deptForm.nameAr.trim()) return;

    if (this.editingDeptId) {
      this.db.updateDepartment(this.editingDeptId, {
        nameAr: this.deptForm.nameAr,
        nameEn: this.deptForm.nameEn,
        icon: this.deptForm.icon,
        accentColor: this.deptForm.accentColor,
        descriptionAr: this.deptForm.descriptionAr
      });
      this.notifications.success('تم التحديث', `تم تحديث بيانات قسم "${this.deptForm.nameAr}" بنجاح.`);
    } else {
      const slug = this.deptForm.id.trim().toLowerCase().replace(/\s+/g, '_') || ('dept_' + Math.random().toString(36).substring(2, 8));
      const newDept: DepartmentInfo = {
        id: slug,
        nameAr: this.deptForm.nameAr,
        nameEn: this.deptForm.nameEn,
        icon: this.deptForm.icon,
        accentColor: this.deptForm.accentColor,
        descriptionAr: this.deptForm.descriptionAr,
        isActive: true
      };
      this.db.createDepartment(newDept);
      this.notifications.success('قسم جديد', `تمت إضافة قسم "${newDept.nameAr}" وتفعيله فورياً.`);
    }

    this.isDeptModalOpen = false;
  }

  confirmDeleteDept(dept: DepartmentInfo): void {
    const docCount = this.getDoctorCount(dept.id);
    if (docCount > 0) {
      this.notifications.warning('تعذر الحذف', `لا يمكن حذف قسم "${dept.nameAr}" لوجود ${docCount} أطباء مرتبطين به.`);
      return;
    }

    if (confirm(`هل أنت متأكد من حذف قسم "${dept.nameAr}"؟`)) {
      this.db.deleteDepartment(dept.id);
      this.notifications.info('تم الحذف', `تم حذف قسم "${dept.nameAr}".`);
    }
  }

  // Clinical Service CRUD
  openAddServiceModal(): void {
    this.editingServiceId = null;
    this.serviceForm = {
      code: 'SRV-' + Math.floor(100 + Math.random() * 900),
      nameAr: '',
      nameEn: '',
      category: 'procedure',
      departmentId: '',
      departmentNameAr: '',
      priceEgp: 250,
      normalRange: '',
      unit: '',
      descriptionAr: ''
    };
    this.isServiceModalOpen = true;
  }

  openEditServiceModal(srv: ClinicalService): void {
    this.editingServiceId = srv.id;
    this.serviceForm = {
      code: srv.code,
      nameAr: srv.nameAr,
      nameEn: srv.nameEn,
      category: srv.category,
      departmentId: srv.departmentId || '',
      departmentNameAr: srv.departmentNameAr || '',
      priceEgp: srv.priceEgp,
      normalRange: srv.normalRange || '',
      unit: srv.unit || '',
      descriptionAr: srv.descriptionAr || ''
    };
    this.isServiceModalOpen = true;
  }

  onServiceDeptChange(): void {
    const dept = this.departments.find(d => d.id === this.serviceForm.departmentId);
    this.serviceForm.departmentNameAr = dept ? dept.nameAr : '';
  }

  saveService(): void {
    if (!this.serviceForm.nameAr.trim()) return;

    if (this.editingServiceId) {
      this.db.updateServiceItem(this.editingServiceId, {
        code: this.serviceForm.code.toUpperCase(),
        nameAr: this.serviceForm.nameAr,
        nameEn: this.serviceForm.nameEn,
        category: this.serviceForm.category,
        departmentId: this.serviceForm.departmentId || undefined,
        departmentNameAr: this.serviceForm.departmentNameAr || undefined,
        priceEgp: this.serviceForm.priceEgp,
        normalRange: this.serviceForm.normalRange || undefined,
        unit: this.serviceForm.unit || undefined,
        descriptionAr: this.serviceForm.descriptionAr || undefined
      });
      this.notifications.success('تم التحديث', `تم تحديث خدمة "${this.serviceForm.nameAr}" بنجاح.`);
    } else {
      const newService: ClinicalService = {
        id: 'srv_' + Math.random().toString(36).substring(2, 9),
        code: this.serviceForm.code.toUpperCase(),
        nameAr: this.serviceForm.nameAr,
        nameEn: this.serviceForm.nameEn,
        category: this.serviceForm.category,
        departmentId: this.serviceForm.departmentId || undefined,
        departmentNameAr: this.serviceForm.departmentNameAr || undefined,
        priceEgp: this.serviceForm.priceEgp,
        normalRange: this.serviceForm.normalRange || undefined,
        unit: this.serviceForm.unit || undefined,
        descriptionAr: this.serviceForm.descriptionAr || undefined,
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0]
      };
      this.db.createServiceItem(newService);
      this.notifications.success('خدمة جديدة', `تمت إضافة "${newService.nameAr}" وتغذية الفواتير والمختبر فورياً.`);
    }

    this.isServiceModalOpen = false;
  }

  confirmDeleteService(srv: ClinicalService): void {
    if (confirm(`هل أنت متأكد من حذف الخدمة "${srv.nameAr}"؟`)) {
      this.db.deleteServiceItem(srv.id);
      this.notifications.warning('تم الحذف', `تم حذف خدمة "${srv.nameAr}".`);
    }
  }

  getCategoryLabelAr(cat: ServiceCategory): string {
    const map: Record<ServiceCategory, string> = {
      consultation: 'كشف واستشارة',
      procedure: 'إجراء طبي',
      'lab-test': 'تحليل مختبر',
      radiology: 'أشعة وتصوير'
    };
    return map[cat] || cat;
  }

  getCategoryBadgeClass(cat: ServiceCategory): string {
    const map: Record<ServiceCategory, string> = {
      consultation: 'badge bg-primary-subtle text-primary',
      procedure: 'badge bg-success-subtle text-success',
      'lab-test': 'badge bg-info-subtle text-info',
      radiology: 'badge bg-purple-subtle text-purple'
    };
    return map[cat] || 'badge bg-secondary';
  }
}
