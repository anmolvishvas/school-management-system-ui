export type AppRole = 'Admin' | 'Teacher' | 'Student' | 'Accountant';

export interface LoginRequest {
  username: string;
  password: string;
}

/** Response from POST /api/Auth/login (extend when backend adds fields). */
export interface LoginResponse {
  token: string;
  username?: string;
  expiresAt?: string;
  roles?: string[];
}

export interface RegisterRequest {
  username: string;
  password: string;
  role: AppRole;
  email?: string;
}
