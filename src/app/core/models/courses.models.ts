export interface Course {
  id: number;
  name: string;
  code?: string;
  isActive?: boolean;
}

export interface CoursesPagedResponse {
  data: Course[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface CourseSection {
  id: number;
  courseId: number;
  section: string;
  isActive?: boolean;
}

export interface CourseSubject {
  id: number;
  courseId: number;
  subjectId: number;
  subjectName?: string;
  isActive?: boolean;
}
