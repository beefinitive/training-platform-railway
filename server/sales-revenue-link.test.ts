import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { employees, employeeTargets, dailyStats, courses, courseFees } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * اختبار ربط الإيرادات المحصّلة بمستهدف مبلغ المبيعات
 * 
 * المتطلب: يجب أن يتم تحديث مستهدف sales_amount بناءً على totalRevenue
 * (الإيرادات المحصّلة من الإحصائيات المؤكدة) وليس salesAmount المدخل يدوياً
 */

describe('Sales Amount Target linked to Total Revenue', () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let testEmployeeId: number;
  let testCourseId: number;
  let testFeeId: number;
  let testTargetId: number;
  let testStatId: number;

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // إنشاء موظف اختباري
    const empResult = await db.insert(employees).values({
      name: 'موظف اختبار الربط',
      email: 'link-test@example.com',
      phone: '0500000000',
      hireDate: new Date(),
      salary: '5000',
      status: 'active',
    });
    testEmployeeId = Number(empResult[0].insertId);

    // إنشاء دورة اختبارية
    const courseResult = await db.insert(courses).values({
      name: 'دورة اختبار الربط',
      description: 'دورة لاختبار ربط الإيرادات بالمستهدفات',
      instructorName: 'مدرب اختباري',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active',
    });
    testCourseId = Number(courseResult[0].insertId);

    // إنشاء رسوم للدورة
    const feeResult = await db.insert(courseFees).values({
      courseId: testCourseId,
      name: 'رسوم التسجيل',
      amount: '500',
    });
    testFeeId = Number(feeResult[0].insertId);

    // إنشاء مستهدف مبلغ المبيعات للموظف
    const targetResult = await db.insert(employeeTargets).values({
      employeeId: testEmployeeId,
      targetType: 'sales_amount',
      targetValue: '10000',
      currentValue: '0',
      baseValue: '0',
      period: 'monthly',
      month: currentMonth,
      year: currentYear,
      status: 'in_progress',
    });
    testTargetId = Number(targetResult[0].insertId);
  });

  afterAll(async () => {
    if (!db) return;

    // تنظيف البيانات الاختبارية
    if (testStatId) {
      await db.delete(dailyStats).where(eq(dailyStats.id, testStatId));
    }
    if (testTargetId) {
      await db.delete(employeeTargets).where(eq(employeeTargets.id, testTargetId));
    }
    if (testFeeId) {
      await db.delete(courseFees).where(eq(courseFees.id, testFeeId));
    }
    if (testCourseId) {
      await db.delete(courses).where(eq(courses.id, testCourseId));
    }
    if (testEmployeeId) {
      await db.delete(employees).where(eq(employees.id, testEmployeeId));
    }
  });

  it('should update sales_amount target from totalRevenue (approved stats)', async () => {
    // إنشاء إحصائية يومية مؤكدة مع إيراد محسوب
    const statResult = await db!.insert(dailyStats).values({
      employeeId: testEmployeeId,
      date: new Date(),
      confirmedCustomers: 5,
      registeredCustomers: 10,
      targetedCustomers: 20,
      servicesSold: 3,
      salesAmount: '1000', // هذا القيمة المدخلة يدوياً - يجب ألا تستخدم
      courseFee: '500',
      courseId: testCourseId,
      calculatedRevenue: '2500', // 5 عملاء × 500 ر.س = 2500 ر.س
      status: 'approved', // مؤكدة
    });
    testStatId = Number(statResult[0].insertId);

    // استدعاء دالة تحديث المستهدفات
    const { updateEmployeeTargetsFromDailyStats } = await import('./db');
    await updateEmployeeTargetsFromDailyStats(testEmployeeId);

    // التحقق من تحديث المستهدف
    const updatedTarget = await db!.select().from(employeeTargets)
      .where(eq(employeeTargets.id, testTargetId))
      .limit(1);

    expect(updatedTarget.length).toBe(1);
    
    // يجب أن يكون المحقق = totalRevenue (2500) وليس salesAmount (1000)
    const currentValue = parseFloat(updatedTarget[0].currentValue || '0');
    expect(currentValue).toBe(2500);
    expect(currentValue).not.toBe(1000);
  });

  it('should not count pending stats in totalRevenue', async () => {
    // حذف الإحصائية السابقة
    if (testStatId) {
      await db!.delete(dailyStats).where(eq(dailyStats.id, testStatId));
    }

    // إنشاء إحصائية يومية قيد المراجعة
    const statResult = await db!.insert(dailyStats).values({
      employeeId: testEmployeeId,
      date: new Date(),
      confirmedCustomers: 10,
      registeredCustomers: 15,
      targetedCustomers: 30,
      servicesSold: 5,
      salesAmount: '5000',
      courseFee: '500',
      courseId: testCourseId,
      calculatedRevenue: '5000', // 10 عملاء × 500 ر.س
      status: 'pending', // قيد المراجعة - يجب ألا تحسب
    });
    testStatId = Number(statResult[0].insertId);

    // استدعاء دالة تحديث المستهدفات
    const { updateEmployeeTargetsFromDailyStats } = await import('./db');
    await updateEmployeeTargetsFromDailyStats(testEmployeeId);

    // التحقق من عدم تحديث المستهدف
    const updatedTarget = await db!.select().from(employeeTargets)
      .where(eq(employeeTargets.id, testTargetId))
      .limit(1);

    expect(updatedTarget.length).toBe(1);
    
    // يجب أن يكون المحقق = 0 لأن الإحصائية قيد المراجعة
    const currentValue = parseFloat(updatedTarget[0].currentValue || '0');
    expect(currentValue).toBe(0);
  });

  it('should calculate achievement percentage correctly', async () => {
    // حذف الإحصائية السابقة
    if (testStatId) {
      await db!.delete(dailyStats).where(eq(dailyStats.id, testStatId));
    }

    // إنشاء إحصائية يومية مؤكدة
    const statResult = await db!.insert(dailyStats).values({
      employeeId: testEmployeeId,
      date: new Date(),
      confirmedCustomers: 6,
      registeredCustomers: 10,
      targetedCustomers: 20,
      servicesSold: 4,
      salesAmount: '2000',
      courseFee: '500',
      courseId: testCourseId,
      calculatedRevenue: '3000', // 6 عملاء × 500 ر.س
      status: 'approved',
    });
    testStatId = Number(statResult[0].insertId);

    // استدعاء دالة تحديث المستهدفات
    const { updateEmployeeTargetsFromDailyStats } = await import('./db');
    await updateEmployeeTargetsFromDailyStats(testEmployeeId);

    // التحقق من المستهدف
    const updatedTarget = await db!.select().from(employeeTargets)
      .where(eq(employeeTargets.id, testTargetId))
      .limit(1);

    expect(updatedTarget.length).toBe(1);
    
    const currentValue = parseFloat(updatedTarget[0].currentValue || '0');
    const targetValue = parseFloat(updatedTarget[0].targetValue || '0');
    
    // المحقق = 3000، المستهدف = 10000
    expect(currentValue).toBe(3000);
    expect(targetValue).toBe(10000);
    
    // نسبة الإنجاز = 30%
    const achievementPercentage = (currentValue / targetValue) * 100;
    expect(achievementPercentage).toBe(30);
  });
});
