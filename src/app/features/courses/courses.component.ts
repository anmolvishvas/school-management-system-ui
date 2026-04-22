import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CoursesService } from './courses.service';
import { SubjectsService } from '../subjects/subjects.service';
import { ToastService } from '../../core/services/toast.service';
import type { Course, CourseSection, CourseSubject } from '../../core/models/courses.models';
import type { Subject } from '../../core/models/subjects.models';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.css'
})
export class CoursesComponent implements OnInit {
  private readonly service = inject(CoursesService);
  private readonly subjectsService = inject(SubjectsService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly courses = signal<Course[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);

  readonly selectedCourse = signal<Course | null>(null);
  readonly sections = signal<CourseSection[]>([]);
  readonly mappings = signal<CourseSubject[]>([]);
  readonly subjects = signal<Subject[]>([]);
  readonly detailLoading = signal(false);

  pageIndex = 0;
  pageSize = 10;

  readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    activeOnly: [true]
  });

  readonly courseForm = this.fb.nonNullable.group({
    id: [0],
    name: ['', [Validators.required, Validators.minLength(2)]],
    code: [''],
    isActive: [true]
  });

  readonly sectionForm = this.fb.nonNullable.group({
    section: ['', [Validators.required, Validators.minLength(1)]],
    isActive: [true]
  });

  readonly mappingForm = this.fb.group({
    subjectId: [null as number | null, [Validators.required]],
    isActive: [true]
  });

  readonly courseColumns = ['id', 'name', 'code', 'isActive', 'actions'];
  readonly sectionColumns = ['id', 'section', 'isActive', 'actions'];
  readonly mappingColumns = ['id', 'subjectId', 'subjectName', 'isActive', 'actions'];

  ngOnInit(): void {
    this.loadCourses();
    this.loadSubjects();
  }

  loadCourses(): void {
    const f = this.filterForm.getRawValue();
    this.loading.set(true);
    this.service
      .getCourses({
        page: this.pageIndex + 1,
        pageSize: this.pageSize,
        search: f.search || undefined,
        activeOnly: f.activeOnly
      })
      .subscribe({
        next: (res) => {
          this.courses.set(res.data ?? []);
          this.total.set(res.total ?? 0);
          this.loading.set(false);
        },
        error: () => {
          this.courses.set([]);
          this.total.set(0);
          this.loading.set(false);
          this.toast.show('Failed to load courses.', 'error');
        }
      });
  }

  loadSubjects(): void {
    this.subjectsService.getSubjects(true).subscribe({
      next: (rows) => this.subjects.set(rows ?? []),
      error: () => this.subjects.set([])
    });
  }

  createOrUpdateCourse(): void {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      return;
    }
    const v = this.courseForm.getRawValue();
    const body = {
      name: v.name.trim(),
      code: v.code.trim() || undefined,
      isActive: v.isActive
    };
    const req = v.id ? this.service.updateCourse(v.id, body) : this.service.createCourse(body);
    req.subscribe({
      next: () => {
        this.toast.show(v.id ? 'Course updated.' : 'Course created.', 'success');
        this.courseForm.reset({ id: 0, name: '', code: '', isActive: true });
        this.loadCourses();
      },
      error: () => this.toast.show('Course save failed (check duplicates).', 'error')
    });
  }

  editCourse(c: Course): void {
    this.courseForm.setValue({
      id: c.id,
      name: c.name,
      code: c.code ?? '',
      isActive: c.isActive !== false
    });
  }

  deleteCourse(id: number): void {
    if (!confirm('Delete this course?')) return;
    this.service.deleteCourse(id).subscribe({
      next: () => {
        this.toast.show('Course deleted.', 'success');
        this.loadCourses();
        if (this.selectedCourse()?.id === id) this.clearSelection();
      },
      error: () => this.toast.show('Course delete failed.', 'error')
    });
  }

  selectCourse(c: Course): void {
    this.selectedCourse.set(c);
    this.detailLoading.set(true);
    this.service.getSections(c.id, true).subscribe({
      next: (rows) => {
        this.sections.set(rows ?? []);
        this.detailLoading.set(false);
      },
      error: () => {
        this.sections.set([]);
        this.detailLoading.set(false);
      }
    });
    this.service.getSubjects(c.id, true).subscribe({
      next: (rows) => this.mappings.set(rows ?? []),
      error: () => this.mappings.set([])
    });
  }

  clearSelection(): void {
    this.selectedCourse.set(null);
    this.sections.set([]);
    this.mappings.set([]);
    this.sectionForm.reset({ section: '', isActive: true });
    this.mappingForm.reset({ subjectId: null, isActive: true });
  }

  addSection(): void {
    const c = this.selectedCourse();
    if (!c) return;
    if (this.sectionForm.invalid) {
      this.sectionForm.markAllAsTouched();
      return;
    }
    const v = this.sectionForm.getRawValue();
    this.service
      .createSection(c.id, { section: v.section.trim(), isActive: v.isActive })
      .subscribe({
        next: () => {
          this.toast.show('Section added.', 'success');
          this.sectionForm.reset({ section: '', isActive: true });
          this.selectCourse(c);
        },
        error: () => this.toast.show('Section create failed (duplicate section maybe).', 'error')
      });
  }

  removeSection(sectionId: number): void {
    const c = this.selectedCourse();
    if (!c) return;
    if (!confirm('Delete this section?')) return;
    this.service.deleteSection(sectionId).subscribe({
      next: () => {
        this.toast.show('Section deleted.', 'success');
        this.selectCourse(c);
      },
      error: () => this.toast.show('Section delete failed.', 'error')
    });
  }

  addSubjectMapping(): void {
    const c = this.selectedCourse();
    if (!c) return;
    if (this.mappingForm.invalid) {
      this.mappingForm.markAllAsTouched();
      return;
    }
    const v = this.mappingForm.getRawValue();
    this.service
      .createSubjectMapping(c.id, { subjectId: Number(v.subjectId), isActive: v.isActive ?? true })
      .subscribe({
        next: () => {
          this.toast.show('Subject mapped to course.', 'success');
          this.mappingForm.reset({ subjectId: null, isActive: true });
          this.selectCourse(c);
        },
        error: () => this.toast.show('Subject mapping failed (duplicate or invalid subject).', 'error')
      });
  }

  removeSubjectMapping(id: number): void {
    const c = this.selectedCourse();
    if (!c) return;
    if (!confirm('Delete this subject mapping?')) return;
    this.service.deleteSubjectMapping(id).subscribe({
      next: () => {
        this.toast.show('Subject mapping deleted.', 'success');
        this.selectCourse(c);
      },
      error: () => this.toast.show('Subject mapping delete failed.', 'error')
    });
  }

  onPage(e: PageEvent): void {
    const sizeChanged = e.pageSize !== this.pageSize;
    this.pageSize = e.pageSize;
    this.pageIndex = sizeChanged ? 0 : e.pageIndex;
    this.loadCourses();
  }
}
