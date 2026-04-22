import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { AttendanceService } from './attendance.service';
import { PeriodAttendanceService } from './period-attendance.service';
import { TeachersService } from './teachers.service';
import { SubjectsService } from '../subjects/subjects.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import type {
  AttendanceBulkDayRequest,
  AttendanceRecord,
  PeriodAttendanceBulkMarkRequest,
  PeriodAttendanceRecord,
  AttendanceStatus,
  AttendanceSummary
} from '../../core/models/attendance.models';
import type { Subject } from '../../core/models/subjects.models';
import type { Student } from '../../core/models/student.models';
import { StudentsService } from '../students/students.service';
import type { Teacher, TeacherAllocation, TeacherTeachingPlan } from '../../core/models/teachers.models';

interface DayPeriod {
  id: number;
  subject: string;
  teacher: string;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatTabsModule
  ],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.css'
})
export class AttendanceComponent implements OnInit {
  private readonly attendance = inject(AttendanceService);
  private readonly periodAttendance = inject(PeriodAttendanceService);
  private readonly teachersService = inject(TeachersService);
  private readonly subjectsService = inject(SubjectsService);
  private readonly studentsService = inject(StudentsService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly dateCtrl = new FormControl(this.todayISO(), { nonNullable: true });
  readonly fromCtrl = new FormControl(this.monthStartISO(), { nonNullable: true });
  readonly toCtrl = new FormControl(this.todayISO(), { nonNullable: true });
  readonly classCtrl = new FormControl('', { nonNullable: true });
  readonly sectionCtrl = new FormControl('', { nonNullable: true });
  readonly subjectCtrl = new FormControl('', { nonNullable: true });
  readonly teacherCtrl = new FormControl('', { nonNullable: true });
  readonly startTimeCtrl = new FormControl('09:00', { nonNullable: true });
  readonly endTimeCtrl = new FormControl('10:00', { nonNullable: true });
  readonly hourNumberCtrl = new FormControl(1, { nonNullable: true });
  readonly periodSubjectIdCtrl = new FormControl<number | null>(null);

  readonly subjectNameCtrl = new FormControl('', { nonNullable: true });
  readonly allocationTeacherIdCtrl = new FormControl<number | null>(null);
  readonly allocationSubjectIdCtrl = new FormControl<number | null>(null);

  readonly rows = signal<AttendanceRecord[]>([]);
  readonly periodRows = signal<AttendanceRecord[]>([]);
  readonly summary = signal<AttendanceSummary | null>(null);
  readonly allStudents = signal<Student[]>([]);
  readonly subjects = signal<Subject[]>([]);
  readonly teachers = signal<Teacher[]>([]);
  readonly allocations = signal<TeacherAllocation[]>([]);
  readonly selectedTeacherPlan = signal<TeacherTeachingPlan | null>(null);
  readonly loadingSheet = signal(false);
  readonly loadingPeriodSheet = signal(false);
  readonly saving = signal(false);
  readonly periodSaving = signal(false);
  readonly loadingSummary = signal(false);
  readonly loadingStudents = signal(false);
  readonly listLoading = signal(false);
  readonly periodListLoading = signal(false);
  readonly attendanceList = signal<AttendanceRecord[]>([]);
  readonly periodAttendanceList = signal<PeriodAttendanceRecord[]>([]);
  readonly listTotal = signal(0);
  readonly periodListTotal = signal(0);
  readonly periods = signal<DayPeriod[]>([]);
  readonly selectedPeriodId = signal<number | null>(null);
  listPageIndex = 0;
  listPageSize = 10;
  periodListPageIndex = 0;
  periodListPageSize = 10;
  private periodSeq = 1;

  readonly statusOptions: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Excused', 'HalfDay'];
  readonly displayedColumns = ['studentId', 'studentName', 'className', 'section', 'status', 'remark'];
  readonly listColumns = ['date', 'studentId', 'studentName', 'className', 'section', 'status', 'notes', 'actions'];
  readonly periodListColumns = [
    'date',
    'hourNumber',
    'subjectName',
    'teacherName',
    'studentId',
    'studentName',
    'status',
    'notes'
  ];

  ngOnInit(): void {
    this.seedDefaultPeriod();
    this.loadStudentsForBulk();
    this.loadSubjects();
    this.loadTeachers();
    this.loadAllocations();
    this.loadDaily();
    this.loadPeriodDaily();
    this.loadSummary();
    this.loadAttendanceList();
    this.loadPeriodAttendanceList();
  }

  onFilterChange(): void {
    this.loadStudentsForBulk();
    this.loadDaily();
    this.loadPeriodDaily();
    this.loadSummary();
    this.listPageIndex = 0;
    this.periodListPageIndex = 0;
    this.loadAllocations();
    this.loadAttendanceList();
    this.loadPeriodAttendanceList();
  }

  private loadStudentsForBulk(): void {
    this.loadingStudents.set(true);
    this.studentsService
      .getPage({
        page: 1,
        pageSize: 1000,
        sortBy: 'name',
        order: 'asc',
        className: this.classCtrl.value || undefined,
        section: this.sectionCtrl.value || undefined,
        activeOnly: true
      })
      .subscribe({
        next: (res) => {
          this.allStudents.set(res.data ?? []);
          this.loadingStudents.set(false);
          this.loadDaily();
        },
        error: () => {
          this.loadingStudents.set(false);
          this.allStudents.set([]);
        }
      });
  }

  loadDaily(): void {
    this.loadingSheet.set(true);
    this.attendance.getDailySheet(this.dateCtrl.value, this.classCtrl.value, this.sectionCtrl.value).subscribe({
      next: (records) => {
        const byStudent = new Map(records.map((r) => [r.studentId, r] as const));
        const rows = this.allStudents().length
          ? this.allStudents().map((s) => {
              const existing = byStudent.get(s.id);
              return (
                existing ?? {
                  id: 0,
                  studentId: s.id,
                  studentName: s.name,
                  className: (s.class ?? s.className ?? '').toString(),
                  section: s.section ?? '',
                  date: this.dateCtrl.value,
                  status: 'Present' as AttendanceStatus,
                  notes: ''
                }
              );
            })
          : records;
        this.rows.set(rows);
        this.loadingSheet.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.loadingSheet.set(false);
        this.toast.show('Unable to load attendance sheet.', 'error');
      }
    });
  }

  loadPeriodDaily(): void {
    const subjectId = this.periodSubjectIdCtrl.value;
    if (!subjectId) {
      this.periodRows.set([]);
      return;
    }
    this.loadingPeriodSheet.set(true);
    this.periodAttendance
      .getList({
        page: 1,
        pageSize: 1000,
        className: this.classCtrl.value || undefined,
        section: this.sectionCtrl.value || undefined,
        dateFrom: this.dateCtrl.value,
        dateTo: this.dateCtrl.value,
        hourNumber: this.hourNumberCtrl.value,
        subjectId
      })
      .subscribe({
        next: (res) => {
          const byStudent = new Map((res.data ?? []).map((r) => [r.studentId, r] as const));
          const rows = this.allStudents().map((s) => {
            const existing = byStudent.get(s.id);
            return (
              existing ?? {
                id: 0,
                studentId: s.id,
                studentName: s.name,
                className: (s.class ?? s.className ?? '').toString(),
                section: s.section ?? '',
                date: this.dateCtrl.value,
                status: 'Present' as AttendanceStatus,
                notes: ''
              }
            );
          });
          this.periodRows.set(rows);
          this.loadingPeriodSheet.set(false);
        },
        error: () => {
          this.periodRows.set([]);
          this.loadingPeriodSheet.set(false);
        }
      });
  }

  loadSubjects(): void {
    this.subjectsService.getSubjects(true).subscribe({
      next: (rows) => {
        this.subjects.set(rows ?? []);
        if (!this.periodSubjectIdCtrl.value && rows?.length) {
          this.periodSubjectIdCtrl.setValue(rows[0].id);
          this.loadPeriodDaily();
        }
      },
      error: () => this.subjects.set([])
    });
  }

  loadTeachers(): void {
    this.teachersService.getTeachers(true).subscribe({
      next: (rows) => this.teachers.set(rows ?? []),
      error: () => this.teachers.set([])
    });
  }

  loadAllocations(): void {
    this.teachersService
      .getAllocations({
        page: 1,
        pageSize: 200,
        className: this.classCtrl.value || undefined,
        section: this.sectionCtrl.value || undefined,
        activeOnly: true
      })
      .subscribe({
        next: (res) => this.allocations.set(res.data ?? []),
        error: () => this.allocations.set([])
      });
  }

  loadSummary(): void {
    this.loadingSummary.set(true);
    this.attendance.getSummary(this.fromCtrl.value, this.toCtrl.value, this.classCtrl.value, this.sectionCtrl.value).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loadingSummary.set(false);
      },
      error: () => {
        this.summary.set(null);
        this.loadingSummary.set(false);
      }
    });
  }

  loadAttendanceList(): void {
    this.listLoading.set(true);
    this.attendance
      .getList({
        page: this.listPageIndex + 1,
        pageSize: this.listPageSize,
        className: this.classCtrl.value || undefined,
        section: this.sectionCtrl.value || undefined,
        dateFrom: this.fromCtrl.value || undefined,
        dateTo: this.toCtrl.value || undefined,
        sortBy: 'date',
        order: 'desc'
      })
      .subscribe({
        next: (res) => {
          this.attendanceList.set(res.data ?? []);
          this.listTotal.set(res.total ?? 0);
          this.listLoading.set(false);
        },
        error: () => {
          this.attendanceList.set([]);
          this.listTotal.set(0);
          this.listLoading.set(false);
        }
      });
  }

  loadPeriodAttendanceList(): void {
    this.periodListLoading.set(true);
    this.periodAttendance
      .getList({
        page: this.periodListPageIndex + 1,
        pageSize: this.periodListPageSize,
        className: this.classCtrl.value || undefined,
        section: this.sectionCtrl.value || undefined,
        dateFrom: this.fromCtrl.value || undefined,
        dateTo: this.toCtrl.value || undefined,
        subjectId: this.periodSubjectIdCtrl.value ?? undefined,
        hourNumber: this.hourNumberCtrl.value || undefined
      })
      .subscribe({
        next: (res) => {
          this.periodAttendanceList.set(res.data ?? []);
          this.periodListTotal.set(res.total ?? 0);
          this.periodListLoading.set(false);
        },
        error: () => {
          this.periodAttendanceList.set([]);
          this.periodListTotal.set(0);
          this.periodListLoading.set(false);
        }
      });
  }

  onStatusChange(studentId: number, value: AttendanceStatus): void {
    this.rows.update((rows) => rows.map((r) => (r.studentId === studentId ? { ...r, status: value } : r)));
  }

  onRemarkChange(studentId: number, value: string): void {
    this.rows.update((rows) => rows.map((r) => (r.studentId === studentId ? { ...r, notes: value } : r)));
  }

  onPeriodStatusChange(studentId: number, value: AttendanceStatus): void {
    this.periodRows.update((rows) => rows.map((r) => (r.studentId === studentId ? { ...r, status: value } : r)));
  }

  onPeriodRemarkChange(studentId: number, value: string): void {
    this.periodRows.update((rows) => rows.map((r) => (r.studentId === studentId ? { ...r, notes: value } : r)));
  }

  markAllPeriod(status: AttendanceStatus): void {
    this.periodRows.update((rows) => rows.map((r) => ({ ...r, status })));
  }

  markAll(status: AttendanceStatus): void {
    this.rows.update((rows) => rows.map((r) => ({ ...r, status })));
  }

  addPeriod(): void {
    const subject = this.subjectCtrl.value.trim();
    const teacher = this.teacherCtrl.value.trim();
    const startTime = this.startTimeCtrl.value;
    const endTime = this.endTimeCtrl.value;
    if (!subject || !teacher) {
      this.toast.show('Enter both subject and teacher before adding a period.', 'error');
      return;
    }
    if (this.diffMinutes(startTime, endTime) <= 0) {
      this.toast.show('End time must be after start time.', 'error');
      return;
    }

    const sameSubject = this.periods().find((p) => p.subject.toLowerCase() === subject.toLowerCase());
    if (sameSubject && sameSubject.teacher.toLowerCase() !== teacher.toLowerCase()) {
      this.toast.show('A subject can have only one teacher. Update the existing period teacher.', 'error');
      return;
    }

    const id = this.periodSeq++;
    this.periods.update((rows) => [...rows, { id, subject, teacher, startTime, endTime }]);
    this.selectedPeriodId.set(id);
    this.subjectCtrl.setValue('');
    this.teacherCtrl.setValue('');
  }

  selectPeriod(id: number): void {
    this.selectedPeriodId.set(id);
  }

  removePeriod(id: number): void {
    const next = this.periods().filter((p) => p.id !== id);
    this.periods.set(next);
    if (this.selectedPeriodId() === id) {
      this.selectedPeriodId.set(next.length ? next[0].id : null);
    }
  }

  periodHoursFor(startTime: string, endTime: string): string {
    const minutes = this.diffMinutes(startTime, endTime);
    if (minutes <= 0) return '0.0';
    return (minutes / 60).toFixed(2);
  }

  saveDaily(): void {
    const className = this.classCtrl.value.trim();
    const section = this.sectionCtrl.value.trim();
    if (!className || !section) {
      this.toast.show('Class and section are required for bulk-day save.', 'error');
      return;
    }

    const payload: AttendanceBulkDayRequest = {
      date: this.dateCtrl.value,
      class: className,
      section,
      lines: this.rows().map((r) => ({
        studentId: r.studentId,
        status: r.status,
        notes: this.composeNotes(r.notes)
      }))
    };
    this.saving.set(true);
    this.attendance.upsertBulkDay(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.show('Attendance saved successfully.', 'success');
        this.loadSummary();
        this.loadAttendanceList();
      },
      error: () => {
        this.saving.set(false);
        this.toast.show('Save failed. Verify class/section and attendance API permissions.', 'error');
      }
    });
  }

  savePeriodAttendance(): void {
    const className = this.classCtrl.value.trim();
    const section = this.sectionCtrl.value.trim();
    const subjectId = this.periodSubjectIdCtrl.value;
    const hourNumber = this.hourNumberCtrl.value;
    if (!className || !section || !subjectId || !hourNumber) {
      this.toast.show('Class, section, subject and hour are required for period attendance.', 'error');
      return;
    }
    const payload: PeriodAttendanceBulkMarkRequest = {
      date: this.dateCtrl.value,
      class: className,
      section,
      subjectId,
      hourNumber,
      lines: this.periodRows().map((r) => ({
        studentId: r.studentId,
        status: r.status,
        notes: this.composeNotes(r.notes)
      }))
    };
    this.periodSaving.set(true);
    this.periodAttendance.bulkMark(payload).subscribe({
      next: () => {
        this.periodSaving.set(false);
        this.toast.show('Period attendance saved.', 'success');
        this.loadPeriodAttendanceList();
      },
      error: () => {
        this.periodSaving.set(false);
        this.toast.show('Period save failed.', 'error');
      }
    });
  }

  presentCount(): number {
    return this.rows().filter((r) => r.status === 'Present').length;
  }

  absentCount(): number {
    return this.rows().filter((r) => r.status === 'Absent').length;
  }

  onListPage(e: PageEvent): void {
    const sizeChanged = e.pageSize !== this.listPageSize;
    this.listPageSize = e.pageSize;
    this.listPageIndex = sizeChanged ? 0 : e.pageIndex;
    this.loadAttendanceList();
  }

  onPeriodListPage(e: PageEvent): void {
    const sizeChanged = e.pageSize !== this.periodListPageSize;
    this.periodListPageSize = e.pageSize;
    this.periodListPageIndex = sizeChanged ? 0 : e.pageIndex;
    this.loadPeriodAttendanceList();
  }

  editAttendanceRow(row: AttendanceRecord): void {
    if (!row.id || !this.canWriteAttendance()) return;
    this.attendance.updateRow(row.id, { status: row.status, notes: row.notes || undefined }).subscribe({
      next: () => this.toast.show('Attendance row updated.', 'success'),
      error: () => this.toast.show('Update failed.', 'error')
    });
  }

  deleteAttendanceRow(row: AttendanceRecord): void {
    if (!row.id || !this.auth.isAdmin()) return;
    if (!confirm('Delete this attendance row?')) return;
    this.attendance.deleteRow(row.id).subscribe({
      next: () => {
        this.toast.show('Attendance row deleted.', 'success');
        this.loadAttendanceList();
      },
      error: () => this.toast.show('Delete failed.', 'error')
    });
  }

  canWriteAttendance(): boolean {
    return this.auth.hasRole('Admin') || this.auth.hasRole('Teacher');
  }

  createSubject(): void {
    if (!this.auth.isAdmin()) return;
    const name = this.subjectNameCtrl.value.trim();
    if (!name) {
      this.toast.show('Subject name is required.', 'error');
      return;
    }
    this.subjectsService
      .create({
        name,
        isActive: true
      })
      .subscribe({
        next: () => {
          this.toast.show('Subject created.', 'success');
          this.subjectNameCtrl.setValue('');
          this.loadSubjects();
        },
        error: () => this.toast.show('Subject create failed.', 'error')
      });
  }

  createAllocation(): void {
    if (!this.auth.isAdmin()) return;
    const teacherId = this.allocationTeacherIdCtrl.value;
    const subjectId = this.allocationSubjectIdCtrl.value;
    if (!teacherId || !subjectId) {
      this.toast.show('Teacher and subject are required for allocation.', 'error');
      return;
    }
    this.teachersService
      .createAllocation({
        teacherId,
        subjectId,
        class: this.classCtrl.value.trim() || undefined,
        section: this.sectionCtrl.value.trim() || undefined,
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
    if (!this.auth.isAdmin()) return;
    if (!confirm('Delete this allocation?')) return;
    this.teachersService.deleteAllocation(id).subscribe({
      next: () => {
        this.toast.show('Allocation deleted.', 'success');
        this.loadAllocations();
      },
      error: () => this.toast.show('Allocation delete failed.', 'error')
    });
  }

  loadTeacherPlan(teacherId: number): void {
    this.teachersService.getTeachingPlan(teacherId, this.fromCtrl.value, this.toCtrl.value, true).subscribe({
      next: (plan) => this.selectedTeacherPlan.set(plan),
      error: () => this.selectedTeacherPlan.set(null)
    });
  }

  deleteSubject(id: number): void {
    if (!this.auth.isAdmin()) return;
    if (!confirm('Delete this subject?')) return;
    this.subjectsService.delete(id).subscribe({
      next: () => {
        this.toast.show('Subject deleted.', 'success');
        this.loadSubjects();
      },
      error: () => this.toast.show('Subject delete failed.', 'error')
    });
  }

  periodHours(): string {
    const start = this.startTimeCtrl.value;
    const end = this.endTimeCtrl.value;
    const minutes = this.diffMinutes(start, end);
    if (minutes <= 0) return '0.0';
    return (minutes / 60).toFixed(2);
  }

  private composeNotes(base?: string): string | undefined {
    const selected = this.currentPeriod();
    const subject = selected?.subject ?? this.subjectCtrl.value.trim();
    const teacher = selected?.teacher ?? this.teacherCtrl.value.trim();
    const start = selected?.startTime ?? this.startTimeCtrl.value;
    const end = selected?.endTime ?? this.endTimeCtrl.value;
    const hours = selected ? this.periodHoursFor(selected.startTime, selected.endTime) : this.periodHours();
    const prefixParts: string[] = [];
    if (subject) prefixParts.push(`Subject=${subject}`);
    if (teacher) prefixParts.push(`Teacher=${teacher}`);
    if (start && end) prefixParts.push(`Period=${start}-${end}`);
    if (Number(hours) > 0) prefixParts.push(`Hours=${hours}`);
    const prefix = prefixParts.length ? `[${prefixParts.join(' | ')}]` : '';
    const extra = base?.trim() ?? '';
    const full = [prefix, extra].filter(Boolean).join(' ');
    return full || undefined;
  }

  private diffMinutes(start: string, end: string): number {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
    return eh * 60 + em - (sh * 60 + sm);
  }

  private currentPeriod(): DayPeriod | null {
    const id = this.selectedPeriodId();
    if (id === null) return null;
    return this.periods().find((p) => p.id === id) ?? null;
  }

  private seedDefaultPeriod(): void {
    const id = this.periodSeq++;
    this.periods.set([
      {
        id,
        subject: 'General',
        teacher: this.auth.getRole() === 'Teacher' ? 'Current Teacher' : 'Unassigned',
        startTime: this.startTimeCtrl.value,
        endTime: this.endTimeCtrl.value
      }
    ]);
    this.selectedPeriodId.set(id);
  }

  private todayISO(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private monthStartISO(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  }
}
