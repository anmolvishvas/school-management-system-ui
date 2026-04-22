import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule
  ],
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav
        #drawer
        class="sidenav"
        [mode]="isHandset() ? 'over' : 'side'"
        [opened]="!isHandset()"
      >
        <div class="brand">
          <mat-icon>school</mat-icon>
          <div>
            <div class="brand-title">School & Coaching</div>
            <div class="brand-sub">Management</div>
          </div>
        </div>
        <mat-divider />
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link" (click)="closeOnHandset(drawer)">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/students" routerLinkActive="active-link" (click)="closeOnHandset(drawer)">
            <mat-icon matListItemIcon>groups</mat-icon>
            <span matListItemTitle>Students</span>
          </a>
          @if (auth.isAdmin()) {
            <a mat-list-item routerLink="/courses" routerLinkActive="active-link" (click)="closeOnHandset(drawer)">
              <mat-icon matListItemIcon>menu_book</mat-icon>
              <span matListItemTitle>Courses</span>
            </a>
          }
          @if (auth.isAdmin()) {
            <a mat-list-item routerLink="/subjects" routerLinkActive="active-link" (click)="closeOnHandset(drawer)">
              <mat-icon matListItemIcon>library_books</mat-icon>
              <span matListItemTitle>Subjects</span>
            </a>
          }
          @if (auth.isAdmin()) {
            <a mat-list-item routerLink="/teachers" routerLinkActive="active-link" (click)="closeOnHandset(drawer)">
              <mat-icon matListItemIcon>person</mat-icon>
              <span matListItemTitle>Teachers</span>
            </a>
          }
          @if (auth.isAdmin()) {
            <a mat-list-item routerLink="/accounts" routerLinkActive="active-link" (click)="closeOnHandset(drawer)">
              <mat-icon matListItemIcon>account_balance</mat-icon>
              <span matListItemTitle>Accountants</span>
            </a>
          }
          <a mat-list-item routerLink="/attendance" routerLinkActive="active-link" (click)="closeOnHandset(drawer)">
            <mat-icon matListItemIcon>event_available</mat-icon>
            <span matListItemTitle>Attendance</span>
          </a>
          @if (auth.isAccountant()) {
            <a mat-list-item routerLink="/fees" routerLinkActive="active-link" (click)="closeOnHandset(drawer)">
              <mat-icon matListItemIcon>payments</mat-icon>
              <span matListItemTitle>Fees</span>
            </a>
          }
          <a mat-list-item routerLink="/timetable" routerLinkActive="active-link" (click)="closeOnHandset(drawer)">
            <mat-icon matListItemIcon>calendar_month</mat-icon>
            <span matListItemTitle>Timetable</span>
          </a>
          <a mat-list-item routerLink="/reports" routerLinkActive="active-link" (click)="closeOnHandset(drawer)">
            <mat-icon matListItemIcon>analytics</mat-icon>
            <span matListItemTitle>Reports</span>
          </a>
          @if (auth.isAdmin()) {
            <a mat-list-item routerLink="/register" routerLinkActive="active-link" (click)="closeOnHandset(drawer)">
              <mat-icon matListItemIcon>person_add</mat-icon>
              <span matListItemTitle>Register user</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="toolbar">
          @if (isHandset()) {
            <button mat-icon-button type="button" aria-label="Open navigation" (click)="drawer.toggle()">
              <mat-icon>menu</mat-icon>
            </button>
          }
          <span class="toolbar-title">School & Coaching Management</span>
          <span class="spacer"></span>
          @if (auth.getRole(); as role) {
            <span class="role-chip">{{ role }}</span>
          }
          <button mat-button type="button" (click)="logout()">
            <mat-icon>logout</mat-icon>
            Sign out
          </button>
        </mat-toolbar>
        <main class="content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .shell {
        height: 100vh;
      }
      .sidenav {
        width: 260px;
        padding-top: 8px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
      }
      .brand mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
      }
      .brand-title {
        font-weight: 600;
        font-size: 1rem;
      }
      .brand-sub {
        font-size: 0.8rem;
        opacity: 0.8;
      }
      .active-link {
        background: color-mix(in srgb, var(--mat-sys-primary) 12%, transparent);
      }
      .toolbar-title {
        font-size: 1rem;
        font-weight: 500;
      }
      .spacer {
        flex: 1;
      }
      .toolbar {
        position: sticky;
        top: 0;
        z-index: 2;
      }
      .role-chip {
        font-size: 0.8rem;
        margin-right: 8px;
        opacity: 0.9;
      }
      .content {
        padding: 16px 20px 32px;
        max-width: 1400px;
        margin: 0 auto;
      }
    `
  ]
})
export class MainLayoutComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly breakpoint = inject(BreakpointObserver);

  readonly isHandset = toSignal(
    this.breakpoint.observe('(max-width: 960px)').pipe(map((r) => r.matches)),
    { initialValue: false }
  );

  closeOnHandset(drawer: { close: () => void }) {
    if (this.isHandset()) drawer.close();
  }

  logout() {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
