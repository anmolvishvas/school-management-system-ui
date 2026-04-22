import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type { FeeRecord, FeesPagedResponse, FeeSummary } from '../../core/models/fees.models';

export interface FeesQuery {
  page: number;
  pageSize: number;
  studentId?: number;
  className?: string;
  section?: string;
  status?: string;
  dueFrom?: string;
  dueTo?: string;
}

/**
 * Fees API:
 * GET /api/Fees/invoices?page=&pageSize=&studentId=&status=&className=&section=&dueFrom=&dueTo=
 * GET /api/Fees/reports/summary?from=&to=&className=&section=
 * plus CRUD/payments on /api/Fees/invoices/...
 */
@Injectable({ providedIn: 'root' })
export class FeesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/Fees`;

  getPage(q: FeesQuery): Observable<FeesPagedResponse> {
    let params = new HttpParams().set('page', String(q.page)).set('pageSize', String(q.pageSize));
    if (q.studentId != null && q.studentId > 0) params = params.set('studentId', String(q.studentId));
    if (q.className?.trim()) params = params.set('className', q.className.trim());
    if (q.section?.trim()) params = params.set('section', q.section.trim());
    if (q.status?.trim()) params = params.set('status', q.status.trim());
    if (q.dueFrom) params = params.set('dueFrom', q.dueFrom);
    if (q.dueTo) params = params.set('dueTo', q.dueTo);
    return this.http.get<unknown>(`${this.base}/invoices`, { params }).pipe(map((res) => this.normalizeInvoicesPaged(res)));
  }

  getSummary(from: string, to: string, className = '', section = ''): Observable<FeeSummary | null> {
    let params = new HttpParams().set('from', from).set('to', to);
    if (className.trim()) params = params.set('className', className.trim());
    if (section.trim()) params = params.set('section', section.trim());
    return this.http
      .get<FeeSummary>(`${this.base}/reports/summary`, { params })
      .pipe(catchError(() => of(null)));
  }

  getInvoiceById(id: number): Observable<FeeRecord> {
    return this.http.get<FeeRecord>(`${this.base}/invoices/${id}`);
  }

  private normalizeInvoicesPaged(res: unknown): FeesPagedResponse {
    if (Array.isArray(res)) {
      return { data: res as FeeRecord[], total: res.length };
    }
    if (res && typeof res === 'object') {
      const o = res as Record<string, unknown>;
      const raw = o['data'] ?? o['items'];
      const data = (Array.isArray(raw) ? raw : []) as FeeRecord[];
      const total =
        typeof o['total'] === 'number'
          ? (o['total'] as number)
          : typeof o['totalCount'] === 'number'
            ? (o['totalCount'] as number)
            : data.length;
      return { data, total };
    }
    return { data: [], total: 0 };
  }
}
