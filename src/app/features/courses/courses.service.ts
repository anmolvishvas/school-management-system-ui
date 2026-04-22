import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type {
  Course,
  CourseSection,
  CoursesPagedResponse,
  CourseSubject
} from '../../core/models/courses.models';

@Injectable({ providedIn: 'root' })
export class CoursesService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiBaseUrl}/api/Courses`;

  getCourses(q: { page: number; pageSize: number; search?: string; activeOnly?: boolean }) {
    let params = new HttpParams().set('page', String(q.page)).set('pageSize', String(q.pageSize));
    if (q.search?.trim()) params = params.set('search', q.search.trim());
    if (q.activeOnly !== undefined) params = params.set('activeOnly', String(q.activeOnly));
    return this.http.get<CoursesPagedResponse>(this.api, { params });
  }

  getCourseById(id: number) {
    return this.http.get<Course>(`${this.api}/${id}`);
  }

  createCourse(body: { name: string; code?: string; isActive?: boolean }) {
    return this.http.post<Course>(this.api, body);
  }

  updateCourse(id: number, body: Partial<Course>) {
    return this.http.put(`${this.api}/${id}`, body);
  }

  deleteCourse(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }

  getSections(courseId: number, activeOnly = true) {
    const params = new HttpParams().set('activeOnly', String(activeOnly));
    return this.http.get<CourseSection[]>(`${this.api}/${courseId}/sections`, { params });
  }

  createSection(courseId: number, body: { section: string; isActive?: boolean }) {
    return this.http.post<CourseSection>(`${this.api}/${courseId}/sections`, body);
  }

  updateSection(sectionId: number, body: Partial<CourseSection>) {
    return this.http.put(`${this.api}/sections/${sectionId}`, body);
  }

  deleteSection(sectionId: number) {
    return this.http.delete(`${this.api}/sections/${sectionId}`);
  }

  getSubjects(courseId: number, activeOnly = true) {
    const params = new HttpParams().set('activeOnly', String(activeOnly));
    return this.http.get<CourseSubject[]>(`${this.api}/${courseId}/subjects`, { params });
  }

  createSubjectMapping(courseId: number, body: { subjectId: number; isActive?: boolean }) {
    return this.http.post<CourseSubject>(`${this.api}/${courseId}/subjects`, body);
  }

  updateSubjectMapping(id: number, body: Partial<CourseSubject>) {
    return this.http.put(`${this.api}/subjects/${id}`, body);
  }

  deleteSubjectMapping(id: number) {
    return this.http.delete(`${this.api}/subjects/${id}`);
  }
}
