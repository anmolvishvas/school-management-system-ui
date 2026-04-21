import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { StudentsComponent } from './features/students/students.component';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full' as const
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'students',
    loadComponent: () => import('./features/students/students.component').then(m => m.StudentsComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  }
];