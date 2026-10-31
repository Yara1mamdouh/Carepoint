import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDatabaseService } from '../../core/repositories/mock-database.service';
import { NotificationService } from '../../core/services/notification.service';
import { Doctor, DepartmentInfo } from '../../core/models/doctor.model';
import { CurrencyEgpPipe } from '../../shared/pipes/currency-egp.pipe';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-doctor-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyEgpPipe, ModalComponent],
  template: `
    <div class="doctor-manager-container">
      <!-- Action Bar & Filter -->
      <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-surface">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div class="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
            <div class="search-input-box position-relative">
              <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
              <input
                type="text"
                class="form-control form-control-sm ps-5 rounded-pill"
                placeholder="بحث بالاسم أو التخصص أو رقم الترخيص..."
                [(ngModel)]="searchQuery"
              />
            </div>

            <select class="form-select form-select-sm rounded-pill w-auto" [(ngModel)]="filterDepartment">
              <option value="">جميع التخصصات الطبية</option>
              @for (dept of departments; track dept.id) {
                <option [value]="dept.id">{{ dept.nameAr }}</option>
              }
            </select>
          </div>

          <button class="btn btn-primary btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-2" (click)="openAddDoctorModal()">
            <i class="bi bi-person-plus-fill"></i>
            <span>إضافة طبيب جديد</span>
          </button>
        </div>
      </div>

      <!-- Doctors Grid -->
      <div class="row g-3">
        @for (doc of filteredDoctors; track doc.id) {
          <div class="col-md-6 col-xl-4">
            <div class="card border-0 shadow-sm rounded-4 h-100 bg-surface doctor-admin-card p-3 position-relative">
              <!-- Top Row: Avatar + Info -->
              <div class="d-flex align-items-start gap-3 mb-3">
                <img [src]="doc.avatarUrl" [alt]="doc.name" class="doctor-card-avatar rounded-circle border shadow-xs" />
                <div class="flex-grow-1 overflow-hidden">
                  <h6 class="fw-bold mb-1 text-truncate text-dark" [title]="doc.name">{{ doc.name }}</h6>
                  <span class="badge bg-primary-subtle text-primary x-small mb-1">{{ doc.departmentArabic }}</span>
                  <div class="text-muted x-small text-truncate">{{ doc.title }}</div>
                  <div class="x-small text-secondary mt-1">
                    <i class="bi bi-door-open text-muted me-1"></i>غرفة: <strong>{{ doc.roomNumber }}</strong>
                    <span class="mx-1">•</span>
                    <i class="bi bi-tag text-muted me-1"></i>الكشف: <strong>{{ doc.consultationFee | currencyEgp }}</strong>
                  </div>
                </div>
              </div>

              <!-- Working Hours Summary Box -->
              <div class="p-2 rounded-3 bg-light border mb-3 x-small">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <span class="text-muted"><i class="bi bi-clock me-1 text-primary"></i>فترة الشفت:</span>
                  <strong class="text-dark dir-ltr">{{ doc.shiftStart }} - {{ doc.shiftEnd }}</strong>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <span class="text-muted"><i class="bi bi-hourglass-split me-1 text-info"></i>مدة الكشف:</span>
                  <span class="badge bg-info-subtle text-info">{{ doc.slotDurationMinutes }} دقيقة</span>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-muted"><i class="bi bi-calendar-week me-1 text-success"></i>أيام العمل:</span>
                  <span class="fw-bold text-dark">{{ formatWorkingDaysShort(doc.workingDays) }}</span>
                </div>
                @if (doc.vacationDays.length > 0) {
                  <div class="mt-1 pt-1 border-top text-danger d-flex align-items-center gap-1">
                    <i class="bi bi-calendar-x"></i>
                    <span>عطلات مجدولة ({{ doc.vacationDays.length }} يوم)</span>
                  </div>
                }
              </div>

              <!-- Bottom Actions -->
              <div class="d-flex align-items-center justify-content-between pt-2 border-top mt-auto">
                <button class="btn btn-outline-info btn-sm rounded-pill px-3" (click)="openScheduleModal(doc)">
                  <i class="bi bi-calendar-range me-1"></i>
                  تعديل الجدول والشفت
                </button>

                <div class="d-flex align-items-center gap-1">
                  <button class="btn btn-light btn-sm rounded-circle" (click)="openEditDoctorModal(doc)" title="تعديل البيانات">
                    <i class="bi bi-pencil-fill text-primary"></i>
                  </button>
                  <button class="btn btn-light btn-sm rounded-circle" (click)="confirmDeleteDoctor(doc)" title="حذف الطبيب">
                    <i class="bi bi-trash-fill text-danger"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        } @empty {
          <div class="col-12">
            <div class="text-center py-5 bg-surface rounded-4 shadow-sm">
              <i class="bi bi-person-x fs-1 text-muted d-block mb-2"></i>
              <h6 class="fw-bold text-dark">لا يوجد أطباء مطابقين للبحث</h6>
              <p class="text-muted small">قم بتعديل فلتر التخصص أو اضغط على "إضافة طبيب جديد"</p>
            </div>
          </div>
        }
      </div>

      <!-- MODAL 1: Add / Edit Doctor Profile -->
      <app-modal
        [isOpen]="isDoctorModalOpen"
        [title]="editingDoctorId ? 'تعديل بيانات الطبيب' : 'إضافة طبيب جديد إلى المركز'"
        size="lg"
        (closed)="isDoctorModalOpen = false"
      >
        <form (ngSubmit)="saveDoctor()" #docForm="ngForm" class="p-2">
          <div class="row g-3">
            <!-- Full Name -->
            <div class="col-md-7">
              <label class="form-label small fw-bold">الاسم الكامل للطبيب <span class="text-danger">*</span></label>
              <input
                type="text"
                class="form-control"
                placeholder="مثال: د. كريم سامي الشناوي"
                required
                name="docName"
                [(ngModel)]="doctorForm.name"
              />
            </div>

            <!-- Professional Title -->
            <div class="col-md-5">
              <label class="form-label small fw-bold">المسمى المهني / الدرجة <span class="text-danger">*</span></label>
              <input
                type="text"
                class="form-control"
                placeholder="مثال: استشاري أول - دكتوراه"
                required
                name="docTitle"
                [(ngModel)]="doctorForm.title"
              />
            </div>

            <!-- Department Selection -->
            <div class="col-md-6">
              <label class="form-label small fw-bold">التخصص / القسم الطبي <span class="text-danger">*</span></label>
              <select
                class="form-select"
                required
                name="docDept"
                [(ngModel)]="doctorForm.department"
                (change)="onDeptChange()"
              >
                @for (dept of departments; track dept.id) {
                  <option [value]="dept.id">{{ dept.nameAr }} ({{ dept.nameEn }})</option>
                }
              </select>
            </div>

            <!-- Consultation Fee -->
            <div class="col-md-3">
              <label class="form-label small fw-bold">سعر الكشف (ج.م) <span class="text-danger">*</span></label>
              <input
                type="number"
                class="form-control"
                min="0"
                step="25"
                required
                name="docFee"
                [(ngModel)]="doctorForm.consultationFee"
              />
            </div>

            <!-- Room Number -->
            <div class="col-md-3">
              <label class="form-label small fw-bold">رقم العيادة / الغرفة <span class="text-danger">*</span></label>
              <input
                type="text"
                class="form-control font-monospace"
                placeholder="e.g. 204"
                required
                name="docRoom"
                [(ngModel)]="doctorForm.roomNumber"
              />
            </div>

            <!-- License Number -->
            <div class="col-md-4">
              <label class="form-label small fw-bold">رقم ترخيص مزاولة المهنة</label>
              <input
                type="text"
                class="form-control font-monospace"
                placeholder="MOH-8921"
                name="docLicense"
                [(ngModel)]="doctorForm.licenseNumber"
              />
            </div>

            <!-- Phone -->
            <div class="col-md-4">
              <label class="form-label small fw-bold">رقم الهاتف للتواصل</label>
              <input
                type="tel"
                class="form-control"
                placeholder="+2010xxxxxxxx"
                name="docPhone"
                [(ngModel)]="doctorForm.phone"
              />
            </div>

            <!-- Email -->
            <div class="col-md-4">
              <label class="form-label small fw-bold">البريد الإلكتروني</label>
              <input
                type="email"
                class="form-control"
                placeholder="doctor@carepoint.eg"
                name="docEmail"
                [(ngModel)]="doctorForm.email"
              />
            </div>

            <!-- Avatar Uploader / URL -->
            <div class="col-12 p-3 rounded-3 bg-light border">
              <label class="form-label small fw-bold d-block mb-2">صورة الطبيب الشخصية (رابط URL أو رفع ملف مباشر):</label>
              <div class="d-flex align-items-center gap-3">
                <img [src]="doctorForm.avatarUrl || defaultAvatar" alt="Avatar preview" class="rounded-circle border shadow-sm preview-avatar" />
                <div class="flex-grow-1">
                  <div class="input-group input-group-sm mb-2">
                    <span class="input-group-text"><i class="bi bi-link-45deg"></i></span>
                    <input
                      type="text"
                      class="form-control"
                      placeholder="رابط مباشر للصورة (URL)..."
                      name="docAvatar"
                      [(ngModel)]="doctorForm.avatarUrl"
                    />
                  </div>
                  <input
                    type="file"
                    class="form-control form-control-sm"
                    accept="image/*"
                    (change)="onAvatarFileChange($event)"
                  />
                  <small class="text-muted x-small">يدعم صيغ JPG، PNG، WebP، أو رفع صورة مباشرة كـ Base64</small>
                </div>
              </div>
            </div>

            <!-- Bio -->
            <div class="col-12">
              <label class="form-label small fw-bold">نبذة تعريفية ومؤهلات الطبيب</label>
              <textarea
                class="form-control"
                rows="2"
                placeholder="نبذة عن الطبيب، الخبرات السابقة والشهادات الطبية المعتمدة..."
                name="docBio"
                [(ngModel)]="doctorForm.bio"
              ></textarea>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" class="btn btn-light" (click)="isDoctorModalOpen = false">إلغاء</button>
            <button type="submit" class="btn btn-primary fw-bold px-4" [disabled]="!docForm.form.valid">
              <i class="bi bi-check2-circle me-1"></i>
              {{ editingDoctorId ? 'حفظ التعديلات' : 'إضافة الطبيب' }}
            </button>
          </div>
        </form>
      </app-modal>

      <!-- MODAL 2: Dynamic Working Hours & Schedule Builder -->
      <app-modal
        [isOpen]="isScheduleModalOpen"
        [title]="'منشئ جدول العمل والمواعيد: ' + (activeScheduleDoctor?.name || '')"
        size="lg"
        (closed)="isScheduleModalOpen = false"
      >
        @if (activeScheduleDoctor) {
          <div class="schedule-builder-content p-2">
            <!-- Alert info -->
            <div class="alert alert-info py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
              <i class="bi bi-info-circle-fill fs-5"></i>
              <span>أي تعديل على الشفت أو مدة الكشف ينعكس فورياً على نظام حجز المرضى ومولد المواعيد الذكي.</span>
            </div>

            <!-- Section 1: Working Days Selector -->
            <div class="mb-4">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <label class="form-label small fw-bold m-0">أيام العمل الأسبوعية (اختر الأيام المتاحة):</label>
                <div class="d-flex gap-1">
                  <button type="button" class="btn btn-xs btn-outline-secondary" (click)="setAllDays()">طوال الأسبوع</button>
                  <button type="button" class="btn btn-xs btn-outline-secondary" (click)="setWeekdays()">السبت - الخميس</button>
                </div>
              </div>

              <div class="d-flex flex-wrap gap-2">
                @for (day of daysOfWeekList; track day.val) {
                  <button
                    type="button"
                    class="btn btn-sm rounded-pill px-3 py-2 d-flex align-items-center gap-2 day-pill"
                    [class.btn-primary]="isDaySelected(day.val)"
                    [class.btn-outline-secondary]="!isDaySelected(day.val)"
                    (click)="toggleDay(day.val)"
                  >
                    @if (isDaySelected(day.val)) {
                      <i class="bi bi-check-circle-fill"></i>
                    } @else {
                      <i class="bi bi-circle"></i>
                    }
                    <span>{{ day.nameAr }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Section 2: Shift Hours & Slot Duration -->
            <div class="row g-3 mb-4 p-3 rounded-3 bg-light border">
              <div class="col-md-4">
                <label class="form-label small fw-bold">بداية الشفت اليومي <span class="text-danger">*</span></label>
                <input
                  type="time"
                  class="form-control text-center fw-bold"
                  [(ngModel)]="scheduleForm.shiftStart"
                />
              </div>

              <div class="col-md-4">
                <label class="form-label small fw-bold">نهاية الشفت اليومي <span class="text-danger">*</span></label>
                <input
                  type="time"
                  class="form-control text-center fw-bold"
                  [(ngModel)]="scheduleForm.shiftEnd"
                />
              </div>

              <div class="col-md-4">
                <label class="form-label small fw-bold">مدة الكشف لكل مريض <span class="text-danger">*</span></label>
                <div class="d-flex gap-1">
                  @for (dur of [15, 20, 30, 45, 60]; track dur) {
                    <button
                      type="button"
                      class="btn btn-sm flex-fill"
                      [class.btn-primary]="scheduleForm.slotDurationMinutes === dur"
                      [class.btn-outline-secondary]="scheduleForm.slotDurationMinutes !== dur"
                      (click)="scheduleForm.slotDurationMinutes = dur"
                    >
                      {{ dur }}د
                    </button>
                  }
                </div>
              </div>

              <!-- Optional Lunch Interval -->
              <div class="col-12 pt-2 border-top">
                <div class="form-check form-switch mb-2">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="hasLunchCheck"
                    [(ngModel)]="scheduleForm.hasLunch"
                  />
                  <label class="form-check-label small fw-bold" for="hasLunchCheck">
                    تحديد فترة استراحة غداء / راحة خلال الشفت
                  </label>
                </div>

                @if (scheduleForm.hasLunch) {
                  <div class="row g-2">
                    <div class="col-6 col-md-3">
                      <label class="form-label x-small text-muted mb-1">بداية الاستراحة:</label>
                      <input type="time" class="form-control form-control-sm text-center" [(ngModel)]="scheduleForm.lunchStart" />
                    </div>
                    <div class="col-6 col-md-3">
                      <label class="form-label x-small text-muted mb-1">نهاية الاستراحة:</label>
                      <input type="time" class="form-control form-control-sm text-center" [(ngModel)]="scheduleForm.lunchEnd" />
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Section 3: Vacation Block-Out Dates -->
            <div class="mb-3">
              <label class="form-label small fw-bold d-block mb-1">
                تواريخ الإجازات والعطلات المحجوبة (Block-Out Vacation Dates):
              </label>
              <div class="d-flex align-items-center gap-2 mb-2">
                <input
                  type="date"
                  class="form-control form-control-sm w-auto"
                  [(ngModel)]="newVacationDate"
                />
                <button type="button" class="btn btn-outline-danger btn-sm rounded-pill px-3" (click)="addVacationDate()">
                  <i class="bi bi-calendar-plus me-1"></i> إضافة يوم إجازة
                </button>
              </div>

              @if (scheduleForm.vacationDays.length > 0) {
                <div class="d-flex flex-wrap gap-2 p-2 rounded-3 bg-light border">
                  @for (vDate of scheduleForm.vacationDays; track vDate; let i = $index) {
                    <span class="badge bg-danger-subtle text-danger border border-danger-subtle d-inline-flex align-items-center gap-1 p-2">
                      <i class="bi bi-calendar-event"></i>
                      <span>{{ vDate }}</span>
                      <button type="button" class="btn-close btn-close-xs ms-1" (click)="removeVacationDate(i)" aria-label="حذف"></button>
                    </span>
                  }
                </div>
              } @else {
                <small class="text-muted x-small">لا توجد عطلات محجوبة مسجلة لهذا الطبيب حالياً.</small>
              }
            </div>

            <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <button type="button" class="btn btn-light" (click)="isScheduleModalOpen = false">إلغاء</button>
              <button type="button" class="btn btn-primary fw-bold px-4" (click)="saveSchedule()">
                <i class="bi bi-save2 me-1"></i> حفظ جدول المواعيد
              </button>
            </div>
          </div>
        }
      </app-modal>
    </div>
  `,
  styles: [`
    .doctor-card-avatar {
      width: 60px;
      height: 60px;
      object-fit: cover;
    }
    .preview-avatar {
      width: 55px;
      height: 55px;
      object-fit: cover;
    }
    .search-input-box input {
      min-width: 260px;
    }
    .doctor-admin-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .doctor-admin-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important;
    }
    .day-pill {
      min-width: 100px;
      justify-content: center;
    }
    .btn-xs {
      font-size: 0.72rem;
      padding: 0.2rem 0.5rem;
    }
    .btn-close-xs {
      font-size: 0.55rem;
    }
  `]
})
export class DoctorManagerComponent implements OnInit {
  private readonly db = inject(MockDatabaseService);
  private readonly notifications = inject(NotificationService);

