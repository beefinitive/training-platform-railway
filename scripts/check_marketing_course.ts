import { db } from '../server/db';
import { courses, courseEnrollments } from '../drizzle/schema';
import { eq, like, or } from 'drizzle-orm';

async function check() {
  // Get marketing courses
  const marketingCourses = await db.select().from(courses).where(
    or(
      like(courses.name, '%تسويق%'),
      like(courses.name, '%التسويق%')
    )
  );
  
  console.log('=== Marketing Courses ===');
  for (const c of marketingCourses) {
    console.log('ID:', c.id);
    console.log('Name:', c.name);
    console.log('Start Date:', c.startDate);
    console.log('End Date:', c.endDate);
    console.log('Status:', c.status);
    console.log('---');
    
    // Get enrollments for this course
    const enrollments = await db.select().from(courseEnrollments).where(eq(courseEnrollments.courseId, c.id));
    console.log('Enrollments:', enrollments.length);
    for (const e of enrollments) {
      console.log('  - Enrollment Date:', e.enrollmentDate, 'Amount:', e.amount, 'Trainees:', e.traineesCount);
    }
    console.log('===');
  }
  
  process.exit(0);
}

check();
