import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { StudentsComponent } from './features/students/students.component';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
    canActivate: [guestGuard]   // ✅ block if already logged in
  },
  {
    path: 'students',
    component: StudentsComponent,
    canActivate: [authGuard]    // ✅ protect route
  }
];