  readonly defaultAvatar = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80';

  readonly daysOfWeekList = [
    { val: 6, nameAr: 'السبت' },
    { val: 0, nameAr: 'الأحد' },
    { val: 1, nameAr: 'الإثنين' },
    { val: 2, nameAr: 'الثلاثاء' },
    { val: 3, nameAr: 'الأربعاء' },
    { val: 4, nameAr: 'الخميس' },
    { val: 5, nameAr: 'الجمعة' }
  ];

  searchQuery = '';
  filterDepartment = '';

  departments: DepartmentInfo[] = [];

  // Modals state
  isDoctorModalOpen = false;
  editingDoctorId: string | null = null;

  isScheduleModalOpen = false;
  activeScheduleDoctor: Doctor | null = null;
  newVacationDate = '';

  doctorForm = {
    name: '',
    title: '',
    department: 'general',
    departmentArabic: 'الطب العام والباطنة',
    roomNumber: '101',
    consultationFee: 300,
    licenseNumber: '',
    phone: '',
    email: '',
    avatarUrl: '',
    bio: ''
  };

  scheduleForm = {
    workingDays: [0, 1, 2, 3, 4] as number[],
    shiftStart: '09:00',
    shiftEnd: '17:00',
    slotDurationMinutes: 30,
    hasLunch: true,
    lunchStart: '14:00',
    lunchEnd: '15:00',
    vacationDays: [] as string[]
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.departments = this.db.getDepartments();
  }

