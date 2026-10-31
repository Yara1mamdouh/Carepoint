import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card data-table-card border-0 shadow-sm">
      <!-- Toolbar -->
      <div class="card-header bg-transparent border-bottom p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div class="d-flex align-items-center gap-2">
          @if (title) {
            <h6 class="mb-0 fw-bold">{{ title }}</h6>
          }
          @if (badgeText) {
            <span class="badge bg-primary-subtle text-primary rounded-pill">{{ badgeText }}</span>
          }
        </div>

        <div class="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0 justify-content-end">
          @if (showSearch) {
            <div class="input-group input-group-sm search-group">
              <span class="input-group-text bg-transparent border-end-0">
                <i class="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                class="form-control border-start-0"
                [placeholder]="searchPlaceholder"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange($event)"
              />
              @if (searchQuery) {
                <button class="btn btn-outline-secondary border-start-0" (click)="clearSearch()">
                  <i class="bi bi-x"></i>
                </button>
              }
            </div>
          }
          <ng-content select="[actions]"></ng-content>
        </div>
      </div>

      <!-- Table Content -->
      <div class="table-responsive">
        <ng-content select="table"></ng-content>
      </div>

      <!-- Footer / Pagination -->
      @if (showFooter) {
        <div class="card-footer bg-transparent border-top p-3 d-flex align-items-center justify-content-between text-muted small">
          <div>
            <span>إجمالي السجلات: <strong>{{ totalItems }}</strong></span>
          </div>
          <ng-content select="[pagination]"></ng-content>
        </div>
      }
    </div>
  `,
  styles: [`
    .data-table-card {
      background: var(--cp-surface, #ffffff);
      border-radius: 16px;
      overflow: hidden;
    }
    .search-group {
      max-width: 260px;
    }
    .search-group .form-control:focus {
      box-shadow: none;
      border-color: #0ea5e9;
    }
  `]
})
export class DataTableComponent {
  @Input() title = '';
  @Input() badgeText?: string;
  @Input() showSearch = true;
  @Input() searchPlaceholder = 'بحث سريع...';
  @Input() totalItems = 0;
  @Input() showFooter = true;

  @Output() search = new EventEmitter<string>();

  searchQuery = '';

  onSearchChange(val: string): void {
    this.search.emit(val);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.search.emit('');
  }
}
