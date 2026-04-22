import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TeachersService } from '../attendance/teachers.service';
import { SubjectsService } from '../subjects/subjects.service';
import { CoursesService } from '../courses/courses.service';
import { ToastService } from '../../core/services/toast.service';
import type { Teacher, TeacherAllocation, TeacherTeachingPlan } from '../../core/models/teachers.models';
import type { Subject } from '../../core/models/subjects.models';
import type { Course } from '../../core/models/courses.models';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule
  ],
  templateUrl: './teachers.component.html',
  styleUrl: './teachers.component.css'
})
export class TeachersComponent implements OnInit {
  private readonly teachersService = inject(TeachersService);
  private readonly subjectsService = inject(SubjectsService);
  private readonly coursesService = inject(CoursesService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly teachers = signal<Teacher[]>([]);
  readonly subjects = signal<Subject[]>([]);
  readonly courses = signal<Course[]>([]);
  readonly allocations = signal<TeacherAllocation[]>([]);
  readonly allocationsTotal = signal(0);
  readonly plan = signal<TeacherTeachingPlan | null>(null);

  allocationPageIndex = 0;
  allocationPageSize = 20;

  readonly allocationForm = this.fb.group({
    teacherId: [null as number | null, [Validators.required]],
    subjectId: [null as number | null, [Validators.required]],
    class: [''],
    section: [''],
    isClassTeacher: [false]
  });

  readonly filterForm = this.fb.nonNullable.group({
    teacherId: [0],
    subjectId: [0],
    className: [''],
    section: ['']
  });

  readonly teacherColumns = ['id', 'userId', 'fullName', 'email', 'phone', 'actions'];
  readonly allocationColumns = ['id', 'teacherName', 'subjectName', 'className', 'section', 'actions'];

  ngOnInit(): void {
    this.loadTeachers();
    this.loadSubjects();
    this.loadCourses();
    this.loadAllocations();
  }

  loadTeachers(): void {
    this.loading.set(true);
    this.teachersService.getTeachers(true).subscribe({
      next: (rows) => {
        this.teachers.set(rows ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.show('Failed to load teachers.', 'error');
      }
    });
  }

  loadSubjects(): void {
    this.subjectsService.getSubjects(true).subscribe({
      next: (rows) => this.subjects.set(rows ?? []),
      error: () => this.subjects.set([])
    });
  }

  loadCourses(): void {
    this.coursesService.getCourses({ page: 1, pageSize: 500, activeOnly: true }).subscribe({
      next: (res) => this.courses.set(res.data ?? []),
      error: () => this.courses.set([])
    });
  }

  loadAllocations(): void {
    const f = this.filterForm.getRawValue();
    this.teachersService
      .getAllocations({
        page: this.allocationPageIndex + 1,
        pageSize: this.allocationPageSize,
        teacherId: f.teacherId > 0 ? f.teacherId : undefined,
        subjectId: f.subjectId > 0 ? f.subjectId : undefined,
        className: f.className || undefined,
        section: f.section || undefined,
        activeOnly: true
      })
      .subscribe({
        next: (res) => {
          this.allocations.set(res.data ?? []);
          this.allocationsTotal.set(res.total ?? 0);
        },
        error: () => {
          this.allocations.set([]);
          this.allocationsTotal.set(0);
        }
      });
  }

  deleteTeacher(id: number): void {
    if (!confirm('Delete this teacher?')) return;
    this.teachersService.deleteTeacher(id).subscribe({
      next: () => {
        this.toast.show('Teacher deleted.', 'success');
        this.loadTeachers();
        this.loadAllocations();
      },
      error: () => this.toast.show('Teacher delete failed.', 'error')
    });
  }

  createAllocation(): void {
    if (this.allocationForm.invalid) {
      this.allocationForm.markAllAsTouched();
      return;
    }
    const v = this.allocationForm.getRawValue();
    this.teachersService
      .createAllocation({
        teacherId: Number(v.teacherId),
        subjectId: Number(v.subjectId),
        class: v.class?.trim() || undefined,
        section: v.section?.trim() || undefined,
        isClassTeacher: v.isClassTeacher ?? false,
        isActive: true
      })
      .subscribe({
        next: () => {
          this.toast.show('Allocation created.', 'success');
          this.loadAllocations();
        },
        error: () => this.toast.show('Allocation create failed.', 'error')
      });
  }

  deleteAllocation(id: number): void {
    if (!confirm('Delete this allocation?')) return;
    this.teachersService.deleteAllocation(id).subscribe({
      next: () => {
        this.toast.show('Allocation deleted.', 'success');
        this.loadAllocations();
      },
      error: () => this.toast.show('Allocation delete failed.', 'error')
    });
  }

  loadTeachingPlan(teacherId: number): void {
    const now = new Date();
    const y = now.getFullYear();
    const fromDate = `${y}-01-01`;
    const toDate = `${y}-12-31`;
    this.teachersService.getTeachingPlan(teacherId, fromDate, toDate, true).subscribe({
      next: (plan) => this.plan.set(plan),
      error: () => {
        this.plan.set(null);
        this.toast.show('Failed to load teaching plan.', 'error');
      }
    });
  }

  onAllocationPage(e: PageEvent): void {
    const sizeChanged = e.pageSize !== this.allocationPageSize;
    this.allocationPageSize = e.pageSize;
    this.allocationPageIndex = sizeChanged ? 0 : e.pageIndex;
    this.loadAllocations();
  }
}
