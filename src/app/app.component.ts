import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeService } from './core/services/theme.service';
import { AuthRoleService, UserRole } from './core/services/auth-role.service';
import { MockDatabaseService } from './core/repositories/mock-database.service';
import { OtpSecurityService, EmailJsConfig } from './services/otp-security.service';
import { WhatsappDispatchService, UltraMsgConfig } from './services/whatsapp-dispatch.service';
import { SpeechChimeService } from './services/speech-chime.service';
import { NotificationService } from './core/services/notification.service';
import { ToastContainerComponent } from './shared/components/toast/toast.component';
import { ModalComponent } from './shared/components/modal/modal.component';
import { Patient } from './core/models/patient.model';
import { Doctor } from './core/models/doctor.model';
import { Appointment } from './core/models/appointment.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    ToastContainerComponent,
    ModalComponent
  ],
  template: `
    <div class="app-layout min-vh-100 d-flex flex-column">
      <!-- Top Navbar -->
      <nav class="navbar navbar-expand-xl navbar-light border-bottom bg-surface sticky-top py-2 px-3 px-md-4 shadow-sm">
        <div class="container-fluid p-0">
          <!-- Brand -->
          <a class="navbar-brand d-flex align-items-center gap-2 m-0 cursor-pointer" routerLink="/reception">
            <div class="brand-logo-circle">
              <i class="bi bi-hospital-fill text-white"></i>
            </div>
            <div>
              <div class="brand-name fw-bold text-dark lh-1">CarePoint <span class="text-primary">Pro</span></div>
              <small class="text-muted x-small d-block mt-1">نظام كير بوينت الطبي الشامل</small>
            </div>
          </a>

          <!-- Mobile Toggle Button -->
          <button
            class="navbar-toggler border-0"
            type="button"
            (click)="isMobileNavOpen = !isMobileNavOpen"
            aria-label="Toggle navigation"
          >
            <i class="bi bi-list fs-3"></i>
          </button>

          <!-- Nav Links & Controls -->
          <div class="collapse navbar-collapse" [class.show]="isMobileNavOpen">
            <ul class="navbar-nav me-auto my-2 my-xl-0 gap-1 gap-xl-2">
              <li class="nav-item">
                <a
                  class="nav-link px-3 py-2 rounded-3 fw-semibold"
                  routerLink="/booking"
                  routerLinkActive="active"
                  (click)="isMobileNavOpen = false"
                >
                  <i class="bi bi-calendar-plus me-1 text-primary"></i>
                  حجز المرضى
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link px-3 py-2 rounded-3 fw-semibold"
                  routerLink="/reception"
                  routerLinkActive="active"
                  (click)="isMobileNavOpen = false"
                >
                  <i class="bi bi-display me-1 text-info"></i>
                  مكتب الاستقبال والطوارئ
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link px-3 py-2 rounded-3 fw-semibold"
                  routerLink="/doctor"
                  routerLinkActive="active"
                  (click)="isMobileNavOpen = false"
                >
                  <i class="bi bi-stethoscope me-1 text-danger"></i>
                  عيادة الطبيب والسجل الطبي
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link px-3 py-2 rounded-3 fw-semibold"
                  routerLink="/pharmacy-lab"
                  routerLinkActive="active"
                  (click)="isMobileNavOpen = false"
                >
                  <i class="bi bi-capsule-pill me-1 text-warning"></i>
                  الصيدلية والمختبر
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link px-3 py-2 rounded-3 fw-semibold"
                  routerLink="/billing"
                  routerLinkActive="active"
                  (click)="isMobileNavOpen = false"
                >
                  <i class="bi bi-cash-stack me-1 text-success"></i>
                  الحسابات والفواتير
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link px-3 py-2 rounded-3 fw-bold admin-nav-link text-danger"
                  routerLink="/admin"
                  routerLinkActive="active"
                  (click)="isMobileNavOpen = false"
                >
                  <i class="bi bi-shield-lock-fill me-1"></i>
                  لوحة الإدارة
                  <span class="badge bg-danger text-white ms-1 x-small">CRUD</span>
                </a>
              </li>
            </ul>

            <!-- Right Controls: Global Search, Role Persona, Theme, Settings -->
            <div class="d-flex flex-wrap align-items-center gap-2 pt-2 pt-xl-0 border-top border-xl-0">
              <!-- Global Search Trigger -->
              <button
                class="btn btn-sm btn-light border d-flex align-items-center gap-2 rounded-pill px-3 py-1"
                (click)="isSearchModalOpen = true"
                title="البحث الشامل عن مريض أو طبيب (Ctrl+K)"
              >
                <i class="bi bi-search text-muted"></i>
                <span class="small text-muted d-none d-md-inline">بحث...</span>
                <span class="badge bg-secondary-subtle text-secondary x-small d-none d-lg-inline">Ctrl+K</span>
              </button>

              <!-- Voice Announce Toggle -->
              <button
                class="btn btn-sm btn-light border rounded-circle theme-btn"
                [class.text-primary]="speechService.isVoiceEnabled()"
                [class.text-muted]="!speechService.isVoiceEnabled()"
                (click)="speechService.toggleVoice()"
                [title]="speechService.isVoiceEnabled() ? 'النداء الصوتي مفعل' : 'النداء الصوتي معطل'"
              >
                <i [class]="speechService.isVoiceEnabled() ? 'bi bi-megaphone-fill' : 'bi bi-volume-mute-fill'"></i>
              </button>

              <!-- Persona Switcher -->
              <div class="dropdown">
                <button
                  class="btn btn-sm btn-light border d-flex align-items-center gap-2 rounded-pill px-3 py-1"
                  type="button"
                  id="roleDropdown"
                  (click)="isRoleDropdownOpen = !isRoleDropdownOpen"
                >
                  <i class="bi bi-person-badge text-primary"></i>
                  <span class="small fw-bold">{{ getActiveRoleTitle() }}</span>
                  <i class="bi bi-chevron-down x-small text-muted"></i>
                </button>
                @if (isRoleDropdownOpen) {
                  <ul class="dropdown-menu show dropdown-menu-end shadow-lg border-0 rounded-4 p-2 mt-2">
                    <li class="dropdown-header x-small text-muted">تبديل دور المستخدم (Persona):</li>
                    @for (item of authService.availableRoles; track item.role) {
                      <li>
                        <button
                          class="dropdown-item rounded-3 small py-2 d-flex align-items-center gap-2"
                          [class.active]="authService.currentRole() === item.role"
                          (click)="selectRole(item.role)"
                        >
                          <i [class]="'bi ' + item.icon"></i>
                          <div>
                            <div class="fw-bold">{{ item.titleAr }}</div>
                            <div class="x-small opacity-75">{{ item.description }}</div>
                          </div>
                        </button>
                      </li>
                    }
                  </ul>
                }
              </div>

              <!-- Theme Toggle -->
              <button
                class="btn btn-sm btn-light border rounded-circle theme-btn"
                (click)="themeService.toggleTheme()"
                [title]="themeService.isDark() ? 'التبديل إلى الوضع النهاري السريري' : 'التبديل إلى الوضع الليلي الطبي'"
              >
                <i [class]="themeService.isDark() ? 'bi bi-sun-fill text-warning' : 'bi bi-moon-stars-fill text-secondary'"></i>
              </button>

              <!-- Integrations & Settings Button -->
              <button
                class="btn btn-sm btn-light border rounded-circle theme-btn"
                (click)="openSettingsModal()"
                title="إعدادات بوابات الربط ومحاكاة البيانات"
              >
                <i class="bi bi-gear-fill text-primary"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <!-- Quick Interactive Demo Scenarios Banner -->
      <div class="demo-scenarios-strip py-1 px-3 px-md-4 bg-primary-subtle border-bottom d-print-none">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 small">
          <div class="d-flex align-items-center gap-2 text-primary fw-bold">
            <i class="bi bi-lightning-charge-fill text-warning"></i>
            <span>سيناريوهات التشغيل السريعة (Live Tour):</span>
          </div>

          <div class="d-flex flex-wrap gap-1">
            <button class="btn btn-xs btn-outline-primary bg-white rounded-pill px-2 py-1" (click)="runScenario1()">
              🩺 1. حجز موعد ورمز OTP
            </button>
            <button class="btn btn-xs btn-outline-danger bg-white rounded-pill px-2 py-1" (click)="runScenario2()">
              🚨 2. طوارئ واستدعاء صوتي
            </button>
            <button class="btn btn-xs btn-outline-info bg-white rounded-pill px-2 py-1" (click)="runScenario3()">
              💊 3. روشتة وتعارض دوائي
            </button>
            <button class="btn btn-xs btn-outline-success bg-white rounded-pill px-2 py-1" (click)="runScenario4()">
              🧾 4. صرف وفاتورة ضريبية
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content Router Area -->
      <main class="flex-grow-1">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <footer class="mt-auto py-3 px-4 border-top bg-surface small text-muted d-print-none">
        <div class="container-fluid d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div class="d-flex align-items-center gap-2">
            <span class="fw-bold text-dark">CarePoint Pro &copy; 2026</span>
            <span>•</span>
            <span>نظام إدارة العمليات الطبية والعيادات المتكامل</span>
          </div>

          <div class="d-flex align-items-center gap-3">
            <span><i class="bi bi-telephone-fill text-primary me-1"></i> الخط الساخن: <strong>19850</strong></span>
            <span>•</span>
            <span><i class="bi bi-shield-check text-success me-1"></i> معايير الأمان والخصوصية الطبية HIPAA</span>
          </div>
        </div>
      </footer>

      <!-- Global Toast Alerts -->
      <app-toast-container></app-toast-container>

      <!-- Global Search Modal (Ctrl+K) -->
      <app-modal
        [isOpen]="isSearchModalOpen"
        title="البحث الشامل في منظومة كير بوينت"
        subtitle="ابحث بالاسم، رقم الهاتف، الرقم القومي، أو رقم الملف الطبي"
        headerIcon="bi-search"
        size="lg"
        (closed)="isSearchModalOpen = false"
      >
        <div class="mb-3">
          <div class="input-group">
            <span class="input-group-text bg-transparent"><i class="bi bi-search"></i></span>
            <input
              type="text"
              class="form-control"
              placeholder="اكتب اسم المريض، الهاتف (010...)، أو رقم التذكرة..."
              [(ngModel)]="globalSearchQuery"
              (ngModelChange)="onGlobalSearch()"
              autofocus
            />
          </div>
        </div>

        <div class="search-results-box" style="max-height: 380px; overflow-y: auto;">
          @if (searchResults.length > 0) {
            <div class="d-flex flex-column gap-2">
              @for (res of searchResults; track res.id) {
                <div class="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between">
                  <div>
                    <div class="d-flex align-items-center gap-2">
                      <strong class="text-dark">{{ res.name }}</strong>
                      <span class="badge bg-primary-subtle text-primary font-monospace">{{ res.badge }}</span>
                    </div>
                    <div class="x-small text-muted mt-1">{{ res.subtext }}</div>
                  </div>
                  <button class="btn btn-primary btn-sm py-1 px-3" (click)="navigateToSearchResult(res)">
                    {{ res.actionLabel }}
                  </button>
                </div>
              }
            </div>
          } @else if (globalSearchQuery) {
            <div class="text-center text-muted py-4 small">
              لا توجد نتائج مطابقة لبحثك: "{{ globalSearchQuery }}"
            </div>
          } @else {
            <div class="text-center text-muted py-4 small">
              ابدأ بكتابة اسم المريض أو رقم الهاتف لعرض السجلات فورياً.
            </div>
          }
        </div>
      </app-modal>

      <!-- Settings & Integrations Modal -->
      <app-modal
        [isOpen]="isSettingsModalOpen"
        title="إعدادات النظام والبوابات الخارجية"
        subtitle="تكوين مفاتيح EmailJS وبوابة WhatsApp UltraMsg وإدارة البيانات التجريبية"
        headerIcon="bi-sliders2"
        size="lg"
        (closed)="isSettingsModalOpen = false"
      >
        <div class="row g-4">
          <!-- EmailJS Config -->
          <div class="col-12">
            <div class="p-3 rounded-3 border bg-light">
              <h6 class="fw-bold text-primary mb-2 d-flex align-items-center gap-2">
                <i class="bi bi-envelope-check"></i>
                بوابة البريد الإلكتروني (EmailJS SDK)
              </h6>
              <p class="x-small text-muted mb-3">
                تُستخدم في إرسال رموز الأمان (OTP Verification) وإشعارات جاهزية نتائج التحاليل. (يعمل النظام في وضع المحاكاة التلقائي عند ترك الحقول فارغة).
              </p>

              <div class="row g-2">
                <div class="col-md-4">
                  <label class="form-label x-small fw-bold">Service ID:</label>
                  <input type="text" class="form-control form-control-sm font-monospace dir-ltr" placeholder="service_xyz" [(ngModel)]="emailJsForm.serviceId" />
                </div>
                <div class="col-md-4">
                  <label class="form-label x-small fw-bold">Template ID:</label>
                  <input type="text" class="form-control form-control-sm font-monospace dir-ltr" placeholder="template_abc" [(ngModel)]="emailJsForm.templateId" />
                </div>
                <div class="col-md-4">
                  <label class="form-label x-small fw-bold">Public Key:</label>
                  <input type="text" class="form-control form-control-sm font-monospace dir-ltr" placeholder="user_pub_key" [(ngModel)]="emailJsForm.publicKey" />
                </div>
              </div>

              <div class="text-end mt-2">
                <button class="btn btn-outline-primary btn-sm" (click)="saveEmailJsSettings()">
                  حفظ إعدادات EmailJS
                </button>
              </div>
            </div>
          </div>

          <!-- UltraMsg Config -->
          <div class="col-12">
            <div class="p-3 rounded-3 border bg-light">
              <h6 class="fw-bold text-success mb-2 d-flex align-items-center gap-2">
                <i class="bi bi-whatsapp"></i>
                بوابة واتساب الهجينة (UltraMsg Gateway & wa.me Fallback)
              </h6>
              <p class="x-small text-muted mb-3">
                تُستخدم في إرسال تذاكر المواعيد، التذكيرات، وقسائم الحضور. في حال عدم توفر رصيد بالبوابة ينتقل النظام تلقائياً وبسلاسة إلى رابط wa.me المباشر.
              </p>

              <div class="row g-2 align-items-center">
                <div class="col-md-5">
                  <label class="form-label x-small fw-bold">Instance ID:</label>
                  <input type="text" class="form-control form-control-sm font-monospace dir-ltr" placeholder="instance9482" [(ngModel)]="ultraMsgForm.instanceId" />
                </div>
                <div class="col-md-5">
                  <label class="form-label x-small fw-bold">API Token:</label>
                  <input type="text" class="form-control form-control-sm font-monospace dir-ltr" placeholder="tok_sec_123" [(ngModel)]="ultraMsgForm.token" />
                </div>
                <div class="col-md-2 mt-4">
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="umToggle" [(ngModel)]="ultraMsgForm.enabled" />
                    <label class="form-check-label small" for="umToggle">تفعيل API</label>
                  </div>
                </div>
              </div>

              <div class="text-end mt-2">
                <button class="btn btn-outline-success btn-sm" (click)="saveUltraMsgSettings()">
                  حفظ إعدادات UltraMsg
                </button>
              </div>
            </div>
          </div>

          <!-- Reset Database -->
          <div class="col-12">
            <div class="p-3 rounded-3 border border-danger border-opacity-25 bg-danger-subtle d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div>
                <strong class="text-danger d-block">إعادة تعيين كافة البيانات التجريبية (Factory Reset)</strong>
                <span class="x-small text-danger opacity-75">إعادة تحميل كافة الأطباء، المرضى، الروشتات، والفحوصات إلى الحالة الأولية.</span>
              </div>
              <button class="btn btn-danger btn-sm fw-bold" (click)="resetAllSeedData()">
                <i class="bi bi-arrow-counterclockwise me-1"></i> إعادة ضبط البيانات
              </button>
            </div>
          </div>
        </div>

        <div footer class="d-flex justify-content-end">
          <button class="btn btn-primary px-4" (click)="isSettingsModalOpen = false">إغلاق النافذة</button>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .brand-logo-circle {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .brand-name {
      font-size: 1.2rem;
      letter-spacing: -0.02em;
    }
    .x-small { font-size: 0.72rem; }
    .btn-xs { font-size: 0.72rem; padding: 0.2rem 0.6rem; }
    .theme-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nav-link {
      transition: all 0.15s ease;
      color: var(--cp-text-muted, #64748b);
    }
    .nav-link:hover {
      color: var(--cp-text, #0f172a);
      background: var(--cp-surface-2, #f1f5f9);
    }
    .nav-link.active {
      color: #0284c7 !important;
      background: rgba(14, 165, 233, 0.1) !important;
      font-weight: 700 !important;
    }
    .dropdown-menu {
      min-width: 260px;
    }
  `]
})
export class AppComponent {
  readonly themeService = inject(ThemeService);
  readonly authService = inject(AuthRoleService);
  readonly speechService = inject(SpeechChimeService);
  private readonly router = inject(Router);
  private readonly db = inject(MockDatabaseService);
  private readonly otpService = inject(OtpSecurityService);
  private readonly whatsapp = inject(WhatsappDispatchService);
  private readonly notifications = inject(NotificationService);

