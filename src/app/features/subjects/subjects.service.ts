import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type { Subject } from '../../core/models/subjects.models';

@Injectable({ providedIn: 'root' })
export class SubjectsService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiBaseUrl}/api/Subjects`;

  getSubjects(activeOnly = true) {
    const params = new HttpParams().set('activeOnly', String(activeOnly));
    return this.http.get<Subject[]>(this.api, { params });
  }

  getById(id: number) {
    return this.http.get<Subject>(`${this.api}/${id}`);
  }

  create(body: { name: string; code?: string; isActive?: boolean }) {
    return this.http.post<Subject>(this.api, body);
  }

  update(id: number, body: Partial<Subject>) {
    return this.http.put(`${this.api}/${id}`, body);
  }

  delete(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }
}
