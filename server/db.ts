import { eq, desc, sql, and, gte, lte, ne, inArray, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  courses, InsertCourse, 
  courseFees, InsertCourseFee,
  courseEnrollments, InsertCourseEnrollment,
  courseExpenses, InsertCourseExpense,
  platformSettings, InsertPlatformSetting,
  instructors, InsertInstructor,
  courseTemplates, InsertCourseTemplate,
  services, InsertService,
  serviceTemplates, InsertServiceTemplate,
  operationalExpenses, InsertOperationalExpense,
  strategicTargets, InsertStrategicTarget,
  partnerships, InsertPartnership,
  innovativeIdeas, InsertInnovativeIdea,
  roles, InsertRole,
  permissions, InsertPermission,
  rolePermissions, InsertRolePermission,
  userPermissions, InsertUserPermission,
  projects, InsertProject,
  projectRevenues, InsertProjectRevenue,
  projectExpenses, InsertProjectExpense,
  employees, InsertEmployee,
  employeeTargets, InsertEmployeeTarget,
  employeeRewards, InsertEmployeeReward,
  attendance, InsertAttendance,
  dailyReports, InsertDailyReport,
  customerStats, InsertCustomerStat,
  monthlySalaries, InsertMonthlySalary,
  salaryAdjustments, InsertSalaryAdjustment,
  passwordHistory, InsertPasswordHistory,
  dailyStats, InsertDailyStat,
  projectEmployees, InsertProjectEmployee,
  publicRegistrations, InsertPublicRegistration,
  publicServices, InsertPublicService,
  serviceOrders, InsertServiceOrder,
  courseDisplaySettings, InsertCourseDisplaySetting,
  recordedCourses, InsertRecordedCourse,
  recordedCourseSections, InsertRecordedCourseSection,
  recordedCourseLessons, InsertRecordedCourseLesson,
  recordedCourseEnrollments, InsertRecordedCourseEnrollment,
  lessonProgress, InsertLessonProgress,
  recordedCourseReviews, InsertRecordedCourseReview,
  instructorEarnings, InsertInstructorEarning,
  courseViewLogs, InsertCourseViewLog,
  payments, InsertPayment,
  courseReviews, InsertCourseReview,
  certificates, InsertCertificate,
  quizzes, InsertQuiz,
  quizQuestions, InsertQuizQuestion,
  quizAnswers, InsertQuizAnswer,
  quizAttempts, InsertQuizAttempt,
  targetAlerts, InsertTargetAlert
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  const connectionString = process.env.DATABASE_URL || process.env.MYSQL_URL;
  if (!_db && connectionString) {
    try {
      _db = drizzle(connectionString);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER FUNCTIONS ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
      email: user.email || `${user.openId}@oauth.user`, // Email is required
    };
    const updateSet: Record<string, unknown> = {};

    // Handle name
    if (user.name !== undefined) {
      values.name = user.name ?? null;
      updateSet.name = user.name ?? null;
    }

    // Handle email
    if (user.email !== undefined) {
      values.email = user.email;
      updateSet.email = user.email;
    }

    // Handle loginMethod
    if (user.loginMethod !== undefined && user.loginMethod !== null) {
      const method = user.loginMethod as "password" | "oauth" | "google";
      values.loginMethod = method;
      updateSet.loginMethod = method;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    // Set roleId for admin if owner
    if (user.openId === ENV.ownerOpenId) {
      // Owner gets admin role (roleId will be set after roles are seeded)
      values.status = 'active';
      updateSet.status = 'active';
    } else {
      values.status = 'active';
      updateSet.status = 'active';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ COURSE FUNCTIONS ============

// Generate automatic course code: C-XX-MM-YYYY
// XX = sequential number for courses in that month
// MM = month of start date
// YYYY = year of start date
async function generateCourseCode(startDate: Date): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const year = startDate.getFullYear();
  const month = String(startDate.getMonth() + 1).padStart(2, '0');
  
  // Count existing courses in the same month and year
  const startOfMonth = new Date(year, startDate.getMonth(), 1);
  const endOfMonth = new Date(year, startDate.getMonth() + 1, 0);
  
  const existingCourses = await db.select({ count: sql<number>`COUNT(*)` })
    .from(courses)
    .where(
      and(
        gte(courses.startDate, startOfMonth),
        lte(courses.startDate, endOfMonth)
      )
    );
  
  const sequenceNumber = (existingCourses[0]?.count || 0) + 1;
  const sequence = String(sequenceNumber).padStart(2, '0');
  
  return `C-${sequence}-${month}-${year}`;
}

export async function createCourse(course: {
  name: string;
  templateId?: number;
  instructorId?: number;
  instructorName: string;
  startDate: string;
  endDate: string;
  description?: string;
  status?: "active" | "completed" | "cancelled";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startDateObj = new Date(course.startDate);
  const courseCode = await generateCourseCode(startDateObj);
  
  const result = await db.insert(courses).values({
    ...course,
    courseCode,
    startDate: startDateObj,
    endDate: new Date(course.endDate),
  });
  return result[0].insertId;
}

export async function updateCourse(id: number, course: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get the old course data to check if dates changed
  const oldCourse = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (!oldCourse[0]) throw new Error("Course not found");
  
  const oldStartDate = oldCourse[0].startDate;
  const newStartDate = course.startDate ? new Date(course.startDate as string) : null;
  
  // Calculate date difference before updating the course
  let dateDiff = 0;
  if (newStartDate && oldStartDate) {
    const oldDate = new Date(oldStartDate);
    // Normalize both dates to midnight UTC for accurate comparison
    const oldDateNormalized = new Date(Date.UTC(oldDate.getFullYear(), oldDate.getMonth(), oldDate.getDate()));
    const newDateNormalized = new Date(Date.UTC(newStartDate.getFullYear(), newStartDate.getMonth(), newStartDate.getDate()));
    dateDiff = newDateNormalized.getTime() - oldDateNormalized.getTime();
  }
  
  // Update the course
  await db.update(courses).set(course).where(eq(courses.id, id));
  
  // If start date changed, update all related data dates
  if (dateDiff !== 0 && newStartDate) {
    // Update enrollment dates
    const enrollments = await db.select().from(courseEnrollments).where(eq(courseEnrollments.courseId, id));
    for (const enrollment of enrollments) {
      const oldEnrollmentDate = new Date(enrollment.enrollmentDate);
      const newEnrollmentDate = new Date(oldEnrollmentDate.getTime() + dateDiff);
      await db.update(courseEnrollments)
        .set({ enrollmentDate: newEnrollmentDate })
        .where(eq(courseEnrollments.id, enrollment.id));
    }
    
    // Update expense dates
    const expenses = await db.select().from(courseExpenses).where(eq(courseExpenses.courseId, id));
    for (const expense of expenses) {
      const oldExpenseDate = new Date(expense.expenseDate);
      const newExpenseDate = new Date(oldExpenseDate.getTime() + dateDiff);
      await db.update(courseExpenses)
        .set({ expenseDate: newExpenseDate })
        .where(eq(courseExpenses.id, expense.id));
    }
    
    console.log(`[updateCourse] Updated dates for course ${id}: moved ${enrollments.length} enrollments and ${expenses.length} expenses by ${dateDiff / (1000 * 60 * 60 * 24)} days`);
  }
}

export async function deleteCourse(id: number, keepStatistics: boolean = true) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (keepStatistics) {
    // Soft delete - mark as cancelled but keep all data for statistics
    await db.update(courses).set({ status: "cancelled" }).where(eq(courses.id, id));
  } else {
    // Hard delete - remove all related data
    await db.delete(courseEnrollments).where(eq(courseEnrollments.courseId, id));
    await db.delete(courseExpenses).where(eq(courseExpenses.courseId, id));
    await db.delete(courseFees).where(eq(courseFees.courseId, id));
    await db.delete(courses).where(eq(courses.id, id));
  }
}

export async function getCourseById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  return result[0] || null;
}

export async function listCourses(includeDeleted: boolean = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (includeDeleted) {
    return db.select().from(courses).orderBy(desc(courses.createdAt));
  }
  
  // Exclude cancelled courses (soft deleted)
  return db.select().from(courses)
    .where(ne(courses.status, "cancelled"))
    .orderBy(desc(courses.createdAt));
}

// ============ ARCHIVE FUNCTIONS ============
export async function listArchivedCourses() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(courses)
    .where(eq(courses.status, "cancelled"))
    .orderBy(desc(courses.createdAt));
}

export async function restoreCourse(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(courses).set({ status: "completed" }).where(eq(courses.id, id));
}

export async function permanentlyDeleteCourse(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete all related data first
  await db.delete(courseEnrollments).where(eq(courseEnrollments.courseId, id));
  await db.delete(courseExpenses).where(eq(courseExpenses.courseId, id));
  await db.delete(courseFees).where(eq(courseFees.courseId, id));
  await db.delete(courses).where(eq(courses.id, id));
}

// ============ COURSE FEES FUNCTIONS ============
export async function createCourseFee(fee: Omit<InsertCourseFee, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(courseFees).values(fee);
  return result[0].insertId;
}

export async function updateCourseFee(id: number, fee: Partial<InsertCourseFee>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(courseFees).set(fee).where(eq(courseFees.id, id));
}

export async function deleteCourseFee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(courseFees).where(eq(courseFees.id, id));
}

export async function listCourseFees(courseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(courseFees).where(eq(courseFees.courseId, courseId));
}

// ============ ENROLLMENT FUNCTIONS (STATISTICAL) ============
export async function createEnrollment(enrollment: {
  courseId: number;
  feeId: number;
  traineeCount: number;
  paidAmount: string;
  enrollmentDate: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(courseEnrollments).values({
    ...enrollment,
    enrollmentDate: new Date(enrollment.enrollmentDate),
  });
  return result[0].insertId;
}

export async function updateEnrollment(id: number, enrollment: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get the existing enrollment to check if it has a linked dailyStatId
  const existing = await db.select().from(courseEnrollments).where(eq(courseEnrollments.id, id)).limit(1);
  const existingEnrollment = existing[0];
  
  // Calculate the difference in trainee count if it's being updated
  const oldTraineeCount = existingEnrollment?.traineeCount || 0;
  const newTraineeCount = enrollment.traineeCount as number | undefined;
  
  // Update the enrollment
  await db.update(courseEnrollments).set(enrollment).where(eq(courseEnrollments.id, id));
  
  // If the enrollment is linked to a daily stat and trainee count changed, update the daily stat
  if (existingEnrollment?.dailyStatId && newTraineeCount !== undefined && newTraineeCount !== oldTraineeCount) {
    const difference = newTraineeCount - oldTraineeCount;
    
    // Get the daily stat
    const dailyStat = await getDailyStatById(existingEnrollment.dailyStatId);
    if (dailyStat) {
      // Update the daily stat's confirmed customers
      const newConfirmedCustomers = (dailyStat.confirmedCustomers || 0) + difference;
      await db.update(dailyStats).set({
        confirmedCustomers: Math.max(0, newConfirmedCustomers),
        // Recalculate revenue if course fee is set
        calculatedRevenue: dailyStat.courseFee 
          ? (parseFloat(dailyStat.courseFee) * Math.max(0, newConfirmedCustomers)).toFixed(2)
          : dailyStat.calculatedRevenue,
      }).where(eq(dailyStats.id, existingEnrollment.dailyStatId));
      
      // Update the employee's targets
      if (dailyStat.employeeId) {
        await updateEmployeeTargetsFromDailyStats(dailyStat.employeeId);
      }
    }
  }
}

export async function deleteEnrollment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(courseEnrollments).where(eq(courseEnrollments.id, id));
}

export async function listEnrollmentsByCourse(courseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select({
      enrollment: courseEnrollments,
      fee: courseFees,
    })
    .from(courseEnrollments)
    .innerJoin(courseFees, eq(courseEnrollments.feeId, courseFees.id))
    .where(eq(courseEnrollments.courseId, courseId));
  
  return result;
}

// ============ EXPENSE FUNCTIONS ============
export async function createExpense(expense: {
  courseId: number;
  category: "certificates" | "instructor" | "marketing" | "tax" | "other";
  amount: string;
  expenseDate: string;
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(courseExpenses).values({
    ...expense,
    expenseDate: new Date(expense.expenseDate),
  });
  return result[0].insertId;
}

export async function updateExpense(id: number, expense: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(courseExpenses).set(expense).where(eq(courseExpenses.id, id));
}

export async function deleteExpense(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(courseExpenses).where(eq(courseExpenses.id, id));
}

export async function listExpensesByCourse(courseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(courseExpenses).where(eq(courseExpenses.courseId, courseId));
}

// ============ STATISTICS & REPORTS ============
export async function getCourseStatistics(courseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get enrollments with fees
  const enrollmentsData = await db
    .select({
      traineeCount: courseEnrollments.traineeCount,
      paidAmount: courseEnrollments.paidAmount,
    })
    .from(courseEnrollments)
    .where(eq(courseEnrollments.courseId, courseId));
  
  // Calculate total enrollments and revenue
  let totalEnrollments = 0;
  let totalRevenue = 0;
  
  for (const e of enrollmentsData) {
    totalEnrollments += e.traineeCount;
    totalRevenue += e.traineeCount * parseFloat(e.paidAmount);
  }
  
  // Get expenses
  const expensesData = await db
    .select({ amount: courseExpenses.amount })
    .from(courseExpenses)
    .where(eq(courseExpenses.courseId, courseId));
  
  const totalExpenses = expensesData.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  
  return {
    totalEnrollments,
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
  };
}

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Total courses
  const coursesCount = await db.select({ count: sql<number>`count(*)` }).from(courses);
  
  // Total trainees (sum of traineeCount)
  const traineesCount = await db
    .select({ total: sql<number>`COALESCE(SUM(traineeCount), 0)` })
    .from(courseEnrollments);
  
  // Total revenue
  const revenueData = await db
    .select({
      traineeCount: courseEnrollments.traineeCount,
      paidAmount: courseEnrollments.paidAmount,
    })
    .from(courseEnrollments);
  
  let totalRevenue = 0;
  for (const e of revenueData) {
    totalRevenue += e.traineeCount * parseFloat(e.paidAmount);
  }
  
  // Total expenses
  const expensesData = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(courseExpenses);
  
  const totalExpenses = parseFloat(String(expensesData[0]?.total || 0));
  
  return {
    totalCourses: coursesCount[0]?.count || 0,
    totalTrainees: traineesCount[0]?.total || 0,
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
  };
}

export async function getMonthlyReport(year: number, month: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  // Active courses in this month
  const activeCourses = await db
    .select({ count: sql<number>`count(*)` })
    .from(courses)
    .where(
      sql`${courses.startDate} <= ${endDateStr} AND ${courses.endDate} >= ${startDateStr}`
    );
  
  // Enrollments in this month
  const enrollmentsData = await db
    .select({
      traineeCount: courseEnrollments.traineeCount,
      paidAmount: courseEnrollments.paidAmount,
    })
    .from(courseEnrollments)
    .where(
      sql`${courseEnrollments.enrollmentDate} >= ${startDateStr} AND ${courseEnrollments.enrollmentDate} <= ${endDateStr}`
    );
  
  let totalEnrollments = 0;
  let totalRevenue = 0;
  
  for (const e of enrollmentsData) {
    totalEnrollments += e.traineeCount;
    totalRevenue += e.traineeCount * parseFloat(e.paidAmount);
  }
  
  // Expenses in this month by category
  const expensesData = await db
    .select({
      category: courseExpenses.category,
      amount: courseExpenses.amount,
    })
    .from(courseExpenses)
    .where(
      sql`${courseExpenses.expenseDate} >= ${startDateStr} AND ${courseExpenses.expenseDate} <= ${endDateStr}`
    );
  
  const expensesByCategory: Record<string, number> = {
    certificates: 0,
    instructor: 0,
    marketing: 0,
    tax: 0,
    other: 0,
  };
  
  let totalExpenses = 0;
  for (const e of expensesData) {
    const amount = parseFloat(e.amount);
    expensesByCategory[e.category] += amount;
    totalExpenses += amount;
  }
  
  return {
    activeCourses: activeCourses[0]?.count || 0,
    totalEnrollments,
    totalRevenue,
    totalExpenses,
    expensesByCategory,
    netProfit: totalRevenue - totalExpenses,
  };
}


// ============ PLATFORM SETTINGS FUNCTIONS ============
export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.key, key))
    .limit(1);
  
  return result[0]?.value || null;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(platformSettings);
  
  const settings: Record<string, string> = {};
  for (const row of result) {
    if (row.value) {
      settings[row.key] = row.value;
    }
  }
  return settings;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .insert(platformSettings)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

export async function setSettings(settings: Record<string, string>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  for (const [key, value] of Object.entries(settings)) {
    await db
      .insert(platformSettings)
      .values({ key, value })
      .onDuplicateKeyUpdate({ set: { value } });
  }
}


// ============ INSTRUCTORS FUNCTIONS ============
export async function listInstructors() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(instructors).orderBy(desc(instructors.createdAt));
}

export async function getInstructorById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(instructors).where(eq(instructors.id, id)).limit(1);
  return result[0] || null;
}

export async function createInstructor(instructor: {
  name: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  bio?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(instructors).values(instructor);
  return result[0].insertId;
}

export async function updateInstructor(id: number, instructor: Partial<InsertInstructor>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(instructors).set(instructor).where(eq(instructors.id, id));
}

export async function deleteInstructor(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(instructors).set({ status: "inactive" }).where(eq(instructors.id, id));
}

export async function getInstructorStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Total active instructors
  const activeCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(instructors)
    .where(eq(instructors.status, "active"));
  
  // Instructors with courses
  const instructorsWithCourses = await db
    .select({ 
      instructorId: courses.instructorId,
      courseCount: sql<number>`count(*)` 
    })
    .from(courses)
    .where(sql`${courses.instructorId} IS NOT NULL`)
    .groupBy(courses.instructorId);
  
  return {
    totalInstructors: activeCount[0]?.count || 0,
    instructorsWithCourses: instructorsWithCourses.length,
  };
}

// ============ COURSE TEMPLATES FUNCTIONS ============
export async function listCourseTemplates() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Only return active templates (not from deleted courses)
  return db.select().from(courseTemplates).where(eq(courseTemplates.isActive, true)).orderBy(desc(courseTemplates.createdAt));
}

export async function getCourseTemplateById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(courseTemplates).where(eq(courseTemplates.id, id)).limit(1);
  return result[0] || null;
}

export async function createCourseTemplate(template: {
  name: string;
  instructorId?: number;
  description?: string;
  defaultFees?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(courseTemplates).values(template);
  return result[0].insertId;
}

export async function updateCourseTemplate(id: number, template: Partial<InsertCourseTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(courseTemplates).set(template).where(eq(courseTemplates.id, id));
}

export async function deleteCourseTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(courseTemplates).where(eq(courseTemplates.id, id));
}


// ============ SERVICES FUNCTIONS ============
export async function listServices() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(services).orderBy(desc(services.saleDate));
}

export async function getServiceById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return result[0] || null;
}

export async function createService(service: {
  name: string;
  price: string;
  quantity: number;
  totalAmount: string;
  saleDate: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(services).values({
    ...service,
    saleDate: new Date(service.saleDate),
  });
  return result[0].insertId;
}

export async function updateService(id: number, service: {
  name?: string;
  price?: string;
  quantity?: number;
  totalAmount?: string;
  saleDate?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { ...service };
  if (service.saleDate) {
    updateData.saleDate = new Date(service.saleDate);
  }
  
  await db.update(services).set(updateData).where(eq(services.id, id));
}

export async function deleteService(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(services).where(eq(services.id, id));
}

export async function getServicesStatistics() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const allServices = await db.select().from(services);
  
  const totalServices = allServices.length;
  const totalRevenue = allServices.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0);
  const totalQuantity = allServices.reduce((sum, s) => sum + s.quantity, 0);
  
  return {
    totalServices,
    totalRevenue,
    totalQuantity,
  };
}

export async function getMonthlyServicesReport(year: number, month: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = month === 12 
    ? `${year + 1}-01-01` 
    : `${year}-${String(month + 1).padStart(2, '0')}-01`;
  
  // Get excluded project IDs (projects not included in reports)
  const excludedProjectIds = await getExcludedProjectIds();
  
  const monthlyServices = await db.select().from(services)
    .where(and(
      gte(services.saleDate, sql`${startDate}`),
      lte(services.saleDate, sql`${endDate}`)
    ));
  
  // Filter out services from excluded projects
  const filteredServices = monthlyServices.filter(s => 
    !s.projectId || !excludedProjectIds.includes(s.projectId)
  );
  
  const totalRevenue = filteredServices.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0);
  const totalQuantity = filteredServices.reduce((sum, s) => sum + s.quantity, 0);
  
  return {
    services: filteredServices,
    totalRevenue,
    totalQuantity,
    count: filteredServices.length,
  };
}


// ============ SERVICE TEMPLATES FUNCTIONS ============

export async function listServiceTemplates() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(serviceTemplates).orderBy(desc(serviceTemplates.createdAt));
}

export async function getServiceTemplateById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(serviceTemplates).where(eq(serviceTemplates.id, id)).limit(1);
  return result[0] || null;
}

export async function createServiceTemplate(data: {
  name: string;
  serviceName: string;
  price: string;
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(serviceTemplates).values({
    name: data.name,
    serviceName: data.serviceName,
    price: data.price,
    description: data.description || null,
  });
  
  return { id: Number(result[0].insertId) };
}

export async function updateServiceTemplate(id: number, data: {
  name?: string;
  serviceName?: string;
  price?: string;
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.serviceName !== undefined) updateData.serviceName = data.serviceName;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.description !== undefined) updateData.description = data.description;
  
  await db.update(serviceTemplates).set(updateData).where(eq(serviceTemplates.id, id));
}

export async function deleteServiceTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(serviceTemplates).where(eq(serviceTemplates.id, id));
}


// ============ OPERATIONAL EXPENSES FUNCTIONS ============

export async function listOperationalExpenses(year?: number, month?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (year && month) {
    return db.select().from(operationalExpenses)
      .where(and(
        eq(operationalExpenses.year, year),
        eq(operationalExpenses.month, month)
      ))
      .orderBy(desc(operationalExpenses.createdAt));
  } else if (year) {
    return db.select().from(operationalExpenses)
      .where(eq(operationalExpenses.year, year))
      .orderBy(desc(operationalExpenses.createdAt));
  }
  
  return db.select().from(operationalExpenses).orderBy(desc(operationalExpenses.createdAt));
}

