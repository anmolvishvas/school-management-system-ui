import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StudentsService } from './students.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import type { Student } from '../../core/models/student.models';
import { StudentFormDialogComponent } from './student-form-dialog.component';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './students.component.html',
  styleUrl: './students.component.css'
})
export class StudentsComponent implements OnInit {
  private readonly service = inject(StudentsService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  readonly students = signal<Student[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly searchCtrl = new FormControl('', { nonNullable: true });
  readonly classCtrl = new FormControl('', { nonNullable: true });
  readonly sectionCtrl = new FormControl('', { nonNullable: true });
  readonly activeOnlyCtrl = new FormControl(false, { nonNullable: true });

  sortBy = 'id';
  order: 'asc' | 'desc' = 'asc';

  pageIndex = 0;
  pageSize = 10;

  readonly displayedColumns = ['id', 'name', 'class', 'section', 'status', 'actions'];

  ngOnInit(): void {
    this.searchCtrl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pageIndex = 0;
      this.load();
    });
    this.load();
  }

  displayClass(s: Student): string {
    return (s.class ?? s.className ?? '').toString();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .getPage({
        page: this.pageIndex + 1,
        pageSize: this.pageSize,
        search: this.searchCtrl.value,
        sortBy: this.sortBy,
        order: this.order,
        className: this.classCtrl.value,
        section: this.sectionCtrl.value,
        activeOnly: this.activeOnlyCtrl.value ? true : undefined
      })
      .subscribe({
        next: (res) => {
          this.students.set(res.data ?? []);
          this.total.set(res.total ?? 0);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load students.');
          this.loading.set(false);
        }
      });
  }

  onFilterChange(): void {
    this.pageIndex = 0;
    this.load();
  }

  onPage(e: PageEvent): void {
    const sizeChanged = e.pageSize !== this.pageSize;
    this.pageSize = e.pageSize;
    this.pageIndex = sizeChanged ? 0 : e.pageIndex;
    this.load();
  }

  applySort(): void {
    this.pageIndex = 0;
    this.load();
  }

  onSortBy(value: string): void {
    this.sortBy = value;
    this.applySort();
  }

  onOrderChange(value: string): void {
    this.order = value === 'desc' ? 'desc' : 'asc';
    this.applySort();
  }

  openCreate(): void {
    this.dialog
      .open(StudentFormDialogComponent, {
        data: { mode: 'create' },
        autoFocus: 'first-tabbable',
        width: '640px'
      })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.load();
          this.toast.show('Student created', 'success');
        }
      });
  }

  openEdit(s: Student): void {
    this.dialog
      .open(StudentFormDialogComponent, {
        data: { mode: 'edit', student: s },
        autoFocus: 'first-tabbable',
        width: '640px'
      })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.load();
          this.toast.show('Student updated', 'success');
        }
      });
  }

  deleteStudent(id: number): void {
    if (!confirm('Delete this student?')) return;
    this.service.delete(id).subscribe({
      next: () => {
        this.load();
        this.toast.show('Student deleted', 'success');
      },
      error: () => this.toast.show('Delete failed', 'error')
    });
  }
}
