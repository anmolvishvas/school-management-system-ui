import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type { AppRole, LoginRequest, LoginResponse, RegisterRequest } from '../models/auth.models';

const ROLE_CLAIM =
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role' as const;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiBaseUrl}/api/Auth`;

  login(data: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.api}/login`, data).pipe(
      tap((res) => {
        this.saveToken(res.token);
      })
    );
  }

  register(body: RegisterRequest) {
    return this.http.post(`${this.api}/register`, body);
  }

  saveToken(token: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem('token');
  }

  logout() {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /** Primary role for display (first claim). */
  getRole(): string | null {
    const roles = this.getRoles();
    return roles[0] ?? null;
  }

  getRoles(): string[] {
    const payload = this.decodePayload();
    if (!payload) return [];
    const raw = payload[ROLE_CLAIM];
    if (Array.isArray(raw)) return raw.map(String);
    if (typeof raw === 'string') return [raw];
    return [];
  }

  hasRole(role: AppRole | string): boolean {
    const want = String(role).toLowerCase();
    return this.getRoles().some((r) => r.toLowerCase() === want);
  }

  isAdmin(): boolean {
    return this.hasRole('Admin');
  }

  private decodePayload(): Record<string, unknown> | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const segment = token.split('.')[1];
      if (!segment) return null;
      const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      return JSON.parse(atob(padded)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