  get doctors(): Doctor[] {
    this.db.doctorsVersion();
    return this.db.doctors.getAll();
  }

  get filteredDoctors(): Doctor[] {
    return this.doctors.filter(d => {
      const matchSearch =
        !this.searchQuery.trim() ||
        d.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        d.departmentArabic.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        d.licenseNumber?.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchDept = !this.filterDepartment || d.department === this.filterDepartment;
      return matchSearch && matchDept;
    });
  }

  onDeptChange(): void {
    const found = this.departments.find(dept => dept.id === this.doctorForm.department);
    if (found) {
      this.doctorForm.departmentArabic = found.nameAr;
    }
  }

  openAddDoctorModal(): void {
    this.editingDoctorId = null;
    this.doctorForm = {
      name: '',
      title: 'استشاري أول',
      department: this.departments[0]?.id || 'general',
      departmentArabic: this.departments[0]?.nameAr || 'الطب العام والباطنة',
      roomNumber: '10' + (this.doctors.length + 1),
      consultationFee: 400,
      licenseNumber: 'MOH-' + Math.floor(1000 + Math.random() * 9000),
      phone: '+2010' + Math.floor(10000000 + Math.random() * 90000000),
      email: '',
      avatarUrl: this.defaultAvatar,
      bio: ''
    };
    this.isDoctorModalOpen = true;
  }

