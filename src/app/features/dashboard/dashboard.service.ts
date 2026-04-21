import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import type { DashboardKpis } from '../../core/models/dashboard.models';
import type { StudentStats } from '../../core/models/student.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly base = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getKpis() {
    return this.http.get<DashboardKpis>(`${this.base}/api/Dashboard/kpis`);
  }

  /** Admin-only in API; callers should handle 403. */
  getStudentStats() {
    return this.http.get<StudentStats>(`${this.base}/api/Students/stats`);
  }
}
