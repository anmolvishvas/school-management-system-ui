import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import type {
  AppRole,
  CreateTeacherRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest
} from '../models/auth.models';

const ROLE_CLAIM =
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role' as const;
const NAME_ID_CLAIM =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier' as const;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiBaseUrl}/api/Auth`;
  private readonly teachersApi = `${environment.apiBaseUrl}/api/Teachers`;

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

  createTeacher(body: CreateTeacherRequest) {
    return this.http.post(this.teachersApi, body);
  }

  /**
   * Registration flow used by frontend:
   * 1) POST /api/Auth/register
   * 2) If role is Teacher and response contains user id => POST /api/Teachers
   */
  registerUserWithOptionalTeacherProfile(input: {
    username: string;
    password: string;
    role: AppRole;
    email?: string;
    fullName?: string;
    phone?: string;
  }): Observable<{ userId: number }> {
    return this.register({
      username: input.username,
      password: input.password,
      role: input.role,
      email: input.email
    }).pipe(
      map((res) => {
        const userId = this.extractUserId(res);
        return userId;
      }),
      switchMap((userId) => {
        if (input.role !== 'Teacher') return of({ userId });
        // Some /api/Auth/register implementations return only a message, no user id.
        if (!userId) return of({ userId: 0 });
        if (!input.fullName?.trim()) throw new Error('Teacher full name is required');
        return this.createTeacher({
          userId,
          fullName: input.fullName.trim(),
          phone: input.phone?.trim() || undefined,
          email: input.email?.trim() || undefined,
          isActive: true
        }).pipe(map(() => ({ userId })));
      })
    );
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

  getUserId(): number | null {
    const payload = this.decodePayload();
    if (!payload) return null;
    const candidates: unknown[] = [
      payload[NAME_ID_CLAIM],
      payload['sub'],
      payload['userId'],
      payload['id']
    ];
    for (const value of candidates) {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
    return null;
  }

  private extractUserId(res: unknown): number {
    if (typeof res === 'object' && res !== null) {
      const withId = res as { id?: unknown; userId?: unknown };
      if (typeof withId.id === 'number') return withId.id;
      if (typeof withId.userId === 'number') return withId.userId;
    }
    return 0;
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
