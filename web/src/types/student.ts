export type EnrollmentStatus = 'active' | 'inactive' | 'suspended' | 'graduated' | 'withdrawn';

export interface Student {
  id: string;
  student_id: string;
  user_id: string | null;
  year_level: number;
  enrollment_status: EnrollmentStatus;
  created_at: string;
  updated_at: string;
  course_id: string | null;
  // Additional fields for display
  first_name?: string;
  last_name?: string;
  email?: string;
  course_name?: string;
}