export async function getOperationalExpenseById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(operationalExpenses).where(eq(operationalExpenses.id, id)).limit(1);
  return result[0] || null;
}

export async function createOperationalExpense(expense: {
  category: "salaries" | "electricity" | "water" | "rent" | "government" | "other";
  amount: string;
  month: number;
  year: number;
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(operationalExpenses).values(expense);
  return result[0].insertId;
}

export async function updateOperationalExpense(id: number, expense: {
  category?: "salaries" | "electricity" | "water" | "rent" | "government" | "other";
  amount?: string;
  month?: number;
  year?: number;
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(operationalExpenses).set(expense).where(eq(operationalExpenses.id, id));
}

export async function deleteOperationalExpense(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(operationalExpenses).where(eq(operationalExpenses.id, id));
}

export async function getMonthlyOperationalExpenses(year: number, month: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const expenses = await db.select().from(operationalExpenses)
    .where(and(
      eq(operationalExpenses.year, year),
      eq(operationalExpenses.month, month)
    ));
  
  const byCategory: Record<string, number> = {
    salaries: 0,
    electricity: 0,
    water: 0,
    rent: 0,
    government: 0,
    other: 0,
  };
  
  let total = 0;
  for (const e of expenses) {
    const amount = parseFloat(e.amount);
    byCategory[e.category] += amount;
    total += amount;
  }
  
  return {
    expenses,
    byCategory,
    total,
  };
}

export async function getYearlyOperationalExpenses(year: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const expenses = await db.select().from(operationalExpenses)
    .where(eq(operationalExpenses.year, year));
  
  const byMonth: Record<number, number> = {};
  const byCategory: Record<string, number> = {
    salaries: 0,
    electricity: 0,
    water: 0,
    rent: 0,
    government: 0,
    other: 0,
  };
  
  let total = 0;
  for (const e of expenses) {
    const amount = parseFloat(e.amount);
    byMonth[e.month] = (byMonth[e.month] || 0) + amount;
    byCategory[e.category] += amount;
    total += amount;
  }
  
  return {
    expenses,
    byMonth,
    byCategory,
    total,
  };
}


// ============ PERIODIC REPORTS FUNCTIONS ============

export async function getQuarterlyReport(year: number, quarter: number) {
  // Quarter 1: Jan-Mar, Quarter 2: Apr-Jun, Quarter 3: Jul-Sep, Quarter 4: Oct-Dec
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = quarter * 3;
  
  return getPeriodReport(year, startMonth, year, endMonth);
}

export async function getSemiAnnualReport(year: number, half: number) {
  // Half 1: Jan-Jun, Half 2: Jul-Dec
  const startMonth = half === 1 ? 1 : 7;
  const endMonth = half === 1 ? 6 : 12;
  
  return getPeriodReport(year, startMonth, year, endMonth);
}

export async function getAnnualReport(year: number) {
  return getPeriodReport(year, 1, year, 12);
}

async function getPeriodReport(startYear: number, startMonth: number, endYear: number, endMonth: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startDate = new Date(startYear, startMonth - 1, 1);
  const endDate = new Date(endYear, endMonth, 0);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  // Active courses in this period
  const activeCourses = await db
    .select({ count: sql<number>`count(*)` })
    .from(courses)
    .where(
      sql`${courses.startDate} <= ${endDateStr} AND ${courses.endDate} >= ${startDateStr}`
    );
  
  // Enrollments in this period
  const enrollmentsData = await db
    .select({
      traineeCount: courseEnrollments.traineeCount,
      paidAmount: courseEnrollments.paidAmount,
    })
    .from(courseEnrollments)
    .where(
      sql`${courseEnrollments.enrollmentDate} >= ${startDateStr} AND ${courseEnrollments.enrollmentDate} <= ${endDateStr}`
    );
  
  let totalEnrollments = 0;
  let totalRevenue = 0;
  
  for (const e of enrollmentsData) {
    totalEnrollments += e.traineeCount;
    totalRevenue += e.traineeCount * parseFloat(e.paidAmount);
  }
  
  // Expenses in this period by category
  const expensesData = await db
    .select({
      category: courseExpenses.category,
      amount: courseExpenses.amount,
    })
    .from(courseExpenses)
    .where(
      sql`${courseExpenses.expenseDate} >= ${startDateStr} AND ${courseExpenses.expenseDate} <= ${endDateStr}`
    );
  
  const expensesByCategory: Record<string, number> = {
    certificates: 0,
    instructor: 0,
    marketing: 0,
    tax: 0,
    other: 0,
  };
  
  let totalCourseExpenses = 0;
  for (const e of expensesData) {
    const amount = parseFloat(e.amount);
    expensesByCategory[e.category] += amount;
    totalCourseExpenses += amount;
  }
  
  // Services revenue in this period (excluding projects not included in reports)
  const excludedProjectIds = await getExcludedProjectIds();
  const servicesData = await db
    .select({
      totalAmount: services.totalAmount,
      projectId: services.projectId,
    })
    .from(services)
    .where(
      sql`${services.saleDate} >= ${startDateStr} AND ${services.saleDate} <= ${endDateStr}`
    );
  
  let servicesRevenue = 0;
  let servicesCount = 0;
  for (const s of servicesData) {
    // Skip services from excluded projects
    if (s.projectId && excludedProjectIds.includes(s.projectId)) {
      continue;
    }
    servicesRevenue += parseFloat(s.totalAmount);
    servicesCount++;
  }
  
  // Operational expenses in this period
  const operationalData = await db
    .select({
      category: operationalExpenses.category,
      amount: operationalExpenses.amount,
    })
    .from(operationalExpenses)
    .where(
      and(
        gte(operationalExpenses.year, startYear),
        lte(operationalExpenses.year, endYear),
        sql`(${operationalExpenses.year} > ${startYear} OR ${operationalExpenses.month} >= ${startMonth})`,
        sql`(${operationalExpenses.year} < ${endYear} OR ${operationalExpenses.month} <= ${endMonth})`
      )
    );
  
  const operationalByCategory: Record<string, number> = {
    salaries: 0,
    electricity: 0,
    water: 0,
    rent: 0,
    government: 0,
    other: 0,
  };
  
  let totalOperationalExpenses = 0;
  for (const o of operationalData) {
    const amount = parseFloat(o.amount);
    operationalByCategory[o.category] += amount;
    totalOperationalExpenses += amount;
  }
  
  const totalAllRevenue = totalRevenue + servicesRevenue;
  const totalAllExpenses = totalCourseExpenses + totalOperationalExpenses;
  
  // Monthly breakdown
  const monthlyData: Array<{
    month: number;
    year: number;
    revenue: number;
    expenses: number;
    profit: number;
  }> = [];
  
  let currentYear = startYear;
  let currentMonth = startMonth;
  
  while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0);
    const monthStartStr = monthStart.toISOString().split('T')[0];
    const monthEndStr = monthEnd.toISOString().split('T')[0];
    
    // Monthly enrollments revenue
    const monthEnrollments = await db
      .select({
        traineeCount: courseEnrollments.traineeCount,
        paidAmount: courseEnrollments.paidAmount,
      })
      .from(courseEnrollments)
      .where(
        sql`${courseEnrollments.enrollmentDate} >= ${monthStartStr} AND ${courseEnrollments.enrollmentDate} <= ${monthEndStr}`
      );
    
    let monthRevenue = 0;
    for (const e of monthEnrollments) {
      monthRevenue += e.traineeCount * parseFloat(e.paidAmount);
    }
    
    // Monthly services revenue (excluding projects not included in reports)
    const monthServices = await db
      .select({
        totalAmount: services.totalAmount,
        projectId: services.projectId,
      })
      .from(services)
      .where(
        sql`${services.saleDate} >= ${monthStartStr} AND ${services.saleDate} <= ${monthEndStr}`
      );
    
    for (const s of monthServices) {
      // Skip services from excluded projects
      if (s.projectId && excludedProjectIds.includes(s.projectId)) {
        continue;
      }
      monthRevenue += parseFloat(s.totalAmount);
    }
    
    // Monthly course expenses
    const monthCourseExpenses = await db
      .select({
        amount: courseExpenses.amount,
      })
      .from(courseExpenses)
      .where(
        sql`${courseExpenses.expenseDate} >= ${monthStartStr} AND ${courseExpenses.expenseDate} <= ${monthEndStr}`
      );
    
    let monthExpenses = 0;
    for (const e of monthCourseExpenses) {
      monthExpenses += parseFloat(e.amount);
    }
    
    // Monthly operational expenses
    const monthOperational = await db
      .select({
        amount: operationalExpenses.amount,
      })
      .from(operationalExpenses)
      .where(
        and(
          eq(operationalExpenses.year, currentYear),
          eq(operationalExpenses.month, currentMonth)
        )
      );
    
    for (const o of monthOperational) {
      monthExpenses += parseFloat(o.amount);
    }
    
    monthlyData.push({
      month: currentMonth,
      year: currentYear,
      revenue: monthRevenue,
      expenses: monthExpenses,
      profit: monthRevenue - monthExpenses,
    });
    
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }
  
  return {
    activeCourses: activeCourses[0]?.count || 0,
    totalEnrollments,
    coursesRevenue: totalRevenue,
    servicesRevenue,
    servicesCount,
    totalRevenue: totalAllRevenue,
    courseExpenses: totalCourseExpenses,
    expensesByCategory,
    operationalExpenses: totalOperationalExpenses,
    operationalByCategory,
    totalExpenses: totalAllExpenses,
    netProfit: totalAllRevenue - totalAllExpenses,
    profitMargin: totalAllRevenue > 0 ? ((totalAllRevenue - totalAllExpenses) / totalAllRevenue) * 100 : 0,
    monthlyData,
  };
}


// ============ STRATEGIC TARGETS FUNCTIONS ============
export async function listStrategicTargets(year?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (year) {
    return db.select().from(strategicTargets).where(eq(strategicTargets.year, year)).orderBy(strategicTargets.type);
  }
  return db.select().from(strategicTargets).orderBy(desc(strategicTargets.year), strategicTargets.type);
}

export async function createStrategicTarget(data: InsertStrategicTarget) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(strategicTargets).values(data);
}

export async function updateStrategicTarget(id: number, data: Partial<InsertStrategicTarget>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(strategicTargets).set(data).where(eq(strategicTargets.id, id));
}

export async function deleteStrategicTarget(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(strategicTargets).where(eq(strategicTargets.id, id));
}

// Get actual values for strategic targets
export async function getStrategicTargetActuals(year: number) {
  const db = await getDb();
  if (!db) return {};
  
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  
  // Count direct courses (NEW course templates created this year - not repeated courses)
  // This counts unique/new course templates, not the courses that are created from them
  const directCourseTemplates = await db
    .select({ count: sql<number>`count(*)` })
    .from(courseTemplates)
    .where(
      and(
        eq(courseTemplates.isActive, true),
        sql`YEAR(${courseTemplates.createdAt}) = ${year}`
      )
    );
  
  // Count total courses held (from courses table - for reference)
  const totalCoursesHeld = await db
    .select({ count: sql<number>`count(*)` })
    .from(courses)
    .where(
      and(
        ne(courses.status, "cancelled"),
        sql`${courses.startDate} >= ${startDate}`,
        sql`${courses.startDate} <= ${endDate}`
      )
    );
  
  // Count total customers (trainees)
  const enrollmentData = await db
    .select({ total: sql<number>`SUM(${courseEnrollments.traineeCount})` })
    .from(courseEnrollments)
    .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
    .where(
      and(
        ne(courses.status, "cancelled"),
        sql`${courses.startDate} >= ${startDate}`,
        sql`${courses.startDate} <= ${endDate}`
      )
    );
  
  // Calculate annual profit
  // Revenue from courses
  const courseRevenue = await db
    .select({ total: sql<number>`SUM(${courseEnrollments.paidAmount} * ${courseEnrollments.traineeCount})` })
    .from(courseEnrollments)
    .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
    .where(
      and(
        ne(courses.status, "cancelled"),
        sql`${courses.startDate} >= ${startDate}`,
        sql`${courses.startDate} <= ${endDate}`
      )
    );
  
  // Revenue from services
  const serviceRevenue = await db
    .select({ total: sql<number>`SUM(${services.totalAmount})` })
    .from(services)
    .where(
      and(
        sql`${services.saleDate} >= ${startDate}`,
        sql`${services.saleDate} <= ${endDate}`
      )
    );
  
  // Course expenses
  const courseExp = await db
    .select({ total: sql<number>`SUM(${courseExpenses.amount})` })
    .from(courseExpenses)
    .innerJoin(courses, eq(courseExpenses.courseId, courses.id))
    .where(
      and(
        ne(courses.status, "cancelled"),
        sql`${courses.startDate} >= ${startDate}`,
        sql`${courses.startDate} <= ${endDate}`
      )
    );
  
  // Operational expenses
  const opExp = await db
    .select({ total: sql<number>`SUM(${operationalExpenses.amount})` })
    .from(operationalExpenses)
    .where(eq(operationalExpenses.year, year));
  
  const totalRevenue = (parseFloat(courseRevenue[0]?.total?.toString() || "0")) + 
                       (parseFloat(serviceRevenue[0]?.total?.toString() || "0"));
  const totalExpenses = (parseFloat(courseExp[0]?.total?.toString() || "0")) + 
                        (parseFloat(opExp[0]?.total?.toString() || "0"));
  const annualProfit = totalRevenue - totalExpenses;
  
  // Count partnerships
  const entityPartnerships = await db
    .select({ count: sql<number>`count(*)` })
    .from(partnerships)
    .where(
      and(
        eq(partnerships.type, "entity"),
        eq(partnerships.status, "active"),
        sql`${partnerships.partnershipDate} >= ${startDate}`,
        sql`${partnerships.partnershipDate} <= ${endDate}`
      )
    );
  
  const individualPartnerships = await db
    .select({ count: sql<number>`count(*)` })
    .from(partnerships)
    .where(
      and(
        eq(partnerships.type, "individual"),
        eq(partnerships.status, "active"),
        sql`${partnerships.partnershipDate} >= ${startDate}`,
        sql`${partnerships.partnershipDate} <= ${endDate}`
      )
    );
  
  // Count innovative ideas
  const ideas = await db
    .select({ count: sql<number>`count(*)` })
    .from(innovativeIdeas)
    .where(
      and(
        sql`${innovativeIdeas.submissionDate} >= ${startDate}`,
        sql`${innovativeIdeas.submissionDate} <= ${endDate}`
      )
    );
    return {
    direct_courses: directCourseTemplates[0]?.count || 0, // NEW course templates (not repeated courses)
    new_courses: directCourseTemplates[0]?.count || 0, // Same as direct_courses - unique templates
    recorded_courses: 0, // Will be implemented when course type is added,
    customers: parseInt(enrollmentData[0]?.total?.toString() || "0"),
    annual_profit: annualProfit,
    entity_partnerships: entityPartnerships[0]?.count || 0,
    individual_partnerships: individualPartnerships[0]?.count || 0,
    innovative_ideas: ideas[0]?.count || 0,
    service_quality: 0, // To be implemented later
    customer_satisfaction: 0, // To be implemented later
    website_quality: 0, // To be implemented later
  };
}

// ============ PARTNERSHIPS FUNCTIONS ============
export async function listPartnerships(type?: "entity" | "individual") {
  const db = await getDb();
  if (!db) return [];
  
  if (type) {
    return db.select().from(partnerships).where(eq(partnerships.type, type)).orderBy(desc(partnerships.partnershipDate));
  }
  return db.select().from(partnerships).orderBy(desc(partnerships.partnershipDate));
}

export async function createPartnership(data: InsertPartnership) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(partnerships).values(data);
}

export async function updatePartnership(id: number, data: Partial<InsertPartnership>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(partnerships).set(data).where(eq(partnerships.id, id));
}

export async function deletePartnership(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(partnerships).where(eq(partnerships.id, id));
}

export async function getPartnershipStats() {
  const db = await getDb();
  if (!db) return { total: 0, entities: 0, individuals: 0, active: 0 };
  
  const total = await db.select({ count: sql<number>`count(*)` }).from(partnerships);
  const entities = await db.select({ count: sql<number>`count(*)` }).from(partnerships).where(eq(partnerships.type, "entity"));
  const individuals = await db.select({ count: sql<number>`count(*)` }).from(partnerships).where(eq(partnerships.type, "individual"));
  const active = await db.select({ count: sql<number>`count(*)` }).from(partnerships).where(eq(partnerships.status, "active"));
  
  return {
    total: total[0]?.count || 0,
    entities: entities[0]?.count || 0,
    individuals: individuals[0]?.count || 0,
    active: active[0]?.count || 0,
  };
}

// ============ INNOVATIVE IDEAS FUNCTIONS ============
export async function listInnovativeIdeas(status?: "pending" | "approved" | "implemented" | "rejected") {
  const db = await getDb();
  if (!db) return [];
  
  if (status) {
    return db.select().from(innovativeIdeas).where(eq(innovativeIdeas.status, status)).orderBy(desc(innovativeIdeas.submissionDate));
  }
  return db.select().from(innovativeIdeas).orderBy(desc(innovativeIdeas.submissionDate));
}

export async function createInnovativeIdea(data: InsertInnovativeIdea) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(innovativeIdeas).values(data);
}

export async function updateInnovativeIdea(id: number, data: Partial<InsertInnovativeIdea>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(innovativeIdeas).set(data).where(eq(innovativeIdeas.id, id));
}

export async function deleteInnovativeIdea(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(innovativeIdeas).where(eq(innovativeIdeas.id, id));
}

export async function getInnovativeIdeasStats() {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, approved: 0, implemented: 0, rejected: 0 };
  
  const total = await db.select({ count: sql<number>`count(*)` }).from(innovativeIdeas);
  const pending = await db.select({ count: sql<number>`count(*)` }).from(innovativeIdeas).where(eq(innovativeIdeas.status, "pending"));
  const approved = await db.select({ count: sql<number>`count(*)` }).from(innovativeIdeas).where(eq(innovativeIdeas.status, "approved"));
  const implemented = await db.select({ count: sql<number>`count(*)` }).from(innovativeIdeas).where(eq(innovativeIdeas.status, "implemented"));
  const rejected = await db.select({ count: sql<number>`count(*)` }).from(innovativeIdeas).where(eq(innovativeIdeas.status, "rejected"));
  
  return {
    total: total[0]?.count || 0,
    pending: pending[0]?.count || 0,
    approved: approved[0]?.count || 0,
    implemented: implemented[0]?.count || 0,
    rejected: rejected[0]?.count || 0,
  };
}

// ============ TEMPLATE COURSE COUNT ============
export async function getTemplateCourseCount(templateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(courses)
    .where(eq(courses.templateId, templateId));
  
  return result[0]?.count || 0;
}

export async function getAllTemplatesWithCourseCount() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const templates = await db.select().from(courseTemplates).where(eq(courseTemplates.isActive, true));
  
  const templatesWithCount = await Promise.all(
    templates.map(async (template) => {
      const count = await getTemplateCourseCount(template.id);
      return { ...template, courseCount: count };
    })
  );
  
  return templatesWithCount;
}

// ============ STRATEGIC TARGETS ALL YEARS ============
export async function getStrategicTargetsAllYears() {
  const db = await getDb();
  if (!db) return [];
  
  // Get all unique years
  const years = await db
    .selectDistinct({ year: strategicTargets.year })
    .from(strategicTargets)
    .orderBy(desc(strategicTargets.year));
  
  const results = [];
  
  for (const { year } of years) {
    const targets = await db
      .select()
      .from(strategicTargets)
      .where(eq(strategicTargets.year, year))
      .orderBy(strategicTargets.type);
    
    const actuals = await getStrategicTargetActuals(year);
    
    results.push({
      year,
      targets: targets.map(t => ({
        ...t,
        actual: actuals[t.type as keyof typeof actuals] || 0,
      })),
    });
  }
  
  return results;
}


// Get courses details for a specific month
export async function getMonthlyCoursesDetails(year: number, month: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  const coursesData = await db
    .select({
      id: courses.id,
      code: courses.courseCode,
      name: courses.name,
      instructorName: courses.instructorName,
      startDate: courses.startDate,
      endDate: courses.endDate,
      status: courses.status,
    })
    .from(courses)
    .where(
      sql`${courses.startDate} <= ${endDateStr} AND ${courses.endDate} >= ${startDateStr}`
    );
  
  return coursesData;
}

// Get enrollments details for a specific month
export async function getMonthlyEnrollmentsDetails(year: number, month: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  const enrollmentsData = await db
    .select({
      id: courseEnrollments.id,
      courseName: courses.name,
      courseCode: courses.courseCode,
      notes: courseEnrollments.notes,
      traineeCount: courseEnrollments.traineeCount,
      paidAmount: courseEnrollments.paidAmount,
      enrollmentDate: courseEnrollments.enrollmentDate,
    })
    .from(courseEnrollments)
    .leftJoin(courses, eq(courseEnrollments.courseId, courses.id))
    .where(
      sql`${courseEnrollments.enrollmentDate} >= ${startDateStr} AND ${courseEnrollments.enrollmentDate} <= ${endDateStr}`
    );
  
  return enrollmentsData;
}

// Get expenses details for a specific month
export async function getMonthlyExpensesDetails(year: number, month: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  const expensesData = await db
    .select({
      id: courseExpenses.id,
      courseName: courses.name,
      courseCode: courses.courseCode,
      category: courseExpenses.category,
      amount: courseExpenses.amount,
      description: courseExpenses.description,
      expenseDate: courseExpenses.expenseDate,
    })
    .from(courseExpenses)
    .leftJoin(courses, eq(courseExpenses.courseId, courses.id))
    .where(
      sql`${courseExpenses.expenseDate} >= ${startDateStr} AND ${courseExpenses.expenseDate} <= ${endDateStr}`
    );
  
  return expensesData;
}

// Get services details for a specific month (with option to filter by project inclusion)
export async function getMonthlyServicesDetails(year: number, month: number, excludeProjectServices = true) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  const excludedProjectIds = excludeProjectServices ? await getExcludedProjectIds() : [];
  
  const servicesData = await db
    .select({
      id: services.id,
      name: services.name,
      price: services.price,
      quantity: services.quantity,
      totalAmount: services.totalAmount,
      saleDate: services.saleDate,
      projectId: services.projectId,
      notes: services.notes,
    })
    .from(services)
    .where(
      sql`${services.saleDate} >= ${startDateStr} AND ${services.saleDate} <= ${endDateStr}`
    );
  
  // Filter out services from excluded projects
  if (excludeProjectServices && excludedProjectIds.length > 0) {
    return servicesData.filter(s => !s.projectId || !excludedProjectIds.includes(s.projectId));
  }
  
  return servicesData;
}


