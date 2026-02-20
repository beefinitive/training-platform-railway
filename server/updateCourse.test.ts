import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { courses, courseEnrollments, courseExpenses, courseFees } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('updateCourse - date synchronization', () => {
  let testCourseId: number;
  let testFeeId: number;
  let testEnrollmentId: number;
  let testExpenseId: number;
  
  const originalStartDate = new Date('2026-03-01');
  const newStartDate = new Date('2026-04-01');
  const originalEnrollmentDate = new Date('2026-03-05');
  const originalExpenseDate = new Date('2026-03-10');
  
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Create test course
    const courseResult = await db.insert(courses).values({
      name: 'Test Course for Date Sync',
      courseCode: 'TEST-DATE-001',
      instructorId: null,
      instructorName: 'Test Instructor',
      startDate: originalStartDate,
      endDate: new Date('2026-03-15'),
      status: 'active',
    });
    testCourseId = courseResult[0].insertId;
    
    // Create test fee
    const feeResult = await db.insert(courseFees).values({
      courseId: testCourseId,
      name: 'Test Fee',
      amount: '500',
    });
    testFeeId = feeResult[0].insertId;
    
    // Create test enrollment with original date
    const enrollmentResult = await db.insert(courseEnrollments).values({
      courseId: testCourseId,
      feeId: testFeeId,
      traineeCount: 5,
      paidAmount: '2500',
      enrollmentDate: originalEnrollmentDate,
    });
    testEnrollmentId = enrollmentResult[0].insertId;
    
    // Create test expense with original date
    const expenseResult = await db.insert(courseExpenses).values({
      courseId: testCourseId,
      expenseType: 'marketing',
      amount: '100',
      expenseDate: originalExpenseDate,
    });
    testExpenseId = expenseResult[0].insertId;
  });
  
  afterAll(async () => {
    const db = await getDb();
    if (!db) return;
    
    // Clean up test data
    await db.delete(courseExpenses).where(eq(courseExpenses.id, testExpenseId));
    await db.delete(courseEnrollments).where(eq(courseEnrollments.id, testEnrollmentId));
    await db.delete(courseFees).where(eq(courseFees.id, testFeeId));
    await db.delete(courses).where(eq(courses.id, testCourseId));
  });
  
  it('should update enrollment and expense dates when course start date changes', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Import updateCourse function
    const { updateCourse } = await import('./db');
    
    // Get dates before update
    const beforeEnrollment = await db.select()
      .from(courseEnrollments)
      .where(eq(courseEnrollments.id, testEnrollmentId))
      .limit(1);
    const beforeExpense = await db.select()
      .from(courseExpenses)
      .where(eq(courseExpenses.id, testExpenseId))
      .limit(1);
    
    // Update course start date (moving from March 1 to April 1 = 31 days)
    await updateCourse(testCourseId, {
      startDate: newStartDate.toISOString().split('T')[0],
    });
    
    // Verify enrollment date was updated
    const updatedEnrollment = await db.select()
      .from(courseEnrollments)
      .where(eq(courseEnrollments.id, testEnrollmentId))
      .limit(1);
    
    const beforeEnrollmentMs = new Date(beforeEnrollment[0].enrollmentDate).getTime();
    const afterEnrollmentMs = new Date(updatedEnrollment[0].enrollmentDate).getTime();
    const enrollmentDiffDays = Math.round((afterEnrollmentMs - beforeEnrollmentMs) / (24 * 60 * 60 * 1000));
    
    // The enrollment date should have moved by 31 days (March 1 to April 1)
    expect(enrollmentDiffDays).toBe(31);
    
    // Verify expense date was updated
    const updatedExpense = await db.select()
      .from(courseExpenses)
      .where(eq(courseExpenses.id, testExpenseId))
      .limit(1);
    
    const beforeExpenseMs = new Date(beforeExpense[0].expenseDate).getTime();
    const afterExpenseMs = new Date(updatedExpense[0].expenseDate).getTime();
    const expenseDiffDays = Math.round((afterExpenseMs - beforeExpenseMs) / (24 * 60 * 60 * 1000));
    
    // The expense date should have moved by 31 days
    expect(expenseDiffDays).toBe(31);
  });
  
  it('should not update dates when only course name changes', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const { updateCourse } = await import('./db');
    
    // Get current dates before update
    const beforeEnrollment = await db.select()
      .from(courseEnrollments)
      .where(eq(courseEnrollments.id, testEnrollmentId))
      .limit(1);
    
    const beforeExpense = await db.select()
      .from(courseExpenses)
      .where(eq(courseExpenses.id, testExpenseId))
      .limit(1);
    
    // Update only course name
    await updateCourse(testCourseId, {
      name: 'Updated Test Course Name',
    });
    
    // Verify dates remain unchanged
    const afterEnrollment = await db.select()
      .from(courseEnrollments)
      .where(eq(courseEnrollments.id, testEnrollmentId))
      .limit(1);
    
    const afterExpense = await db.select()
      .from(courseExpenses)
      .where(eq(courseExpenses.id, testExpenseId))
      .limit(1);
    
    expect(new Date(afterEnrollment[0].enrollmentDate).getTime())
      .toBe(new Date(beforeEnrollment[0].enrollmentDate).getTime());
    
    expect(new Date(afterExpense[0].expenseDate).getTime())
      .toBe(new Date(beforeExpense[0].expenseDate).getTime());
  });
});
