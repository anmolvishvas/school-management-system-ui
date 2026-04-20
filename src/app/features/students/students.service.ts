import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class StudentsService {

  private api = 'http://localhost:5295/api/students';

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<any[]>(this.api);
  }

  add(student: any) {
    return this.http.post(this.api, student);
  }

  delete(id: number) {
    return this.http.delete(`${this.api}/${id}`, {
      responseType: 'text'
    });
  }

  update(id: number, student: any) {
    return this.http.put(`${this.api}/${id}`, student, {
      responseType: 'text'
  });
}
}