// ============ ROLES MANAGEMENT ============
export async function listRoles() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(roles).orderBy(roles.id);
}

export async function getRoleById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(roles).where(eq(roles.id, id));
  return result[0] || null;
}

export async function getRoleByName(name: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(roles).where(eq(roles.name, name));
  return result[0] || null;
}

export async function createRole(role: Omit<InsertRole, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(roles).values(role);
  return result[0].insertId;
}

export async function updateRole(id: number, data: Partial<InsertRole>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(roles).set(data).where(eq(roles.id, id));
}

export async function deleteRole(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if role is system role
  const role = await getRoleById(id);
  if (role?.isSystem) {
    throw new Error("Cannot delete system role");
  }
  
  // Delete role permissions first
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
  // Delete role
  await db.delete(roles).where(eq(roles.id, id));
}

// ============ PERMISSIONS MANAGEMENT ============
export async function listPermissions() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(permissions).orderBy(permissions.module, permissions.name);
}

export async function getPermissionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(permissions).where(eq(permissions.id, id));
  return result[0] || null;
}

export async function createPermission(permission: Omit<InsertPermission, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(permissions).values(permission);
  return result[0].insertId;
}

export async function deletePermission(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete role permissions first
  await db.delete(rolePermissions).where(eq(rolePermissions.permissionId, id));
  // Delete permission
  await db.delete(permissions).where(eq(permissions.id, id));
}

// ============ ROLE PERMISSIONS MANAGEMENT ============
export async function getRolePermissions(roleId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: rolePermissions.id,
      roleId: rolePermissions.roleId,
      permissionId: rolePermissions.permissionId,
      permissionName: permissions.name,
      permissionDisplayName: permissions.displayName,
      permissionModule: permissions.module,
    })
    .from(rolePermissions)
    .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));
  
  return result;
}

export async function setRolePermissions(roleId: number, permissionIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete existing permissions
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
  
  // Insert new permissions
  if (permissionIds.length > 0) {
    const values = permissionIds.map(permissionId => ({
      roleId,
      permissionId,
    }));
    await db.insert(rolePermissions).values(values);
  }
}

export async function addRolePermission(roleId: number, permissionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(rolePermissions).values({ roleId, permissionId });
}

export async function removeRolePermission(roleId: number, permissionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(rolePermissions).where(
    and(
      eq(rolePermissions.roleId, roleId),
      eq(rolePermissions.permissionId, permissionId)
    )
  );
}

// ============ USERS MANAGEMENT ============
export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      loginMethod: users.loginMethod,
      roleId: users.roleId,
      roleName: roles.displayName,
      employeeId: users.employeeId,
      employeeName: employees.name,
      status: users.status,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .leftJoin(employees, eq(users.employeeId, employees.id))
    .orderBy(desc(users.createdAt));
  
  return result;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      loginMethod: users.loginMethod,
      roleId: users.roleId,
      roleName: roles.displayName,
      status: users.status,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, id));
  
  return result[0] || null;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0] || null;
}

export async function updateUserRole(userId: number, roleId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ roleId }).where(eq(users.id, userId));
}

export async function updateUserStatus(userId: number, status: 'active' | 'inactive' | 'pending') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ status }).where(eq(users.id, userId));
}

export async function linkUserToEmployee(userId: number, employeeId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ employeeId }).where(eq(users.id, userId));
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(users).where(eq(users.id, userId));
}

// Check if user has specific permission
export async function userHasPermission(userId: number, permissionName: string) {
  const perms = await getUserPermissions(userId);
  return perms.map(p => p.permission?.name).includes(permissionName);
}

// ============ SEED DEFAULT ROLES AND PERMISSIONS ============
export async function seedRolesAndPermissions() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if roles already exist
  const existingRoles = await listRoles();
  if (existingRoles.length > 0) {
    return { message: "Roles already seeded" };
  }
  
  // Create default roles
  const adminRoleId = await createRole({
    name: 'admin',
    displayName: 'مدير النظام',
    description: 'صلاحيات كاملة للنظام',
    isSystem: true,
  });
  
  const supervisorRoleId = await createRole({
    name: 'supervisor',
    displayName: 'مشرف',
    description: 'صلاحيات إدارة الدورات والتقارير',
    isSystem: true,
  });
  
  const userRoleId = await createRole({
    name: 'user',
    displayName: 'مستخدم',
    description: 'صلاحيات عرض فقط',
    isSystem: true,
  });
  
  // Create default permissions
  const permissionsData = [
    // Dashboard
    { name: 'dashboard.view', displayName: 'عرض لوحة التحكم', module: 'dashboard' },
    
    // Courses
    { name: 'courses.view', displayName: 'عرض الدورات', module: 'courses' },
    { name: 'courses.create', displayName: 'إنشاء دورة', module: 'courses' },
    { name: 'courses.edit', displayName: 'تعديل دورة', module: 'courses' },
    { name: 'courses.delete', displayName: 'حذف دورة', module: 'courses' },
    
    // Course Templates
    { name: 'templates.view', displayName: 'عرض قوالب الدورات', module: 'templates' },
    { name: 'templates.create', displayName: 'إنشاء قالب', module: 'templates' },
    { name: 'templates.edit', displayName: 'تعديل قالب', module: 'templates' },
    { name: 'templates.delete', displayName: 'حذف قالب', module: 'templates' },
    
    // Instructors
    { name: 'instructors.view', displayName: 'عرض المدربين', module: 'instructors' },
    { name: 'instructors.create', displayName: 'إضافة مدرب', module: 'instructors' },
    { name: 'instructors.edit', displayName: 'تعديل مدرب', module: 'instructors' },
    { name: 'instructors.delete', displayName: 'حذف مدرب', module: 'instructors' },
    
    // Services
    { name: 'services.view', displayName: 'عرض الخدمات', module: 'services' },
    { name: 'services.create', displayName: 'إضافة خدمة', module: 'services' },
    { name: 'services.edit', displayName: 'تعديل خدمة', module: 'services' },
    { name: 'services.delete', displayName: 'حذف خدمة', module: 'services' },
    
    // Operational Expenses
    { name: 'expenses.view', displayName: 'عرض المصروفات التشغيلية', module: 'expenses' },
    { name: 'expenses.create', displayName: 'إضافة مصروف', module: 'expenses' },
    { name: 'expenses.edit', displayName: 'تعديل مصروف', module: 'expenses' },
    { name: 'expenses.delete', displayName: 'حذف مصروف', module: 'expenses' },
    
    // Strategic Targets
    { name: 'targets.view', displayName: 'عرض المستهدفات', module: 'targets' },
    { name: 'targets.create', displayName: 'إضافة مستهدف', module: 'targets' },
    { name: 'targets.edit', displayName: 'تعديل مستهدف', module: 'targets' },
    { name: 'targets.delete', displayName: 'حذف مستهدف', module: 'targets' },
    
    // Partnerships
    { name: 'partnerships.view', displayName: 'عرض الشراكات', module: 'partnerships' },
    { name: 'partnerships.create', displayName: 'إضافة شراكة', module: 'partnerships' },
    { name: 'partnerships.edit', displayName: 'تعديل شراكة', module: 'partnerships' },
    { name: 'partnerships.delete', displayName: 'حذف شراكة', module: 'partnerships' },
    
    // Innovative Ideas
    { name: 'ideas.view', displayName: 'عرض الأفكار النوعية', module: 'ideas' },
    { name: 'ideas.create', displayName: 'إضافة فكرة', module: 'ideas' },
    { name: 'ideas.edit', displayName: 'تعديل فكرة', module: 'ideas' },
    { name: 'ideas.delete', displayName: 'حذف فكرة', module: 'ideas' },
    
    // Reports
    { name: 'reports.view', displayName: 'عرض التقارير', module: 'reports' },
    { name: 'reports.export', displayName: 'تصدير التقارير', module: 'reports' },
    
    // Archive
    { name: 'archive.view', displayName: 'عرض الأرشيف', module: 'archive' },
    { name: 'archive.restore', displayName: 'استعادة من الأرشيف', module: 'archive' },
    { name: 'archive.delete', displayName: 'حذف نهائي', module: 'archive' },
    
    // Settings
    { name: 'settings.view', displayName: 'عرض الإعدادات', module: 'settings' },
    { name: 'settings.edit', displayName: 'تعديل الإعدادات', module: 'settings' },
    
    // Users Management
    { name: 'users.view', displayName: 'عرض المستخدمين', module: 'users' },
    { name: 'users.create', displayName: 'إضافة مستخدم', module: 'users' },
    { name: 'users.edit', displayName: 'تعديل مستخدم', module: 'users' },
    { name: 'users.delete', displayName: 'حذف مستخدم', module: 'users' },
    { name: 'users.permissions', displayName: 'إدارة الصلاحيات', module: 'users' },
  ];
  
  const permissionIds: Record<string, number> = {};
  for (const perm of permissionsData) {
    const id = await createPermission(perm);
    permissionIds[perm.name] = id;
  }
  
  // Assign all permissions to admin
  const allPermissionIds = Object.values(permissionIds);
  await setRolePermissions(adminRoleId, allPermissionIds);
  
  // Assign limited permissions to supervisor
  const supervisorPermissions = [
    'dashboard.view',
    'courses.view', 'courses.create', 'courses.edit',
    'templates.view',
    'instructors.view',
    'services.view', 'services.create', 'services.edit',
    'expenses.view', 'expenses.create', 'expenses.edit',
    'targets.view',
    'partnerships.view',
    'ideas.view', 'ideas.create', 'ideas.edit',
    'reports.view',
    'archive.view',
    'settings.view',
  ];
  await setRolePermissions(supervisorRoleId, supervisorPermissions.map(p => permissionIds[p]));
  
  // Assign view-only permissions to user
  const userPermissions = [
    'dashboard.view',
    'courses.view',
    'templates.view',
    'instructors.view',
    'services.view',
    'targets.view',
    'partnerships.view',
    'ideas.view',
    'reports.view',
    'archive.view',
  ];
  await setRolePermissions(userRoleId, userPermissions.map(p => permissionIds[p]));
  
  return { 
    message: "Roles and permissions seeded successfully",
    roles: { admin: adminRoleId, supervisor: supervisorRoleId, user: userRoleId },
  };
}

// ============ PASSWORD AUTH ============
import bcrypt from 'bcryptjs';

export async function createUserWithPassword(data: {
  name: string;
  email: string;
  password: string;
  roleId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if email already exists
  const existing = await getUserByEmail(data.email);
  if (existing) {
    throw new Error("البريد الإلكتروني مستخدم بالفعل");
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  // Get default role (user role) if not provided
  let roleId = data.roleId;
  if (!roleId) {
    // Try to get the default 'user' role
    try {
      const defaultRole = await db.select().from(roles).where(eq(roles.name, 'user')).limit(1);
      roleId = defaultRole[0]?.id || 2; // Default to roleId 2 if user role not found
    } catch (error) {
      roleId = 2; // Fallback to roleId 2
    }
  }
  
  // Create user
  const result = await db.insert(users).values({
    openId: null, // No openId for password-based auth
    name: data.name,
    email: data.email,
    password: hashedPassword,
    loginMethod: 'password',
    roleId: roleId,
    status: 'pending', // Needs admin approval
  });
  
  return result[0].insertId;
}

export async function verifyPassword(email: string, password: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const user = await getUserByEmail(email);
  if (!user || !user.password) {
    return null;
  }
  
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return null;
  }
  
  // Check if user is active
  if (user.status !== 'active') {
    throw new Error("الحساب غير مفعل. يرجى التواصل مع مدير النظام.");
  }
  
  // Update last signed in
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
  
  return user;
}


// ============ PROJECTS MANAGEMENT ============
export async function listProjects(includeInactive = false) {
  const db = await getDb();
  if (!db) return [];
  
  if (includeInactive) {
    return db.select().from(projects).orderBy(desc(projects.createdAt));
  }
  
  return db.select().from(projects)
    .where(ne(projects.status, 'inactive'))
    .orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(projects).where(eq(projects.id, id));
  return result[0] || null;
}

export async function createProject(project: Omit<InsertProject, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(projects).values(project);
  return result[0].insertId;
}

export async function updateProject(id: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // First, unlink all services from this project
  await db.update(services).set({ projectId: null }).where(eq(services.projectId, id));
  
  // Then delete the project
  await db.delete(projects).where(eq(projects.id, id));
}

export async function toggleProjectInReports(id: number, includeInReports: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(projects).set({ includeInReports }).where(eq(projects.id, id));
}

// Get services for a specific project
export async function getProjectServices(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(services)
    .where(eq(services.projectId, projectId))
    .orderBy(desc(services.saleDate));
}

// Assign service to a project
export async function assignServiceToProject(serviceId: number, projectId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(services).set({ projectId }).where(eq(services.id, serviceId));
}

// Get project statistics
export async function getProjectStats(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const projectServices = await db.select().from(services)
    .where(eq(services.projectId, projectId));
  
  const totalRevenue = projectServices.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
  const serviceCount = projectServices.length;
  
  return {
    totalRevenue,
    serviceCount,
  };
}

// Get project monthly report
export async function getProjectMonthlyReport(projectId: number, year: number, month: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  const projectServices = await db.select().from(services)
    .where(and(
      eq(services.projectId, projectId),
      sql`${services.saleDate} >= ${startDateStr} AND ${services.saleDate} <= ${endDateStr}`
    ));
  
  const totalRevenue = projectServices.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
  
  return {
    services: projectServices,
    totalRevenue,
    serviceCount: projectServices.length,
  };
}

// Get services revenue excluding specific projects
export async function getServicesRevenueExcludingProjects(year: number, month: number, excludeProjectIds: number[]) {
  const db = await getDb();
  if (!db) return 0;
  
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  let query = db.select({ total: sql<number>`COALESCE(SUM(${services.totalAmount}), 0)` })
    .from(services)
    .where(sql`${services.saleDate} >= ${startDateStr} AND ${services.saleDate} <= ${endDateStr}`);
  
  // If there are projects to exclude, filter them out
  if (excludeProjectIds.length > 0) {
    const result = await db.select({ total: sql<number>`COALESCE(SUM(${services.totalAmount}), 0)` })
      .from(services)
      .where(and(
        sql`${services.saleDate} >= ${startDateStr} AND ${services.saleDate} <= ${endDateStr}`,
        sql`(${services.projectId} IS NULL OR ${services.projectId} NOT IN (${sql.raw(excludeProjectIds.join(','))}))`
      ));
    return Number(result[0]?.total || 0);
  }
  
  const result = await query;
  return Number(result[0]?.total || 0);
}

// Get excluded project IDs (projects not included in reports)
export async function getExcludedProjectIds() {
  const db = await getDb();
  if (!db) return [];
  
  const excludedProjects = await db.select({ id: projects.id })
    .from(projects)
    .where(eq(projects.includeInReports, false));
  
  return excludedProjects.map(p => p.id);
}


// ============ PROJECT REVENUES & EXPENSES FUNCTIONS ============

// Project Revenues
export async function listProjectRevenues(projectId: number, year?: number, month?: number) {
  const db = await getDb();
  if (!db) return [];
  
  let conditions = [eq(projectRevenues.projectId, projectId)];
  
  if (year && month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    conditions.push(sql`${projectRevenues.revenueDate} >= ${startDateStr} AND ${projectRevenues.revenueDate} <= ${endDateStr}`);
  }
  
  return db.select().from(projectRevenues)
    .where(and(...conditions))
    .orderBy(desc(projectRevenues.revenueDate));
}

export async function createProjectRevenue(data: Omit<InsertProjectRevenue, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(projectRevenues).values(data);
  return result[0].insertId;
}

export async function updateProjectRevenue(id: number, data: Partial<InsertProjectRevenue>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(projectRevenues).set(data).where(eq(projectRevenues.id, id));
}

export async function deleteProjectRevenue(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(projectRevenues).where(eq(projectRevenues.id, id));
}

// Project Expenses
export async function listProjectExpenses(projectId: number, year?: number, month?: number) {
  const db = await getDb();
  if (!db) return [];
  
  let conditions = [eq(projectExpenses.projectId, projectId)];
  
  if (year && month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    conditions.push(sql`${projectExpenses.expenseDate} >= ${startDateStr} AND ${projectExpenses.expenseDate} <= ${endDateStr}`);
  }
  
  return db.select().from(projectExpenses)
    .where(and(...conditions))
    .orderBy(desc(projectExpenses.expenseDate));
}

export async function createProjectExpense(data: Omit<InsertProjectExpense, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(projectExpenses).values(data);
  return result[0].insertId;
}

export async function updateProjectExpense(id: number, data: Partial<InsertProjectExpense>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(projectExpenses).set(data).where(eq(projectExpenses.id, id));
}

export async function deleteProjectExpense(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(projectExpenses).where(eq(projectExpenses.id, id));
}

// Get project financial summary
export async function getProjectFinancialSummary(projectId: number, year?: number, month?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let revenueConditions = [eq(projectRevenues.projectId, projectId)];
  let expenseConditions = [eq(projectExpenses.projectId, projectId)];
  
  if (year && month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    revenueConditions.push(sql`${projectRevenues.revenueDate} >= ${startDateStr} AND ${projectRevenues.revenueDate} <= ${endDateStr}`);
    expenseConditions.push(sql`${projectExpenses.expenseDate} >= ${startDateStr} AND ${projectExpenses.expenseDate} <= ${endDateStr}`);
  }
  
  const revenueResult = await db.select({ total: sql<number>`COALESCE(SUM(${projectRevenues.amount}), 0)` })
    .from(projectRevenues)
    .where(and(...revenueConditions));
  
  const expenseResult = await db.select({ total: sql<number>`COALESCE(SUM(${projectExpenses.amount}), 0)` })
    .from(projectExpenses)
    .where(and(...expenseConditions));
  
  // Get expenses by category
  const expensesByCategory = await db.select({
    category: projectExpenses.category,
    total: sql<number>`COALESCE(SUM(${projectExpenses.amount}), 0)`
  })
    .from(projectExpenses)
    .where(and(...expenseConditions))
    .groupBy(projectExpenses.category);
  
  const totalRevenue = Number(revenueResult[0]?.total || 0);
  const totalExpenses = Number(expenseResult[0]?.total || 0);
  
  return {
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    expensesByCategory: expensesByCategory.map(e => ({
      category: e.category,
      total: Number(e.total)
    }))
  };
}

// ============ EMPLOYEE FUNCTIONS ============

export async function listEmployees(specialization?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (specialization) {
    return db.select().from(employees)
      .where(eq(employees.specialization, specialization as any))
      .orderBy(desc(employees.createdAt));
  }
  return db.select().from(employees).orderBy(desc(employees.createdAt));
}

export async function getEmployeeById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(employees).where(eq(employees.id, id));
  return result[0] || null;
}

export async function getEmployeeByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  // أولاً: البحث عن الموظف عبر employees.userId
  const result = await db.select().from(employees).where(eq(employees.userId, userId));
  if (result[0]) return result[0];
  
  // ثانياً: البحث عبر users.employeeId (في حالة الربط من جهة المستخدم فقط)
  const userResult = await db.select().from(users).where(eq(users.id, userId));
  const user = userResult[0];
  if (user?.employeeId) {
    const empResult = await db.select().from(employees).where(eq(employees.id, user.employeeId));
    return empResult[0] || null;
  }
  
  return null;
}

export async function createEmployee(employee: Omit<InsertEmployee, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(employees).values(employee);
  const employeeId = result[0].insertId;
  
  // إضافة مستهدفات تلقائية لموظفي خدمة العملاء
  if (employee.specialization === 'customer_service') {
    await createDefaultCustomerServiceTargets(employeeId);
  }
  
  // Return full employee object
  const createdEmployee = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
  return createdEmployee[0] || { id: employeeId, ...employee };
}

// إنشاء مستهدفات تلقائية لموظفي خدمة العملاء
export async function createDefaultCustomerServiceTargets(employeeId: number) {
  const db = await getDb();
  if (!db) return;
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const defaultTargets = [
    {
      employeeId,
      targetType: 'confirmed_customers' as const,
      customName: 'العملاء المؤكدين',
      targetValue: '0',
      currentValue: '0',
      period: 'monthly' as const,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      status: 'in_progress' as const,
    },
    {
      employeeId,
      targetType: 'registered_customers' as const,
      customName: 'العملاء المسجلين',
      targetValue: '0',
      currentValue: '0',
      period: 'monthly' as const,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      status: 'in_progress' as const,
    },
    {
      employeeId,
      targetType: 'sales_amount' as const,
      customName: 'الخدمات المباعة',
      targetValue: '0',
      currentValue: '0',
      period: 'monthly' as const,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      status: 'in_progress' as const,
    },
    {
      employeeId,
      targetType: 'other' as const,
      customName: 'إعادة الاستهداف',
      targetValue: '0',
      currentValue: '0',
      period: 'monthly' as const,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      status: 'in_progress' as const,
    }
  ];
  
  for (const target of defaultTargets) {
    await db.insert(employeeTargets).values(target);
  }
}

export async function updateEmployee(id: number, data: Partial<InsertEmployee>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(employees).set(data).where(eq(employees.id, id));
}

export async function deleteEmployee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(employees).where(eq(employees.id, id));
}

export async function getEmployeeStats() {
  const db = await getDb();
  if (!db) return { total: 0, bySpecialization: {} };
  
  const allEmployees = await db.select().from(employees).where(eq(employees.status, 'active'));
  
  const bySpecialization: Record<string, number> = {};
  allEmployees.forEach(emp => {
    bySpecialization[emp.specialization] = (bySpecialization[emp.specialization] || 0) + 1;
  });
  
  return {
    total: allEmployees.length,
    bySpecialization
  };
}

// ============ EMPLOYEE TARGETS FUNCTIONS ============

