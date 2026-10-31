import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDatabaseService } from '../../core/repositories/mock-database.service';
import { NotificationService } from '../../core/services/notification.service';
import { WhatsappDispatchService } from '../../services/whatsapp-dispatch.service';
import { LabOrder, LabOrderItem, LabStatus, InterpretationType } from '../../core/models/lab-test.model';
import { StatusBadgePipe } from '../../shared/pipes/status-badge.pipe';
import { MedicalDatePipe } from '../../shared/pipes/medical-date.pipe';
import { CurrencyEgpPipe } from '../../shared/pipes/currency-egp.pipe';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PrintableLabReportComponent } from './printable-lab-report.component';

@Component({
  selector: 'app-lab-order-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatusBadgePipe,
    MedicalDatePipe,
    CurrencyEgpPipe,
    ModalComponent,
    PrintableLabReportComponent
  ],
  template: `
    <div class="lab-manager-container p-3 p-md-4">
      @if (viewingReportOrder) {
        <app-printable-lab-report
          [order]="viewingReportOrder"
          (close)="viewingReportOrder = null"
        >
        </app-printable-lab-report>
      } @else {
        <!-- Header -->
      <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-surface">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div class="d-flex align-items-center gap-3">
            <div class="lab-icon-box">
              <i class="bi bi-eyedropper text-primary"></i>
            </div>
            <div>
              <h4 class="fw-bold mb-0">مختبر التحاليل الطبية والتشخيص الرقمي</h4>
              <p class="text-muted small mb-0">تسجيل سحب العينات، إدخال النتائج، والإشعار الآلي للمريض بجاهزية التقرير</p>
            </div>
          </div>

          <div class="d-flex gap-2">
            <select class="form-select form-select-sm w-auto" [(ngModel)]="statusFilter">
              <option value="all">جميع الحالات</option>
              <option value="ordered">مطلوبة حديثاً</option>
              <option value="sample-collected">تم سحب العينة</option>
              <option value="processing">قيد التحليل</option>
              <option value="ready">النتائج معتمدة</option>
            </select>
          </div>
        </div>

        <!-- Metrics Strip -->
        <div class="row g-2 mt-3 pt-3 border-top">
          <div class="col-6 col-md-3">
            <div class="p-2 rounded-3 bg-light text-center">
              <div class="fw-bold fs-5 text-dark">{{ labOrders.length }}</div>
              <div class="x-small text-muted">إجمالي الفحوصات</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="p-2 rounded-3 bg-warning-subtle text-center">
              <div class="fw-bold fs-5 text-warning-emphasis">{{ processingCount }}</div>
              <div class="x-small text-warning-emphasis">قيد التحليل المعملي</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="p-2 rounded-3 bg-success-subtle text-center">
              <div class="fw-bold fs-5 text-success">{{ readyCount }}</div>
              <div class="x-small text-success">فحوصات معتمدة وجاهزة</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="p-2 rounded-3 bg-info-subtle text-center">
              <div class="fw-bold fs-5 text-info-emphasis">{{ sampleCollectedCount }}</div>
              <div class="x-small text-info-emphasis">عينات مسحوبة</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Orders List -->
      <div class="card border-0 shadow-sm rounded-4 p-4 bg-surface">
        <div class="table-responsive">
          <table class="table table-hover align-middle border mb-0">
            <thead class="table-light small text-muted">
              <tr>
                <th>رقم الأمر</th>
                <th>اسم المريض</th>
                <th>الطبيب الطالب</th>
                <th>الفحوصات المطلوبة</th>
                <th>التكلفة</th>
                <th>الحالة الحالية</th>
                <th>وقت الطلب</th>
                <th>الإجراءات السريعة</th>
              </tr>
            </thead>
            <tbody>
              @for (order of filteredOrders; track order.id) {
                <tr>
                  <td><strong class="font-monospace text-primary">{{ order.orderNumber }}</strong></td>
                  <td>
                    <strong class="text-dark d-block">{{ order.patientName }}</strong>
                    <span class="x-small text-muted dir-ltr">{{ order.patientPhone }}</span>
                  </td>
                  <td><span class="small">{{ order.doctorName }}</span></td>
                  <td>
                    <div class="d-flex flex-wrap gap-1" style="max-width: 240px;">
                      @for (item of order.items; track item.testId) {
                        <span class="badge bg-light text-dark border x-small">
                          {{ item.testNameAr }}
                          @if (item.resultValue) {
                            <strong class="text-success ms-1">({{ item.resultValue }} {{ item.resultUnit }})</strong>
                          }
                        </span>
                      }
                    </div>
                  </td>
                  <td class="fw-bold text-success">{{ order.totalCostEgp | currencyEgp }}</td>
                  <td>
                    <span [class]="order.status | statusBadge:'class'">
                      <i [class]="'bi ' + (order.status | statusBadge:'icon') + ' me-1'"></i>
                      {{ order.status | statusBadge:'label' }}
                    </span>
                  </td>
                  <td><span class="small text-muted">{{ order.orderedAt | medicalDate:'short' }}</span></td>
                  <td>
                    <div class="d-flex gap-1">
                      @if (order.status === 'ordered') {
                        <button class="btn btn-outline-info btn-sm py-0 px-2" (click)="updateStatus(order, 'sample-collected')">
                          <i class="bi bi-droplet me-1"></i> سحب العينة
                        </button>
                      } @else if (order.status === 'sample-collected' || order.status === 'processing') {
                        <button class="btn btn-primary btn-sm py-0 px-2 fw-bold" (click)="openResultsModal(order)">
                          <i class="bi bi-pencil-square me-1"></i> إدخال النتائج
                        </button>
                      } @else if (order.status === 'ready') {
                        <button class="btn btn-outline-primary btn-sm py-0 px-2" (click)="viewingReportOrder = order">
                          <i class="bi bi-printer me-1"></i> التقرير
                        </button>
                        <button class="btn btn-outline-success btn-sm py-0 px-2" (click)="sendReadyAlert(order)">
                          <i class="bi bi-whatsapp me-1"></i> إشعار
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="text-center text-muted py-5">
                    <i class="bi bi-inbox fs-2 d-block mb-1 opacity-50"></i>
                    لا توجد أوامر تحاليل طبية مسجلة في هذا التصنيف.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Results Input Modal -->
      @if (activeOrderForResults) {
        <app-modal
          [isOpen]="isResultsModalOpen"
          title="إدخال النتائج المعملية واعتماد التقرير"
          [subtitle]="'أمر رقم ' + activeOrderForResults.orderNumber + ' - المريض: ' + activeOrderForResults.patientName"
          headerIcon="bi-clipboard2-check-fill"
          size="lg"
          (closed)="isResultsModalOpen = false"
        >
          <div class="d-flex flex-column gap-3">
            @for (item of activeOrderForResults.items; track item.testId; let idx = $index) {
              <div class="p-3 rounded-3 border bg-light">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <strong class="text-primary">{{ item.testNameAr }}</strong>
                  <span class="badge bg-secondary-subtle text-secondary small">المعدل الطبيعي: {{ item.normalRange }}</span>
                </div>

                <div class="row g-2 align-items-center">
                  <div class="col-md-4">
                    <label class="form-label x-small text-muted mb-1">النتيجة المقاسة (Result):</label>
                    <input type="text" class="form-control form-control-sm" placeholder="e.g. 14.2" [(ngModel)]="item.resultValue" />
                  </div>

                  <div class="col-md-3">
                    <label class="form-label x-small text-muted mb-1">وحدة القياس (Unit):</label>
                    <input type="text" class="form-control form-control-sm" placeholder="e.g. g/dL, %" [(ngModel)]="item.resultUnit" />
                  </div>

                  <div class="col-md-5">
                    <label class="form-label x-small text-muted mb-1">التقييم السريري (Interpretation):</label>
                    <select class="form-select form-select-sm" [(ngModel)]="item.interpretation">
                      <option value="normal">طبيعي (Normal)</option>
                      <option value="high">مرتفع عن المعدل (High)</option>
                      <option value="low">منخفض عن المعدل (Low)</option>
                      <option value="critical">مستوى حرج يستدعي تدخل (Critical)</option>
                    </select>
                  </div>

                  <div class="col-12 mt-2">
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      placeholder="ملاحظات فني المختبر..."
                      [(ngModel)]="item.labTechnicianNotes"
                    />
                  </div>
                </div>
              </div>
            }

            <!-- Report Photo Upload (Base64) -->
            <div>
              <label class="form-label small fw-bold">إرفاق صورة التقرير أو الأشعة الممسوحة ضوئياً (اختياري):</label>
              <input type="file" class="form-control form-control-sm" accept="image/*,.pdf" (change)="onReportUpload($event)" />
            </div>
          </div>

          <div footer class="d-flex justify-content-end gap-2">
            <button class="btn btn-light" (click)="isResultsModalOpen = false">إلغاء</button>
            <button class="btn btn-success fw-bold px-4" (click)="saveAndApproveResults()">
              <i class="bi bi-check-circle me-1"></i>
              اعتماد النتائج وإشعار المريض آلياً
            </button>
          </div>
        </app-modal>
      }
      }
    </div>
  `,
  styles: [`
    .lab-icon-box {
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
export class LabOrderManagerComponent implements OnInit {
  private readonly db = inject(MockDatabaseService);
  private readonly whatsapp = inject(WhatsappDispatchService);
  private readonly notifications = inject(NotificationService);

  statusFilter = 'all';
  isResultsModalOpen = false;
  activeOrderForResults: LabOrder | null = null;
  viewingReportOrder: LabOrder | null = null;

  ngOnInit(): void {}

  get labOrders(): LabOrder[] {
    this.db.labOrdersVersion();
    return this.db.labOrders.getAll();
  }

  get filteredOrders(): LabOrder[] {
    if (this.statusFilter === 'all') return this.labOrders;
    return this.labOrders.filter(o => o.status === this.statusFilter);
  }

  get processingCount(): number {
    return this.labOrders.filter(o => o.status === 'processing').length;
  }

  get readyCount(): number {
    return this.labOrders.filter(o => o.status === 'ready').length;
  }

  get sampleCollectedCount(): number {
    return this.labOrders.filter(o => o.status === 'sample-collected').length;
  }

  updateStatus(order: LabOrder, newStatus: LabStatus): void {
    const updates: Partial<LabOrder> = { status: newStatus };
    if (newStatus === 'sample-collected') {
      updates.sampleCollectedAt = new Date().toISOString();
    }
    this.db.labOrders.update(order.id, updates);
    this.notifications.info('تحديث حالة التحليل', `تم تحديث حالة الأمر ${order.orderNumber}.`);
  }

  openResultsModal(order: LabOrder): void {
    this.activeOrderForResults = JSON.parse(JSON.stringify(order));
    // Default values if empty
    this.activeOrderForResults!.items.forEach(i => {
      if (!i.resultValue) i.resultValue = 'طبيعي';
      if (!i.interpretation) i.interpretation = 'normal';
    });
    this.isResultsModalOpen = true;
  }

  onReportUpload(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0] && this.activeOrderForResults) {
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          this.activeOrderForResults!.uploadedReports.push(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  saveAndApproveResults(): void {
    if (!this.activeOrderForResults) return;

    const now = new Date().toISOString();
    this.db.labOrders.update(this.activeOrderForResults.id, {
      items: this.activeOrderForResults.items,
      status: 'ready',
      resultsCompletedAt: now,
      uploadedReports: this.activeOrderForResults.uploadedReports
    });

    // Send Automated Ready Notification
    this.sendReadyAlert(this.activeOrderForResults);

    this.isResultsModalOpen = false;
    this.activeOrderForResults = null;
  }

  sendReadyAlert(order: LabOrder): void {
    const text = this.whatsapp.buildLabReadyMessage(order);
    this.whatsapp.dispatch({
      recipientPhone: order.patientPhone,
      text,
      messageType: 'lab_ready'
    });

    this.notifications.success(
      'تم اعتماد النتائج وإشعار المريض',
      `تم إرسال إشعار جاهزية الفحص للمريض ${order.patientName} عبر واتساب والبريد الإلكتروني.`
    );
  }
}
