import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RouterLink } from '@angular/router';
import { AccountsService } from './accounts.service';
import { ToastService } from '../../core/services/toast.service';
import type { Accountant } from '../../core/models/accounts.models';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatCheckboxModule
  ],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.css'
})
export class AccountsComponent implements OnInit {
  private readonly service = inject(AccountsService);
  private readonly toast = inject(ToastService);

  private apiList: Accountant[] = [];

  readonly loading = signal(false);
  readonly rows = signal<Accountant[]>([]);
  readonly total = signal(0);
  readonly searchCtrl = new FormControl('', { nonNullable: true });
  readonly activeOnlyCtrl = new FormControl(true, { nonNullable: true });

  pageIndex = 0;
  pageSize = 20;

  readonly columns = ['id', 'fullName', 'email', 'phone', 'status'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.list(this.activeOnlyCtrl.value).subscribe({
      next: (list) => {
        this.apiList = list ?? [];
        this.loading.set(false);
        this.applyClientPaging();
      },
      error: () => {
        this.apiList = [];
        this.rows.set([]);
        this.total.set(0);
        this.loading.set(false);
        this.toast.show('Failed to load accountants.', 'error');
      }
    });
  }

  /** Filter + slice in the browser (GET /api/Accountants has no paging/search params). */
  private applyClientPaging(): void {
    const q = this.searchCtrl.value.trim().toLowerCase();
    let list = [...this.apiList];
    if (q) {
      list = list.filter((r) => {
        const name = (r.fullName ?? r.userName ?? r.username ?? '').toLowerCase();
        const email = (r.email ?? '').toLowerCase();
        const phone = (r.phone ?? '').toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q);
      });
    }
    this.total.set(list.length);
    const start = this.pageIndex * this.pageSize;
    this.rows.set(list.slice(start, start + this.pageSize));
  }

  onPage(e: PageEvent): void {
    const sizeChanged = e.pageSize !== this.pageSize;
    this.pageSize = e.pageSize;
    this.pageIndex = sizeChanged ? 0 : e.pageIndex;
    this.applyClientPaging();
  }

  search(): void {
    this.pageIndex = 0;
    this.applyClientPaging();
  }

  onActiveOnlyChange(): void {
    this.pageIndex = 0;
    this.load();
  }

  displayName(row: Accountant): string {
    return row.fullName?.trim() || row.username?.trim() || row.userName?.trim() || '—';
  }
}