export async function listEmployeeTargets(employeeId?: number, year?: number, month?: number) {
  const db = await getDb();
  if (!db) return [];
  
  // إذا تم تحديد موظف وشهر وسنة، نستخدم الدالة المحدثة التي تحسب المتحقق تلقائياً
  if (employeeId && month && year) {
    return getEmployeeTargetsWithProgress(employeeId, month, year);
  }
  
  // إذا تم تحديد شهر وسنة بدون موظف محدد، نحسب المتحقق لجميع الموظفين
  if (month && year) {
    const conditions = [
      eq(employeeTargets.year, year),
      eq(employeeTargets.month, month)
    ];
    
    const targets = await db.select().from(employeeTargets)
      .where(and(...conditions))
      .orderBy(desc(employeeTargets.createdAt));
    
    // حساب المتحقق لكل مستهدف
    const uniqueEmployeeIds = Array.from(new Set(targets.map(t => t.employeeId)));
    const totalsMap: Record<number, any> = {};
    
    for (const empId of uniqueEmployeeIds) {
      totalsMap[empId] = await getDailyStatsMonthlyTotal(empId, month, year);
    }
    
    const targetTypeMapping: Record<string, string> = {
      'confirmed_customers': 'confirmedCustomers',
      'registered_customers': 'registeredCustomers',
      'targeted_customers': 'targetedCustomers',
      'services_sold': 'servicesSold',
      'sales_amount': 'totalRevenue',
      'daily_calls': 'targetedCustomers',
    };
    
    return targets.map(target => {
      const totals = totalsMap[target.employeeId] || {};
      const statsField = targetTypeMapping[target.targetType];
      let achieved = 0;
      
      if (statsField && statsField in totals) {
        achieved = Number(totals[statsField]) || 0;
      }
      
      const baseValue = parseFloat(target.baseValue || '0') || 0;
      const totalAchieved = baseValue + achieved;
      const targetValue = parseFloat(target.targetValue as string) || 0;
      const remaining = Math.max(0, targetValue - totalAchieved);
      const percentage = targetValue > 0 ? Math.min((totalAchieved / targetValue) * 100, 100) : 0;
      
      let newStatus = target.status;
      if (totalAchieved >= targetValue && targetValue > 0) {
        newStatus = 'achieved';
      } else if (totalAchieved < targetValue && target.status === 'achieved') {
        newStatus = 'in_progress';
      }
      
      return {
        ...target,
        currentValue: String(totalAchieved),
        achieved: totalAchieved,
        dailyStatsAchieved: achieved,
        baseValue: String(baseValue),
        remaining,
        percentage,
        status: newStatus,
      };
    });
  }
  
  // الحالة الافتراضية - بدون حساب المتحقق
  const conditions = [];
  if (employeeId) conditions.push(eq(employeeTargets.employeeId, employeeId));
  if (year) conditions.push(eq(employeeTargets.year, year));
  
  if (conditions.length > 0) {
    return db.select().from(employeeTargets)
      .where(and(...conditions))
      .orderBy(desc(employeeTargets.createdAt));
  }
  return db.select().from(employeeTargets).orderBy(desc(employeeTargets.createdAt));
}

export async function getEmployeeTargetById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(employeeTargets).where(eq(employeeTargets.id, id));
  return result[0] || null;
}

export async function createEmployeeTarget(target: Omit<InsertEmployeeTarget, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(employeeTargets).values(target);
  return result[0].insertId;
}

export async function updateEmployeeTarget(id: number, data: Partial<InsertEmployeeTarget>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(employeeTargets).set(data).where(eq(employeeTargets.id, id));
  
  // Check if target is achieved and create reward if applicable
  const target = await getEmployeeTargetById(id);
  if (target && target.rewardAmount && parseFloat(target.currentValue) >= parseFloat(target.targetValue)) {
    // Update status to achieved
    await db.update(employeeTargets).set({ status: 'achieved' }).where(eq(employeeTargets.id, id));
    
    // Check if reward already exists
    const existingReward = await db.select().from(employeeRewards)
      .where(eq(employeeRewards.targetId, id));
    
    if (existingReward.length === 0) {
      // Create reward
      await createEmployeeReward({
        employeeId: target.employeeId,
        targetId: id,
        amount: target.rewardAmount,
        reason: `تحقيق مستهدف: ${target.customName || target.targetType}`,
        status: 'pending'
      });
    }
  }
}

export async function deleteEmployeeTarget(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(employeeTargets).where(eq(employeeTargets.id, id));
}

export async function incrementEmployeeTarget(employeeId: number, targetType: string, incrementBy: number, year: number, month?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [
    eq(employeeTargets.employeeId, employeeId),
    eq(employeeTargets.targetType, targetType as any),
    eq(employeeTargets.year, year)
  ];
  if (month) conditions.push(eq(employeeTargets.month, month));
  
  const targets = await db.select().from(employeeTargets).where(and(...conditions));
  
  if (targets.length > 0) {
    const target = targets[0];
    const newValue = parseFloat(target.currentValue) + incrementBy;
    await updateEmployeeTarget(target.id, { currentValue: newValue.toString() });
  }
}

// ============ EMPLOYEE REWARDS FUNCTIONS ============

export async function listEmployeeRewards(employeeId?: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (employeeId) conditions.push(eq(employeeRewards.employeeId, employeeId));
  if (status) conditions.push(eq(employeeRewards.status, status as any));
  
  if (conditions.length > 0) {
    return db.select().from(employeeRewards)
      .where(and(...conditions))
      .orderBy(desc(employeeRewards.createdAt));
  }
  return db.select().from(employeeRewards).orderBy(desc(employeeRewards.createdAt));
}

export async function getEmployeeRewardById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(employeeRewards).where(eq(employeeRewards.id, id));
  return result[0] || null;
}

export async function createEmployeeReward(reward: Omit<InsertEmployeeReward, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(employeeRewards).values(reward);
  return result[0].insertId;
}

export async function updateEmployeeReward(id: number, data: Partial<InsertEmployeeReward>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(employeeRewards).set(data).where(eq(employeeRewards.id, id));
}

export async function approveReward(id: number, approvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(employeeRewards).set({
    status: 'approved',
    approvedBy,
    approvedAt: new Date()
  }).where(eq(employeeRewards.id, id));
}

export async function markRewardAsPaid(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(employeeRewards).set({
    status: 'paid',
    paidAt: new Date()
  }).where(eq(employeeRewards.id, id));
}

export async function rejectReward(id: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(employeeRewards).set({
    status: 'rejected',
    notes
  }).where(eq(employeeRewards.id, id));
}

export async function getRewardsStats() {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, approved: 0, paid: 0, totalAmount: 0 };
  
  const allRewards = await db.select().from(employeeRewards);
  
  let pending = 0, approved = 0, paid = 0, totalAmount = 0;
  allRewards.forEach(r => {
    if (r.status === 'pending') pending++;
    else if (r.status === 'approved') approved++;
    else if (r.status === 'paid') {
      paid++;
      totalAmount += parseFloat(r.amount);
    }
  });
  
  return { total: allRewards.length, pending, approved, paid, totalAmount };
}

// ============ ATTENDANCE FUNCTIONS ============

export async function listAttendance(employeeId?: number, date?: string, month?: number, year?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (employeeId) conditions.push(eq(attendance.employeeId, employeeId));
  if (date) conditions.push(sql`${attendance.date} = ${date}`);
  
  if (month && year) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    conditions.push(sql`${attendance.date} >= ${startDate}`);
    conditions.push(sql`${attendance.date} <= ${endDate}`);
  }
  
  if (conditions.length > 0) {
    return db.select().from(attendance)
      .where(and(...conditions))
      .orderBy(desc(attendance.createdAt));
  }
  return db.select().from(attendance).orderBy(desc(attendance.createdAt));
}

export async function getAttendanceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(attendance).where(eq(attendance.id, id));
  return result[0] || null;
}

export async function checkIn(employeeId: number, ipAddress?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const today = new Date().toISOString().split('T')[0];
  
  // Check if already checked in today
  const existing = await db.select().from(attendance)
    .where(and(
      eq(attendance.employeeId, employeeId),
      sql`${attendance.date} = ${today}`
    ));
  
  if (existing.length > 0 && existing[0].checkIn) {
    throw new Error("Already checked in today");
  }
  
  if (existing.length > 0) {
    // Update existing record
    await db.update(attendance).set({
      checkIn: new Date(),
      ipAddress,
      status: 'present'
    }).where(eq(attendance.id, existing[0].id));
    return existing[0].id;
  }
  
  // Create new record
  const result = await db.insert(attendance).values({
    employeeId,
    date: new Date(today),
    checkIn: new Date(),
    ipAddress,
    status: 'present'
  });
  return result[0].insertId;
}

export async function checkOut(employeeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const today = new Date().toISOString().split('T')[0];
  
  const existing = await db.select().from(attendance)
    .where(and(
      eq(attendance.employeeId, employeeId),
      sql`${attendance.date} = ${today}`
    ));
  
  if (existing.length === 0 || !existing[0].checkIn) {
    throw new Error("Must check in first");
  }
  
  if (existing[0].checkOut) {
    throw new Error("Already checked out today");
  }
  
  const checkInTime = new Date(existing[0].checkIn);
  const checkOutTime = new Date();
  const totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
  
  await db.update(attendance).set({
    checkOut: checkOutTime,
    totalHours: totalHours.toFixed(2)
  }).where(eq(attendance.id, existing[0].id));
}

export async function getAttendanceStats(employeeId: number, month: number, year: number) {
  const db = await getDb();
  if (!db) return { totalDays: 0, presentDays: 0, absentDays: 0, totalHours: 0 };
  
  const records = await listAttendance(employeeId, undefined, month, year);
  
  let presentDays = 0, absentDays = 0, totalHours = 0;
  records.forEach(r => {
    if (r.status === 'present' || r.status === 'late') {
      presentDays++;
      totalHours += parseFloat(r.totalHours || '0');
    } else if (r.status === 'absent') {
      absentDays++;
    }
  });
  
  return {
    totalDays: records.length,
    presentDays,
    absentDays,
    totalHours
  };
}

// ============ DAILY REPORTS FUNCTIONS ============

export async function listDailyReports(employeeId?: number, month?: number, year?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (employeeId) conditions.push(eq(dailyReports.employeeId, employeeId));
  
  if (month && year) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    conditions.push(sql`${dailyReports.reportDate} >= ${startDate}`);
    conditions.push(sql`${dailyReports.reportDate} <= ${endDate}`);
  }
  
  if (conditions.length > 0) {
    return db.select().from(dailyReports)
      .where(and(...conditions))
      .orderBy(desc(dailyReports.createdAt));
  }
  return db.select().from(dailyReports).orderBy(desc(dailyReports.createdAt));
}

export async function getDailyReportById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(dailyReports).where(eq(dailyReports.id, id));
  return result[0] || null;
}

export async function createDailyReport(report: Omit<InsertDailyReport, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(dailyReports).values(report);
  
  // Update customer stats
  const reportDate = new Date(report.reportDate);
  const month = reportDate.getMonth() + 1;
  const year = reportDate.getFullYear();
  
  await updateCustomerStats(report.employeeId, month, year, report.confirmedCustomers || 0);
  
  // Update employee target for confirmed customers
  await incrementEmployeeTarget(
    report.employeeId,
    'confirmed_customers',
    report.confirmedCustomers || 0,
    year,
    month
  );
  
  return result[0].insertId;
}

export async function updateDailyReport(id: number, data: Partial<InsertDailyReport>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get old report to calculate difference
  const oldReport = await getDailyReportById(id);
  
  await db.update(dailyReports).set(data).where(eq(dailyReports.id, id));
  
  // Update customer stats if confirmed customers changed
  if (oldReport && data.confirmedCustomers !== undefined) {
    const reportDate = new Date(oldReport.reportDate);
    const month = reportDate.getMonth() + 1;
    const year = reportDate.getFullYear();
    const diff = data.confirmedCustomers - oldReport.confirmedCustomers;
    
    if (diff !== 0) {
      await updateCustomerStats(oldReport.employeeId, month, year, diff);
    }
  }
}

export async function deleteDailyReport(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get report to update customer stats
  const report = await getDailyReportById(id);
  if (report) {
    const reportDate = new Date(report.reportDate);
    const month = reportDate.getMonth() + 1;
    const year = reportDate.getFullYear();
    await updateCustomerStats(report.employeeId, month, year, -report.confirmedCustomers);
  }
  
  await db.delete(dailyReports).where(eq(dailyReports.id, id));
}

export async function getDailyReportStats(employeeId: number | undefined, month: number, year: number) {
  const reports = await listDailyReports(employeeId, month, year);
  
  let totalTargeted = 0, totalConfirmed = 0, totalRegistered = 0;
  reports.forEach(r => {
    totalTargeted += r.targetedCustomers;
    totalConfirmed += r.confirmedCustomers;
    totalRegistered += r.registeredCustomers;
  });
  
  return {
    totalReports: reports.length,
    totalTargeted,
    totalConfirmed,
    totalRegistered,
    conversionRate: totalTargeted > 0 ? (totalConfirmed / totalTargeted * 100).toFixed(1) : '0'
  };
}

// ============ CUSTOMER STATS FUNCTIONS ============

export async function getCustomerStats(month?: number, year?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (month) conditions.push(eq(customerStats.month, month));
  if (year) conditions.push(eq(customerStats.year, year));
  
  if (conditions.length > 0) {
    return db.select().from(customerStats).where(and(...conditions));
  }
  return db.select().from(customerStats).orderBy(desc(customerStats.year), desc(customerStats.month));
}

export async function updateCustomerStats(employeeId: number, month: number, year: number, confirmedIncrement: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(customerStats)
    .where(and(
      eq(customerStats.employeeId, employeeId),
      eq(customerStats.month, month),
      eq(customerStats.year, year)
    ));
  
  if (existing.length > 0) {
    const newConfirmed = existing[0].confirmedCustomers + confirmedIncrement;
    await db.update(customerStats).set({
      confirmedCustomers: newConfirmed
    }).where(eq(customerStats.id, existing[0].id));
  } else {
    await db.insert(customerStats).values({
      employeeId,
      month,
      year,
      targetedCustomers: 0,
      confirmedCustomers: confirmedIncrement > 0 ? confirmedIncrement : 0,
      registeredInForm: 0,
      oldCustomersContacted: 0,
      servicesSold: 0
    });
  }
}

export async function getTotalCustomers(year?: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const stats = year 
    ? await db.select().from(customerStats).where(eq(customerStats.year, year))
    : await db.select().from(customerStats);
  
  return stats.reduce((sum, s) => sum + s.confirmedCustomers, 0);
}


// ==================== Monthly Salaries ====================

export async function listMonthlySalaries(year?: number, month?: number, employeeId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(monthlySalaries);
  const conditions = [];
  
  if (year) conditions.push(eq(monthlySalaries.year, year));
  if (month) conditions.push(eq(monthlySalaries.month, month));
  if (employeeId) conditions.push(eq(monthlySalaries.employeeId, employeeId));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }
  
  return query.orderBy(desc(monthlySalaries.year), desc(monthlySalaries.month));
}

export async function getMonthlySalaryById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [salary] = await db.select().from(monthlySalaries).where(eq(monthlySalaries.id, id));
  return salary || null;
}

export async function getMonthlySalaryByEmployeeAndPeriod(employeeId: number, year: number, month: number) {
  const db = await getDb();
  if (!db) return null;
  const [salary] = await db.select().from(monthlySalaries)
    .where(and(
      eq(monthlySalaries.employeeId, employeeId),
      eq(monthlySalaries.year, year),
      eq(monthlySalaries.month, month)
    ));
  return salary || null;
}

export async function createMonthlySalary(salary: Omit<InsertMonthlySalary, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Calculate net salary
  const baseSalary = parseFloat(salary.baseSalary as string);
  const totalDeductions = parseFloat((salary.totalDeductions as string) || "0");
  const totalBonuses = parseFloat((salary.totalBonuses as string) || "0");
  const netSalary = baseSalary - totalDeductions + totalBonuses;
  
  const [result] = await db.insert(monthlySalaries).values({
    ...salary,
    netSalary: netSalary.toFixed(2),
  });
  return result.insertId;
}

export async function updateMonthlySalary(id: number, data: Partial<InsertMonthlySalary>) {
  const db = await getDb();
  if (!db) return;
  await db.update(monthlySalaries).set(data).where(eq(monthlySalaries.id, id));
}

export async function recalculateSalary(salaryId: number) {
  const db = await getDb();
  if (!db) return;
  
  const [salary] = await db.select().from(monthlySalaries).where(eq(monthlySalaries.id, salaryId));
  if (!salary) return;
  
  // Get all adjustments for this salary
  const adjustments = await db.select().from(salaryAdjustments).where(eq(salaryAdjustments.salaryId, salaryId));
  
  let totalDeductions = 0;
  let totalBonuses = 0;
  
  for (const adj of adjustments) {
    const amount = parseFloat(adj.amount as string);
    if (adj.type === 'deduction') {
      totalDeductions += amount;
    } else {
      totalBonuses += amount;
    }
  }
  
  const baseSalary = parseFloat(salary.baseSalary as string);
  const netSalary = baseSalary - totalDeductions + totalBonuses;
  
  await db.update(monthlySalaries).set({
    totalDeductions: totalDeductions.toFixed(2),
    totalBonuses: totalBonuses.toFixed(2),
    netSalary: netSalary.toFixed(2),
  }).where(eq(monthlySalaries.id, salaryId));
}

export async function deleteMonthlySalary(id: number) {
  const db = await getDb();
  if (!db) return;
  // Delete all adjustments first
  await db.delete(salaryAdjustments).where(eq(salaryAdjustments.salaryId, id));
  await db.delete(monthlySalaries).where(eq(monthlySalaries.id, id));
}

export async function markSalaryAsPaid(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(monthlySalaries).set({
    status: 'paid',
    paidAt: new Date(),
  }).where(eq(monthlySalaries.id, id));
}

// ==================== Salary Adjustments ====================

export async function listSalaryAdjustments(salaryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salaryAdjustments)
    .where(eq(salaryAdjustments.salaryId, salaryId))
    .orderBy(desc(salaryAdjustments.createdAt));
}

export async function getSalaryAdjustmentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [adjustment] = await db.select().from(salaryAdjustments).where(eq(salaryAdjustments.id, id));
  return adjustment || null;
}

export async function createSalaryAdjustment(adjustment: Omit<InsertSalaryAdjustment, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(salaryAdjustments).values(adjustment);
  
  // Recalculate the salary
  await recalculateSalary(adjustment.salaryId);
  
  return result.insertId;
}

export async function deleteSalaryAdjustment(id: number) {
  const db = await getDb();
  if (!db) return;
  
  // Get the adjustment to know which salary to recalculate
  const [adjustment] = await db.select().from(salaryAdjustments).where(eq(salaryAdjustments.id, id));
  if (!adjustment) return;
  
  await db.delete(salaryAdjustments).where(eq(salaryAdjustments.id, id));
  
  // Recalculate the salary
  await recalculateSalary(adjustment.salaryId);
}

// ==================== Salary Statistics ====================

export async function getMonthlySalariesTotal(year: number, month: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const salaries = await db.select().from(monthlySalaries)
    .where(and(
      eq(monthlySalaries.year, year),
      eq(monthlySalaries.month, month),
      eq(monthlySalaries.status, 'paid')
    ));
  
  return salaries.reduce((sum, s) => sum + parseFloat(s.netSalary as string), 0);
}

export async function getSalaryStats(year: number) {
  const db = await getDb();
  if (!db) return { totalPaid: 0, totalPending: 0, employeeCount: 0 };
  
  const salaries = await db.select().from(monthlySalaries).where(eq(monthlySalaries.year, year));
  
  let totalPaid = 0;
  let totalPending = 0;
  const employeeIds = new Set<number>();
  
  for (const s of salaries) {
    const netSalary = parseFloat(s.netSalary as string);
    if (s.status === 'paid') {
      totalPaid += netSalary;
    } else if (s.status === 'pending') {
      totalPending += netSalary;
    }
    employeeIds.add(s.employeeId);
  }
  
  return { totalPaid, totalPending, employeeCount: employeeIds.size };
}

// Generate salaries for all active employees for a given month
export async function generateMonthlySalaries(year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get all active employees
  const activeEmployees = await db.select().from(employees).where(eq(employees.status, 'active'));
  
  const generatedIds: number[] = [];
  
  for (const emp of activeEmployees) {
    // Check if salary already exists for this employee and period
    const existing = await getMonthlySalaryByEmployeeAndPeriod(emp.id, year, month);
    if (existing) continue;
    
    // Create salary record
    const salaryId = await createMonthlySalary({
      employeeId: emp.id,
      month,
      year,
      baseSalary: emp.salary || "0",
      totalDeductions: "0",
      totalBonuses: "0",
      netSalary: emp.salary || "0",
      status: 'pending',
    });
    
    generatedIds.push(salaryId);
  }
  
  return generatedIds;
}

// Get total salaries (paid and pending) for a specific month
export async function getMonthlySalariesTotalByStatus(year: number, month: number, status?: 'paid' | 'pending') {
  const db = await getDb();
  if (!db) return { paid: 0, pending: 0, total: 0 };
  
  let conditions = [
    eq(monthlySalaries.year, year),
    eq(monthlySalaries.month, month)
  ];
  
  if (status) {
    conditions.push(eq(monthlySalaries.status, status));
  }
  
  const salaries = await db.select().from(monthlySalaries).where(and(...conditions));
  
  let totalPaid = 0;
  let totalPending = 0;
  
  for (const s of salaries) {
    const netSalary = parseFloat(s.netSalary as string);
    if (s.status === 'paid') {
      totalPaid += netSalary;
    } else if (s.status === 'pending') {
      totalPending += netSalary;
    }
  }
  
  return {
    paid: totalPaid,
    pending: totalPending,
    total: totalPaid + totalPending
  };
}


// Get employee profile data (for employee dashboard)
export async function getEmployeeProfile(employeeId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const employee = await db.select().from(employees).where(eq(employees.id, employeeId));
  if (!employee[0]) return null;
  
  return employee[0];
}

