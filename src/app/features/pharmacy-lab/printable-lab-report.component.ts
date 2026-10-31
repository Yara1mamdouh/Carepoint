import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabOrder, LabOrderItem } from '../../core/models/lab-test.model';
import { QrCodeComponent } from '../../shared/components/qr-code/qr-code.component';
import { MedicalDatePipe } from '../../shared/pipes/medical-date.pipe';

@Component({
  selector: 'app-printable-lab-report',
  standalone: true,
  imports: [CommonModule, QrCodeComponent, MedicalDatePipe],
  template: `
    @if (order) {
      <div class="printable-report-card p-4 rounded-4 shadow border bg-white mx-auto" id="printable-lab-report">
        <!-- Lab Official Header -->
        <div class="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
          <div class="d-flex align-items-center gap-3">
            <div class="lab-logo-box text-primary">
              <i class="bi bi-eyedropper fs-1"></i>
            </div>
            <div>
              <h4 class="fw-bold mb-0 text-dark">مختبرات كير بوينت التخصصية للتحاليل الطبية</h4>
              <div class="text-muted small">CarePoint Pro Diagnostic & Pathology Laboratories</div>
              <div class="x-small text-muted">شهادة اعتماد الجودة ISO 15189 | ترخيص معملي: 3410/2026</div>
            </div>
          </div>

          <div class="text-end">
            <div class="fw-bold fs-6 text-primary font-monospace">{{ order.orderNumber }}</div>
            <div class="x-small text-muted">{{ order.resultsCompletedAt || order.orderedAt | medicalDate:'short' }}</div>
            <span class="badge bg-success-subtle text-success mt-1">تقرير معتمد ونهائي</span>
          </div>
        </div>

        <!-- Patient Demographics Meta -->
        <div class="row g-2 p-2 px-3 rounded-3 bg-light border mb-3 small">
          <div class="col-md-6">اسم المريض: <strong class="text-dark">{{ order.patientName }}</strong></div>
          <div class="col-md-6">رقم الهاتف: <strong class="text-dark dir-ltr">{{ order.patientPhone }}</strong></div>
          <div class="col-md-6">الطبيب الطالب: <strong class="text-dark">{{ order.doctorName }}</strong></div>
          <div class="col-md-6">تاريخ جمع العينة: <strong class="text-dark">{{ order.sampleCollectedAt || order.orderedAt | medicalDate:'short' }}</strong></div>
        </div>

        <!-- Test Results Table -->
        <div class="table-responsive mb-4">
          <table class="table table-bordered align-middle mb-0">
            <thead class="table-light small text-muted">
              <tr>
                <th style="width: 35%;">اسم الفحص والتحليل (Investigation)</th>
                <th class="text-center" style="width: 20%;">النتيجة المقاسة (Result)</th>
                <th class="text-center" style="width: 15%;">الوحدة (Unit)</th>
                <th style="width: 30%;">المعدل الطبيعي المرجعي (Reference Interval)</th>
              </tr>
            </thead>
            <tbody>
              @for (item of order.items; track item.testId) {
                <tr>
                  <td>
                    <strong class="d-block text-dark">{{ item.testNameAr }}</strong>
                    <span class="x-small text-muted">{{ item.testNameEn }}</span>
                  </td>
                  <td class="text-center font-monospace fs-6">
                    <strong [class]="getResultColorClass(item)">
                      {{ item.resultValue || 'قيد التحليل' }}
                    </strong>
                    @if (item.interpretation === 'high') {
                      <span class="badge bg-warning-subtle text-warning-emphasis ms-1 x-small">مرتفع [H]</span>
                    } @else if (item.interpretation === 'critical') {
                      <span class="badge bg-danger ms-1 x-small">حرج [!]</span>
                    } @else if (item.interpretation === 'low') {
                      <span class="badge bg-info-subtle text-info-emphasis ms-1 x-small">منخفض [L]</span>
                    }
                  </td>
                  <td class="text-center text-muted small font-monospace">{{ item.resultUnit || '-' }}</td>
                  <td class="small text-muted">{{ item.normalRange }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (hasUploadedReports()) {
          <div class="mb-3 d-print-none">
            <div class="fw-bold small mb-2 text-dark">مرفقات وصور الأشعة الممسوحة:</div>
            <div class="d-flex gap-2">
              @for (rep of order.uploadedReports; track $index) {
                <a [href]="rep" target="_blank">
                  <img [src]="rep" class="rounded border" style="width: 70px; height: 70px; object-fit: cover;" />
                </a>
              }
            </div>
          </div>
        }

        <!-- Technician & Quality Assurance Footer -->
        <div class="d-flex align-items-center justify-content-between pt-3 border-top mt-4">
          <app-qr-code [value]="getReportQrPayload()" [size]="85" caption="تقرير معتمد"></app-qr-code>

          <div class="text-center small text-muted">
            <div class="p-2 border rounded bg-light mb-1 font-monospace x-small">
              ELECTRONICALLY VERIFIED LABORATORY REPORT
            </div>
            <div>نتمنى لكم دوام الصحة والعافية</div>
          </div>

          <div class="text-end small text-muted">
            <div class="signature-line border-bottom pb-1 mb-1 fw-bold text-dark" style="min-width: 140px;">
              د. رامي شفيق العشماوي
            </div>
            <div>استشاري التحاليل الطبية والباثولوجيا الإكلينيكية</div>
          </div>
        </div>

        <!-- Print Actions (Hidden when printing) -->
        <div class="d-print-none mt-4 pt-3 border-top d-flex justify-content-between">
          <button class="btn btn-outline-secondary btn-sm" (click)="close.emit()">إغلاق</button>
          <button class="btn btn-primary btn-sm fw-bold px-4" (click)="printReport()">
            <i class="bi bi-printer me-1"></i> طباعة التقرير الطبي
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .printable-report-card {
      max-width: 800px;
    }
    .x-small { font-size: 0.72rem; }
    .lab-logo-box {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    @media print {
      body * {
        visibility: hidden;
      }
      #printable-lab-report, #printable-lab-report * {
        visibility: visible;
      }
      #printable-lab-report {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        max-width: 100% !important;
        box-shadow: none !important;
        border: none !important;
      }
    }
  `]
})
export class PrintableLabReportComponent {
  @Input() order: LabOrder | null = null;
  @Output() close = new EventEmitter<void>();

  getResultColorClass(item: LabOrderItem): string {
    if (item.interpretation === 'critical') return 'text-danger';
    if (item.interpretation === 'high') return 'text-warning-emphasis';
    if (item.interpretation === 'low') return 'text-info';
    return 'text-success';
  }

  hasUploadedReports(): boolean {
    return !!(this.order && this.order.uploadedReports && this.order.uploadedReports.length > 0);
  }

  getReportQrPayload(): string {
    if (!this.order) return '';
    return JSON.stringify({
      order: this.order.orderNumber,
      pt: this.order.patientName,
      status: this.order.status,
      date: this.order.resultsCompletedAt || this.order.orderedAt
    });
  }

  printReport(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
