import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDatabaseService } from '../../core/repositories/mock-database.service';
import { NotificationService } from '../../core/services/notification.service';
import { StorageService } from '../../core/services/storage.service';
import { DoctorManagerComponent } from './doctor-manager.component';
import { MultiPharmacyManagerComponent } from './multi-pharmacy-manager.component';
import { ClinicConfiguratorComponent } from './clinic-configurator.component';

@Component({
  selector: 'app-admin-suite',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DoctorManagerComponent,
    MultiPharmacyManagerComponent,
    ClinicConfiguratorComponent
  ],
  template: `
    <div class="admin-suite-container py-4 px-2 px-md-4">
      <!-- Admin Suite Header & Summary Strip -->
      <div class="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-surface">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 border-bottom pb-3">
          <div class="d-flex align-items-center gap-3">
            <div class="admin-shield-box">
              <i class="bi bi-shield-lock-fill text-white fs-3"></i>
            </div>
            <div>
              <div class="d-flex align-items-center gap-2">
                <h3 class="fw-bold mb-0 text-dark">لوحة الإدارة والتهيئة الشاملة (Admin CRUD Engine)</h3>
                <span class="badge bg-danger text-white rounded-pill x-small px-3 py-1">Super Admin Access</span>
              </div>
              <p class="text-muted small mb-0 mt-1">تحكم كامل وفوري في جميع الكيانات الطبية، الجداول، المخازن، والخدمات مع الحفظ الفوري في المستودع المحلي</p>
            </div>
          </div>

          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold" (click)="confirmFactoryReset()">
              <i class="bi bi-arrow-counterclockwise me-1"></i>
              إعادة ضبط المصنع (Reset Seed Data)
            </button>
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="row g-2">
          <div class="col-6 col-md-3">
            <div class="kpi-mini-card p-2 rounded-3 bg-primary-subtle text-center">
              <div class="fw-bold fs-4 text-primary">{{ totalDoctors }}</div>
              <div class="x-small text-primary-emphasis fw-semibold">الأطباء والعيادات المسجلة</div>
            </div>
          </div>

          <div class="col-6 col-md-3">
            <div class="kpi-mini-card p-2 rounded-3 bg-info-subtle text-center">
              <div class="fw-bold fs-4 text-info-emphasis">{{ totalDepartments }}</div>
              <div class="x-small text-info-emphasis fw-semibold">الأقسام والتخصصات الطبية</div>
            </div>
          </div>

          <div class="col-6 col-md-3">
            <div class="kpi-mini-card p-2 rounded-3 bg-warning-subtle text-center">
              <div class="fw-bold fs-4 text-warning-emphasis">{{ totalBranches }}</div>
              <div class="x-small text-warning-emphasis fw-semibold">الفروع والخزائن الصيدلانية</div>
            </div>
          </div>

          <div class="col-6 col-md-3">
            <div class="kpi-mini-card p-2 rounded-3 bg-success-subtle text-center">
              <div class="fw-bold fs-4 text-success">{{ totalServices }}</div>
              <div class="x-small text-success fw-semibold">خدمات وفحوصات الدليل المعتمد</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="admin-tabs-nav mb-4">
        <ul class="nav nav-pills gap-2 p-1 bg-surface rounded-4 shadow-sm border" role="tablist">
          <li class="nav-item flex-fill" role="presentation">
            <button
              class="nav-link w-100 fw-bold py-2 rounded-3 d-flex align-items-center justify-content-center gap-2"
              [class.active]="activeTab === 'doctors'"
              (click)="activeTab = 'doctors'"
            >
              <i class="bi bi-person-badge-fill"></i>
              <span>إدارة الأطباء وجداول المواعيد</span>
              <span class="badge bg-secondary-subtle text-secondary rounded-pill x-small">{{ totalDoctors }}</span>
            </button>
          </li>

          <li class="nav-item flex-fill" role="presentation">
            <button
              class="nav-link w-100 fw-bold py-2 rounded-3 d-flex align-items-center justify-content-center gap-2"
              [class.active]="activeTab === 'pharmacy'"
              (click)="activeTab = 'pharmacy'"
            >
              <i class="bi bi-capsule-pill"></i>
              <span>الفروع الصيدلانية والمخزون</span>
              <span class="badge bg-secondary-subtle text-secondary rounded-pill x-small">{{ totalMeds }}</span>
            </button>
          </li>

          <li class="nav-item flex-fill" role="presentation">
            <button
              class="nav-link w-100 fw-bold py-2 rounded-3 d-flex align-items-center justify-content-center gap-2"
              [class.active]="activeTab === 'clinics'"
              (click)="activeTab = 'clinics'"
            >
              <i class="bi bi-diagram-3"></i>
              <span>الأقسام والخدمات والتحاليل</span>
              <span class="badge bg-secondary-subtle text-secondary rounded-pill x-small">{{ totalServices }}</span>
            </button>
          </li>

          <li class="nav-item flex-fill" role="presentation">
            <button
              class="nav-link w-100 fw-bold py-2 rounded-3 d-flex align-items-center justify-content-center gap-2"
              [class.active]="activeTab === 'backup'"
              (click)="activeTab = 'backup'"
            >
              <i class="bi bi-hdd-network"></i>
              <span>النسخ الاحتياطي وحالة النظام</span>
            </button>
          </li>
        </ul>
      </div>

      <!-- Tab Contents -->
      <div class="tab-content">
        @switch (activeTab) {
          @case ('doctors') {
            <app-doctor-manager></app-doctor-manager>
          }
          @case ('pharmacy') {
            <app-multi-pharmacy-manager></app-multi-pharmacy-manager>
          }
          @case ('clinics') {
            <app-clinic-configurator></app-clinic-configurator>
          }
          @case ('backup') {
            <div class="card border-0 shadow-sm rounded-4 p-4 bg-surface">
              <h5 class="fw-bold mb-3 d-flex align-items-center gap-2">
                <i class="bi bi-database-check text-primary"></i>
                إدارة النسخ الاحتياطي وتفريغ البيانات (Data Backup & Synchronization)
              </h5>
              <p class="text-muted small">
                جميع بيانات النظام والتهيئة الإدارية مخزنة محلياً في المتصفح باستخدام معمارية المستودعات المنفصلة (Repository Pattern). يمكنك تصدير نسخة احتياطية كاملة بصيغة JSON أو استرجاعها في أي وقت.
              </p>

              <div class="row g-3 mt-2">
                <div class="col-md-6">
                  <div class="p-3 rounded-3 border bg-light h-100">
                    <h6 class="fw-bold text-dark mb-2">تصدير قاعدة البيانات (Export Backup JSON)</h6>
                    <p class="x-small text-muted mb-3">قم بتحميل نسخة احتياطية كاملة تحتوي على كافة الأطباء، الجداول، الأدوية، والخدمات.</p>
                    <button class="btn btn-primary btn-sm rounded-pill px-3 fw-bold" (click)="exportDatabaseBackup()">
                      <i class="bi bi-download me-1"></i> تحميل ملف النسخة الاحتياطية
                    </button>
                  </div>
                </div>

                <div class="col-md-6">
                  <div class="p-3 rounded-3 border bg-light h-100">
                    <h6 class="fw-bold text-dark mb-2">إعادة ضبط المصنع (Factory Reset)</h6>
                    <p class="x-small text-muted mb-3">إعادة تهيئة كافة الجداول والبيانات إلى البيانات الأولية النموذجية (Seed Data) وحذف أي إدخالات تجريبية.</p>
                    <button class="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold" (click)="confirmFactoryReset()">
                      <i class="bi bi-trash3 me-1"></i> إعادة تعيين كافة البيانات إلى الوضع الافتراضي
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .admin-shield-box {
      width: 50px;
      height: 50px;
      border-radius: 16px;
      background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 16px rgba(239, 68, 68, 0.25);
    }
    .kpi-mini-card {
      transition: transform 0.15s ease;
    }
    .kpi-mini-card:hover {
      transform: translateY(-2px);
    }
    .admin-tabs-nav .nav-pills .nav-link {
      color: var(--cp-text-muted, #64748b);
      border: 1px solid transparent;
      transition: all 0.2s ease;
    }
    .admin-tabs-nav .nav-pills .nav-link:hover {
      color: var(--cp-text, #0f172a);
      background: rgba(14, 165, 233, 0.05);
    }
    .admin-tabs-nav .nav-pills .nav-link.active {
      background: #0ea5e9;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
    }
    .admin-tabs-nav .nav-pills .nav-link.active .badge {
      background: rgba(255, 255, 255, 0.25) !important;
      color: #ffffff !important;
    }
  `]
})
export class AdminSuiteComponent implements OnInit {
  private readonly db = inject(MockDatabaseService);
  private readonly storage = inject(StorageService);
  private readonly notifications = inject(NotificationService);