// Update employee profile (email, phone, profileImage)
export async function updateEmployeeProfile(employeeId: number, data: {
  email?: string;
  phone?: string;
  profileImage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if email is already used by another employee
  if (data.email) {
    const existing = await db.select().from(employees)
      .where(and(
        eq(employees.email, data.email),
        ne(employees.id, employeeId)
      ));
    
    if (existing.length > 0) {
      throw new Error("البريد الإلكتروني مستخدم بالفعل");
    }
  }
  
  await db.update(employees).set(data).where(eq(employees.id, employeeId));
}

// Get employee targets with progress - يحسب المتحقق تلقائياً من الإحصائيات اليومية المعتمدة
export async function getEmployeeTargetsWithProgress(employeeId: number, month?: number, year?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  const currentMonth = month || now.getMonth() + 1;
  const currentYear = year || now.getFullYear();
  
  // أولاً: حساب المجاميع من الإحصائيات اليومية المعتمدة (daily_stats)
  const totals = await getDailyStatsMonthlyTotal(employeeId, currentMonth, currentYear);
  
  // خريطة ربط أنواع المستهدفات بحقول الإحصائيات
  const targetTypeMapping: Record<string, keyof typeof totals> = {
    'confirmed_customers': 'confirmedCustomers',
    'registered_customers': 'registeredCustomers',
    'targeted_customers': 'targetedCustomers',
    'services_sold': 'servicesSold',
    'sales_amount': 'totalRevenue',
    'daily_calls': 'targetedCustomers',
  };
  
  // جلب المستهدفات للشهر والسنة المحددين
  const conditions = [
    eq(employeeTargets.employeeId, employeeId),
    eq(employeeTargets.month, currentMonth),
    eq(employeeTargets.year, currentYear)
  ];
  
  const targets = await db.select().from(employeeTargets)
    .where(and(...conditions));
  
  // حساب التقدم لكل مستهدف وتحديث currentValue تلقائياً
  const targetsWithProgress = await Promise.all(targets.map(async (target) => {
    const statsField = targetTypeMapping[target.targetType];
    let achieved = 0;
    
    if (statsField && statsField in totals) {
      achieved = Number(totals[statsField as keyof typeof totals]) || 0;
    }
    
    // إضافة القيمة الأساسية (baseValue) للمتحقق
    const baseValue = parseFloat(target.baseValue || '0') || 0;
    const totalAchieved = baseValue + achieved;
    
    const targetValue = parseFloat(target.targetValue as string) || 0;
    const remaining = Math.max(0, targetValue - totalAchieved);
    const percentage = targetValue > 0 ? (totalAchieved / targetValue) * 100 : 0;
    
    // تحديث currentValue و status تلقائياً في قاعدة البيانات
    let newStatus = target.status;
    if (totalAchieved >= targetValue && targetValue > 0) {
      newStatus = 'achieved';
    } else if (totalAchieved < targetValue && target.status === 'achieved') {
      newStatus = 'in_progress';
    }
    
    // تحديث القيمة الحالية في قاعدة البيانات إذا تغيرت
    if (String(totalAchieved) !== target.currentValue || newStatus !== target.status) {
      await db.update(employeeTargets)
        .set({ 
          currentValue: String(totalAchieved),
          status: newStatus
        })
        .where(eq(employeeTargets.id, target.id));
    }
    
    return {
      ...target,
      currentValue: String(totalAchieved),
      achieved: totalAchieved,
      dailyStatsAchieved: achieved,
      baseValue: String(baseValue),
      remaining,
      percentage: Math.min(percentage, 100),
      status: newStatus,
    };
  }));
  
  // فحص وإنشاء تنبيهات تلقائية عند 80% أو 100%
  try {
    const newAlerts = await checkAndCreateTargetAlerts(employeeId, targetsWithProgress);
    if (newAlerts.length > 0) {
      // إرسال إشعارات المالك للتنبيهات الجديدة
      sendPendingAlertNotifications().catch(err => {
        console.error('[TargetAlerts] Error sending notifications:', err);
      });
    }
  } catch (err) {
    console.error('[TargetAlerts] Error checking alerts:', err);
  }

  return targetsWithProgress;
}

// Get employee attendance records
export async function getEmployeeAttendance(employeeId: number, month?: number, year?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  const currentMonth = month || now.getMonth() + 1;
  const currentYear = year || now.getFullYear();
  
  const attendanceRecords = await db.select().from(attendance)
    .where(and(
      eq(attendance.employeeId, employeeId),
      eq(sql`MONTH(${attendance.date})`, currentMonth),
      eq(sql`YEAR(${attendance.date})`, currentYear)
    ))
    .orderBy(desc(attendance.date));
  
  return attendanceRecords;
}

// Get employee salary records
export async function getEmployeeSalaryRecords(employeeId: number, year?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  const currentYear = year || now.getFullYear();
  
  const salaries = await db.select().from(monthlySalaries)
    .where(and(
      eq(monthlySalaries.employeeId, employeeId),
      eq(monthlySalaries.year, currentYear)
    ))
    .orderBy(desc(monthlySalaries.month));
  
  return salaries;
}


// ============ EMPLOYEE LOGIN CREDENTIALS EMAIL ============
export async function sendEmployeeLoginCredentials(
  employeeId: number,
  email: string,
  tempPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!email) {
      return { success: false, message: "البريد الإلكتروني مفقود" };
    }

    // Get employee details using the helper function
    const employee = await getEmployeeProfile(employeeId);

    if (!employee) {
      return { success: false, message: "الموظف غير موجود" };
    }

    // Prepare email content
    const subject = `بيانات الدخول إلى منصة إدارة الدورات التدريبية`;
    const htmlContent = `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2c3e50;">مرحباً ${employee.name}</h2>
        
        <p>تم إنشاء حسابك على منصة إدارة الدورات التدريبية بنجاح.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">بيانات الدخول:</h3>
          <p><strong>البريد الإلكتروني:</strong> ${email}</p>
          <p><strong>كلمة المرور المؤقتة:</strong> ${tempPassword}</p>
          <p style="color: #e74c3c; font-weight: bold;">⚠️ يرجى تغيير كلمة المرور عند أول دخول</p>
        </div>
        
        <p>يمكنك الدخول من خلال الرابط التالي:</p>
        <p><a href="${process.env.VITE_FRONTEND_URL || 'https://example.com'}/login" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">الدخول إلى المنصة</a></p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        <p style="color: #7f8c8d; font-size: 12px;">
          إذا واجهت أي مشاكل، يرجى التواصل مع قسم الدعم الفني.
        </p>
      </div>
    `;

    // Send email using Manus built-in email service
    const emailResponse = await fetch(
      `${process.env.BUILT_IN_FORGE_API_URL}/v1/email/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`,
        },
        body: JSON.stringify({
          to: email,
          subject,
          html: htmlContent,
          from: "noreply@training-platform.com",
        }),
      }
    );

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Email send error:", errorText);
      return { 
        success: false, 
        message: "فشل إرسال البريد الإلكتروني. يرجى المحاولة لاحقاً" 
      };
    }

    return { 
      success: true, 
      message: `تم إرسال بيانات الدخول إلى ${email} بنجاح` 
    };
  } catch (error) {
    console.error("Error sending login credentials:", error);
    return { 
      success: false, 
      message: "حدث خطأ أثناء إرسال البريد الإلكتروني" 
    };
  }
}


// ============ CREATE EMPLOYEE WITH USER ACCOUNT ============
export async function createEmployeeWithUser(
  employeeData: {
    name: string;
    email: string;
    phone?: string;
    specialization: string;
    hireDate: Date;
    salary?: string;
    workType?: string;
    status?: string;
  },
  roleId?: number
): Promise<{ employee: any; user: any; tempPassword: string }> {
  const db = await getDb();
  if (!db) {
    throw new Error("قاعدة البيانات غير متاحة");
  }

  try {
    // Check if email already exists in users table
    const existingUser = await db.select().from(users).where(eq(users.email, employeeData.email)).limit(1);
    if (existingUser.length > 0) {
      throw new Error("البريد الإلكتروني مسجل مسبقاً. يرجى استخدام بريد آخر أو تسجيل الدخول بالبريد الحالي.");
    }

    // Generate temporary password
    const tempPassword = `Temp${Math.random().toString(36).substring(2, 10)}`;
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Get default role (user role) if not provided
    let finalRoleId = roleId;
    if (!finalRoleId) {
      try {
        const defaultRole = await db.select().from(roles).where(eq(roles.name, 'user')).limit(1);
        finalRoleId = defaultRole[0]?.id || 2;
      } catch (error) {
        finalRoleId = 2; // Fallback to roleId 2
      }
    }

    // Create user account first
    const userResult = await db.insert(users).values({
      openId: null, // Will be updated after we get the userId
      email: employeeData.email,
      password: hashedPassword,
      name: employeeData.name,
      loginMethod: "password",
      roleId: finalRoleId,
      status: "active",
    });

    const userId = userResult[0].insertId;
    
    // Update openId to pwd_{userId} for password-based auth
    await db.update(users).set({ openId: `pwd_${userId}` }).where(eq(users.id, userId));

    // Create employee with userId
    const employeeResult = await db.insert(employees).values({
      name: employeeData.name,
      email: employeeData.email,
      phone: employeeData.phone || null,
      specialization: employeeData.specialization as any,
      userId,
      hireDate: employeeData.hireDate,
      salary: employeeData.salary ? parseFloat(employeeData.salary).toString() : null,
      workType: (employeeData.workType || "remote") as any,
      status: (employeeData.status || "active") as any,
    });

    const employeeId = employeeResult[0].insertId;

    // Fetch the created employee
    const employee = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);

    // Fetch the created user
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    return {
      employee: employee[0] || null,
      user: user[0] || null,
      tempPassword,
    };
  } catch (error) {
    console.error("Error creating employee with user:", error);
    throw error;
  }
}

// ============ UPDATE EMPLOYEE ROLE ============
export async function updateEmployeeRole(
  employeeId: number,
  roleId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("قاعدة البيانات غير متاحة");
  }

  try {
    // Get employee to find userId
    const employeeList = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
    const employee = employeeList[0];

    if (!employee || !employee.userId) {
      throw new Error("الموظف أو حسابه غير موجود");
    }

    // Update user role
    await db.update(users)
      .set({ roleId })
      .where(eq(users.id, employee.userId));

    return true;
  } catch (error) {
    console.error("Error updating employee role:", error);
    throw error;
  }
}

// ============ GET EMPLOYEE WITH ROLE ============
export async function getEmployeeWithRole(employeeId: number): Promise<any> {
  const db = await getDb();
  if (!db) {
    throw new Error("قاعدة البيانات غير متاحة");
  }

  try {
    const employeeList = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
    const employee = employeeList[0];

    if (!employee) {
      return null;
    }

    // Get user and role info
    let userRole = null;
    if (employee.userId) {
      const userList = await db.select().from(users).where(eq(users.id, employee.userId)).limit(1);
      const user = userList[0];

      if (user && user.roleId) {
        const roleList = await db.select().from(roles).where(eq(roles.id, user.roleId)).limit(1);
        userRole = roleList[0] || null;
      }
    }

    return {
      ...employee,
      user: userRole ? { role: userRole } : null,
    };
  } catch (error) {
    console.error("Error getting employee with role:", error);
    throw error;
  }
}

// ============ PERMISSIONS MANAGEMENT HELPERS ============
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    roleId: users.roleId,
    roleName: roles.displayName,
    status: users.status,
  }).from(users)
    .leftJoin(roles, eq(users.roleId, roles.id));
}

export async function getAllRoles() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(roles);
}

export async function getAllPermissions() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(permissions);
}

export async function assignPermissionToRole(roleId: number, permissionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if already exists
  const existing = await db.select().from(rolePermissions)
    .where(and(
      eq(rolePermissions.roleId, roleId),
      eq(rolePermissions.permissionId, permissionId)
    ));
  
  if (!existing.length) {
    await db.insert(rolePermissions).values({ roleId, permissionId });
  }
}

export async function removePermissionFromRole(roleId: number, permissionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(rolePermissions)
    .where(and(
      eq(rolePermissions.roleId, roleId),
      eq(rolePermissions.permissionId, permissionId)
    ));
}


// ============ USER PERMISSIONS FUNCTIONS ============
export async function getUserPermissions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select({
    id: userPermissions.id,
    permissionId: userPermissions.permissionId,
    permission: {
      id: permissions.id,
      name: permissions.name,
      displayName: permissions.displayName,
      module: permissions.module,
      description: permissions.description,
    },
  })
  .from(userPermissions)
  .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
  .where(eq(userPermissions.userId, userId));
}

export async function grantPermissionToUser(userId: number, permissionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(userPermissions)
    .where(and(
      eq(userPermissions.userId, userId),
      eq(userPermissions.permissionId, permissionId)
    ));
  
  if (!existing.length) {
    await db.insert(userPermissions).values({ userId, permissionId });
  }
}

export async function removePermissionFromUser(userId: number, permissionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(userPermissions)
    .where(and(
      eq(userPermissions.userId, userId),
      eq(userPermissions.permissionId, permissionId)
    ));
}

export async function setUserPermissions(userId: number, permissionIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(userPermissions).where(eq(userPermissions.userId, userId));
  
  if (permissionIds.length > 0) {
    await db.insert(userPermissions).values(
      permissionIds.map(permissionId => ({
        userId,
        permissionId,
      }))
    );
  }
}


// ============ PASSWORD MANAGEMENT FUNCTIONS ============

/**
 * Change user password with history tracking
 * @param userId - User ID
 * @param oldPassword - Current password (for verification)
 * @param newPassword - New password
 * @param changedBy - User ID who initiated the change (null if self-change)
 * @param reason - Reason for password change
 */
export async function changePassword(
  userId: number,
  oldPassword: string,
  newPassword: string,
  changedBy?: number,
  reason?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !user[0]) throw new Error("المستخدم غير موجود");
  
  const userData = user[0];
  if (!userData.password) {
    throw new Error("لا يمكن تغيير كلمة المرور للحسابات المتصلة بـ OAuth");
  }
  
  // Verify old password
  const isValid = await bcrypt.compare(oldPassword, userData.password);
  if (!isValid) {
    throw new Error("كلمة المرور الحالية غير صحيحة");
  }
  
  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  
  // Record password change in history
  await db.insert(passwordHistory).values({
    userId,
    oldPassword: userData.password,
    newPassword: hashedNewPassword,
    changedBy: changedBy || null,
    reason: reason || "تغيير يدوي",
  });
  
  // Update user password
  await db.update(users)
    .set({ password: hashedNewPassword, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

/**
 * Admin changes user password without verification
 * @param userId - User ID
 * @param newPassword - New password (can be weak)
 * @param adminId - Admin user ID
 * @param sendEmail - Whether to send email notification (optional)
 */
export async function adminChangePassword(
  userId: number,
  newPassword: string,
  adminId: number,
  sendEmail: boolean = false
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !user[0]) throw new Error("المستخدم غير موجود");
  
  const userData = user[0];
  // Hash new password (no strength validation for admin changes)
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  
  // Record password change in history
  if (userData.password) {
    await db.insert(passwordHistory).values({
      userId,
      oldPassword: userData.password,
      newPassword: hashedNewPassword,
      changedBy: adminId,
      reason: "تغيير من قبل المسؤول",
    });
  }
  
  // Update user password
  await db.update(users)
    .set({ password: hashedNewPassword, updatedAt: new Date() })
    .where(eq(users.id, userId));
  
  // TODO: Send email notification if sendEmail is true
  // This would require email service integration
  if (sendEmail) {
    // Email notification would be sent here
    console.log(`Email notification would be sent to ${userData.email}`);
  }
}

/**
 * Reset user password (for forgotten password)
 * @param userId - User ID
 * @param newPassword - New password
 */
export async function resetPassword(userId: number, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !user[0]) throw new Error("المستخدم غير موجود");
  
  const userData = user[0];
  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  
  // Record password change in history
  if (userData.password) {
    await db.insert(passwordHistory).values({
      userId,
      oldPassword: userData.password,
      newPassword: hashedNewPassword,
      changedBy: null,
      reason: "إعادة تعيين كلمة المرور",
    });
  }
  
   // Update user password
  await db.update(users)
    .set({ password: hashedNewPassword, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

/**
 * Get password history for a userr
 * @param userId - User ID
 * @param limit - Number of records to return
 */
export async function getPasswordHistory(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const history = await db.select()
    .from(passwordHistory)
    .where(eq(passwordHistory.userId, userId))
    .orderBy(desc(passwordHistory.changedAt))
    .limit(limit);
  
  return history;
}

/**
 * Get all password changes for a user (for audit)
 * @param userId - User ID
 */
export async function getUserPasswordAudit(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const audit = await db.select({
    id: passwordHistory.id,
    changedAt: passwordHistory.changedAt,
    changedBy: passwordHistory.changedBy,
    reason: passwordHistory.reason,
    changedByName: users.name,
  })
    .from(passwordHistory)
    .leftJoin(users, eq(passwordHistory.changedBy, users.id))
    .where(eq(passwordHistory.userId, userId))
    .orderBy(desc(passwordHistory.changedAt));
  
  return audit;
}

/**
 * Check if user can change their own password
 * @param userId - User ID
 */
export async function canChangeOwnPassword(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !user[0]) return false;
  
  // Can only change password if using password-based auth
  return user[0].loginMethod === 'password' && !!user[0].password;
}

/**
 * Check if user can change another user's password (admin only)
 * @param adminId - Admin user ID
 * @param targetUserId - Target user ID
 */
export async function canChangeUserPassword(
  adminId: number,
  targetUserId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const admin = await db.select().from(users).where(eq(users.id, adminId)).limit(1);
  if (!admin || !admin[0]) return false;
  
  // Admin users can change passwords (roleId = 1 is typically admin)
  const adminUser = admin[0];
  if (adminUser.roleId === 1) {
    return true;
  }
  
  // Also check if admin has permission to manage users
  const adminPermissions = await getUserPermissions(adminId);
  const hasPermission = adminPermissions.some((p: any) => p.permission?.name === 'users.edit');
  
  return hasPermission;
}


/**
 * Delete multiple users and all their related data
 * @param userIds - Array of user IDs to delete
 */
export async function deleteUsersByIds(userIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (userIds.length === 0) return;
  
  // Delete all related data in order of dependencies
  // 1. Delete password history
  await db.delete(passwordHistory).where(inArray(passwordHistory.userId, userIds));
  
  // 2. Delete user permissions
  await db.delete(userPermissions).where(inArray(userPermissions.userId, userIds));
  
  // 3. Delete employees linked to these users
  const employeesList = await db.select({ id: employees.id }).from(employees).where(inArray(employees.userId, userIds));
  if (employeesList.length > 0) {
    const employeeIds = employeesList.map(e => e.id);
    await deleteEmployeesByIds(employeeIds);
  }
  
  // 4. Finally delete the users
  await db.delete(users).where(inArray(users.id, userIds));
}

/**
 * Delete multiple employees and all their related data
 * @param employeeIds - Array of employee IDs to delete
 */
export async function deleteEmployeesByIds(employeeIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (employeeIds.length === 0) return;
  
  // Delete all related data in order of dependencies
  // 1. Delete employee targets
  await db.delete(employeeTargets).where(inArray(employeeTargets.employeeId, employeeIds));
  
  // 2. Delete employee rewards
  await db.delete(employeeRewards).where(inArray(employeeRewards.employeeId, employeeIds));
  
  // 3. Delete attendance records
  await db.delete(attendance).where(inArray(attendance.employeeId, employeeIds));
  
  // 4. Delete daily reports
  await db.delete(dailyReports).where(inArray(dailyReports.employeeId, employeeIds));
  
  // 5. Delete salaries
  await db.delete(monthlySalaries).where(inArray(monthlySalaries.employeeId, employeeIds));
  
  // 6. Delete salary adjustments
  await db.delete(salaryAdjustments).where(inArray(salaryAdjustments.employeeId, employeeIds));
  
  // 7. Finally delete the employees
  await db.delete(employees).where(inArray(employees.id, employeeIds));
}


// ============ RESET PASSWORD (ADMIN ONLY) ============
export async function resetUserPassword(userId: number, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get current password
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !user[0]) {
    throw new Error("المستخدم غير موجود");
  }
  
  const oldPassword = user[0].password || "";
  
  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  // Update the user's password
  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  
  // Also record this in password history
  await db.insert(passwordHistory).values({
    userId: userId,
    oldPassword: oldPassword,
    newPassword: hashedPassword,
    changedBy: userId, // Admin changing it
    changedAt: new Date(),
  });
  
  return true;
}


// ============ ACTIVATE USER ============
export async function activateUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Update user status to active
  await db.update(users).set({ status: 'active' }).where(eq(users.id, userId));
  
  return true;
}

// ============ DEACTIVATE USER ============
export async function deactivateUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Update user status to inactive
  await db.update(users).set({ status: 'inactive' }).where(eq(users.id, userId));
  
  return true;
}


// ============ DAILY STATS FUNCTIONS ============

// List daily stats for an employee
export async function listDailyStats(employeeId?: number, month?: number, year?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (employeeId) {
    conditions.push(eq(dailyStats.employeeId, employeeId));
  }
  if (month && year) {
    // Filter by month and year
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    conditions.push(gte(dailyStats.date, startDate));
    conditions.push(lte(dailyStats.date, endDate));
  } else if (year) {
    // Filter by year only
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    conditions.push(gte(dailyStats.date, startDate));
    conditions.push(lte(dailyStats.date, endDate));
  }

  const result = await db.select().from(dailyStats)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(dailyStats.date));
  
  return result;
}

// Get daily stat by ID
export async function getDailyStatById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(dailyStats).where(eq(dailyStats.id, id));
  return result[0] || null;
}

// Get daily stat by employee and date
export async function getDailyStatByDate(employeeId: number, date: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(dailyStats)
    .where(and(
      eq(dailyStats.employeeId, employeeId),
      eq(dailyStats.date, new Date(date))
    ));
  return result[0] || null;
}

