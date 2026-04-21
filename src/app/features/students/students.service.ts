import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type { PagedStudents, StudentUpsert } from '../../core/models/student.models';

export interface StudentQuery {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  className?: string;
  section?: string;
  activeOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class StudentsService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiBaseUrl}/api/Students`;

  getPage(q: StudentQuery) {
    let params = new HttpParams()
      .set('page', String(q.page))
      .set('pageSize', String(q.pageSize))
      .set('sortBy', q.sortBy ?? 'id')
      .set('order', q.order ?? 'asc');

    if (q.search?.trim()) params = params.set('search', q.search.trim());
    if (q.className?.trim()) params = params.set('className', q.className.trim());
    if (q.section?.trim()) params = params.set('section', q.section.trim());
    if (q.activeOnly === true) params = params.set('activeOnly', 'true');

    return this.http.get<PagedStudents>(this.api, { params });
  }

  add(student: StudentUpsert) {
    return this.http.post(this.api, student);
  }

  delete(id: number) {
    return this.http.delete(`${this.api}/${id}`, { responseType: 'text' });
  }

  update(id: number, student: StudentUpsert) {
    return this.http.put(`${this.api}/${id}`, student, { responseType: 'text' });
  }
}
