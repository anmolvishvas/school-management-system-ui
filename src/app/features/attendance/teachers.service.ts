import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type {
  Teacher,
  TeacherAllocation,
  TeacherAllocationListResponse,
  TeacherTeachingPlan
} from '../../core/models/teachers.models';

@Injectable({ providedIn: 'root' })
export class TeachersService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiBaseUrl}/api/Teachers`;

  getTeachers(activeOnly = true) {
    const params = new HttpParams().set('activeOnly', String(activeOnly));
    return this.http.get<Teacher[]>(this.api, { params });
  }

  createTeacher(body: { userId: number; fullName: string; email?: string; phone?: string; isActive?: boolean }) {
    return this.http.post<Teacher>(this.api, body);
  }

  updateTeacher(id: number, body: Partial<Teacher>) {
    return this.http.put(`${this.api}/${id}`, body);
  }

  deleteTeacher(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }

  getAllocations(q: {
    page: number;
    pageSize: number;
    teacherId?: number;
    subjectId?: number;
    className?: string;
    section?: string;
    activeOnly?: boolean;
  }) {
    let params = new HttpParams().set('page', String(q.page)).set('pageSize', String(q.pageSize));
    if (q.teacherId) params = params.set('teacherId', String(q.teacherId));
    if (q.subjectId) params = params.set('subjectId', String(q.subjectId));
    if (q.className?.trim()) params = params.set('className', q.className.trim());
    if (q.section?.trim()) params = params.set('section', q.section.trim());
    if (q.activeOnly !== undefined) params = params.set('activeOnly', String(q.activeOnly));
    return this.http.get<TeacherAllocationListResponse>(`${this.api}/allocations`, { params });
  }

  createAllocation(body: {
    teacherId: number;
    subjectId: number;
    class?: string;
    section?: string;
    isClassTeacher?: boolean;
    isActive?: boolean;
  }) {
    return this.http.post<TeacherAllocation>(`${this.api}/allocations`, body);
  }

  updateAllocation(id: number, body: Partial<TeacherAllocation>) {
    const payload = {
      teacherId: body.teacherId,
      subjectId: body.subjectId,
      class: body.class ?? body.className,
      section: body.section,
      isClassTeacher: body.isClassTeacher,
      isActive: body.isActive
    };
    return this.http.put(`${this.api}/allocations/${id}`, payload);
  }

  deleteAllocation(id: number) {
    return this.http.delete(`${this.api}/allocations/${id}`);
  }

  getTeachingPlan(teacherId: number, fromDate: string, toDate: string, activeOnly = true) {
    const params = new HttpParams()
      .set('fromDate', fromDate)
      .set('toDate', toDate)
      .set('activeOnly', String(activeOnly));
    return this.http.get<TeacherTeachingPlan>(`${this.api}/${teacherId}/teaching-plan`, { params });
  }
}
