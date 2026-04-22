import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type {
  AttendancePagedResponse,
  PeriodAttendanceBulkMarkRequest,
  PeriodAttendanceListQuery,
  PeriodAttendanceRecord
} from '../../core/models/attendance.models';

@Injectable({ providedIn: 'root' })
export class PeriodAttendanceService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiBaseUrl}/api/PeriodAttendance`;

  getList(q: PeriodAttendanceListQuery) {
    let params = new HttpParams().set('page', String(q.page)).set('pageSize', String(q.pageSize));
    if (q.studentId) params = params.set('studentId', String(q.studentId));
    if (q.subjectId) params = params.set('subjectId', String(q.subjectId));
    if (q.className?.trim()) params = params.set('className', q.className.trim());
    if (q.section?.trim()) params = params.set('section', q.section.trim());
    if (q.dateFrom) params = params.set('dateFrom', q.dateFrom);
    if (q.dateTo) params = params.set('dateTo', q.dateTo);
    if (q.hourNumber) params = params.set('hourNumber', String(q.hourNumber));
    return this.http.get<AttendancePagedResponse & { data: PeriodAttendanceRecord[] }>(this.api, { params });
  }

  bulkMark(body: PeriodAttendanceBulkMarkRequest) {
    return this.http.post(`${this.api}/bulk-mark`, body);
  }
}
