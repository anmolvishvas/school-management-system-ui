export interface Teacher {
  id: number;
  userId?: number;
  fullName: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export interface TeacherAllocation {
  id: number;
  teacherId: number;
  teacherName?: string;
  subjectId: number;
  subjectName?: string;
  class?: string;
  className?: string;
  section?: string;
  isClassTeacher?: boolean;
  isActive?: boolean;
}

export interface TeacherAllocationListResponse {
  data: TeacherAllocation[];
  total: number;
}

export interface TeacherPlanSubject {
  subjectId: number;
  subjectName?: string;
  weeklyPeriods?: number;
}

export interface TeacherPlanClassGroup {
  className?: string;
  section?: string;
  subjects?: TeacherPlanSubject[];
}

export interface TeacherTeachingPlan {
  teacher?: Teacher;
  groups?: TeacherPlanClassGroup[];
}
