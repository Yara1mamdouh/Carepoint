import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invoice } from '../../core/models/invoice.model';
import { QrCodeComponent } from '../../shared/components/qr-code/qr-code.component';
import { CurrencyEgpPipe } from '../../shared/pipes/currency-egp.pipe';
import { MedicalDatePipe } from '../../shared/pipes/medical-date.pipe';

@Component({
  selector: 'app-printable-receipt',
  standalone: true,
  imports: [CommonModule, QrCodeComponent, CurrencyEgpPipe, MedicalDatePipe],
  template: `
    @if (invoice) {
      <div class="printable-receipt-card p-4 rounded-4 shadow border bg-white mx-auto" id="printable-receipt-area">
        <!-- Clinic Official Fiscal Header -->
        <div class="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
          <div class="d-flex align-items-center gap-3">
            <div class="receipt-brand-icon text-primary">
              <i class="bi bi-hospital fs-1"></i>
            </div>
            <div>
              <h5 class="fw-bold mb-0 text-dark">مجمع كير بوينت الطبي التخصصي</h5>
              <div class="small text-muted">فاتورة ضريبية مبسطة (Simplified Tax Invoice)</div>
              <div class="x-small text-muted">السجل التجاري: 104928 | البطاقة الضريبية: 492-381-902</div>
            </div>
          </div>

          <div class="text-end">
            <div class="fw-bold fs-6 text-primary font-monospace">{{ invoice.invoiceNumber }}</div>
            <div class="x-small text-muted">{{ invoice.issuedAt | medicalDate:'short' }}</div>
            <span class="badge bg-success-subtle text-success mt-1">
              {{ invoice.paymentStatus === 'paid' ? 'مسدد بالكامل' : 'معلق السداد' }}
            </span>
          </div>
        </div>

        <!-- Meta Grid -->
        <div class="row g-2 p-2 rounded-3 bg-light border mb-3 small">
          <div class="col-6">
            <span class="text-muted">العميل / المريض:</span>
            <strong class="text-dark ms-1">{{ invoice.patientName }}</strong>
          </div>
          <div class="col-6">
            <span class="text-muted">الهاتف:</span>
            <strong class="text-dark ms-1 dir-ltr">{{ invoice.patientPhone }}</strong>
          </div>
          @if (invoice.doctorName) {
            <div class="col-6">
              <span class="text-muted">الطبيب المشرف:</span>
              <strong class="text-dark ms-1">{{ invoice.doctorName }}</strong>
            </div>
          }
          <div class="col-6">
            <span class="text-muted">طريقة الدفع:</span>
            <strong class="text-dark ms-1">
              {{ invoice.paymentMethod === 'cash' ? 'نقداً (Cash)' : invoice.paymentMethod === 'card' ? 'بطاقة بنكية (Card)' : 'تأمين طبي (Insurance)' }}
            </strong>
          </div>
          @if (invoice.insuranceDetails) {
            <div class="col-12 border-top pt-1 text-primary">
              <i class="bi bi-shield-check me-1"></i>
              شركة التأمين: <strong>{{ invoice.insuranceDetails.companyName }}</strong>
              (نسبة التغطية: {{ invoice.insuranceDetails.coveragePercentage }}%)
            </div>
          }
        </div>

        <!-- Itemized Table -->
        <div class="table-responsive mb-3">
          <table class="table table-sm align-middle border mb-0">
            <thead class="table-light x-small text-muted">
              <tr>
                <th>البند والبيان</th>
                <th>التصنيف</th>
                <th class="text-center">الكمية</th>
                <th class="text-end">سعر الوحدة</th>
                <th class="text-end">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              @for (item of invoice.items; track item.id) {
                <tr class="small">
                  <td><strong class="text-dark">{{ item.description }}</strong></td>
                  <td><span class="badge bg-light text-dark border x-small">{{ item.categoryArabic }}</span></td>
                  <td class="text-center font-monospace">{{ item.quantity }}</td>
                  <td class="text-end text-muted">{{ item.unitPriceEgp | currencyEgp }}</td>
                  <td class="text-end fw-bold text-dark">{{ item.totalPriceEgp | currencyEgp }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Financial Breakdown -->
        <div class="row justify-content-end mb-4">
          <div class="col-md-7">
            <div class="p-3 rounded-3 bg-light border small">
              <div class="d-flex justify-content-between mb-1">
                <span class="text-muted">المجموع الفرعي (Subtotal):</span>
                <strong class="text-dark">{{ invoice.subtotalEgp | currencyEgp }}</strong>
              </div>

              @if (invoice.discountAmountEgp > 0) {
                <div class="d-flex justify-content-between mb-1 text-danger">
                  <span>الخصم المطبق ({{ invoice.discountCode }}):</span>
                  <strong>- {{ invoice.discountAmountEgp | currencyEgp }}</strong>
                </div>
              }

              <div class="d-flex justify-content-between mb-1">
                <span class="text-muted">ضريبة القيمة المضافة (14% VAT):</span>
                <strong class="text-dark">+ {{ invoice.taxAmountEgp | currencyEgp }}</strong>
              </div>

              @if (invoice.insuranceCoverageAmountEgp > 0) {
                <div class="d-flex justify-content-between mb-1 text-primary">
                  <span>تحمل شركة التأمين:</span>
                  <strong>- {{ invoice.insuranceCoverageAmountEgp | currencyEgp }}</strong>
                </div>
              }

              <div class="d-flex justify-content-between border-top pt-2 mt-2 fs-6 fw-bold">
                <span class="text-dark">المبلغ المستحق على المريض:</span>
                <span class="text-success">{{ invoice.patientPayableEgp | currencyEgp }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer with QR & Stamp -->
        <div class="d-flex align-items-center justify-content-between pt-3 border-top">
          <app-qr-code [value]="invoice.qrPayload" [size]="85" caption="فاتورة إلكترونية"></app-qr-code>

          <div class="text-center small text-muted">
            <div class="p-2 border rounded bg-light mb-1 font-monospace x-small">
              CONFIRMED FISCAL RECEIPT
            </div>
            <div>شكراً لثقتكم بمجمع كير بوينت الطبي</div>
          </div>

          <div class="text-end small text-muted">
            <div class="signature-line border-bottom pb-1 mb-1 fw-bold text-dark" style="min-width: 120px;">
              أمين الخزينة
            </div>
            <div>التوقيع المعتمد</div>
          </div>
        </div>

        <!-- Print Actions (Hidden when printing) -->
        <div class="d-print-none mt-4 pt-3 border-top d-flex justify-content-between">
          <button class="btn btn-outline-secondary btn-sm" (click)="close.emit()">إغلاق</button>
          <button class="btn btn-primary btn-sm fw-bold px-4" (click)="print()">
            <i class="bi bi-printer me-1"></i> طباعة الإيصال المالي
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .printable-receipt-card {
      max-width: 680px;
    }
    .x-small { font-size: 0.72rem; }

    @media print {
      body * {
        visibility: hidden;
      }
      #printable-receipt-area, #printable-receipt-area * {
        visibility: visible;
      }
      #printable-receipt-area {
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
export class PrintableReceiptComponent {
  @Input() invoice: Invoice | null = null;
  @Output() close = new EventEmitter<void>();

  print(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
