import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';
import { accountantGuard } from './core/guards/accountant-guard';
import { guestGuard } from './core/guards/guest-guard';
import { MainLayoutComponent } from './layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'register',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'students',
        loadComponent: () =>
          import('./features/students/students.component').then((m) => m.StudentsComponent)
      },
      {
        path: 'courses',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/courses/courses.component').then((m) => m.CoursesComponent)
      },
      {
        path: 'subjects',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/subjects/subjects.component').then((m) => m.SubjectsComponent)
      },
      {
        path: 'teachers',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/teachers/teachers.component').then((m) => m.TeachersComponent)
      },
      {
        path: 'accounts',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/accounts/accounts.component').then((m) => m.AccountsComponent)
      },
      {
        path: 'attendance',
        loadComponent: () =>
          import('./features/attendance/attendance.component').then((m) => m.AttendanceComponent)
      },
      {
        path: 'fees',
        canActivate: [accountantGuard],
        data: { title: 'Fee management' },
        loadComponent: () => import('./features/fees/fees.component').then((m) => m.FeesComponent)
      },
      {
        path: 'timetable',
        loadComponent: () =>
          import('./features/timetable/timetable.component').then((m) => m.TimetableComponent)
      },
      {
        path: 'reports',
        data: { title: 'Reports & analytics' },
        loadComponent: () =>
          import('./features/reports/reports.component').then((m) => m.ReportsComponent)
      }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
