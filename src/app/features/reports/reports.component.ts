import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { DashboardService } from '../dashboard/dashboard.service';
import { AttendanceService } from '../attendance/attendance.service';
import { FeesService } from '../fees/fees.service';
import { AuthService } from '../../core/services/auth.service';
import type { DashboardKpis } from '../../core/models/dashboard.models';
import type { StudentStats } from '../../core/models/student.models';
import type { AttendanceSummary } from '../../core/models/attendance.models';
import type { FeeSummary } from '../../core/models/fees.models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  private readonly dashboard = inject(DashboardService);
  private readonly attendance = inject(AttendanceService);
  private readonly fees = inject(FeesService);
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly kpis = signal<DashboardKpis | null>(null);
  readonly studentStats = signal<StudentStats | null>(null);
  readonly attendanceSummary = signal<AttendanceSummary | null>(null);
  readonly feeSummary = signal<FeeSummary | null>(null);

  readonly filterForm = this.fb.nonNullable.group({
    from: [this.monthStartISO()],
    to: [this.todayISO()],
    className: [''],
    section: ['']
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const f = this.filterForm.getRawValue();
    const from = f.from;
    const to = f.to;
    const className = f.className.trim();
    const section = f.section.trim();
    this.loading.set(true);

    forkJoin({
      kpis: this.dashboard.getKpis().pipe(catchError(() => of(null))),
      stats: this.dashboard.getStudentStats().pipe(catchError(() => of(null))),
      attendance: this.attendance.getSummary(from, to, className, section),
      fees: this.fees.getSummary(from, to, className, section)
    }).subscribe({
      next: ({ kpis, stats, attendance, fees }) => {
        this.kpis.set(kpis);
        this.studentStats.set(stats);
        this.attendanceSummary.set(attendance);
        this.feeSummary.set(fees);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private todayISO(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private monthStartISO(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  }
}
