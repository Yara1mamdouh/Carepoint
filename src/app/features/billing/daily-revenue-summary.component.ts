import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDatabaseService } from '../../core/repositories/mock-database.service';
import { Invoice } from '../../core/models/invoice.model';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';
import { CurrencyEgpPipe } from '../../shared/pipes/currency-egp.pipe';
import { MedicalDatePipe } from '../../shared/pipes/medical-date.pipe';
import { PrintableReceiptComponent } from './printable-receipt.component';

@Component({
  selector: 'app-daily-revenue-summary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MetricCardComponent,
    CurrencyEgpPipe,
    MedicalDatePipe,
    PrintableReceiptComponent
  ],
  template: `
    <div class="revenue-summary-container p-3 p-md-4">
      @if (viewingInvoice) {
        <app-printable-receipt
          [invoice]="viewingInvoice"
          (close)="viewingInvoice = null"
        >
        </app-printable-receipt>
      } @else {
        <!-- Header -->
        <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-surface">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div class="d-flex align-items-center gap-3">
              <div class="revenue-icon-box">
                <i class="bi bi-graph-up-arrow text-success"></i>
              </div>
              <div>
                <h4 class="fw-bold mb-0">لوحة الإيرادات والتقارير المالية اليومية</h4>
                <p class="text-muted small mb-0">متابعة المتحصلات النقدية والبنكية، ضرائب القيمة المضافة، ومطالبات التأمين</p>
              </div>
            </div>

            <div class="d-flex gap-2">
              <button class="btn btn-outline-secondary btn-sm" (click)="printDailyReport()">
                <i class="bi bi-printer me-1"></i> طباعة تقرير الوردية
              </button>
            </div>
          </div>
        </div>

        <!-- 4 Key Metric Cards -->
        <div class="row g-3 mb-4">
          <div class="col-sm-6 col-lg-3">
            <app-metric-card
              title="إجمالي المتحصلات اليومية"
              [value]="totalCollectedEgp | currencyEgp"
              icon="bi-cash-coin"
              variant="success"
              subtext="زيادة +12.4% عن يوم أمس"
              trendIcon="bi-arrow-up-right"
              [trendPositive]="true"
            >
            </app-metric-card>
          </div>

          <div class="col-sm-6 col-lg-3">
            <app-metric-card
              title="ضريبة القيمة المضافة (14%)"
              [value]="totalTaxEgp | currencyEgp"
              icon="bi-calculator-fill"
              variant="primary"
              subtext="مستحقة للإقرار الضريبي"
            >
            </app-metric-card>
          </div>

          <div class="col-sm-6 col-lg-3">
            <app-metric-card
              title="عدد الفواتير المصدرة"
              [value]="invoicesList.length"
              unit="فاتورة"
              icon="bi-receipt-cutoff"
              variant="indigo"
              subtext="متوسط الفاتورة: 480 ج.م"
            >
            </app-metric-card>
          </div>

          <div class="col-sm-6 col-lg-3">
            <app-metric-card
              title="مطالبات التأمين الصحي"
              [value]="totalInsuranceClaimsEgp | currencyEgp"
              icon="bi-shield-check"
              variant="warning"
              subtext="جاهزة للإرسال للشركات"
            >
            </app-metric-card>
          </div>
        </div>

        <!-- Department Share & Breakdown -->
        <div class="row g-3 mb-4">
          <div class="col-lg-6">
            <div class="card border-0 shadow-sm rounded-4 p-4 bg-surface h-100">
              <h6 class="fw-bold mb-3 d-flex align-items-center gap-2">
                <i class="bi bi-pie-chart-fill text-primary"></i>
                توزيع الإيراد حسب طريقة الدفع
              </h6>

              <div class="d-flex flex-column gap-3">
                <div>
                  <div class="d-flex justify-content-between small mb-1">
                    <span>بطاقات بنكية وفيزا (Card)</span>
                    <strong class="text-dark">{{ cardRevenue | currencyEgp }} ({{ getCardPercent() }}%)</strong>
                  </div>
                  <div class="progress" style="height: 8px;">
                    <div class="progress-bar bg-primary" [style.width.%]="getCardPercent()"></div>
                  </div>
                </div>

                <div>
                  <div class="d-flex justify-content-between small mb-1">
                    <span>تحصيل نقدي بالخزينة (Cash)</span>
                    <strong class="text-dark">{{ cashRevenue | currencyEgp }} ({{ getCashPercent() }}%)</strong>
                  </div>
                  <div class="progress" style="height: 8px;">
                    <div class="progress-bar bg-success" [style.width.%]="getCashPercent()"></div>
                  </div>
                </div>

                <div>
                  <div class="d-flex justify-content-between small mb-1">
                    <span>تعاقدات وتأمين صحي (Insurance Co-pay)</span>
                    <strong class="text-dark">{{ insuranceRevenue | currencyEgp }} ({{ getInsurancePercent() }}%)</strong>
                  </div>
                  <div class="progress" style="height: 8px;">
                    <div class="progress-bar bg-warning" [style.width.%]="getInsurancePercent()"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-6">
            <div class="card border-0 shadow-sm rounded-4 p-4 bg-surface h-100">
              <h6 class="fw-bold mb-3 d-flex align-items-center gap-2">
                <i class="bi bi-bar-chart-line-fill text-success"></i>
                أعلى الأقسام دخلاً لليوم
              </h6>

              <div class="d-flex flex-column gap-2 small">
                <div class="d-flex align-items-center justify-content-between p-2 rounded bg-light">
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-primary">1</span>
                    <strong>أمراض القلب وقسطرة الأوعية</strong>
                  </div>
                  <span class="fw-bold text-success">2,450 ج.م</span>
                </div>

                <div class="d-flex align-items-center justify-content-between p-2 rounded bg-light">
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-secondary">2</span>
                    <strong>جراحة وتجميل وزراعة الأسنان</strong>
                  </div>
                  <span class="fw-bold text-success">1,800 ج.م</span>
                </div>

                <div class="d-flex align-items-center justify-content-between p-2 rounded bg-light">
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-secondary">3</span>
                    <strong>مختبر التحاليل الطبية الشاملة</strong>
                  </div>
                  <span class="fw-bold text-success">1,470 ج.م</span>
                </div>

                <div class="d-flex align-items-center justify-content-between p-2 rounded bg-light">
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-secondary">4</span>
                    <strong>صيدلية العيادات الداخلية</strong>
                  </div>
                  <span class="fw-bold text-success">1,120 ج.م</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Filterable Invoices Ledger Table -->
        <div class="card border-0 shadow-sm rounded-4 p-4 bg-surface">
          <div class="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
            <h5 class="fw-bold text-dark m-0 d-flex align-items-center gap-2">
              <i class="bi bi-journal-text text-primary"></i>
              سجل الفواتير والحركات المالية (Invoices Ledger)
            </h5>

            <div class="d-flex gap-2">
              <select class="form-select form-select-sm w-auto" [(ngModel)]="paymentFilter">
                <option value="all">جميع طرق الدفع</option>
                <option value="cash">نقدي (Cash)</option>
                <option value="card">فيزا وبطاقات (Card)</option>
                <option value="insurance">تأمين صحي (Insurance)</option>
              </select>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table table-hover align-middle border mb-0">
              <thead class="table-light small text-muted">
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>اسم المريض</th>
                  <th>عدد البنود</th>
                  <th>طريقة الدفع</th>
                  <th>الضريبة 14%</th>
                  <th>المبلغ المحصل</th>
                  <th>الحالة</th>
                  <th>التوقيت</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                @for (inv of filteredInvoices; track inv.id) {
                  <tr>
                    <td><strong class="font-monospace text-primary">{{ inv.invoiceNumber }}</strong></td>
                    <td>
                      <strong class="text-dark d-block">{{ inv.patientName }}</strong>
                      <span class="x-small text-muted dir-ltr">{{ inv.patientPhone }}</span>
                    </td>
                    <td><span class="badge bg-light text-dark border">{{ inv.items.length }} بنود</span></td>
                    <td>
                      <span class="small">
                        @if (inv.paymentMethod === 'card') {
                          <i class="bi bi-credit-card-2-front text-primary me-1"></i> بطاقة
                        } @else if (inv.paymentMethod === 'cash') {
                          <i class="bi bi-cash-stack text-success me-1"></i> نقداً
                        } @else {
                          <i class="bi bi-shield-check text-warning me-1"></i> تأمين
                        }
                      </span>
                    </td>
                    <td class="small text-muted">{{ inv.taxAmountEgp | currencyEgp }}</td>
                    <td class="fw-bold text-success">{{ inv.patientPayableEgp | currencyEgp }}</td>
                    <td><span class="badge bg-success-subtle text-success">مسدد</span></td>
                    <td><span class="small text-muted">{{ inv.issuedAt | medicalDate:'short' }}</span></td>
                    <td>
                      <button class="btn btn-outline-primary btn-sm py-0 px-2" (click)="viewingInvoice = inv">
                        <i class="bi bi-printer me-1"></i> عرض وطباعة
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="9" class="text-center text-muted py-4 small">
                      لا توجد فواتير مسجلة في هذا التصنيف.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .revenue-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: rgba(16, 185, 129, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .x-small { font-size: 0.72rem; }
  `]
})
export class DailyRevenueSummaryComponent implements OnInit {
  private readonly db = inject(MockDatabaseService);