  isMobileNavOpen = false;
  isRoleDropdownOpen = false;
  isSettingsModalOpen = false;
  isSearchModalOpen = false;

  globalSearchQuery = '';
  searchResults: {
    id: string;
    type: 'patient' | 'doctor' | 'appointment';
    name: string;
    badge: string;
    subtext: string;
    actionLabel: string;
    route: string;
  }[] = [];

  emailJsForm: EmailJsConfig = { serviceId: '', templateId: '', publicKey: '' };
  ultraMsgForm: UltraMsgConfig = { instanceId: '', token: '', enabled: false };

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.isSearchModalOpen = !this.isSearchModalOpen;
    }
  }

  getActiveRoleTitle(): string {
    const r = this.authService.availableRoles.find(item => item.role === this.authService.currentRole());
    return r ? r.titleAr : 'مستخدم';
  }

  selectRole(role: UserRole): void {
    this.authService.setRole(role);
    this.isRoleDropdownOpen = false;
    this.notifications.info('تبديل الصلاحية', `تم التبديل إلى دور: ${this.getActiveRoleTitle()}`);
  }

  onGlobalSearch(): void {
    const q = this.globalSearchQuery.trim().toLowerCase();
    if (!q) {
      this.searchResults = [];
      return;
    }

    const results: typeof this.searchResults = [];

    // Patients
    this.db.patients.getAll().forEach(p => {
      if (
        p.fullName.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.nationalId.includes(q) ||
        p.fileNumber.toLowerCase().includes(q)
      ) {
        results.push({
          id: p.id,
          type: 'patient',
          name: p.fullName,
          badge: p.fileNumber,
          subtext: `هاتف: ${p.phone} | أمراض مزمنة: ${p.chronicDiseases.join(', ') || 'لا يوجد'}`,
          actionLabel: 'فتح ملف المريض',
          route: '/doctor'
        });
      }
    });

    // Appointments / Tickets
    this.db.appointments.getAll().forEach(a => {
      if (a.ticketNumber.toLowerCase().includes(q) || a.patientName.toLowerCase().includes(q)) {
        results.push({
          id: a.id,
          type: 'appointment',
          name: `تذكرة [ ${a.ticketNumber} ] - ${a.patientName}`,
          badge: a.departmentArabic,
          subtext: `الطبيب: ${a.doctorName} | الموعد: ${a.date} ${a.timeSlot}`,
          actionLabel: 'عرض في الطابور',
          route: '/reception'
        });
      }
    });

    this.searchResults = results.slice(0, 8);
  }

  navigateToSearchResult(item: typeof this.searchResults[0]): void {
    this.isSearchModalOpen = false;
    this.router.navigateByUrl(item.route);
    this.notifications.info('انتقال سريع', `تم الانتقال إلى ${item.name}`);
  }

  // Demo Scenarios
  runScenario1(): void {
    this.authService.setRole('patient');
    this.router.navigateByUrl('/booking');
    this.notifications.info(
      'سيناريو 1: حجز موعد للمريض',
      'تم نقلك لبوابة الحجز. اختر عيادة القلب لتجربة التدفق واختبار رمز OTP السريع.'
    );
  }

  runScenario2(): void {
    this.authService.setRole('receptionist');
    this.router.navigateByUrl('/reception');

    // Create an emergency walk-in appointment
    const emergencyPatient: Patient = {
      id: 'pt_em_' + Math.random().toString(36).substring(2, 7),
      fileNumber: 'PT-2026-EM01',
      nationalId: '28901011802999',
      fullName: 'محمود عبد السلام القاضي (طوارئ)',
      phone: '+201099887766',
      email: 'm.kadi@carepoint.local',
      dateOfBirth: '1974-08-12',
      gender: 'male',
      bloodGroup: 'O+',
      chronicDiseases: ['ارتفاع ضغط دم حاد', 'اشتباه ذبحة صدرية'],
      allergies: [],
      currentMedications: ['Aspocid 75mg'],
      emergencyContact: { name: 'المرافق', relation: 'أسرة', phone: '+201099887766' },
      registeredVia: 'walk-in',
      createdAt: new Date().toISOString()
    };
    this.db.patients.create(emergencyPatient);

    const ticketNumber = 'CARD-EM-99';
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const apt: Appointment = {
      id: 'apt_em_' + Math.random().toString(36).substring(2, 7),
      ticketNumber,
      patientId: emergencyPatient.id,
      patientName: emergencyPatient.fullName,
      patientPhone: emergencyPatient.phone,
      patientEmail: emergencyPatient.email,
      doctorId: 'doc_cardio_1',
      doctorName: 'د. خالد عبد العزيز الشناوي',
      department: 'cardiology',
      departmentArabic: 'أمراض القلب والأوعية',
      roomNumber: '101',
      date: todayStr,
      timeSlot: timeStr,
      status: 'waiting',
      priority: 'emergency',
      intake: {
        symptoms: 'ألم عاصر خلف عظم القص يمتد للذراع الأيسر وضيق تنفس حاد.',
        chronicDiseases: ['ضغط دم مرتفع'],
        currentMedications: [],
        triageSeverity: 5,
        uploadedLabPhotos: []
      },
      vitals: {
        systolicBp: 175,
        diastolicBp: 105,
        pulseRate: 110,
        temperature: 37.2,
        oxygenSaturation: 94,
        weightKg: 85,
        heightCm: 174,
        measuredAt: todayStr + ' ' + timeStr
      },
      isWalkIn: true,
      bookedAt: now.toISOString(),
      otpVerified: true
    };

    this.db.appointments.create(apt);

    // Announce via Arabic vocal speech
    this.speechService.announcePatient(ticketNumber, emergencyPatient.fullName, '101', 'القلب');

    this.notifications.warning(
      '🚨 تم إدراج حالة طوارئ قلبية وتصعيدها',
      `تم إدراج تذكرة [ ${ticketNumber} ] على رأس صالة الانتظار وتشغيل النداء الصوتي الآلي!`
    );
  }

  runScenario3(): void {
    this.authService.setRole('doctor');
    this.router.navigateByUrl('/doctor');
    this.notifications.info(
      'سيناريو 3: العيادة والتعارضات الدوائية',
      'تم نقلك لغرفة كشف د. خالد الشناوي. افتح تبويب الروشتة الذكية لإضافة Augmentin لمريض لديه حساسية بنسلين ورؤية تحذير السلامة.'
    );
  }

  runScenario4(): void {
    this.authService.setRole('admin');
    this.router.navigateByUrl('/billing');
    this.notifications.info(
      'سيناريو 4: الحسابات والفواتير',
      'تم نقلك لقسم الفواتير والإيرادات. استعرض تجميع الكشف والأدوية والتحاليل وإصدار الإيصال الضريبي.'
    );
  }

  openSettingsModal(): void {
    this.emailJsForm = this.otpService.getConfig();
    this.ultraMsgForm = this.whatsapp.getConfig();
    this.isSettingsModalOpen = true;
  }

  saveEmailJsSettings(): void {
    this.otpService.saveConfig(this.emailJsForm);
  }

  saveUltraMsgSettings(): void {
    this.whatsapp.saveConfig(this.ultraMsgForm);
  }

  resetAllSeedData(): void {
    if (confirm('هل أنت متأكد من رغبتك في إعادة تعيين كافة البيانات إلى الحالة الافتراضية؟')) {
      this.db.resetAllToSeed();
      this.notifications.success('تمت إعادة الضبط', 'تمت استعادة كافة البيانات السريرية الأولية بنجاح.');
      this.isSettingsModalOpen = false;
    }
  }
}