  openEditDoctorModal(doc: Doctor): void {
    this.editingDoctorId = doc.id;
    this.doctorForm = {
      name: doc.name,
      title: doc.title,
      department: doc.department,
      departmentArabic: doc.departmentArabic,
      roomNumber: doc.roomNumber,
      consultationFee: doc.consultationFee,
      licenseNumber: doc.licenseNumber,
      phone: doc.phone,
      email: doc.email,
      avatarUrl: doc.avatarUrl,
      bio: doc.bio
    };
    this.isDoctorModalOpen = true;
  }

  onAvatarFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        this.doctorForm.avatarUrl = reader.result as string;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  saveDoctor(): void {
    if (!this.doctorForm.name.trim()) return;

    if (this.editingDoctorId) {
      this.db.updateDoctor(this.editingDoctorId, {
        name: this.doctorForm.name,
        title: this.doctorForm.title,
        department: this.doctorForm.department,
        departmentArabic: this.doctorForm.departmentArabic,
        roomNumber: this.doctorForm.roomNumber,
        consultationFee: this.doctorForm.consultationFee,
        licenseNumber: this.doctorForm.licenseNumber,
        phone: this.doctorForm.phone,
        email: this.doctorForm.email,
        avatarUrl: this.doctorForm.avatarUrl || this.defaultAvatar,
        bio: this.doctorForm.bio
      });

      this.notifications.success('تم التحديث', `تم تحديث بيانات ${this.doctorForm.name} بنجاح.`);
    } else {
      const newDoctor: Doctor = {
        id: 'doc_' + Math.random().toString(36).substring(2, 9),
        name: this.doctorForm.name,
        title: this.doctorForm.title,
        department: this.doctorForm.department,
        departmentArabic: this.doctorForm.departmentArabic,
        roomNumber: this.doctorForm.roomNumber,
        consultationFee: this.doctorForm.consultationFee,
        rating: 5.0,
        reviewsCount: 1,
        avatarUrl: this.doctorForm.avatarUrl || this.defaultAvatar,
        workingDays: [6, 0, 1, 2, 3, 4], // Sat to Thu
        shiftStart: '09:00',
        shiftEnd: '17:00',
        slotDurationMinutes: 30,
        lunchInterval: { start: '14:00', end: '15:00' },
        vacationDays: [],
        licenseNumber: this.doctorForm.licenseNumber,
        bio: this.doctorForm.bio,
        phone: this.doctorForm.phone,
        email: this.doctorForm.email
      };

      this.db.createDoctor(newDoctor);
      this.notifications.success('طبيب جديد', `تمت إضافة ${newDoctor.name} وحفظه في النظام بنجاح.`);
    }

    this.isDoctorModalOpen = false;
  }