  paymentFilter = 'all';
  viewingInvoice: Invoice | null = null;

  ngOnInit(): void {}

  get invoicesList(): Invoice[] {
    this.db.invoicesVersion();
    return this.db.invoices.getAll();
  }

  get filteredInvoices(): Invoice[] {
    if (this.paymentFilter === 'all') return this.invoicesList;
    return this.invoicesList.filter(i => i.paymentMethod === this.paymentFilter);
  }

  get totalCollectedEgp(): number {
    return this.invoicesList.reduce((sum, i) => sum + i.amountPaidEgp, 0);
  }

  get totalTaxEgp(): number {
    return this.invoicesList.reduce((sum, i) => sum + i.taxAmountEgp, 0);
  }

  get totalInsuranceClaimsEgp(): number {
    return this.invoicesList.reduce((sum, i) => sum + (i.insuranceCoverageAmountEgp || 0), 0);
  }

  get cardRevenue(): number {
    return this.invoicesList
      .filter(i => i.paymentMethod === 'card')
      .reduce((sum, i) => sum + i.amountPaidEgp, 0);
  }

  get cashRevenue(): number {
    return this.invoicesList
      .filter(i => i.paymentMethod === 'cash')
      .reduce((sum, i) => sum + i.amountPaidEgp, 0);
  }

  get insuranceRevenue(): number {
    return this.invoicesList
      .filter(i => i.paymentMethod === 'insurance')
      .reduce((sum, i) => sum + i.amountPaidEgp, 0);
  }

  getCardPercent(): number {
    if (this.totalCollectedEgp === 0) return 0;
    return Math.round((this.cardRevenue / this.totalCollectedEgp) * 100);
  }

  getCashPercent(): number {
    if (this.totalCollectedEgp === 0) return 0;
    return Math.round((this.cashRevenue / this.totalCollectedEgp) * 100);
  }

  getInsurancePercent(): number {
    if (this.totalCollectedEgp === 0) return 0;
    return Math.round((this.insuranceRevenue / this.totalCollectedEgp) * 100);
  }

  printDailyReport(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
