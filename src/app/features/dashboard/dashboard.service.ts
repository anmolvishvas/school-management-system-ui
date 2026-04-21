import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private api = 'http://localhost:5295/api/students';

  constructor(private http: HttpClient) {}

  getStats() {
    return this.http.get<any>(`${this.api}/stats`);
  }
}