  confirmDeleteDoctor(doc: Doctor): void {
    if (confirm(`هل أنت متأكد من حذف الطبيب "${doc.name}" من النظام؟`)) {
      this.db.deleteDoctor(doc.id);
      this.notifications.warning('تم الحذف', `تم حذف الطبيب "${doc.name}" من قاعدة البيانات.`);
    }
  }

  openScheduleModal(doc: Doctor): void {
    this.activeScheduleDoctor = doc;
    this.scheduleForm = {
      workingDays: [...doc.workingDays],
      shiftStart: doc.shiftStart || '09:00',
      shiftEnd: doc.shiftEnd || '17:00',
      slotDurationMinutes: doc.slotDurationMinutes || 30,
      hasLunch: !!doc.lunchInterval?.start,
      lunchStart: doc.lunchInterval?.start || '14:00',
      lunchEnd: doc.lunchInterval?.end || '15:00',
      vacationDays: [...(doc.vacationDays || [])]
    };
    this.newVacationDate = '';
    this.isScheduleModalOpen = true;
  }

  isDaySelected(dayVal: number): boolean {
    return this.scheduleForm.workingDays.includes(dayVal);
  }

  toggleDay(dayVal: number): void {
    const idx = this.scheduleForm.workingDays.indexOf(dayVal);
    if (idx > -1) {
      if (this.scheduleForm.workingDays.length === 1) {
        this.notifications.warning('تنبيه', 'يجب تحديد يوم عمل واحد على الأقل للطبيب.');
        return;
      }
      this.scheduleForm.workingDays.splice(idx, 1);
    } else {
      this.scheduleForm.workingDays.push(dayVal);
      this.scheduleForm.workingDays.sort((a, b) => a - b);
    }
  }