// Create daily stat with course linking - always creates new record (allows multiple stats per day)
export async function upsertDailyStat(data: InsertDailyStat & { courseId?: number; courseFee?: string; feeBreakdown?: string; calculatedRevenue?: number; soldServices?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Calculate revenue - either from feeBreakdown or from courseFee
  let calculatedRevenue = "0";
  
  if (data.feeBreakdown) {
    // حساب الإيراد من تفاصيل الأسعار المتعددة
    try {
      const breakdown = JSON.parse(data.feeBreakdown);
      calculatedRevenue = breakdown.reduce((sum: number, item: { feeAmount: number; customerCount: number }) => 
        sum + (item.feeAmount * (item.customerCount || 0)), 0
      ).toFixed(2);
    } catch (e) {
      calculatedRevenue = "0";
    }
  } else if (data.courseId && data.courseFee) {
    // حساب الإيراد بالطريقة القديمة
    calculatedRevenue = (parseFloat(data.courseFee) * (data.confirmedCustomers || 0)).toFixed(2);
  }
  
  // Always create new stat - allows multiple entries per day per employee
  const result = await db.insert(dailyStats).values({
    ...data,
    calculatedRevenue: calculatedRevenue,
  });
  const insertId = Number(result[0].insertId);
  
  // Update the employee's targets with the new totals
  await updateEmployeeTargetsFromDailyStats(data.employeeId);
  
  // لا يتم إضافة الإيراد للدورة هنا - يتم ذلك فقط بعد موافقة المشرف في approveDailyStat
  
  return insertId;
}

// Get daily stat by date and course
export async function getDailyStatByDateAndCourse(employeeId: number, dateStr: string, courseId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(dailyStats)
    .where(and(
      eq(dailyStats.employeeId, employeeId),
      eq(dailyStats.date, new Date(dateStr)),
      eq(dailyStats.courseId, courseId)
    ))
    .limit(1);
  
  return result[0] || null;
}

// Add daily stat revenue to course enrollments
export async function addDailyStatRevenueToCourse(courseId: number, dailyStatId: number, traineesCount: number, revenue: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get course fees to find the default fee
  const fees = await db.select().from(courseFees).where(eq(courseFees.courseId, courseId));
  const defaultFee = fees[0];
  const paidPerTrainee = traineesCount > 0 ? (parseFloat(revenue) / traineesCount).toFixed(2) : "0";
  
  if (!defaultFee) {
    // Create a default fee for the course if none exists
    const feeResult = await db.insert(courseFees).values({
      courseId: courseId,
      name: 'رسوم التسجيل',
      amount: paidPerTrainee,
    });
    const feeId = Number(feeResult[0].insertId);
    
    // Create enrollment with the new fee
    await db.insert(courseEnrollments).values({
      courseId: courseId,
      feeId: feeId,
      traineeCount: traineesCount,
      paidAmount: paidPerTrainee,
      enrollmentDate: new Date(),
      notes: `إحصائية يومية #${dailyStatId}`,
    });
  } else {
    // Check if enrollment already exists for this daily stat
    const existingEnrollments = await db.select().from(courseEnrollments)
      .where(and(
        eq(courseEnrollments.courseId, courseId),
        eq(courseEnrollments.notes, `إحصائية يومية #${dailyStatId}`)
      ));
    
    if (existingEnrollments.length > 0) {
      // Update existing enrollment
      await db.update(courseEnrollments).set({
        traineeCount: traineesCount,
        paidAmount: paidPerTrainee,
      }).where(eq(courseEnrollments.id, existingEnrollments[0].id));
    } else {
      // Create new enrollment
      await db.insert(courseEnrollments).values({
        courseId: courseId,
        feeId: defaultFee.id,
        traineeCount: traineesCount,
        paidAmount: paidPerTrainee,
        enrollmentDate: new Date(),
        notes: `إحصائية يومية #${dailyStatId}`,
      });
    }
  }
}

// Create daily stat
export async function createDailyStat(data: InsertDailyStat & { courseId?: number; courseFee?: string; feeBreakdown?: string; calculatedRevenue?: number; soldServices?: string }) {
  // Convert null to undefined for courseId, feeBreakdown, and soldServices
  const cleanData = {
    ...data,
    courseId: data.courseId ?? undefined,
    feeBreakdown: data.feeBreakdown ?? undefined,
    calculatedRevenue: data.calculatedRevenue ?? undefined,
    soldServices: data.soldServices ?? undefined,
  };
  return upsertDailyStat(cleanData);
}

// Update daily stat
export async function updateDailyStat(id: number, data: Partial<InsertDailyStat>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the existing stat to know the employeeId
  const existing = await getDailyStatById(id);
  if (!existing) throw new Error("Daily stat not found");

  await db.update(dailyStats).set(data).where(eq(dailyStats.id, id));
  
  // Update the employee's targets with the new totals
  await updateEmployeeTargetsFromDailyStats(existing.employeeId);
  
  return true;
}

// Update daily stat with sync to course enrollments and targets
export async function updateDailyStatWithSync(id: number, data: Partial<InsertDailyStat> & { courseId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the existing stat
  const existing = await getDailyStatById(id);
  if (!existing) throw new Error("Daily stat not found");

  // Calculate new revenue if confirmedCustomers or courseFee changed
  let calculatedRevenue = existing.calculatedRevenue;
  const newConfirmed = data.confirmedCustomers !== undefined ? data.confirmedCustomers : existing.confirmedCustomers;
  const existingCourseFee = existing.courseFee ?? '0';
  const dataCourseFee = data.courseFee ?? undefined;
  const newCourseFee = dataCourseFee !== undefined ? parseFloat(dataCourseFee) : parseFloat(existingCourseFee);
  const newCourseId = data.courseId !== undefined ? data.courseId : existing.courseId;
  
  if (newCourseFee > 0 && newConfirmed !== undefined) {
    calculatedRevenue = String(newConfirmed * newCourseFee);
  }

  // Update the daily stat
  await db.update(dailyStats).set({
    ...data,
    calculatedRevenue,
    courseId: newCourseId,
  }).where(eq(dailyStats.id, id));

  // If the stat is already approved, update the course enrollment
  if (existing.status === 'approved' && existing.courseId) {
    // Find and update the enrollment linked to this stat
    // First try to find by dailyStatId
    let enrollments = await db.select().from(courseEnrollments)
      .where(eq(courseEnrollments.dailyStatId, id));
    
    // If not found, try to find by notes (for older enrollments)
    if (enrollments.length === 0) {
      enrollments = await db.select().from(courseEnrollments)
        .where(and(
          eq(courseEnrollments.courseId, existing.courseId),
          eq(courseEnrollments.notes, `إحصائية يومية #${id}`)
        ));
    }
    
    if (enrollments.length > 0) {
      const enrollment = enrollments[0];
      const newAmount = String(newConfirmed * newCourseFee);
      const paidPerTrainee = newConfirmed > 0 ? (newConfirmed * newCourseFee / newConfirmed).toFixed(2) : "0";
      
      await db.update(courseEnrollments).set({
        traineeCount: newConfirmed,
        paidAmount: paidPerTrainee,
        courseId: newCourseId || enrollment.courseId,
        dailyStatId: id, // Ensure dailyStatId is set for future updates
      }).where(eq(courseEnrollments.id, enrollment.id));
      
      // Also update the course fee if it changed
      if (dataCourseFee !== undefined && enrollment.feeId) {
        await db.update(courseFees).set({
          amount: String(newCourseFee),
        }).where(eq(courseFees.id, enrollment.feeId));
      }
    }
  }

  // Update the employee's targets with the new totals
  await updateEmployeeTargetsFromDailyStats(existing.employeeId);

  return true;
}

// Delete daily stat
export async function deleteDailyStat(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the existing stat to know the employeeId
  const existing = await getDailyStatById(id);
  if (!existing) throw new Error("Daily stat not found");

  await db.delete(dailyStats).where(eq(dailyStats.id, id));
  
  // Update the employee's targets with the new totals
  await updateEmployeeTargetsFromDailyStats(existing.employeeId);
  
  return true;
}

// Get monthly totals for an employee
export async function getDailyStatsMonthlyTotal(employeeId: number, month: number, year: number) {
  const db = await getDb();
  if (!db) return {
    confirmedCustomers: 0,
    registeredCustomers: 0,
    targetedCustomers: 0,
    servicesSold: 0,
    targetedByServices: 0,
    salesAmount: 0,
    totalDays: 0,
    totalRevenue: 0,
    servicesRevenue: 0,
    coursesRevenue: 0,
  };

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  // حساب الإحصائيات المؤكدة فقط (approved) - لا تُحتسب الإحصائيات المعلقة أو المرفوضة
  const result = await db.select({
    // حساب العملاء المؤكدين من الإحصائيات الموافق عليها فقط
    confirmedCustomers: sql<number>`COALESCE(SUM(CASE WHEN ${dailyStats.status} = 'approved' THEN ${dailyStats.confirmedCustomers} ELSE 0 END), 0)`,
    registeredCustomers: sql<number>`COALESCE(SUM(CASE WHEN ${dailyStats.status} = 'approved' THEN ${dailyStats.registeredCustomers} ELSE 0 END), 0)`,
    targetedCustomers: sql<number>`COALESCE(SUM(CASE WHEN ${dailyStats.status} = 'approved' THEN ${dailyStats.targetedCustomers} ELSE 0 END), 0)`,
    servicesSold: sql<number>`COALESCE(SUM(CASE WHEN ${dailyStats.status} = 'approved' THEN ${dailyStats.servicesSold} ELSE 0 END), 0)`,
    targetedByServices: sql<number>`COALESCE(SUM(CASE WHEN ${dailyStats.status} = 'approved' THEN ${dailyStats.targetedByServices} ELSE 0 END), 0)`,
    // إيرادات الخدمات المباعة (من حقل salesAmount)
    salesAmount: sql<number>`COALESCE(SUM(CASE WHEN ${dailyStats.status} = 'approved' THEN ${dailyStats.salesAmount} ELSE 0 END), 0)`,
    // حساب أيام العمل الفريدة (بالتاريخ) من الإحصائيات المؤكدة فقط
    totalDays: sql<number>`COUNT(DISTINCT CASE WHEN ${dailyStats.status} = 'approved' THEN DATE(${dailyStats.date}) ELSE NULL END)`,
    // إيرادات الدورات (من حقل calculatedRevenue)
    coursesRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${dailyStats.status} = 'approved' THEN CAST(${dailyStats.calculatedRevenue} AS DECIMAL(10,2)) ELSE 0 END), 0)`,
  }).from(dailyStats)
    .where(and(
      eq(dailyStats.employeeId, employeeId),
      gte(dailyStats.date, startDate),
      lte(dailyStats.date, endDate)
    ));

  const stats = result[0] || {
    confirmedCustomers: 0,
    registeredCustomers: 0,
    targetedCustomers: 0,
    servicesSold: 0,
    targetedByServices: 0,
    salesAmount: 0,
    totalDays: 0,
    coursesRevenue: 0,
  };

  // إيرادات الخدمات = salesAmount (مبلغ الخدمات المباعة)
  const servicesRevenue = Number(stats.salesAmount) || 0;
  // إيرادات الدورات = calculatedRevenue
  const coursesRevenue = Number(stats.coursesRevenue) || 0;
  // إجمالي الإيرادات = إيرادات الدورات + إيرادات الخدمات
  const totalRevenue = coursesRevenue + servicesRevenue;

  return {
    ...stats,
    servicesRevenue,
    coursesRevenue,
    totalRevenue,
  };
}

// Update employee targets from daily stats
export async function updateEmployeeTargetsFromDailyStats(employeeId: number) {
  const db = await getDb();
  if (!db) return;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Get monthly totals
  const totals = await getDailyStatsMonthlyTotal(employeeId, currentMonth, currentYear);

  // Map target types to daily stats fields
  // ملاحظة: sales_amount يرتبط بـ totalRevenue (الإيرادات المحصّلة من الإحصائيات المؤكدة)
  // بدلاً من salesAmount (مبلغ المبيعات المدخل يدوياً)
  const targetTypeMapping: Record<string, keyof typeof totals> = {
    'confirmed_customers': 'confirmedCustomers',
    'registered_customers': 'registeredCustomers',
    'targeted_customers': 'targetedCustomers',
    'services_sold': 'servicesSold',
    'sales_amount': 'totalRevenue',
  };

  // Get employee targets for current month
  const targets = await db.select().from(employeeTargets)
    .where(and(
      eq(employeeTargets.employeeId, employeeId),
      eq(employeeTargets.month, currentMonth),
      eq(employeeTargets.year, currentYear)
    ));

  // Update each target's current value = baseValue + daily stats total
  for (const target of targets) {
    const statsField = targetTypeMapping[target.targetType];
    if (statsField && statsField in totals) {
      const dailyStatsTotal = Number(totals[statsField as keyof typeof totals]) || 0;
      const baseValue = parseFloat(target.baseValue || '0') || 0;
      const newValue = baseValue + dailyStatsTotal;
      
      // Check if target is achieved and update status accordingly
      const targetValue = parseFloat(target.targetValue);
      let newStatus = target.status;
      
      if (newValue >= targetValue && target.status !== 'achieved') {
        newStatus = 'achieved';
      } else if (newValue < targetValue && target.status === 'achieved') {
        // If value dropped below target, revert to in_progress
        newStatus = 'in_progress';
      }
      
      await db.update(employeeTargets)
        .set({ 
          currentValue: String(newValue),
          status: newStatus
        })
        .where(eq(employeeTargets.id, target.id));
    }
  }
}

// Get all daily stats for a specific date range
export async function getDailyStatsReport(startDate: string, endDate: string, employeeId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    gte(dailyStats.date, new Date(startDate)),
    lte(dailyStats.date, new Date(endDate)),
  ];
  
  if (employeeId) {
    conditions.push(eq(dailyStats.employeeId, employeeId));
  }

  const result = await db.select().from(dailyStats)
    .where(and(...conditions))
    .orderBy(desc(dailyStats.date));
  
  return result;
}


// ============ DAILY STATS REVIEW FUNCTIONS ============

// List daily stats for review (for supervisors)
export async function listDailyStatsForReview(
  status?: "pending" | "approved" | "rejected",
  month?: number,
  year?: number,
  employeeId?: number
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (status) {
    conditions.push(eq(dailyStats.status, status));
  }
  
  if (employeeId) {
    conditions.push(eq(dailyStats.employeeId, employeeId));
  }
  
  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    conditions.push(gte(dailyStats.date, startDate));
    conditions.push(lte(dailyStats.date, endDate));
  } else if (year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    conditions.push(gte(dailyStats.date, startDate));
    conditions.push(lte(dailyStats.date, endDate));
  }

  // Get daily stats with employee info and course info
  const result = await db.select({
    id: dailyStats.id,
    employeeId: dailyStats.employeeId,
    courseId: dailyStats.courseId,
    date: dailyStats.date,
    confirmedCustomers: dailyStats.confirmedCustomers,
    courseFee: dailyStats.courseFee,
    calculatedRevenue: dailyStats.calculatedRevenue,
    registeredCustomers: dailyStats.registeredCustomers,
    targetedCustomers: dailyStats.targetedCustomers,
    servicesSold: dailyStats.servicesSold,
    targetedByServices: dailyStats.targetedByServices,
    salesAmount: dailyStats.salesAmount,
    notes: dailyStats.notes,
    status: dailyStats.status,
    reviewedBy: dailyStats.reviewedBy,
    reviewedAt: dailyStats.reviewedAt,
    reviewNotes: dailyStats.reviewNotes,
    createdAt: dailyStats.createdAt,
    updatedAt: dailyStats.updatedAt,
    employeeName: employees.name,
    employeeEmail: employees.email,
    courseName: courses.name,
  })
    .from(dailyStats)
    .leftJoin(employees, eq(dailyStats.employeeId, employees.id))
    .leftJoin(courses, eq(dailyStats.courseId, courses.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(dailyStats.date));
  
  return result;
}

// Approve daily stat
export async function approveDailyStat(id: number, reviewerId: number, reviewNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(dailyStats).set({
    status: "approved",
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
    reviewNotes: reviewNotes || null,
  }).where(eq(dailyStats.id, id));

  // Update employee targets when stat is approved
  const stat = await getDailyStatById(id);
  if (stat) {
    await updateEmployeeTargetsFromDailyStats(stat.employeeId);
    
    // إضافة الإيراد للدورة فقط بعد موافقة المشرف
    if (stat.courseId && stat.calculatedRevenue && parseFloat(stat.calculatedRevenue) > 0) {
      await addDailyStatRevenueToCourse(
        stat.courseId, 
        stat.id, 
        stat.confirmedCustomers || 0, 
        stat.calculatedRevenue
      );
    }
    
    // إضافة الخدمات المباعة إلى جدول الخدمات بعد موافقة المشرف
    if (stat.soldServices) {
      try {
        const soldServicesData = JSON.parse(stat.soldServices);
        for (const service of soldServicesData) {
          if (service.templateId && service.quantity > 0) {
            await createService({
              name: service.templateName,
              price: String(service.price),
              quantity: service.quantity,
              totalAmount: String(service.price * service.quantity),
              saleDate: stat.date instanceof Date ? stat.date.toISOString().split('T')[0] : String(stat.date),
              notes: `من إحصائية يومية #${stat.id}`,
            });
          }
        }
      } catch (e) {
        console.error('Error parsing soldServices:', e);
      }
    }
  }

  return true;
}

// Reject daily stat
export async function rejectDailyStat(id: number, reviewerId: number, reviewNotes: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(dailyStats).set({
    status: "rejected",
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
    reviewNotes: reviewNotes,
  }).where(eq(dailyStats.id, id));

  return true;
}

// Unapprove daily stat - إلغاء الموافقة على الإحصائية
export async function unapproveDailyStat(id: number, reviewerId: number, reviewNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the stat first to check if it's approved and has course enrollment
  const stat = await getDailyStatById(id);
  if (!stat) throw new Error("Daily stat not found");
  if (stat.status !== 'approved') throw new Error("Daily stat is not approved");

  // Delete the course enrollment linked to this stat if exists
  if (stat.courseId) {
    // Try to find enrollment by dailyStatId first
    let enrollments = await db.select().from(courseEnrollments)
      .where(eq(courseEnrollments.dailyStatId, id));
    
    // If not found, try to find by notes (for older enrollments)
    if (enrollments.length === 0) {
      enrollments = await db.select().from(courseEnrollments)
        .where(and(
          eq(courseEnrollments.courseId, stat.courseId),
          eq(courseEnrollments.notes, `إحصائية يومية #${id}`)
        ));
    }
    
    // Delete the enrollment
    for (const enrollment of enrollments) {
      await db.delete(courseEnrollments).where(eq(courseEnrollments.id, enrollment.id));
    }
  }

  // Update the stat status back to pending
  await db.update(dailyStats).set({
    status: "pending",
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
    reviewNotes: reviewNotes ? `إلغاء الموافقة: ${reviewNotes}` : "تم إلغاء الموافقة",
  }).where(eq(dailyStats.id, id));

  // Update employee targets after unapproval
  await updateEmployeeTargetsFromDailyStats(stat.employeeId);

  return true;
}

// Bulk approve daily stats
export async function bulkApproveDailyStats(ids: number[], reviewerId: number, reviewNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (const id of ids) {
    await approveDailyStat(id, reviewerId, reviewNotes);
  }

  return true;
}

// Get review statistics
export async function getDailyStatsReviewStats(month?: number, year?: number) {
  const db = await getDb();
  if (!db) return {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  };

  const conditions = [];
  
  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    conditions.push(gte(dailyStats.date, startDate));
    conditions.push(lte(dailyStats.date, endDate));
  } else if (year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    conditions.push(gte(dailyStats.date, startDate));
    conditions.push(lte(dailyStats.date, endDate));
  }

  const result = await db.select({
    total: sql<number>`COUNT(*)`,
    pending: sql<number>`SUM(CASE WHEN ${dailyStats.status} = 'pending' THEN 1 ELSE 0 END)`,
    approved: sql<number>`SUM(CASE WHEN ${dailyStats.status} = 'approved' THEN 1 ELSE 0 END)`,
    rejected: sql<number>`SUM(CASE WHEN ${dailyStats.status} = 'rejected' THEN 1 ELSE 0 END)`,
  })
    .from(dailyStats)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return result[0] || {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  };
}


// ============ RESET EMPLOYEE STATS ============

// إعادة تهيئة إحصائيات الموظفين
export async function resetEmployeeStats(options: {
  employeeId?: number;
  month?: number;
  year?: number;
  resetDailyStats?: boolean;
  resetCurrentValues?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { employeeId, month, year, resetDailyStats = true, resetCurrentValues = true } = options;

  let deletedDailyStats = 0;
  let updatedTargets = 0;

  // حذف الإحصائيات اليومية
  if (resetDailyStats) {
    const conditions = [];
    
    if (employeeId) {
      conditions.push(eq(dailyStats.employeeId, employeeId));
    }
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      conditions.push(gte(dailyStats.date, startDate));
      conditions.push(lte(dailyStats.date, endDate));
    } else if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      conditions.push(gte(dailyStats.date, startDate));
      conditions.push(lte(dailyStats.date, endDate));
    }

    if (conditions.length > 0) {
      // حساب عدد السجلات قبل الحذف
      const toDelete = await db.select({ id: dailyStats.id }).from(dailyStats).where(and(...conditions));
      deletedDailyStats = toDelete.length;
      await db.delete(dailyStats).where(and(...conditions));
    } else {
      const toDelete = await db.select({ id: dailyStats.id }).from(dailyStats);
      deletedDailyStats = toDelete.length;
      await db.delete(dailyStats);
    }
  }

  // إعادة القيم المتحققة والقيمة الأساسية للصفر تماماً
  if (resetCurrentValues) {
    const conditions = [];
    
    if (employeeId) {
      conditions.push(eq(employeeTargets.employeeId, employeeId));
    }
    
    if (month) {
      conditions.push(eq(employeeTargets.month, month));
    }
    
    if (year) {
      conditions.push(eq(employeeTargets.year, year));
    }

    // إعادة currentValue و baseValue للصفر تماماً
    if (conditions.length > 0) {
      const result = await db.update(employeeTargets)
        .set({ 
          currentValue: "0",
          baseValue: "0",
          status: "in_progress"
        })
        .where(and(...conditions));
      
      // حساب عدد السجلات المحدثة
      const targets = await db.select({ id: employeeTargets.id })
        .from(employeeTargets)
        .where(and(...conditions));
      updatedTargets = targets.length;
    } else {
      await db.update(employeeTargets)
        .set({ 
          currentValue: "0",
          baseValue: "0",
          status: "in_progress"
        });
      
      const targets = await db.select({ id: employeeTargets.id }).from(employeeTargets);
      updatedTargets = targets.length;
    }
  }

  return {
    success: true,
    deletedDailyStats,
    updatedTargets,
    message: `تم حذف ${deletedDailyStats} إحصائية يومية وتحديث ${updatedTargets} مستهدف`
  };
}


// ============ PROJECT EMPLOYEES FUNCTIONS ============

/**
 * List employees assigned to a project
 */
