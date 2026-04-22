import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { FeesService } from './fees.service';
import { ToastService } from '../../core/services/toast.service';
import type { FeeRecord } from '../../core/models/fees.models';

@Component({
  selector: 'app-fees',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './fees.component.html',
  styleUrl: './fees.component.css'
})
export class FeesComponent implements OnInit {
  private readonly service = inject(FeesService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly rows = signal<FeeRecord[]>([]);
  readonly total = signal(0);

  readonly filterForm = this.fb.nonNullable.group({
    className: [''],
    section: [''],
    status: [''],
    dueFrom: [''],
    dueTo: ['']
  });

  pageIndex = 0;
  pageSize = 20;
  readonly columns = ['id', 'student', 'classSection', 'amount', 'dueDate', 'paidDate', 'status'];

  ngOnInit(): void {
    this.seedDates();
    this.load();
  }

  private seedDates(): void {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const start = `${y}-${m}-01`;
    const d = String(now.getDate()).padStart(2, '0');
    const end = `${y}-${m}-${d}`;
    this.filterForm.patchValue({ dueFrom: start, dueTo: end });
  }

  load(): void {
    const f = this.filterForm.getRawValue();
    this.loading.set(true);
    this.service
      .getPage({
        page: this.pageIndex + 1,
        pageSize: this.pageSize,
        className: f.className.trim() || undefined,
        section: f.section.trim() || undefined,
        status: f.status.trim() || undefined,
        dueFrom: f.dueFrom || undefined,
        dueTo: f.dueTo || undefined
      })
      .subscribe({
        next: (res) => {
          this.rows.set(res.data ?? []);
          this.total.set(res.total ?? 0);
          this.loading.set(false);
        },
        error: () => {
          this.rows.set([]);
          this.total.set(0);
          this.loading.set(false);
          this.toast.show('Fees API unavailable or forbidden. Confirm GET /api/Fees/invoices.', 'error');
        }
      });
  }

  onPage(e: PageEvent): void {
    const sizeChanged = e.pageSize !== this.pageSize;
    this.pageSize = e.pageSize;
    this.pageIndex = sizeChanged ? 0 : e.pageIndex;
    this.load();
  }

  classSection(row: FeeRecord): string {
    const c = row.className ?? row.class ?? '';
    const s = row.section ?? '';
    if (c && s) return `${c} / ${s}`;
    return c || s || '—';
  }

  amountDisplay(row: FeeRecord): string {
    const v = row.amount ?? row.totalAmount ?? row.amountDue ?? row.amountPaid;
    if (typeof v !== 'number') return '—';
    return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