  setAllDays(): void {
    this.scheduleForm.workingDays = [0, 1, 2, 3, 4, 5, 6];
  }

  setWeekdays(): void {
    this.scheduleForm.workingDays = [6, 0, 1, 2, 3, 4]; // Sat to Thu
  }

  addVacationDate(): void {
    if (!this.newVacationDate) return;
    if (this.scheduleForm.vacationDays.includes(this.newVacationDate)) {
      this.notifications.info('ملاحظة', 'هذا التاريخ مضاف بالفعل كعطلة.');
      return;
    }
    this.scheduleForm.vacationDays.push(this.newVacationDate);
    this.scheduleForm.vacationDays.sort();
    this.newVacationDate = '';
  }

  removeVacationDate(index: number): void {
    this.scheduleForm.vacationDays.splice(index, 1);
  }

  saveSchedule(): void {
    if (!this.activeScheduleDoctor) return;

    const lunchInterval = this.scheduleForm.hasLunch
      ? { start: this.scheduleForm.lunchStart, end: this.scheduleForm.lunchEnd }
      : undefined;

    this.db.updateDoctorSchedule(this.activeScheduleDoctor.id, {
      workingDays: this.scheduleForm.workingDays,
      shiftStart: this.scheduleForm.shiftStart,
      shiftEnd: this.scheduleForm.shiftEnd,
      slotDurationMinutes: this.scheduleForm.slotDurationMinutes,
      lunchInterval,
      vacationDays: this.scheduleForm.vacationDays
    });

    this.notifications.success(
      'تم تحديث الجدول',
      `تم تحديث مواعيد وشفتات ${this.activeScheduleDoctor.name} وتحديث حجز المرضى فورياً.`
    );
    this.isScheduleModalOpen = false;
  }

  formatWorkingDaysShort(days: number[]): string {
    if (!days || days.length === 0) return 'لا يوجد';
    if (days.length === 7) return 'يومياً (طوال الأسبوع)';
    return days.map(d => {
      const match = this.daysOfWeekList.find(item => item.val === d);
      return match ? match.nameAr : '';
    }).filter(Boolean).join('، ');
  }
}
