import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Chart from 'chart.js/auto';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DashboardService } from './dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import type { DashboardKpis } from '../../core/models/dashboard.models';
import type { StudentStats } from '../../core/models/student.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatProgressSpinnerModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  private readonly service = inject(DashboardService);
  private readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly kpis = signal<DashboardKpis | null>(null);
  readonly stats = signal<StudentStats | null>(null);
  readonly statsMessage = signal<string | null>(null);

  @ViewChild('classChart') private classChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('sectionChart') private sectionChart?: ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];

  ngAfterViewInit(): void {
    const stats$ = this.auth.isAdmin()
      ? this.service.getStudentStats().pipe(
          catchError((err) => {
            if (err.status === 403) {
              this.statsMessage.set('Class and section breakdown is available to administrators.');
            } else {
              this.statsMessage.set('Could not load student distribution charts.');
            }
            return of(null);
          })
        )
      : of(null);

    forkJoin({
      kpis: this.service.getKpis().pipe(catchError(() => of(null))),
      stats: stats$
    }).subscribe({
      next: ({ kpis, stats }) => {
        if (!kpis) {
          this.statsMessage.set('Unable to load dashboard KPIs. Is the API running?');
        } else {
          this.kpis.set(kpis);
        }
        this.stats.set(stats);
        this.loading.set(false);
        setTimeout(() => this.renderCharts(stats), 0);
      },
      error: () => {
        this.loading.set(false);
        this.statsMessage.set('Unable to load dashboard data. Is the API running?');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return `${value.toFixed(1)}%`;
  }

  formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR' }).format(value);
  }

  private destroyCharts(): void {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];
  }

  private renderCharts(stats: StudentStats | null): void {
    this.destroyCharts();
    if (!stats) return;

    const classEl = this.classChart?.nativeElement;
    const sectionEl = this.sectionChart?.nativeElement;
    if (classEl && stats.byClass?.length) {
      this.charts.push(
        new Chart(classEl, {
          type: 'bar',
          data: {
            labels: stats.byClass.map((d) => d.label),
            datasets: [
              {
                label: 'Students',
                data: stats.byClass.map((d) => d.count),
                backgroundColor: '#3949ab'
              }
            ]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } }
          }
        })
      );
    }
    if (sectionEl && stats.bySection?.length) {
      this.charts.push(
        new Chart(sectionEl, {
          type: 'bar',
          data: {
            labels: stats.bySection.map((d) => d.label),
            datasets: [
              {
                label: 'Students',
                data: stats.bySection.map((d) => d.count),
                backgroundColor: '#00897b'
              }
            ]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } }
          }
        })
      );
    }
  }
}
