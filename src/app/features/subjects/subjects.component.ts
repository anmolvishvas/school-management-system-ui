import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SubjectsService } from './subjects.service';
import { ToastService } from '../../core/services/toast.service';
import type { Subject } from '../../core/models/subjects.models';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './subjects.component.html',
  styleUrl: './subjects.component.css'
})
export class SubjectsComponent implements OnInit {
  private readonly service = inject(SubjectsService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly activeOnly = signal(true);
  readonly subjects = signal<Subject[]>([]);

  readonly form = this.fb.nonNullable.group({
    id: [0],
    name: ['', [Validators.required, Validators.minLength(2)]],
    code: [''],
    isActive: [true]
  });

  readonly columns = ['id', 'name', 'code', 'isActive', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getSubjects(this.activeOnly()).subscribe({
      next: (rows) => {
        this.subjects.set(rows ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.subjects.set([]);
        this.loading.set(false);
        this.toast.show('Failed to load subjects.', 'error');
      }
    });
  }

  toggleActiveOnly(value: boolean): void {
    this.activeOnly.set(value);
    this.load();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body = {
      name: v.name.trim(),
      code: v.code.trim() || undefined,
      isActive: v.isActive
    };
    const req = v.id ? this.service.update(v.id, body) : this.service.create(body);
    req.subscribe({
      next: () => {
        this.toast.show(v.id ? 'Subject updated.' : 'Subject created.', 'success');
        this.reset();
        this.load();
      },
      error: () => this.toast.show('Subject save failed.', 'error')
    });
  }

  edit(row: Subject): void {
    this.form.setValue({
      id: row.id,
      name: row.name,
      code: row.code ?? '',
      isActive: row.isActive !== false
    });
  }

  remove(id: number): void {
    if (!confirm('Delete this subject?')) return;
    this.service.delete(id).subscribe({
      next: () => {
        this.toast.show('Subject deleted.', 'success');
        this.load();
        if (this.form.value.id === id) this.reset();
      },
      error: () => this.toast.show('Subject delete failed.', 'error')
    });
  }

  reset(): void {
    this.form.reset({ id: 0, name: '', code: '', isActive: true });
  }
}
