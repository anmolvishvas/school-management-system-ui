/** Row from GET /api/Accountants (camelCase JSON from ASP.NET). */
export interface Accountant {
  id: number;
  userId?: number;
  fullName?: string;
  userName?: string;
  username?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}
