import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StudentsService {

  private api = 'http://localhost:5295/api/students';

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get(this.api);
  }
}