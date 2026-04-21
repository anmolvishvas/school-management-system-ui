import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const platformId = inject(PLATFORM_ID);

  const url = req.url.toLowerCase();
  const skipAuth = url.includes('/auth/login');

  const token = isPlatformBrowser(platformId) ? localStorage.getItem('token') : null;
  if (token && !skipAuth) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        if (!url.includes('/auth/login')) {
          auth.logout();
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
