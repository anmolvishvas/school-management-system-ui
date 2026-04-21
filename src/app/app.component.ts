import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ToastComponent } from './shared/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, ToastComponent],
  template: `
    <nav style="padding:10px; background:#f5f5f5; border-radius:8px;">
      <a routerLink="/dashboard">Dashboard</a> |
      <a routerLink="/students">Students</a>
    </nav>

    <app-toast></app-toast>

    <router-outlet></router-outlet>
  `
})
export class AppComponent {}