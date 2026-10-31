import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmrService, PatientTimelineEvent } from '../../services/emr.service';
import { Patient } from '../../core/models/patient.model';
import { MedicalDatePipe } from '../../shared/pipes/medical-date.pipe';

@Component({
  selector: 'app-emr-timeline',
  standalone: true,
  imports: [CommonModule, MedicalDatePipe],
  template: `
    <div class="emr-timeline-container">
      @if (patient) {
        <!-- Patient Summary Card Header -->
        <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-surface">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div class="d-flex align-items-center gap-3">
              <div class="patient-avatar-circle">
                <i class="bi bi-person-fill text-primary"></i>
              </div>
              <div>
                <div class="d-flex align-items-center gap-2">
                  <h5 class="fw-bold mb-0 text-dark">{{ patient.fullName }}</h5>
                  <span class="badge bg-primary-subtle text-primary font-monospace">{{ patient.fileNumber }}</span>
                </div>
                <div class="text-muted small mt-1">
                  <span>{{ patient.gender === 'male' ? 'ذكر' : 'أنثى' }}</span>
                  <span class="mx-1">•</span>
                  <span>فصيلة الدم: <strong class="text-danger">{{ patient.bloodGroup }}</strong></span>
                  <span class="mx-1">•</span>
                  <span>الهاتف: <strong class="dir-ltr text-dark">{{ patient.phone }}</strong></span>
                </div>
              </div>
            </div>

            <!-- Health Flags (Allergies & Chronic) -->
            <div class="d-flex flex-wrap gap-1 align-items-center">
              @if (patient.allergies.length > 0) {
                @for (allergy of patient.allergies; track allergy) {
                  <span class="badge bg-danger-subtle text-danger border border-danger border-opacity-25">
                    <i class="bi bi-shield-slash-fill me-1"></i>حساسية: {{ allergy }}
                  </span>
                }
              } @else {
                <span class="badge bg-success-subtle text-success">لا توجد حساسيات دوائية مسجلة</span>
              }

              @for (chronic of patient.chronicDiseases; track chronic) {
                <span class="badge bg-warning-subtle text-warning-emphasis border border-warning border-opacity-25">
                  <i class="bi bi-heart-pulse me-1"></i>{{ chronic }}
                </span>
              }
            </div>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h6 class="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            <i class="bi bi-clock-history text-primary"></i>
            السجل الطبي الزمني (Longitudinal Timeline)
          </h6>

          <div class="btn-group btn-group-sm" role="group">
            <button
              type="button"
              class="btn"
              [class.btn-primary]="activeFilter === 'all'"
              [class.btn-light]="activeFilter !== 'all'"
              (click)="activeFilter = 'all'"
            >
              الكل
            </button>
            <button
              type="button"
              class="btn"
              [class.btn-primary]="activeFilter === 'appointment'"
              [class.btn-light]="activeFilter !== 'appointment'"
              (click)="activeFilter = 'appointment'"
            >
              الكشوفات
            </button>
            <button
              type="button"
              class="btn"
              [class.btn-primary]="activeFilter === 'prescription'"
              [class.btn-light]="activeFilter !== 'prescription'"
              (click)="activeFilter = 'prescription'"
            >
              الروشتات
            </button>
            <button
              type="button"
              class="btn"
              [class.btn-primary]="activeFilter === 'lab_result'"
              [class.btn-light]="activeFilter !== 'lab_result'"
              (click)="activeFilter = 'lab_result'"
            >
              المختبر
            </button>
            <button
              type="button"
              class="btn"
              [class.btn-primary]="activeFilter === 'vitals'"
              [class.btn-light]="activeFilter !== 'vitals'"
              (click)="activeFilter = 'vitals'"
            >
              العلامات الحيوية
            </button>
          </div>
        </div>

        <!-- Timeline Events -->
        <div class="timeline-wrapper position-relative ps-4 pe-2">
          <div class="timeline-line"></div>

          @for (event of filteredEvents; track event.id) {
            <div class="timeline-item mb-4 position-relative">
              <!-- Node Icon -->
              <div class="timeline-node" [class]="event.badgeClass">
                <i [class]="'bi ' + event.icon"></i>
              </div>

              <!-- Event Card -->
              <div class="card border-0 shadow-sm rounded-4 p-3 bg-surface ms-2">
                <div class="d-flex align-items-start justify-content-between mb-2">
                  <div>
                    <span [class]="'badge me-2 ' + event.badgeClass">{{ event.typeLabelAr }}</span>
                    <strong class="text-dark">{{ event.title }}</strong>
                  </div>
                  <small class="text-muted">{{ event.date | medicalDate:'short' }}</small>
                </div>

                <p class="text-muted small mb-0">{{ event.description }}</p>

                @if (event.doctorName) {
                  <div class="mt-2 pt-2 border-top x-small text-muted d-flex justify-content-between">
                    <span>الطبيب: <strong>{{ event.doctorName }}</strong></span>
                    @if (event.departmentName) {
                      <span>العيادة: {{ event.departmentName }}</span>
                    }
                  </div>
                }
              </div>
            </div>
          } @empty {
            <div class="text-center text-muted py-5">
              <i class="bi bi-folder2-open fs-2 d-block mb-2 opacity-50"></i>
              لا توجد سجلات طبية سابقة لهذا المريض في التصنيف المختار
            </div>
          }
        </div>
      } @else {
        <div class="alert alert-info text-center py-4 rounded-4">
          <i class="bi bi-info-circle fs-3 d-block mb-2"></i>
          يرجى تحديد مريض لاستعراض السجل الطبي الشامل.
        </div>
      }
    </div>
  `,
  styles: [`
    .patient-avatar-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(14, 165, 233, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .timeline-wrapper {
      margin-top: 1rem;
    }
    .timeline-line {
      position: absolute;
      top: 10px;
      bottom: 10px;
      right: 18px;
      width: 2px;
      background: var(--cp-border, #e2e8f0);
    }
    .timeline-item {
      padding-right: 28px;
    }
    .timeline-node {
      position: absolute;
      right: 4px;
      top: 12px;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      border: 3px solid var(--cp-surface, #ffffff);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 2;
    }
    .x-small { font-size: 0.72rem; }
  `]
})
export class EmrTimelineComponent implements OnChanges {
  @Input() patient: Patient | null = null;

  private readonly emrService = inject(EmrService);

  events: PatientTimelineEvent[] = [];
  activeFilter: 'all' | 'appointment' | 'prescription' | 'lab_result' | 'vitals' = 'all';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patient'] && this.patient) {
      this.loadTimeline();
    }
  }

  loadTimeline(): void {
    if (!this.patient) return;
    this.events = this.emrService.getPatientTimeline(this.patient.id);
  }

  get filteredEvents(): PatientTimelineEvent[] {
    if (this.activeFilter === 'all') return this.events;
    return this.events.filter(e => e.type === this.activeFilter);
  }
}
