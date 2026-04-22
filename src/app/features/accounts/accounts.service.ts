import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type { Accountant } from '../../core/models/accounts.models';

/**
 * Accountants API:
 * GET /api/Accountants?activeOnly=true|false
 * GET /api/Accountants/{id}
 * POST /api/Accountants (Admin)
 * PUT /api/Accountants/{id} (Admin)
 * DELETE /api/Accountants/{id} (Admin)
 */
@Injectable({ providedIn: 'root' })
export class AccountsService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiBaseUrl}/api/Accountants`;

  /** List accountants; response is a JSON array (or optional `{ data: [...] }`). */
  list(activeOnly = true): Observable<Accountant[]> {
    const params = new HttpParams().set('activeOnly', String(activeOnly));
    return this.http.get<Accountant[] | { data?: Accountant[] }>(this.api, { params }).pipe(
      map((res) => (Array.isArray(res) ? res : (res.data ?? [])))
    );
  }

  getById(id: number): Observable<Accountant> {
    return this.http.get<Accountant>(`${this.api}/${id}`);
  }
}
