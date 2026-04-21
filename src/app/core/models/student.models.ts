/** Paged list returned by GET /api/Students */
export interface PagedStudents {
  data: Student[];
  total: number;
  page?: number;
  pageSize?: number;
}

/** Student row / detail (camelCase JSON from ASP.NET). */
export interface Student {
  id: number;
  name: string;
  /** Serialized name for class may be `class` or `className` depending on DTO. */
  class?: string;
  className?: string;
  section?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  parentGuardianName?: string;
  parentGuardianPhone?: string;
  admissionNumber?: string;
  admissionDate?: string | null;
  notes?: string;
  isActive?: boolean;
}

/** Payload for POST/PUT /api/Students (keys aligned with common EF DTO naming). */
export interface StudentUpsert {
  name: string;
  class: string;
  section: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  parentGuardianName?: string;
  parentGuardianPhone?: string;
  admissionNumber?: string;
  admissionDate?: string | null;
  notes?: string;
  isActive?: boolean;
}

export interface StudentStatsBucket {
  label: string;
  count: number;
}

export interface StudentStats {
  byClass: StudentStatsBucket[];
  bySection: StudentStatsBucket[];
}
