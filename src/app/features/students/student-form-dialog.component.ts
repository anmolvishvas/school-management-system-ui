import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import type { Student, StudentUpsert } from '../../core/models/student.models';
import { StudentsService } from './students.service';

export interface StudentFormDialogData {
  mode: 'create' | 'edit';
  student?: Student;
}

@Component({
  selector: 'app-student-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Add student' : 'Edit student' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="grid">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
          @if (form.controls.name.touched && form.controls.name.invalid) {
            <mat-error>Required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Class</mat-label>
          <input matInput formControlName="studentClass" />
          @if (form.controls.studentClass.touched && form.controls.studentClass.invalid) {
            <mat-error>Required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Section</mat-label>
          <input matInput formControlName="section" />
          @if (form.controls.section.touched && form.controls.section.invalid) {
            <mat-error>Required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Phone</mat-label>
          <input matInput formControlName="phone" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="span-2">
          <mat-label>Address</mat-label>
          <input matInput formControlName="addressLine1" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>City</mat-label>
          <input matInput formControlName="city" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>State</mat-label>
          <input matInput formControlName="state" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Postal code</mat-label>
          <input matInput formControlName="postalCode" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Parent / guardian</mat-label>
          <input matInput formControlName="parentGuardianName" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Parent phone</mat-label>
          <input matInput formControlName="parentGuardianPhone" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Admission number</mat-label>
          <input matInput formControlName="admissionNumber" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Admission date</mat-label>
          <input matInput type="date" formControlName="admissionDate" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="span-2">
          <mat-label>Notes</mat-label>
          <textarea matInput rows="2" formControlName="notes"></textarea>
        </mat-form-field>
        <mat-slide-toggle formControlName="isActive">Active</mat-slide-toggle>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="ref.close()">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="saving">
          {{ data.mode === 'create' ? 'Create' : 'Save' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px 16px;
        padding-top: 8px;
        min-width: min(520px, 92vw);
      }
      .span-2 {
        grid-column: span 2;
      }
      @media (max-width: 600px) {
        .grid {
          grid-template-columns: 1fr;
        }
        .span-2 {
          grid-column: span 1;
        }
      }
    `
  ]
})
export class StudentFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(StudentsService);
  readonly ref = inject(MatDialogRef<StudentFormDialogComponent, boolean>);

  saving = false;

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    studentClass: ['', Validators.required],
    section: ['', Validators.required],
    email: [''],
    phone: [''],
    addressLine1: [''],
    city: [''],
    state: [''],
    postalCode: [''],
    parentGuardianName: [''],
    parentGuardianPhone: [''],
    admissionNumber: [''],
    admissionDate: [''],
    notes: [''],
    isActive: [true]
  });

  constructor(@Inject(MAT_DIALOG_DATA) readonly data: StudentFormDialogData) {
    if (data.mode === 'edit' && data.student) {
      const s = data.student;
      this.form.patchValue({
        name: s.name,
        studentClass: s.class ?? s.className ?? '',
        section: s.section ?? '',
        email: s.email ?? '',
        phone: s.phone ?? '',
        addressLine1: s.addressLine1 ?? '',
        city: s.city ?? '',
        state: s.state ?? '',
        postalCode: s.postalCode ?? '',
        parentGuardianName: s.parentGuardianName ?? '',
        parentGuardianPhone: s.parentGuardianPhone ?? '',
        admissionNumber: s.admissionNumber ?? '',
        admissionDate: (s.admissionDate ?? '').toString().slice(0, 10),
        notes: s.notes ?? '',
        isActive: s.isActive !== false
      });
    }
  }

  private toPayload(): StudentUpsert {
    const v = this.form.getRawValue();
    return {
      name: v.name.trim(),
      class: v.studentClass.trim(),
      section: v.section.trim(),
      email: v.email?.trim() || undefined,
      phone: v.phone?.trim() || undefined,
      addressLine1: v.addressLine1?.trim() || undefined,
      city: v.city?.trim() || undefined,
      state: v.state?.trim() || undefined,
      postalCode: v.postalCode?.trim() || undefined,
      parentGuardianName: v.parentGuardianName?.trim() || undefined,
      parentGuardianPhone: v.parentGuardianPhone?.trim() || undefined,
      admissionNumber: v.admissionNumber?.trim() || undefined,
      admissionDate: v.admissionDate ? v.admissionDate : null,
      notes: v.notes?.trim() || undefined,
      isActive: v.isActive
    };
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const payload = this.toPayload();
    const done = () => {
      this.saving = false;
      this.ref.close(true);
    };
    if (this.data.mode === 'create') {
      this.service.add(payload).subscribe({ next: done, error: () => (this.saving = false) });
    } else if (this.data.student) {
      this.service.update(this.data.student.id, payload).subscribe({
        next: done,
        error: () => (this.saving = false)
      });
    }
  }
}
