import { Student, EnrollmentStatus } from '@/types/student';

const enrollmentStatuses: EnrollmentStatus[] = ['active', 'inactive', 'suspended', 'graduated', 'withdrawn'];
const courses = [
  { id: 'cs-001', name: 'Computer Science' },
  { id: 'eng-001', name: 'Engineering' },
  { id: 'bus-001', name: 'Business Administration' },
  { id: 'med-001', name: 'Medicine' },
  { id: 'law-001', name: 'Law' },
  { id: 'art-001', name: 'Fine Arts' },
];

const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Christopher', 'Ashley', 'Matthew', 'Jessica', 'Andrew', 'Amanda', 'Joshua', 'Stephanie', 'Daniel', 'Jennifer', 'Ryan', 'Elizabeth', 'Nicholas', 'Samantha'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

export const generateMockStudents = (count: number = 50): Student[] => {
  const students: Student[] = [];
  
  for (let i = 1; i <= count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const course = courses[Math.floor(Math.random() * courses.length)];
    const enrollmentStatus = enrollmentStatuses[Math.floor(Math.random() * enrollmentStatuses.length)];
    
    const student: Student = {
      id: `student-${i.toString().padStart(3, '0')}`,
      student_id: `STU${(2024000 + i).toString()}`,
      user_id: `user-${i.toString().padStart(3, '0')}`,
      year_level: Math.floor(Math.random() * 4) + 1,
      enrollment_status: enrollmentStatus,
      created_at: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      updated_at: new Date().toISOString(),
      course_id: course.id,
      first_name: firstName,
      last_name: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@university.edu`,
      course_name: course.name,
    };
    
    students.push(student);
  }
  
  return students;
};

export const mockStudents = generateMockStudents();