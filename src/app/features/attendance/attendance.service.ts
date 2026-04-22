import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type {
  AttendanceBulkDayRequest,
  AttendanceListQuery,
  AttendancePagedResponse,
  AttendanceRecord,
  AttendanceStatus,
  AttendanceSummary
} from '../../core/models/attendance.models';
import type { Student } from '../../core/models/student.models';
import { StudentsService } from '../students/students.service';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly http = inject(HttpClient);
  private readonly students = inject(StudentsService);
  private readonly api = `${environment.apiBaseUrl}/api/Attendance`;

  getList(q: AttendanceListQuery): Observable<AttendancePagedResponse> {
    let params = new HttpParams()
      .set('page', String(q.page))
      .set('pageSize', String(q.pageSize))
      .set('sortBy', q.sortBy ?? 'date')
      .set('order', q.order ?? 'desc');
    if (q.studentId) params = params.set('studentId', String(q.studentId));
    if (q.className?.trim()) params = params.set('className', q.className.trim());
    if (q.section?.trim()) params = params.set('section', q.section.trim());
    if (q.dateFrom) params = params.set('dateFrom', q.dateFrom);
    if (q.dateTo) params = params.set('dateTo', q.dateTo);
    return this.http.get<AttendancePagedResponse>(this.api, { params });
  }

  getById(id: number) {
    return this.http.get<AttendanceRecord>(`${this.api}/${id}`);
  }

  markSingle(body: {
    studentId: number;
    date: string;
    class: string;
    section: string;
    status: AttendanceStatus;
    notes?: string;
  }) {
    return this.http.post(this.api, body);
  }

  updateRow(id: number, body: { status: AttendanceStatus; notes?: string }) {
    return this.http.put(`${this.api}/${id}`, body);
  }

  deleteRow(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }

  getSummary(from: string, to: string, className = '', section = ''): Observable<AttendanceSummary | null> {
    let params = new HttpParams().set('from', from).set('to', to);
    if (className.trim()) params = params.set('className', className.trim());
    if (section.trim()) params = params.set('section', section.trim());
    return this.http.get<AttendanceSummary>(`${this.api}/summary`, { params }).pipe(catchError(() => of(null)));
  }

  getDailySheet(date: string, className = '', section = ''): Observable<AttendanceRecord[]> {
    return this.getList({
      page: 1,
      pageSize: 1000,
      className: className || undefined,
      section: section || undefined,
      dateFrom: date,
      dateTo: date,
      sortBy: 'studentId',
      order: 'asc'
    }).pipe(
      map((res) => res.data ?? []),
      catchError(() =>
        this.students
          .getPage({
            page: 1,
            pageSize: 1000,
            sortBy: 'name',
            order: 'asc',
            className: className || undefined,
            section: section || undefined,
            activeOnly: true
          })
          .pipe(
            map((res) =>
              (res.data ?? []).map(
                (s: Student): AttendanceRecord => ({
                  id: 0,
                  studentId: s.id,
                  studentName: s.name,
                  className: (s.class ?? s.className ?? '').toString(),
                  section: s.section ?? '',
                  date,
                  status: 'Present',
                  notes: ''
                })
              )
            )
          )
      )
    );
  }

  upsertBulkDay(payload: AttendanceBulkDayRequest) {
    return this.http.post(`${this.api}/bulk-day`, payload);
  }
}
