import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import type { Course, CourseSection } from '../../core/models/courses.models';
import type { Subject } from '../../core/models/subjects.models';
import type { Teacher } from '../../core/models/teachers.models';
import type { TimetableDayOfWeek, TimetableEntry } from '../../core/models/timetable.models';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CoursesService } from '../courses/courses.service';
import { SubjectsService } from '../subjects/subjects.service';
import { TeachersService } from '../attendance/teachers.service';
import { TimetableService } from './timetable.service';

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatTableModule,
    MatSlideToggleModule,
    MatPaginatorModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './timetable.component.html',
  styleUrl: './timetable.component.css'
})
export class TimetableComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(TimetableService);
  private readonly coursesService = inject(CoursesService);
  private readonly subjectsService = inject(SubjectsService);
  private readonly teachersService = inject(TeachersService);
  private readonly toast = inject(ToastService);

  readonly auth = inject(AuthService);
  readonly isTeacher = computed(() => this.auth.hasRole('Teacher') && !this.auth.isAdmin());
  readonly days: TimetableDayOfWeek[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ];

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly entries = signal<TimetableEntry[]>([]);
  readonly classSectionEntries = signal<TimetableEntry[]>([]);
  readonly total = signal(0);
  readonly teacherScopedId = signal<number | null>(null);
  readonly teacherScopeReady = signal(false);

  readonly courses = signal<Course[]>([]);
  readonly sections = signal<CourseSection[]>([]);
  readonly subjects = signal<Subject[]>([]);
  readonly teachers = signal<Teacher[]>([]);

  pageIndex = 0;
  pageSize = 20;

  readonly filtersForm = this.fb.nonNullable.group({
    className: [''],
    section: [''],
    dayOfWeek: this.fb.control<TimetableDayOfWeek | ''>(''),
    teacherId: [0],
    activeOnly: [true]
  });

  readonly entryForm = this.fb.nonNullable.group({
    id: [0],
    class: ['', [Validators.required]],
    section: ['', [Validators.required]],
    dayOfWeek: ['Monday' as TimetableDayOfWeek, [Validators.required]],
    startTime: ['07:30:00', [Validators.required]],
    endTime: ['08:30:00', [Validators.required]],
    subjectId: [0, [Validators.required, Validators.min(1)]],
    teacherId: [0, [Validators.required, Validators.min(1)]],
    isActive: [true]
  });

  readonly bulkForm = this.fb.nonNullable.group({
    class: ['', [Validators.required]],
    section: ['', [Validators.required]],
    lines: this.fb.array([this.createBulkLine()])
  });

  readonly tableColumns = [
    'id',
    'className',
    'section',
    'dayOfWeek',
    'timeRange',
    'subject',
    'teacher',
    'isActive',
    'actions'
  ];

  readonly hasClassFilter = computed(() => !!this.filtersForm.controls.className.value.trim());
  readonly weeklyRows = computed(() =>
    this.buildWeeklyRows(this.classSectionEntries().length ? this.classSectionEntries() : this.entries())
  );

  get bulkLines(): FormArray {
    return this.bulkForm.controls.lines;
  }

  ngOnInit(): void {
    this.loadCourses();
    this.loadSubjects();
    this.loadTeachers(() => this.loadEntries());
  }

  createBulkLine() {
    return this.fb.nonNullable.group({
      dayOfWeek: ['Monday' as TimetableDayOfWeek, [Validators.required]],
      startTime: ['07:30:00', [Validators.required]],
      endTime: ['08:30:00', [Validators.required]],
      subjectId: [0, [Validators.required, Validators.min(1)]],
      teacherId: [0, [Validators.required, Validators.min(1)]],
      isActive: [true]
    });
  }

  loadCourses(): void {
    this.coursesService.getCourses({ page: 1, pageSize: 500, activeOnly: true }).subscribe({
      next: (res) => this.courses.set(res.data ?? []),
      error: () => this.courses.set([])
    });
  }

  loadSubjects(): void {
    this.subjectsService.getSubjects(true).subscribe({
      next: (rows) => this.subjects.set(rows ?? []),
      error: () => this.subjects.set([])
    });
  }

  loadTeachers(afterLoad?: () => void): void {
    this.teachersService.getTeachers(true).subscribe({
      next: (rows) => {
        this.teachers.set(rows ?? []);
        this.resolveTeacherScope();
        afterLoad?.();
      },
      error: () => {
        this.teachers.set([]);
        this.resolveTeacherScope();
        afterLoad?.();
      }
    });
  }

  resolveTeacherScope(): void {
    if (!this.isTeacher()) {
      this.teacherScopedId.set(null);
      this.filtersForm.controls.teacherId.enable({ emitEvent: false });
      this.teacherScopeReady.set(true);
      return;
    }
    const userId = this.auth.getUserId();
    const teacher = this.teachers().find((t) => t.userId === (userId ?? -1));
    if (!teacher?.id) {
      this.teacherScopedId.set(null);
      this.filtersForm.controls.teacherId.disable({ emitEvent: false });
      this.teacherScopeReady.set(true);
      this.toast.show('Teacher profile mapping not found for current user.', 'error');
      return;
    }
    this.teacherScopedId.set(teacher.id);
    this.teacherScopeReady.set(true);
    this.filtersForm.controls.teacherId.setValue(teacher.id);
    this.filtersForm.controls.teacherId.disable({ emitEvent: false });
  }

  onEntryClassChange(className: string): void {
    this.entryForm.controls.section.setValue('');
    this.loadSections(className);
  }

  onBulkClassChange(className: string): void {
    this.bulkForm.controls.section.setValue('');
    this.loadSections(className);
  }

  onFilterClassChange(className: string): void {
    this.filtersForm.controls.section.setValue('');
    this.loadSections(className);
  }

  loadSections(className: string): void {
    const selectedCourse = this.courses().find((c) => c.name === className);
    if (!selectedCourse?.id) {
      this.sections.set([]);
      return;
    }
    this.coursesService.getSections(selectedCourse.id, true).subscribe({
      next: (rows) => this.sections.set(rows ?? []),
      error: () => this.sections.set([])
    });
  }

  loadEntries(): void {
    if (this.isTeacher() && !this.teacherScopeReady()) return;
    const f = this.filtersForm.getRawValue();
    const teacherId = this.isTeacher() ? this.teacherScopedId() ?? undefined : f.teacherId > 0 ? f.teacherId : undefined;
    if (this.isTeacher() && !teacherId) {
      this.entries.set([]);
      this.total.set(0);
      return;
    }
    this.loading.set(true);
    this.service
      .getPage({
        page: this.pageIndex + 1,
        pageSize: this.pageSize,
        className: f.className.trim() || undefined,
        section: f.section.trim() || undefined,
        dayOfWeek: f.dayOfWeek || undefined,
        teacherId,
        activeOnly: f.activeOnly
      })
      .subscribe({
        next: (res) => {
          this.classSectionEntries.set([]);
          this.entries.set(res.data ?? []);
          this.total.set(res.total ?? 0);
          this.loading.set(false);
        },
        error: () => {
          this.entries.set([]);
          this.total.set(0);
          this.loading.set(false);
          this.toast.show('Failed to load timetable.', 'error');
        }
      });
  }

  loadClassSectionView(): void {
    const className = this.filtersForm.controls.className.value.trim();
    const section = this.filtersForm.controls.section.value.trim();
    if (!className || !section) {
      this.toast.show('Select class and section first.', 'error');
      return;
    }
    const activeOnly = this.filtersForm.controls.activeOnly.value;
    this.service.getByClassSection(className, section, activeOnly).subscribe({
      next: (rows) => {
        this.classSectionEntries.set(rows ?? []);
        if ((rows ?? []).length === 0) {
          this.toast.show('No timetable slots found for selected class/section.', 'error');
        }
      },
      error: () => {
        this.classSectionEntries.set([]);
        this.toast.show('Failed to load weekly calendar for selected section.', 'error');
      }
    });
  }

  saveEntry(): void {
    if (!this.auth.isAdmin()) return;
    if (this.entryForm.invalid) {
      this.entryForm.markAllAsTouched();
      return;
    }
    const v = this.entryForm.getRawValue();
    const body = {
      class: v.class.trim(),
      section: v.section.trim(),
      dayOfWeek: v.dayOfWeek,
      startTime: this.toApiTime(v.startTime),
      endTime: this.toApiTime(v.endTime),
      subjectId: Number(v.subjectId),
      teacherId: Number(v.teacherId),
      isActive: v.isActive
    };
    this.submitting.set(true);
    const req = v.id ? this.service.update(v.id, body) : this.service.create(body);
    req.subscribe({
      next: () => {
        this.submitting.set(false);
        this.toast.show(v.id ? 'Timetable entry updated.' : 'Timetable entry created.', 'success');
        this.resetEntryForm();
        this.loadEntries();
      },
      error: () => {
        this.submitting.set(false);
        this.toast.show('Timetable save failed. Check allocation/slot conflicts.', 'error');
      }
    });
  }

  editEntry(row: TimetableEntry): void {
    if (!this.auth.isAdmin()) return;
    const className = row.class ?? row.className ?? '';
    this.entryForm.setValue({
      id: row.id,
      class: className,
      section: row.section ?? '',
      dayOfWeek: row.dayOfWeek,
      startTime: row.startTime ?? '07:30:00',
      endTime: row.endTime ?? '08:30:00',
      subjectId: row.subjectId,
      teacherId: row.teacherId,
      isActive: row.isActive !== false
    });
    this.loadSections(className);
  }

  deleteEntry(id: number): void {
    if (!this.auth.isAdmin()) return;
    if (!confirm('Delete this timetable entry?')) return;
    this.service.delete(id).subscribe({
      next: () => {
        this.toast.show('Timetable entry deleted.', 'success');
        this.loadEntries();
      },
      error: () => this.toast.show('Timetable delete failed.', 'error')
    });
  }

  resetEntryForm(): void {
    this.entryForm.reset({
      id: 0,
      class: '',
      section: '',
      dayOfWeek: 'Monday',
      startTime: '07:30:00',
      endTime: '08:30:00',
      subjectId: 0,
      teacherId: 0,
      isActive: true
    });
  }

  addBulkLine(): void {
    this.bulkLines.push(this.createBulkLine());
  }

  removeBulkLine(index: number): void {
    if (this.bulkLines.length <= 1) return;
    this.bulkLines.removeAt(index);
  }

  saveBulkWeekly(): void {
    if (!this.auth.isAdmin()) return;
    if (this.bulkForm.invalid) {
      this.bulkForm.markAllAsTouched();
      return;
    }
    const v = this.bulkForm.getRawValue();
    this.submitting.set(true);
    this.service
      .bulkWeekly({
        class: v.class.trim(),
        section: v.section.trim(),
        lines: (v.lines ?? []).map((line) => ({
          dayOfWeek: line.dayOfWeek,
          startTime: this.toApiTime(line.startTime),
          endTime: this.toApiTime(line.endTime),
          subjectId: Number(line.subjectId),
          teacherId: Number(line.teacherId),
          isActive: line.isActive
        }))
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.toast.show('Weekly timetable upserted.', 'success');
          this.loadEntries();
          this.loadClassSectionView();
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('Bulk weekly upsert failed. Check duplicate/conflict rules.', 'error');
        }
      });
  }

  resetBulkForm(): void {
    this.bulkForm.reset({ class: '', section: '' });
    while (this.bulkLines.length > 0) this.bulkLines.removeAt(0);
    this.bulkLines.push(this.createBulkLine());
  }

  onPage(e: PageEvent): void {
    const sizeChanged = e.pageSize !== this.pageSize;
    this.pageSize = e.pageSize;
    this.pageIndex = sizeChanged ? 0 : e.pageIndex;
    this.loadEntries();
  }

  getClassValue(row: TimetableEntry): string {
    return row.class ?? row.className ?? '—';
  }

  getTimeRange(row: TimetableEntry): string {
    if (row.startTime && row.endTime) return `${this.toHm(row.startTime)} - ${this.toHm(row.endTime)}`;
    if (row.hourNumber) return `Hour ${row.hourNumber}`;
    return '—';
  }

  private toApiTime(value: string): string {
    const v = value.trim();
    if (/^\d{2}:\d{2}:\d{2}$/.test(v)) return v;
    if (/^\d{2}:\d{2}$/.test(v)) return `${v}:00`;
    return v;
  }

  private toHm(value: string): string {
    return value.slice(0, 5);
  }

  private buildWeeklyRows(rows: TimetableEntry[]): Array<{ slot: string; cells: Array<TimetableEntry | null> }> {
    const dayIndex: Record<TimetableDayOfWeek, number> = {
      Monday: 0,
      Tuesday: 1,
      Wednesday: 2,
      Thursday: 3,
      Friday: 4,
      Saturday: 5,
      Sunday: 6
    };
    const keys = Array.from(
      new Set(
        rows
          .map((r) => (r.startTime && r.endTime ? `${r.startTime}|${r.endTime}` : r.hourNumber ? `H|${r.hourNumber}` : ''))
          .filter(Boolean)
      )
    ).sort((a, b) => {
      const [aStart] = a.split('|');
      const [bStart] = b.split('|');
      return aStart.localeCompare(bStart);
    });
    return keys.map((key) => {
      const [start, endOrHour] = key.split('|');
      const cells: Array<TimetableEntry | null> = new Array(7).fill(null);
      for (const row of rows) {
        const rowKey =
          row.startTime && row.endTime ? `${row.startTime}|${row.endTime}` : row.hourNumber ? `H|${row.hourNumber}` : '';
        if (rowKey !== key) continue;
        const idx = dayIndex[row.dayOfWeek];
        cells[idx] = row;
      }
      const slot = start === 'H' ? `Hour ${endOrHour}` : `${this.toHm(start)} - ${this.toHm(endOrHour)}`;
      return { slot, cells };
    });
  }
}
