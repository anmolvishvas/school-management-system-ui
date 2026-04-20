import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { StudentsComponent } from './features/students/students.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'students', component: StudentsComponent }
];