  activeTab: 'doctors' | 'pharmacy' | 'clinics' | 'backup' = 'doctors';

  ngOnInit(): void {}

  get totalDoctors(): number {
    this.db.doctorsVersion();
    return this.db.doctors.getAll().length;
  }

  get totalDepartments(): number {
    this.db.departmentsVersion();
    return this.db.departments.getAll().length;
  }

  get totalBranches(): number {
    this.db.pharmacyBranchesVersion();
    return this.db.pharmacyBranches.getAll().length;
  }

  get totalMeds(): number {
    this.db.inventoryVersion();
    return this.db.inventory.getAll().length;
  }

  get totalServices(): number {
    this.db.servicesVersion();
    return this.db.servicesCatalog.getAll().length;
  }

  exportDatabaseBackup(): void {
    const backupData = {
      exportedAt: new Date().toISOString(),
      departments: this.db.departments.getAll(),
      doctors: this.db.doctors.getAll(),
      pharmacyBranches: this.db.pharmacyBranches.getAll(),
      inventory: this.db.inventory.getAll(),
      servicesCatalog: this.db.servicesCatalog.getAll()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carepoint-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.notifications.success('تصدير النسخة الاحتياطية', 'تم تصدير ملف النسخة الاحتياطية بنجاح.');
  }

  confirmFactoryReset(): void {
    if (confirm('تحذير: هل أنت متأكد من رغبتك في إعادة ضبط النظام إلى الإعدادات الأولية (Factory Reset)؟ ستتم استعادة جميع البيانات النموذجية.')) {
      this.db.resetAllToSeed();
      this.notifications.warning('إعادة الضبط', 'تمت استعادة كافة البيانات النموذجية الافتراضية بنجاح.');
    }
  }
}
