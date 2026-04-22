import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AttendanceComponent } from './attendance.component';
import { AttendanceService } from './attendance.service';
import { PeriodAttendanceService } from './period-attendance.service';
import { TeachersService } from './teachers.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { StudentsService } from '../students/students.service';

describe('AttendanceComponent', () => {
  let fixture: ComponentFixture<AttendanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceComponent],
      providers: [
        {
          provide: AttendanceService,
          useValue: {
            getDailySheet: () => of([]),
            getSummary: () => of(null),
            getList: () => of({ data: [], total: 0 }),
            upsertBulkDay: () => of({})
          }
        },
        {
          provide: PeriodAttendanceService,
          useValue: {
            getSubjects: () => of([]),
            getList: () => of({ data: [], total: 0 }),
            bulkMark: () => of({}),
            createSubject: () => of({}),
            deleteSubject: () => of({})
          }
        },
        {
          provide: TeachersService,
          useValue: {
            getTeachers: () => of([]),
            getAllocations: () => of({ data: [], total: 0 }),
            createAllocation: () => of({}),
            deleteAllocation: () => of({}),
            getTeachingPlan: () => of(null)
          }
        },
        {
          provide: StudentsService,
          useValue: {
            getPage: () => of({ data: [], total: 0 })
          }
        },
        {
          provide: ToastService,
          useValue: { show: () => undefined }
        },
        {
          provide: AuthService,
          useValue: { getRole: () => 'Teacher', hasRole: () => true, isAdmin: () => true }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
