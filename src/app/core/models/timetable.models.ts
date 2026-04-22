export type TimetableDayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface TimetableEntry {
  id: number;
  class?: string;
  className?: string;
  section?: string;
  dayOfWeek: TimetableDayOfWeek;
  startTime?: string;
  endTime?: string;
  hourNumber?: number;
  subjectId: number;
  subjectName?: string;
  teacherId: number;
  teacherName?: string;
  isActive?: boolean;
}

export interface TimetablePagedResponse {
  data: TimetableEntry[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface TimetableQuery {
  page: number;
  pageSize: number;
  className?: string;
  section?: string;
  dayOfWeek?: TimetableDayOfWeek;
  teacherId?: number;
  activeOnly?: boolean;
}

export interface TimetableUpsertRequest {
  class: string;
  section: string;
  dayOfWeek: TimetableDayOfWeek;
  startTime: string;
  endTime: string;
  subjectId: number;
  teacherId: number;
  isActive?: boolean;
}

export interface TimetableBulkWeeklyRequest {
  class: string;
  section: string;
  lines: {
    dayOfWeek: TimetableDayOfWeek;
    startTime: string;
    endTime: string;
    subjectId: number;
    teacherId: number;
    isActive?: boolean;
  }[];
}