export async function listProjectEmployees(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    id: projectEmployees.id,
    projectId: projectEmployees.projectId,
    employeeId: projectEmployees.employeeId,
    salaryPercentage: projectEmployees.salaryPercentage,
    calculatedCost: projectEmployees.calculatedCost,
    notes: projectEmployees.notes,
    createdAt: projectEmployees.createdAt,
    updatedAt: projectEmployees.updatedAt,
    employee: {
      id: employees.id,
      name: employees.name,
      email: employees.email,
      salary: employees.salary,
      specialization: employees.specialization,
      status: employees.status,
    }
  })
    .from(projectEmployees)
    .leftJoin(employees, eq(projectEmployees.employeeId, employees.id))
    .where(eq(projectEmployees.projectId, projectId))
    .orderBy(desc(projectEmployees.createdAt));
  
  return result;
}

/**
 * Add employee to project with salary percentage
 */
export async function addProjectEmployee(data: {
  projectId: number;
  employeeId: number;
  salaryPercentage: number;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get employee salary
  const employee = await db.select().from(employees).where(eq(employees.id, data.employeeId)).limit(1);
  if (!employee || !employee[0]) throw new Error("الموظف غير موجود");
  
  const salary = parseFloat(employee[0].salary || "0");
  const calculatedCost = (salary * data.salaryPercentage) / 100;
  
  // Check if employee already exists in project
  const existing = await db.select()
    .from(projectEmployees)
    .where(and(
      eq(projectEmployees.projectId, data.projectId),
      eq(projectEmployees.employeeId, data.employeeId)
    ))
    .limit(1);
  
  if (existing && existing.length > 0) {
    throw new Error("الموظف مضاف مسبقاً لهذا المشروع");
  }
  
  const result = await db.insert(projectEmployees).values({
    projectId: data.projectId,
    employeeId: data.employeeId,
    salaryPercentage: data.salaryPercentage.toString(),
    calculatedCost: calculatedCost.toString(),
    notes: data.notes || null,
  });
  
  return result;
}

/**
 * Update project employee salary percentage
 */
export async function updateProjectEmployee(
  id: number,
  data: {
    salaryPercentage?: number;
    notes?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get current project employee
  const current = await db.select()
    .from(projectEmployees)
    .where(eq(projectEmployees.id, id))
    .limit(1);
  
  if (!current || !current[0]) throw new Error("السجل غير موجود");
  
  const updateData: Record<string, unknown> = {};
  
  if (data.salaryPercentage !== undefined) {
    // Get employee salary to recalculate cost
    const employee = await db.select()
      .from(employees)
      .where(eq(employees.id, current[0].employeeId))
      .limit(1);
    
    if (employee && employee[0]) {
      const salary = parseFloat(employee[0].salary || "0");
      const calculatedCost = (salary * data.salaryPercentage) / 100;
      updateData.salaryPercentage = data.salaryPercentage.toString();
      updateData.calculatedCost = calculatedCost.toString();
    }
  }
  
  if (data.notes !== undefined) {
    updateData.notes = data.notes;
  }
  
  if (Object.keys(updateData).length > 0) {
    await db.update(projectEmployees)
      .set(updateData)
      .where(eq(projectEmployees.id, id));
  }
}

/**
 * Remove employee from project
 */
export async function deleteProjectEmployee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(projectEmployees).where(eq(projectEmployees.id, id));
}

/**
 * Get total employee costs for a project (monthly)
 */
export async function getProjectEmployeeCosts(projectId: number) {
  const db = await getDb();
  if (!db) return { totalCost: 0, employeeCount: 0 };
  
  const result = await db.select({
    totalCost: sql<string>`COALESCE(SUM(${projectEmployees.calculatedCost}), 0)`,
    employeeCount: sql<number>`COUNT(*)`,
  })
    .from(projectEmployees)
    .where(eq(projectEmployees.projectId, projectId));
  
  return {
    totalCost: parseFloat(result[0]?.totalCost || "0"),
    employeeCount: result[0]?.employeeCount || 0,
  };
}

/**
 * Get employees not yet assigned to a project
 */
export async function getAvailableEmployeesForProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get all active employees
  const allEmployees = await db.select()
    .from(employees)
    .where(eq(employees.status, "active"));
  
  // Get employees already in project
  const assignedEmployees = await db.select({ employeeId: projectEmployees.employeeId })
    .from(projectEmployees)
    .where(eq(projectEmployees.projectId, projectId));
  
  const assignedIds = new Set(assignedEmployees.map(e => e.employeeId));
  
  return allEmployees.filter(e => !assignedIds.has(e.id));
}


// ============ WPFORMS WEBHOOK INTEGRATION ============

/**
 * Get employee by their unique code (used for WPForms webhook)
 */
export async function getEmployeeByCode(employeeCode: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select()
    .from(employees)
    .where(eq(employees.employeeCode, employeeCode))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Increment registered clients count for an employee from WPForms webhook
 * This updates the daily stats for the current day
 */
export async function incrementRegisteredClientsFromWebhook(employeeCode: string, incrementBy: number = 1) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Find employee by code
  const employee = await getEmployeeByCode(employeeCode);
  if (!employee) {
    throw new Error(`Employee with code ${employeeCode} not found`);
  }
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Check if there's already a daily stat for today
  const existingStat = await db.select()
    .from(dailyStats)
    .where(and(
      eq(dailyStats.employeeId, employee.id),
      sql`DATE(${dailyStats.date}) = ${todayStr}`
    ))
    .limit(1);
  
  if (existingStat.length > 0) {
    // Update existing stat - increment registeredCustomers
    const currentRegistered = existingStat[0].registeredCustomers || 0;
    await db.update(dailyStats)
      .set({ 
        registeredCustomers: currentRegistered + incrementBy,
        updatedAt: new Date()
      })
      .where(eq(dailyStats.id, existingStat[0].id));
    
    return {
      success: true,
      employeeId: employee.id,
      employeeName: employee.name,
      date: todayStr,
      newRegisteredClients: currentRegistered + incrementBy,
      action: 'updated'
    };
  } else {
    // Create new daily stat for today
    const result = await db.insert(dailyStats).values({
      employeeId: employee.id,
      date: today, // Use Date object
      targetedCustomers: 0,
      registeredCustomers: incrementBy,
      confirmedCustomers: 0,
      servicesSold: 0,
      salesAmount: "0",
      calculatedRevenue: "0",
      status: 'pending',
      notes: 'تم الإنشاء تلقائياً من WPForms'
    });
    
    return {
      success: true,
      employeeId: employee.id,
      employeeName: employee.name,
      date: todayStr,
      newRegisteredClients: incrementBy,
      action: 'created'
    };
  }
}

/**
 * Log webhook call for debugging
 */
export async function logWebhookCall(data: {
  source: string;
  employeeCode: string;
  payload: any;
  result: any;
  error?: string;
}) {
  // For now, just log to console. Can be extended to store in database
  console.log('[Webhook Log]', JSON.stringify({
    timestamp: new Date().toISOString(),
    ...data
  }));
  return { success: true, logged: true };
}


// ============ STRATEGIC TARGETS BY PERIOD ============
/**
 * Get strategic target actuals for a specific period (monthly or quarterly)
 * @param year - The year
 * @param periodType - 'monthly' or 'quarterly'
 * @param periodValue - Month (1-12) for monthly, Quarter (1-4) for quarterly
 */
export async function getStrategicTargetActualsByPeriod(
  year: number,
  periodType: 'monthly' | 'quarterly',
  periodValue: number
) {
  const db = await getDb();
  if (!db) return {};
  
  let startDate: string;
  let endDate: string;
  
  if (periodType === 'monthly') {
    // Monthly: specific month
    const monthStart = new Date(year, periodValue - 1, 1);
    const monthEnd = new Date(year, periodValue, 0);
    startDate = monthStart.toISOString().split('T')[0];
    endDate = monthEnd.toISOString().split('T')[0];
  } else {
    // Quarterly: Q1 (1-3), Q2 (4-6), Q3 (7-9), Q4 (10-12)
    const quarterStartMonth = (periodValue - 1) * 3;
    const quarterEndMonth = quarterStartMonth + 3;
    const quarterStart = new Date(year, quarterStartMonth, 1);
    const quarterEnd = new Date(year, quarterEndMonth, 0);
    startDate = quarterStart.toISOString().split('T')[0];
    endDate = quarterEnd.toISOString().split('T')[0];
  }
  
  // Count direct courses (NEW course templates created in this period - not repeated courses)
  const directCourseTemplates = await db
    .select({ count: sql<number>`count(*)` })
    .from(courseTemplates)
    .where(
      and(
        eq(courseTemplates.isActive, true),
        sql`${courseTemplates.createdAt} >= ${startDate}`,
        sql`${courseTemplates.createdAt} <= ${endDate}`
      )
    );
  
  // Count total courses held (from courses table - for reference)
  const totalCoursesHeld = await db
    .select({ count: sql<number>`count(*)` })
    .from(courses)
    .where(
      and(
        ne(courses.status, "cancelled"),
        sql`${courses.startDate} >= ${startDate}`,
        sql`${courses.startDate} <= ${endDate}`
      )
    );
  
  // Count total customers (trainees)
  const enrollmentData = await db
    .select({ total: sql<number>`SUM(${courseEnrollments.traineeCount})` })
    .from(courseEnrollments)
    .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
    .where(
      and(
        ne(courses.status, "cancelled"),
        sql`${courses.startDate} >= ${startDate}`,
        sql`${courses.startDate} <= ${endDate}`
      )
    );
  
  // Calculate profit for period
  // Revenue from courses
  const courseRevenue = await db
    .select({ total: sql<number>`SUM(${courseEnrollments.paidAmount} * ${courseEnrollments.traineeCount})` })
    .from(courseEnrollments)
    .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
    .where(
      and(
        ne(courses.status, "cancelled"),
        sql`${courses.startDate} >= ${startDate}`,
        sql`${courses.startDate} <= ${endDate}`
      )
    );
  
  // Revenue from services
  const serviceRevenue = await db
    .select({ total: sql<number>`SUM(${services.totalAmount})` })
    .from(services)
    .where(
      and(
        sql`${services.saleDate} >= ${startDate}`,
        sql`${services.saleDate} <= ${endDate}`
      )
    );
  
  // Course expenses
  const courseExp = await db
    .select({ total: sql<number>`SUM(${courseExpenses.amount})` })
    .from(courseExpenses)
    .innerJoin(courses, eq(courseExpenses.courseId, courses.id))
    .where(
      and(
        ne(courses.status, "cancelled"),
        sql`${courses.startDate} >= ${startDate}`,
        sql`${courses.startDate} <= ${endDate}`
      )
    );
  
  // Operational expenses for the period
  let opExpTotal = 0;
  if (periodType === 'monthly') {
    const opExp = await db
      .select({ total: sql<number>`SUM(${operationalExpenses.amount})` })
      .from(operationalExpenses)
      .where(
        and(
          eq(operationalExpenses.year, year),
          eq(operationalExpenses.month, periodValue)
        )
      );
    opExpTotal = parseFloat(opExp[0]?.total?.toString() || "0");
  } else {
    // Sum operational expenses for the quarter
    const quarterMonths = [(periodValue - 1) * 3 + 1, (periodValue - 1) * 3 + 2, (periodValue - 1) * 3 + 3];
    const opExp = await db
      .select({ total: sql<number>`SUM(${operationalExpenses.amount})` })
      .from(operationalExpenses)
      .where(
        and(
          eq(operationalExpenses.year, year),
          sql`${operationalExpenses.month} IN (${quarterMonths.join(',')})`
        )
      );
    opExpTotal = parseFloat(opExp[0]?.total?.toString() || "0");
  }
  
  const totalRevenue = (parseFloat(courseRevenue[0]?.total?.toString() || "0")) + 
                       (parseFloat(serviceRevenue[0]?.total?.toString() || "0"));
  const totalExpenses = (parseFloat(courseExp[0]?.total?.toString() || "0")) + opExpTotal;
  const periodProfit = totalRevenue - totalExpenses;
  
  // Count partnerships
  const entityPartnerships = await db
    .select({ count: sql<number>`count(*)` })
    .from(partnerships)
    .where(
      and(
        eq(partnerships.type, "entity"),
        eq(partnerships.status, "active"),
        sql`${partnerships.partnershipDate} >= ${startDate}`,
        sql`${partnerships.partnershipDate} <= ${endDate}`
      )
    );
  
  const individualPartnerships = await db
    .select({ count: sql<number>`count(*)` })
    .from(partnerships)
    .where(
      and(
        eq(partnerships.type, "individual"),
        eq(partnerships.status, "active"),
        sql`${partnerships.partnershipDate} >= ${startDate}`,
        sql`${partnerships.partnershipDate} <= ${endDate}`
      )
    );
  
  // Count innovative ideas
  const ideas = await db
    .select({ count: sql<number>`count(*)` })
    .from(innovativeIdeas)
    .where(
      and(
        sql`${innovativeIdeas.submissionDate} >= ${startDate}`,
        sql`${innovativeIdeas.submissionDate} <= ${endDate}`
      )
    );
  
  return {
    direct_courses: directCourseTemplates[0]?.count || 0, // NEW course templates
    new_courses: directCourseTemplates[0]?.count || 0, // Same as direct_courses
    recorded_courses: 0,
    customers: parseInt(enrollmentData[0]?.total?.toString() || "0"),
    annual_profit: periodProfit,
    entity_partnerships: entityPartnerships[0]?.count || 0,
    individual_partnerships: individualPartnerships[0]?.count || 0,
    innovative_ideas: ideas[0]?.count || 0,
    service_quality: 0,
    customer_satisfaction: 0,
    website_quality: 0,
  };
}

/**
 * Get strategic targets with period-based breakdown
 * Returns targets with monthly and quarterly divisions
 */
export async function getStrategicTargetsWithPeriods(year: number) {
  const db = await getDb();
  if (!db) return { targets: [], yearlyActuals: {}, monthlyActuals: [], quarterlyActuals: [] };
  
  // Get all targets for the year
  const targets = await db
    .select()
    .from(strategicTargets)
    .where(eq(strategicTargets.year, year))
    .orderBy(strategicTargets.type);
  
  // Get yearly actuals
  const yearlyActuals = await getStrategicTargetActuals(year);
  
  // Get monthly actuals for each month
  const monthlyActuals = [];
  for (let month = 1; month <= 12; month++) {
    const actuals = await getStrategicTargetActualsByPeriod(year, 'monthly', month);
    monthlyActuals.push({ month, actuals });
  }
  
  // Get quarterly actuals
  const quarterlyActuals = [];
  for (let quarter = 1; quarter <= 4; quarter++) {
    const actuals = await getStrategicTargetActualsByPeriod(year, 'quarterly', quarter);
    quarterlyActuals.push({ quarter, actuals });
  }
  
  return {
    targets,
    yearlyActuals,
    monthlyActuals,
    quarterlyActuals,
  };
}


// ============ PUBLIC COURSES ============
export async function listPublicCourses() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(courses)
    .where(eq(courses.status, "active"))
    .orderBy(desc(courses.startDate));
  
  // Get fees, display settings, and instructor for each course
  const coursesWithDetails = await Promise.all(result.map(async (course) => {
    const fees = await db.select().from(courseFees).where(eq(courseFees.courseId, course.id));
    const template = course.templateId 
      ? await db.select().from(courseTemplates).where(eq(courseTemplates.id, course.templateId)).then(r => r[0])
      : null;
    const displaySettings = await db.select().from(courseDisplaySettings)
      .where(eq(courseDisplaySettings.courseId, course.id)).then(r => r[0]);
    const instructor = course.instructorId
      ? await db.select().from(instructors).where(eq(instructors.id, course.instructorId)).then(r => r[0])
      : null;
    return {
      ...course,
      fees,
      templateName: template?.name || null,
      courseType: displaySettings?.courseType || "online_live",
      isPublic: displaySettings?.isPublic ?? false,
      price: displaySettings?.publicDiscountPrice || displaySettings?.publicPrice || null,
      originalPrice: displaySettings?.publicPrice || null,
      imageUrl: displaySettings?.imageUrl || null,
      shortDescription: displaySettings?.shortDescription || course.description || null,
      detailedDescription: displaySettings?.detailedDescription || null,
      highlights: displaySettings?.highlights || null,
      targetAudience: displaySettings?.targetAudience || null,
      maxSeats: displaySettings?.maxSeats || null,
      currentSeats: displaySettings?.currentSeats || 0,
      location: displaySettings?.location || null,
      meetingLink: displaySettings?.meetingLink || null,
      videoPreviewUrl: displaySettings?.videoPreviewUrl || null,
      thumbnailUrl: displaySettings?.thumbnailUrl || null,
      instructorPhoto: instructor?.photoUrl || null,
      instructorBio: instructor?.bio || null,
    };
  }));
  
  // Filter only public courses
  return coursesWithDetails.filter(c => c.isPublic);
}

export async function getPublicCourseById(courseId: number) {
  const db = await getDb();
  if (!db) return null;
  const [course] = await db.select().from(courses).where(eq(courses.id, courseId));
  if (!course) return null;
  
  const fees = await db.select().from(courseFees).where(eq(courseFees.courseId, courseId));
  const template = course.templateId 
    ? await db.select().from(courseTemplates).where(eq(courseTemplates.id, course.templateId)).then(r => r[0])
    : null;
  const displaySettings = await db.select().from(courseDisplaySettings)
    .where(eq(courseDisplaySettings.courseId, courseId)).then(r => r[0]);
  const instructor = course.instructorId
    ? await db.select().from(instructors).where(eq(instructors.id, course.instructorId)).then(r => r[0])
    : null;
  
  // Get registration count
  const registrations = await db.select().from(publicRegistrations)
    .where(eq(publicRegistrations.courseId, courseId));
  
  return {
    ...course,
    fees,
    templateName: template?.name || null,
    courseType: displaySettings?.courseType || "online_live",
    isPublic: displaySettings?.isPublic ?? true,
    price: displaySettings?.publicDiscountPrice || displaySettings?.publicPrice || null,
    originalPrice: displaySettings?.publicPrice || null,
    publicPrice: displaySettings?.publicPrice || null,
    publicDiscountPrice: displaySettings?.publicDiscountPrice || null,
    imageUrl: displaySettings?.imageUrl || null,
    shortDescription: displaySettings?.shortDescription || course.description || null,
    detailedDescription: displaySettings?.detailedDescription || null,
    highlights: displaySettings?.highlights || null,
    targetAudience: displaySettings?.targetAudience || null,
    maxSeats: displaySettings?.maxSeats || null,
    currentSeats: displaySettings?.currentSeats || 0,
    location: displaySettings?.location || null,
    meetingLink: displaySettings?.meetingLink || null,
    videoPreviewUrl: displaySettings?.videoPreviewUrl || null,
    thumbnailUrl: displaySettings?.thumbnailUrl || null,
    instructorPhoto: instructor?.photoUrl || null,
    instructorBio: instructor?.bio || null,
    instructorEmail: instructor?.email || null,
    instructorPhone: instructor?.phone || null,
    registrationCount: registrations.length,
  };
}

// ============ PUBLIC REGISTRATIONS ============
export async function createPublicRegistration(data: InsertPublicRegistration) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(publicRegistrations).values(data);
  return result.insertId;
}

export async function listPublicRegistrations(courseId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (courseId) {
    return db.select().from(publicRegistrations)
      .where(eq(publicRegistrations.courseId, courseId))
      .orderBy(desc(publicRegistrations.createdAt));
  }
  return db.select().from(publicRegistrations).orderBy(desc(publicRegistrations.createdAt));
}

// ============ PUBLIC SERVICES ============
export async function listActivePublicServices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(publicServices)
    .where(eq(publicServices.isActive, true))
    .orderBy(publicServices.sortOrder);
}

export async function getPublicServiceById(serviceId: number) {
  const db = await getDb();
  if (!db) return null;
  const [service] = await db.select().from(publicServices).where(eq(publicServices.id, serviceId));
  return service || null;
}

export async function createServiceOrder(data: InsertServiceOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(serviceOrders).values(data);
  return result.insertId;
}

export async function listServiceOrders(serviceId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (serviceId) {
    return db.select().from(serviceOrders)
      .where(eq(serviceOrders.serviceId, serviceId))
      .orderBy(desc(serviceOrders.createdAt));
  }
  return db.select().from(serviceOrders).orderBy(desc(serviceOrders.createdAt));
}

// ============ COURSE DISPLAY SETTINGS ============
export async function getCourseDisplaySettings(courseId: number) {
  const db = await getDb();
  if (!db) return null;
  const [settings] = await db.select().from(courseDisplaySettings)
    .where(eq(courseDisplaySettings.courseId, courseId));
  return settings || null;
}

export async function upsertCourseDisplaySettings(courseId: number, data: Partial<InsertCourseDisplaySetting>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getCourseDisplaySettings(courseId);
  if (existing) {
    await db.update(courseDisplaySettings)
      .set({ ...data, courseId })
      .where(eq(courseDisplaySettings.courseId, courseId));
    return existing.id;
  } else {
    const [result] = await db.insert(courseDisplaySettings).values({ ...data, courseId } as InsertCourseDisplaySetting);
    return result.insertId;
  }
}


// ============ RECORDED COURSES SYSTEM ============

// --- Recorded Courses CRUD ---
export async function createRecordedCourse(data: InsertRecordedCourse) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(recordedCourses).values(data);
  return result.insertId;
}

export async function getRecordedCourseById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [course] = await db.select().from(recordedCourses).where(eq(recordedCourses.id, id));
  return course || null;
}

export async function listRecordedCourses(filters?: { status?: string; instructorId?: number }) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(recordedCourses).orderBy(desc(recordedCourses.createdAt));
  const conditions: any[] = [];
  if (filters?.status) {
    conditions.push(eq(recordedCourses.status, filters.status as any));
  }
  if (filters?.instructorId) {
    conditions.push(eq(recordedCourses.instructorId, filters.instructorId));
  }
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  return query;
}

export async function listPublishedRecordedCourses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recordedCourses)
    .where(eq(recordedCourses.status, "published"))
    .orderBy(desc(recordedCourses.publishedAt));
}

export async function updateRecordedCourse(id: number, data: Partial<InsertRecordedCourse>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(recordedCourses).set(data).where(eq(recordedCourses.id, id));
}

export async function deleteRecordedCourse(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete related data first
  await db.delete(recordedCourseLessons).where(eq(recordedCourseLessons.courseId, id));
  await db.delete(recordedCourseSections).where(eq(recordedCourseSections.courseId, id));
  await db.delete(recordedCourseReviews).where(eq(recordedCourseReviews.courseId, id));
  await db.delete(lessonProgress).where(eq(lessonProgress.courseId, id));
  await db.delete(courseViewLogs).where(eq(courseViewLogs.courseId, id));
  await db.delete(recordedCourses).where(eq(recordedCourses.id, id));
}

