export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused' | 'HalfDay';

/** GET /api/Attendance row */
export interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName?: string;
  className?: string;
  section?: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendancePagedResponse {
  data: AttendanceRecord[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface AttendanceListQuery {
  page: number;
  pageSize: number;
  studentId?: number;
  className?: string;
  section?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface AttendanceBulkDayRequest {
  date: string;
  class: string;
  section: string;
  lines: Array<{
    studentId: number;
    status: AttendanceStatus;
    notes?: string;
  }>;
}

export interface AttendanceSummary {
  from: string;
  to: string;
  className?: string;
  section?: string;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
  totalHalfDay: number;
  attendanceRatePercent: number;
}

export interface PeriodAttendanceSubject {
  id: number;
  name: string;
  className?: string;
  section?: string;
  teacherName?: string;
  isActive?: boolean;
}

export interface PeriodAttendanceRecord {
  id: number;
  studentId: number;
  studentName?: string;
  className?: string;
  section?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  hourNumber: number;
  subjectId: number;
  subjectName?: string;
  teacherName?: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface PeriodAttendanceListQuery {
  page: number;
  pageSize: number;
  studentId?: number;
  subjectId?: number;
  className?: string;
  section?: string;
  dateFrom?: string;
  dateTo?: string;
  hourNumber?: number;
}

export interface PeriodAttendanceBulkMarkRequest {
  date: string;
  class: string;
  section: string;
  subjectId: number;
  hourNumber: number;
  lines: Array<{
    studentId: number;
    status: AttendanceStatus;
    notes?: string;
  }>;
}

export interface PeriodAttendanceBulkMarkTimetableRequest {
  date: string;
  timetableEntryId: number;
  lines: Array<{
    studentId: number;
    status: AttendanceStatus;
    notes?: string;
  }>;
}
