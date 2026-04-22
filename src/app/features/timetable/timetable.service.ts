import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type {
  TimetableBulkWeeklyRequest,
  TimetableEntry,
  TimetablePagedResponse,
  TimetableQuery,
  TimetableUpsertRequest
} from '../../core/models/timetable.models';

@Injectable({ providedIn: 'root' })
export class TimetableService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiBaseUrl}/api/Timetable`;

  getPage(q: TimetableQuery) {
    let params = new HttpParams().set('page', String(q.page)).set('pageSize', String(q.pageSize));
    if (q.className?.trim()) params = params.set('className', q.className.trim());
    if (q.section?.trim()) params = params.set('section', q.section.trim());
    if (q.dayOfWeek) params = params.set('dayOfWeek', q.dayOfWeek);
    if (q.teacherId) params = params.set('teacherId', String(q.teacherId));
    if (q.activeOnly !== undefined) params = params.set('activeOnly', String(q.activeOnly));
    return this.http.get<TimetablePagedResponse>(this.api, { params });
  }

  getById(id: number) {
    return this.http.get<TimetableEntry>(`${this.api}/${id}`);
  }

  getByClassSection(className: string, section: string, activeOnly = true) {
    const params = new HttpParams()
      .set('className', className)
      .set('section', section)
      .set('activeOnly', String(activeOnly));
    return this.http.get<TimetableEntry[]>(`${this.api}/class-section`, { params });
  }

  create(body: TimetableUpsertRequest) {
    return this.http.post<TimetableEntry>(this.api, body);
  }

  bulkWeekly(body: TimetableBulkWeeklyRequest) {
    return this.http.post(`${this.api}/bulk-weekly`, body);
  }

  update(id: number, body: TimetableUpsertRequest) {
    return this.http.put(`${this.api}/${id}`, body);
  }

  delete(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }
}