// --- Sections CRUD ---
export async function createSection(data: InsertRecordedCourseSection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(recordedCourseSections).values(data);
  return result.insertId;
}

export async function listSections(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recordedCourseSections)
    .where(eq(recordedCourseSections.courseId, courseId))
    .orderBy(recordedCourseSections.sortOrder);
}

export async function updateSection(id: number, data: Partial<InsertRecordedCourseSection>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(recordedCourseSections).set(data).where(eq(recordedCourseSections.id, id));
}

export async function deleteSection(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete lessons in section first
  await db.delete(recordedCourseLessons).where(eq(recordedCourseLessons.sectionId, id));
  await db.delete(recordedCourseSections).where(eq(recordedCourseSections.id, id));
}

// --- Lessons CRUD ---
export async function createLesson(data: InsertRecordedCourseLesson) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(recordedCourseLessons).values(data);
  return result.insertId;
}

export async function listLessons(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recordedCourseLessons)
    .where(eq(recordedCourseLessons.courseId, courseId))
    .orderBy(recordedCourseLessons.sortOrder);
}

export async function listLessonsBySection(sectionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recordedCourseLessons)
    .where(eq(recordedCourseLessons.sectionId, sectionId))
    .orderBy(recordedCourseLessons.sortOrder);
}

export async function updateLesson(id: number, data: Partial<InsertRecordedCourseLesson>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(recordedCourseLessons).set(data).where(eq(recordedCourseLessons.id, id));
}

export async function deleteLesson(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(recordedCourseLessons).where(eq(recordedCourseLessons.id, id));
}

// --- Enrollments ---
export async function createRecordedEnrollment(data: InsertRecordedCourseEnrollment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(recordedCourseEnrollments).values(data);
  // Update course enrollment count
  await db.update(recordedCourses)
    .set({ totalEnrollments: sql`totalEnrollments + 1` })
    .where(eq(recordedCourses.id, data.courseId));
  return result.insertId;
}

export async function listRecordedEnrollments(courseId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (courseId) {
    return db.select().from(recordedCourseEnrollments)
      .where(eq(recordedCourseEnrollments.courseId, courseId))
      .orderBy(desc(recordedCourseEnrollments.enrolledAt));
  }
  return db.select().from(recordedCourseEnrollments)
    .orderBy(desc(recordedCourseEnrollments.enrolledAt));
}

export async function getEnrollmentByUserAndCourse(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return null;
  const [enrollment] = await db.select().from(recordedCourseEnrollments)
    .where(and(
      eq(recordedCourseEnrollments.userId, userId),
      eq(recordedCourseEnrollments.courseId, courseId)
    ));
  return enrollment || null;
}

// --- Lesson Progress ---
export async function upsertLessonProgress(data: InsertLessonProgress) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(lessonProgress)
    .where(and(
      eq(lessonProgress.enrollmentId, data.enrollmentId!),
      eq(lessonProgress.lessonId, data.lessonId!)
    ));
  if (existing.length > 0) {
    await db.update(lessonProgress)
      .set({ ...data })
      .where(eq(lessonProgress.id, existing[0].id));
    return existing[0].id;
  }
  const [result] = await db.insert(lessonProgress).values(data);
  return result.insertId;
}

export async function getLessonProgressForEnrollment(enrollmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lessonProgress)
    .where(eq(lessonProgress.enrollmentId, enrollmentId));
}

// --- Reviews ---
export async function createReview(data: InsertRecordedCourseReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(recordedCourseReviews).values(data);
  // Update average rating
  const reviews = await db.select().from(recordedCourseReviews)
    .where(eq(recordedCourseReviews.courseId, data.courseId));
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await db.update(recordedCourses)
    .set({ averageRating: avgRating.toFixed(2) })
    .where(eq(recordedCourses.id, data.courseId));
  return result.insertId;
}

export async function listReviews(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recordedCourseReviews)
    .where(eq(recordedCourseReviews.courseId, courseId))
    .orderBy(desc(recordedCourseReviews.createdAt));
}

// --- Instructor Earnings ---
export async function createInstructorEarning(data: InsertInstructorEarning) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(instructorEarnings).values(data);
  // Update course total revenue
  await db.update(recordedCourses)
    .set({ totalRevenue: sql`totalRevenue + ${data.totalAmount}` })
    .where(eq(recordedCourses.id, data.courseId));
  return result.insertId;
}

export async function getInstructorEarnings(instructorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(instructorEarnings)
    .where(eq(instructorEarnings.instructorId, instructorId))
    .orderBy(desc(instructorEarnings.createdAt));
}

export async function getInstructorEarningsSummary(instructorId: number) {
  const db = await getDb();
  if (!db) return { totalEarnings: 0, pendingEarnings: 0, paidEarnings: 0, totalEnrollments: 0 };
  
  const earnings = await db.select().from(instructorEarnings)
    .where(eq(instructorEarnings.instructorId, instructorId));
  
  const totalEarnings = earnings.reduce((sum, e) => sum + parseFloat(e.instructorAmount as string || "0"), 0);
  const pendingEarnings = earnings.filter(e => e.status === "pending" || e.status === "approved")
    .reduce((sum, e) => sum + parseFloat(e.instructorAmount as string || "0"), 0);
  const paidEarnings = earnings.filter(e => e.status === "paid")
    .reduce((sum, e) => sum + parseFloat(e.instructorAmount as string || "0"), 0);
  
  return { totalEarnings, pendingEarnings, paidEarnings, totalEnrollments: earnings.length };
}

// --- Course Views ---
export async function logCourseView(courseId: number, userId?: number, source?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(courseViewLogs).values({ courseId, userId, source });
  await db.update(recordedCourses)
    .set({ totalViews: sql`totalViews + 1` })
    .where(eq(recordedCourses.id, courseId));
}

export async function getCourseViewStats(courseId: number) {
  const db = await getDb();
  if (!db) return { totalViews: 0, last30Days: 0, last7Days: 0 };
  
  const allViews = await db.select({ count: sql<number>`count(*)` })
    .from(courseViewLogs)
    .where(eq(courseViewLogs.courseId, courseId));
  
  return { totalViews: allViews[0]?.count || 0, last30Days: 0, last7Days: 0 };
}

// --- Get recorded courses by instructor user ---
export async function getRecordedCoursesByInstructorUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recordedCourses)
    .where(eq(recordedCourses.submittedByUserId, userId))
    .orderBy(desc(recordedCourses.createdAt));
}

// --- Get full course with sections and lessons ---
export async function getRecordedCourseWithContent(courseId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [course] = await db.select().from(recordedCourses).where(eq(recordedCourses.id, courseId));
  if (!course) return null;
  
  const sections = await db.select().from(recordedCourseSections)
    .where(eq(recordedCourseSections.courseId, courseId))
    .orderBy(recordedCourseSections.sortOrder);
  
  const lessons = await db.select().from(recordedCourseLessons)
    .where(eq(recordedCourseLessons.courseId, courseId))
    .orderBy(recordedCourseLessons.sortOrder);
  
  // Get instructor info
  const [instructor] = await db.select().from(instructors)
    .where(eq(instructors.id, course.instructorId));
  
  const sectionsWithLessons = sections.map(section => ({
    ...section,
    lessons: lessons.filter(l => l.sectionId === section.id),
  }));
  
  return { ...course, instructor: instructor || null, sections: sectionsWithLessons };
}

// --- Update course stats (totalDuration, totalLessons) ---
export async function updateRecordedCourseStats(courseId: number) {
  const db = await getDb();
  if (!db) return;
  
  const lessons = await db.select().from(recordedCourseLessons)
    .where(eq(recordedCourseLessons.courseId, courseId));
  
  const totalDuration = lessons.reduce((sum, l) => sum + (l.duration || 0), 0);
  const totalLessons = lessons.length;
  
  await db.update(recordedCourses)
    .set({ totalDuration: Math.floor(totalDuration / 60), totalLessons })
    .where(eq(recordedCourses.id, courseId));
}


// =============================================
// PAYMENTS
// =============================================

export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(payments).values(data);
  return result.insertId;
}

export async function getPaymentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [payment] = await db.select().from(payments).where(eq(payments.id, id));
  return payment || null;
}

export async function getPaymentByExternalId(externalPaymentId: string) {
  const db = await getDb();
  if (!db) return null;
  const [payment] = await db.select().from(payments).where(eq(payments.externalPaymentId, externalPaymentId));
  return payment || null;
}

export async function updatePaymentStatus(id: number, status: string, externalPaymentId?: string, paidAt?: Date) {
  const db = await getDb();
  if (!db) return;
  const updateData: any = { paymentStatus: status };
  if (externalPaymentId) updateData.externalPaymentId = externalPaymentId;
  if (paidAt) updateData.paidAt = paidAt;
  await db.update(payments).set(updateData).where(eq(payments.id, id));
}

export async function getUserPayments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
}

export async function getAllPayments(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments).orderBy(desc(payments.createdAt)).limit(limit).offset(offset);
}

// =============================================
// COURSE REVIEWS (new table - courseReviews)
// =============================================

export async function createCourseReviewNew(data: InsertCourseReview) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(courseReviews).values(data);
  return result.insertId;
}

export async function getCourseReviewsNew(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(courseReviews)
    .where(and(eq(courseReviews.recordedCourseId, courseId), eq(courseReviews.isVisible, true)))
    .orderBy(desc(courseReviews.createdAt));
}

export async function getUserCourseReview(courseId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [review] = await db.select().from(courseReviews)
    .where(and(eq(courseReviews.recordedCourseId, courseId), eq(courseReviews.userId, userId)));
  return review || null;
}

export async function updateCourseReviewNew(id: number, data: Partial<InsertCourseReview>) {
  const db = await getDb();
  if (!db) return;
  await db.update(courseReviews).set(data).where(eq(courseReviews.id, id));
}

export async function deleteCourseReviewNew(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(courseReviews).where(eq(courseReviews.id, id));
}

export async function getCourseAverageRating(courseId: number) {
  const db = await getDb();
  if (!db) return { average: 0, count: 0 };
  const reviews = await db.select().from(courseReviews)
    .where(and(eq(courseReviews.recordedCourseId, courseId), eq(courseReviews.isVisible, true)));
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return { average: sum / reviews.length, count: reviews.length };
}

export async function getAllCourseReviewsAdmin(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(courseReviews).orderBy(desc(courseReviews.createdAt)).limit(limit).offset(offset);
}

// =============================================
// CERTIFICATES
// =============================================

export async function createCertificate(data: InsertCertificate) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(certificates).values(data);
  return result.insertId;
}

export async function getCertificateByEnrollment(enrollmentId: number) {
  const db = await getDb();
  if (!db) return null;
  const [cert] = await db.select().from(certificates).where(eq(certificates.enrollmentId, enrollmentId));
  return cert || null;
}

export async function getCertificateByNumber(certNumber: string) {
  const db = await getDb();
  if (!db) return null;
  const [cert] = await db.select().from(certificates).where(eq(certificates.certificateNumber, certNumber));
  return cert || null;
}

export async function getUserCertificates(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(certificates).where(eq(certificates.userId, userId)).orderBy(desc(certificates.issuedAt));
}

export async function getCourseCertificatesCount(courseId: number) {
  const db = await getDb();
  if (!db) return 0;
  const certs = await db.select().from(certificates).where(eq(certificates.recordedCourseId, courseId));
  return certs.length;
}


// =============================================
// Quiz Functions
// =============================================

export async function createQuiz(data: InsertQuiz) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(quizzes).values(data);
  return result.insertId;
}

export async function getQuizById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
  return quiz || null;
}

export async function getQuizByLessonId(lessonId: number) {
  const db = await getDb();
  if (!db) return null;
  const [quiz] = await db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId));
  return quiz || null;
}

export async function updateQuiz(id: number, data: Partial<InsertQuiz>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(quizzes).set(data).where(eq(quizzes.id, id));
}

export async function deleteQuiz(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete answers first, then questions, then quiz
  const questions = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, id));
  for (const q of questions) {
    await db.delete(quizAnswers).where(eq(quizAnswers.questionId, q.id));
  }
  await db.delete(quizQuestions).where(eq(quizQuestions.quizId, id));
  await db.delete(quizAttempts).where(eq(quizAttempts.quizId, id));
  await db.delete(quizzes).where(eq(quizzes.id, id));
}

// --- Quiz Questions ---
export async function createQuizQuestion(data: InsertQuizQuestion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(quizQuestions).values(data);
  return result.insertId;
}

export async function getQuizQuestions(quizId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(quizQuestions.sortOrder);
}

export async function updateQuizQuestion(id: number, data: Partial<InsertQuizQuestion>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(quizQuestions).set(data).where(eq(quizQuestions.id, id));
}

export async function deleteQuizQuestion(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(quizAnswers).where(eq(quizAnswers.questionId, id));
  await db.delete(quizQuestions).where(eq(quizQuestions.id, id));
}

// --- Quiz Answers ---
export async function createQuizAnswer(data: InsertQuizAnswer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(quizAnswers).values(data);
  return result.insertId;
}

export async function getQuizAnswers(questionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizAnswers)
    .where(eq(quizAnswers.questionId, questionId))
    .orderBy(quizAnswers.sortOrder);
}

export async function updateQuizAnswer(id: number, data: Partial<InsertQuizAnswer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(quizAnswers).set(data).where(eq(quizAnswers.id, id));
}

export async function deleteQuizAnswer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(quizAnswers).where(eq(quizAnswers.id, id));
}

export async function setQuizAnswers(questionId: number, answers: InsertQuizAnswer[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete existing answers
  await db.delete(quizAnswers).where(eq(quizAnswers.questionId, questionId));
  // Insert new answers
  if (answers.length > 0) {
    await db.insert(quizAnswers).values(answers.map(a => ({ ...a, questionId })));
  }
}

// --- Quiz with full content ---
export async function getQuizWithQuestions(quizId: number) {
  const db = await getDb();
  if (!db) return null;
  const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId));
  if (!quiz) return null;
  
  const questions = await db.select().from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(quizQuestions.sortOrder);
  
  const questionsWithAnswers = await Promise.all(
    questions.map(async (q) => {
      const answers = await db.select().from(quizAnswers)
        .where(eq(quizAnswers.questionId, q.id))
        .orderBy(quizAnswers.sortOrder);
      return { ...q, answers };
    })
  );
  
  return { ...quiz, questions: questionsWithAnswers };
}

// --- Quiz Attempts ---
export async function createQuizAttempt(data: InsertQuizAttempt) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(quizAttempts).values(data);
  return result.insertId;
}

export async function getQuizAttempts(quizId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizAttempts)
    .where(and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.userId, userId)))
    .orderBy(desc(quizAttempts.createdAt));
}

export async function getQuizAttemptById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, id));
  return attempt || null;
}

export async function updateQuizAttempt(id: number, data: Partial<InsertQuizAttempt>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(quizAttempts).set(data).where(eq(quizAttempts.id, id));
}


// ============================================
// Target Alerts - تنبيهات المستهدفات
// ============================================

const targetTypeLabelsAr: Record<string, string> = {
  targeted_customers: "العملاء المستهدفين",
  confirmed_customers: "العملاء المؤكدين",
  registered_customers: "العملاء المسجلين في النموذج",
  services_sold: "الخدمات المباعة",
  retargeting: "إعادة الاستهداف",
  daily_calls: "المكالمات اليومية",
  campaigns: "الحملات",
  leads_generated: "العملاء المحتملين",
  conversion_rate: "معدل التحويل",
  features_completed: "المهام المنجزة",
  bugs_fixed: "الأخطاء المصلحة",
  sales_amount: "مبلغ المبيعات",
  customer_satisfaction: "رضا العملاء",
  attendance_hours: "ساعات الحضور",
  contacted_old_customers: "العملاء القدامى المتواصل معهم",
  other: "أخرى",
};

/**
 * فحص وإنشاء تنبيهات تلقائية عند وصول الموظف لـ 80% أو 100% من المستهدف
 * يتم استدعاؤها تلقائياً بعد حساب المستهدفات
 */
export async function checkAndCreateTargetAlerts(
  employeeId: number,
  targetsWithProgress: Array<{
    id: number;
    targetType: string;
    customName?: string | null;
    targetValue: string | number;
    achieved: number;
    percentage: number;
    month?: number | null;
    year: number;
    status: string;
  }>
) {
  const db = await getDb();
  if (!db) return [];

  const createdAlerts: any[] = [];

  for (const target of targetsWithProgress) {
    const percentage = target.percentage;
    const targetVal = parseFloat(String(target.targetValue)) || 0;
    
    if (targetVal <= 0) continue;

    // فحص 80% و 100%
    const thresholds: Array<{ type: "reached_80" | "reached_100"; minPercent: number }> = [
      { type: "reached_80", minPercent: 80 },
      { type: "reached_100", minPercent: 100 },
    ];

    for (const threshold of thresholds) {
      if (percentage < threshold.minPercent) continue;

      // فحص عدم وجود تنبيه مكرر لنفس المستهدف ونفس النوع
      const existing = await db.select()
        .from(targetAlerts)
        .where(and(
          eq(targetAlerts.targetId, target.id),
          eq(targetAlerts.alertType, threshold.type)
        ));

      if (existing.length > 0) continue;

      // جلب اسم الموظف
      const employee = await getEmployeeById(employeeId);
      const employeeName = employee?.name || `موظف #${employeeId}`;
      const targetName = target.customName || targetTypeLabelsAr[target.targetType] || target.targetType;

      let message = "";
      if (threshold.type === "reached_80") {
        message = `🎯 ${employeeName} وصل إلى ${Math.round(percentage)}% من مستهدف "${targetName}" (${target.achieved} من ${targetVal}). استمر في التقدم!`;
      } else {
        message = `🏆 تهانينا! ${employeeName} حقق مستهدف "${targetName}" بنسبة ${Math.round(percentage)}% (${target.achieved} من ${targetVal})!`;
      }

      // إنشاء التنبيه
      const [result] = await db.insert(targetAlerts).values({
        employeeId,
        targetId: target.id,
        alertType: threshold.type,
        percentage: String(Math.round(percentage)),
        targetType: target.targetType,
        targetValue: String(targetVal),
        achievedValue: String(target.achieved),
        message,
        isRead: false,
        notifiedOwner: false,
        month: target.month || null,
        year: target.year,
      });

      createdAlerts.push({
        id: result.insertId,
        alertType: threshold.type,
        employeeName,
        targetName,
        percentage: Math.round(percentage),
        message,
      });
    }
  }

  return createdAlerts;
}

/**
 * إرسال إشعارات المالك للتنبيهات غير المرسلة
 */
export async function sendPendingAlertNotifications() {
  const db = await getDb();
  if (!db) return;

  const { notifyOwner } = await import("./_core/notification");

  const pendingAlerts = await db.select()
    .from(targetAlerts)
    .where(eq(targetAlerts.notifiedOwner, false))
    .orderBy(targetAlerts.createdAt);

  for (const alert of pendingAlerts) {
    try {
      const title = alert.alertType === "reached_100"
        ? `🏆 إنجاز مستهدف - ${alert.message?.split(" ")[1] || "موظف"}`
        : `🎯 تقدم ملحوظ - ${alert.message?.split(" ")[1] || "موظف"}`;

      await notifyOwner({
        title,
        content: alert.message || "",
      });

      // تحديث حالة الإشعار
      await db.update(targetAlerts)
        .set({ notifiedOwner: true })
        .where(eq(targetAlerts.id, alert.id));
    } catch (error) {
      console.error(`[TargetAlerts] Failed to notify owner for alert ${alert.id}:`, error);
    }
  }
}

/**
 * جلب جميع التنبيهات مع بيانات الموظف
 */
export async function listTargetAlerts(filters?: {
  employeeId?: number;
  alertType?: string;
  isRead?: boolean;
  month?: number;
  year?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];
  
  if (filters?.employeeId) {
    conditions.push(eq(targetAlerts.employeeId, filters.employeeId));
  }
  if (filters?.alertType) {
    conditions.push(eq(targetAlerts.alertType, filters.alertType as any));
  }
  if (filters?.isRead !== undefined) {
    conditions.push(eq(targetAlerts.isRead, filters.isRead));
  }
  if (filters?.month) {
    conditions.push(eq(targetAlerts.month, filters.month));
  }
  if (filters?.year) {
    conditions.push(eq(targetAlerts.year, filters.year));
  }

  const query = db.select({
    alert: targetAlerts,
    employeeName: employees.name,
    employeeImage: employees.profileImage,
  })
    .from(targetAlerts)
    .leftJoin(employees, eq(targetAlerts.employeeId, employees.id))
    .orderBy(desc(targetAlerts.createdAt));

  if (conditions.length > 0) {
    query.where(and(...conditions));
  }

  if (filters?.limit) {
    query.limit(filters.limit);
  }

  const results = await query;
  
  return results.map(r => ({
    ...r.alert,
    employeeName: r.employeeName,
    employeeImage: r.employeeImage,
  }));
}

/**
 * تحديث حالة قراءة التنبيه
 */
export async function markAlertAsRead(alertId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(targetAlerts)
    .set({ isRead: true })
    .where(eq(targetAlerts.id, alertId));
}

/**
 * تحديث جميع التنبيهات كمقروءة
 */
export async function markAllAlertsAsRead(employeeId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (employeeId) {
    await db.update(targetAlerts)
      .set({ isRead: true })
      .where(and(
        eq(targetAlerts.employeeId, employeeId),
        eq(targetAlerts.isRead, false)
      ));
  } else {
    await db.update(targetAlerts)
      .set({ isRead: true })
      .where(eq(targetAlerts.isRead, false));
  }
}

/**
 * عدد التنبيهات غير المقروءة
 */
export async function getUnreadAlertCount(employeeId?: number) {
  const db = await getDb();
  if (!db) return 0;

  const conditions: any[] = [eq(targetAlerts.isRead, false)];
  if (employeeId) {
    conditions.push(eq(targetAlerts.employeeId, employeeId));
  }

  const result = await db.select({ count: count() })
    .from(targetAlerts)
    .where(and(...conditions));

  return result[0]?.count || 0;
}

/**
 * حذف تنبيه
 */
export async function deleteTargetAlert(alertId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(targetAlerts).where(eq(targetAlerts.id, alertId));
}
