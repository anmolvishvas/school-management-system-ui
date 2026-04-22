import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../services/auth.service';

/** Fee management is restricted to the Accountant role. */
export const accountantGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (auth.isAccountant()) return true;

  return router.parseUrl('/dashboard');
};
