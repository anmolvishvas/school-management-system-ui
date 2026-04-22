import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import type { AppRole } from '../../../core/models/auth.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly roles: AppRole[] = ['Admin', 'Teacher', 'Student', 'Accountant'];

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.minLength(2)]],
    username: ['', [Validators.required, Validators.minLength(2)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phone: [''],
    email: [''],
    role: this.fb.nonNullable.control<AppRole>('Teacher', [Validators.required])
  });

  submitting = false;

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap.get('role')?.trim();
    if (q && this.roles.some((r) => r.toLowerCase() === q.toLowerCase())) {
      const match = this.roles.find((r) => r.toLowerCase() === q.toLowerCase())!;
      this.form.patchValue({ role: match });
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    const v = this.form.getRawValue();
    if (v.role === 'Teacher' && !v.fullName.trim()) {
      this.toast.show('Full name is required for teacher profile.', 'error');
      this.submitting = false;
      return;
    }

    this.auth
      .registerUserWithOptionalTeacherProfile({
        username: v.username.trim(),
        password: v.password,
        role: v.role,
        email: v.email?.trim() || undefined,
        fullName: v.fullName.trim() || undefined,
        phone: v.phone?.trim() || undefined
      })
      .subscribe({
        next: (res) => {
          const msg =
            v.role === 'Teacher'
              ? res.userId
                ? 'User and teacher profile created.'
                : 'User created. Teacher profile skipped because backend register did not return user id.'
              : 'User created.';
          this.toast.show(msg, 'success');
          void this.router.navigate(['/students']);
        },
        error: () => {
          this.toast.show('Registration failed (check /auth/register and /teachers API validation).', 'error');
          this.submitting = false;
        },
        complete: () => {
          this.submitting = false;
        }
      });
  }
}
