import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { ENV } from "./_core/env";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => {
      const user = opts.ctx.user;
      if (!user) return null;
      return {
        ...user,
        isOwner: user.openId === ENV.ownerOpenId,
      };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ COURSES ============
  courses: router({
    list: protectedProcedure.query(async () => {
      return db.listCourses();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getCourseById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        instructorId: z.number().optional(),
        instructorName: z.string().min(1),
        startDate: z.string(),
        endDate: z.string(),
        description: z.string().optional(),
        status: z.enum(["active", "completed", "cancelled"]).optional(),
        templateId: z.number().optional(), // Create from template
      }))
      .mutation(async ({ input }) => {
        const id = await db.createCourse({
          name: input.name,
          templateId: input.templateId,
          instructorId: input.instructorId,
          instructorName: input.instructorName,
          startDate: input.startDate,
          endDate: input.endDate,
          description: input.description,
          status: input.status || "active",
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        instructorId: z.number().optional(),
        instructorName: z.string().min(1).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["active", "completed", "cancelled"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCourse(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ 
        id: z.number(),
        keepStatistics: z.boolean().optional().default(true),
      }))
      .mutation(async ({ input }) => {
        await db.deleteCourse(input.id, input.keepStatistics);
        return { success: true };
      }),

    getStatistics: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ input }) => {
        return db.getCourseStatistics(input.courseId);
      }),
  }),

  // ============ ARCHIVE ============
  archive: router({
    list: protectedProcedure.query(async () => {
      return db.listArchivedCourses();
    }),

    restore: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.restoreCourse(input.id);
        return { success: true };
      }),

    permanentDelete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.permanentlyDeleteCourse(input.id);
        return { success: true };
      }),
  }),

  // ============ COURSE FEES ============
  courseFees: router({
    list: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ input }) => {
        return db.listCourseFees(input.courseId);
      }),

    create: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        name: z.string().min(1),
        amount: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createCourseFee({
          courseId: input.courseId,
          name: input.name,
          amount: input.amount,
          description: input.description,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        amount: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCourseFee(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCourseFee(input.id);
        return { success: true };
      }),
  }),

  // ============ ENROLLMENTS (STATISTICAL) ============
  enrollments: router({
    listByCourse: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ input }) => {
        return db.listEnrollmentsByCourse(input.courseId);
      }),

    create: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        feeId: z.number(),
        traineeCount: z.number().min(1),
        paidAmount: z.string(),
        enrollmentDate: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createEnrollment({
          courseId: input.courseId,
          feeId: input.feeId,
          traineeCount: input.traineeCount,
          paidAmount: input.paidAmount,
          enrollmentDate: input.enrollmentDate,
          notes: input.notes,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        traineeCount: z.number().min(1).optional(),
        paidAmount: z.string().optional(),
        enrollmentDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, enrollmentDate, ...rest } = input;
        const data: Record<string, unknown> = { ...rest };
        if (enrollmentDate) {
          data.enrollmentDate = enrollmentDate;
        }
        await db.updateEnrollment(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteEnrollment(input.id);
        return { success: true };
      }),
  }),

  // ============ EXPENSES ============
  expenses: router({
    listByCourse: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ input }) => {
        return db.listExpensesByCourse(input.courseId);
      }),

    create: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        category: z.enum(["certificates", "instructor", "marketing", "tax", "other"]),
        amount: z.string(),
        description: z.string().optional(),
        expenseDate: z.string(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createExpense({
          courseId: input.courseId,
          category: input.category,
          amount: input.amount,
          description: input.description,
          expenseDate: input.expenseDate,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        category: z.enum(["certificates", "instructor", "marketing", "tax", "other"]).optional(),
        amount: z.string().optional(),
        description: z.string().optional(),
        expenseDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, expenseDate, ...rest } = input;
        const data: Record<string, unknown> = { ...rest };
        if (expenseDate) {
          data.expenseDate = expenseDate;
        }
        await db.updateExpense(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteExpense(input.id);
        return { success: true };
      }),
  }),

  // ============ REPORTS ============
  reports: router({
    dashboard: protectedProcedure.query(async () => {
      return db.getDashboardStats();
    }),

    monthly: protectedProcedure
      .input(z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      }))
      .query(async ({ input }) => {
        return db.getMonthlyReport(input.year, input.month);
      }),

    quarterly: protectedProcedure
      .input(z.object({
        year: z.number(),
        quarter: z.number().min(1).max(4),
      }))
      .query(async ({ input }) => {
        return db.getQuarterlyReport(input.year, input.quarter);
      }),

    semiAnnual: protectedProcedure
      .input(z.object({
        year: z.number(),
        half: z.number().min(1).max(2),
      }))
      .query(async ({ input }) => {
        return db.getSemiAnnualReport(input.year, input.half);
      }),

    annual: protectedProcedure
      .input(z.object({
        year: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getAnnualReport(input.year);
      }),

    // Details APIs for drill-down
    monthlyCoursesDetails: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number().min(1).max(12) }))
      .query(async ({ input }) => {
        return db.getMonthlyCoursesDetails(input.year, input.month);
      }),

    monthlyEnrollmentsDetails: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number().min(1).max(12) }))
      .query(async ({ input }) => {
        return db.getMonthlyEnrollmentsDetails(input.year, input.month);
      }),

    monthlyExpensesDetails: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number().min(1).max(12) }))
      .query(async ({ input }) => {
        return db.getMonthlyExpensesDetails(input.year, input.month);
      }),

    monthlyServicesDetails: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number().min(1).max(12) }))
      .query(async ({ input }) => {
        return db.getMonthlyServicesDetails(input.year, input.month);
      }),
  }),

  // ============ INSTRUCTORS ============
  instructors: router({
    list: protectedProcedure.query(async () => {
      return db.listInstructors();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getInstructorById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().optional(),
        phone: z.string().optional(),
        photoUrl: z.string().optional(),
        bio: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        let photoUrl = input.photoUrl;
        
        // If photoUrl is a base64 data URL, upload to S3
        if (photoUrl && photoUrl.startsWith('data:')) {
          try {
            const { storagePut } = await import('./storage');
            const matches = photoUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
              const contentType = matches[1];
              const base64Data = matches[2];
              const buffer = Buffer.from(base64Data, 'base64');
              const extension = contentType.split('/')[1] || 'png';
              const fileName = `instructors/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
              const result = await storagePut(fileName, buffer, contentType);
              photoUrl = result.url;
            }
          } catch (error) {
            console.error('Failed to upload instructor photo:', error);
            photoUrl = undefined; // Skip photo if upload fails
          }
        }
        
        const id = await db.createInstructor({ ...input, photoUrl });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        photoUrl: z.string().optional(),
        bio: z.string().optional(),
        status: z.enum(["active", "inactive"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        let photoUrl = data.photoUrl;
        
        // If photoUrl is a base64 data URL, upload to S3
        if (photoUrl && photoUrl.startsWith('data:')) {
          try {
            const { storagePut } = await import('./storage');
            const matches = photoUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
              const contentType = matches[1];
              const base64Data = matches[2];
              const buffer = Buffer.from(base64Data, 'base64');
              const extension = contentType.split('/')[1] || 'png';
              const fileName = `instructors/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
              const result = await storagePut(fileName, buffer, contentType);
              photoUrl = result.url;
            }
          } catch (error) {
            console.error('Failed to upload instructor photo:', error);
            photoUrl = undefined; // Skip photo update if upload fails
          }
        }
        
        await db.updateInstructor(id, { ...data, photoUrl });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteInstructor(input.id);
        return { success: true };
      }),

    stats: protectedProcedure.query(async () => {
      return db.getInstructorStats();
    }),
  }),

  // ============ COURSE TEMPLATES ============
  templates: router({
    list: protectedProcedure.query(async () => {
      return db.listCourseTemplates();
    }),

    listWithCourseCount: protectedProcedure.query(async () => {
      return db.getAllTemplatesWithCourseCount();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getCourseTemplateById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        instructorId: z.number().optional(),
        description: z.string().optional(),
        defaultFees: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createCourseTemplate(input);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        instructorId: z.number().optional(),
        description: z.string().optional(),
        defaultFees: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCourseTemplate(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCourseTemplate(input.id);
        return { success: true };
      }),
  }),

  // ============ PLATFORM SETTINGS ============
  settings: router({
    getAll: protectedProcedure.query(async () => {
      return db.getAllSettings();
    }),

    get: protectedProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        return db.getSetting(input.key);
      }),

    update: protectedProcedure
      .input(z.object({
        settings: z.record(z.string(), z.string()),
      }))
      .mutation(async ({ input }) => {
        await db.setSettings(input.settings as Record<string, string>);
        return { success: true };
      }),
  }),

  // ============ SERVICES ============
  services: router({
    list: protectedProcedure.query(async () => {
      return db.listServices();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getServiceById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        price: z.string(),
        quantity: z.number().min(1),
        saleDate: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const totalAmount = (parseFloat(input.price) * input.quantity).toFixed(2);
        const id = await db.createService({
          ...input,
          totalAmount,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        price: z.string().optional(),
        quantity: z.number().min(1).optional(),
        saleDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        let updateData: any = { ...data };
        
        // Recalculate totalAmount if price or quantity changed
        if (data.price || data.quantity) {
          const existing = await db.getServiceById(id);
          if (existing) {
            const price = data.price ? parseFloat(data.price) : parseFloat(existing.price);
            const quantity = data.quantity ?? existing.quantity;
            updateData.totalAmount = (price * quantity).toFixed(2);
          }
        }
        
        await db.updateService(id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteService(input.id);
        return { success: true };
      }),

    getStatistics: protectedProcedure.query(async () => {
      return db.getServicesStatistics();
    }),

    getMonthlyReport: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number() }))
      .query(async ({ input }) => {
        return db.getMonthlyServicesReport(input.year, input.month);
      }),
  }),

  // ============ OPERATIONAL EXPENSES ============
  operationalExpenses: router({
    list: protectedProcedure
      .input(z.object({
        year: z.number().optional(),
        month: z.number().min(1).max(12).optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listOperationalExpenses(input?.year, input?.month);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getOperationalExpenseById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        category: z.enum(["salaries", "electricity", "water", "rent", "government", "other"]),
        amount: z.string(),
        month: z.number().min(1).max(12),
        year: z.number(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createOperationalExpense(input);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        category: z.enum(["salaries", "electricity", "water", "rent", "government", "other"]).optional(),
        amount: z.string().optional(),
        month: z.number().min(1).max(12).optional(),
        year: z.number().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateOperationalExpense(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteOperationalExpense(input.id);
        return { success: true };
      }),

    getMonthly: protectedProcedure
      .input(z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      }))
      .query(async ({ input }) => {
        return db.getMonthlyOperationalExpenses(input.year, input.month);
      }),

    getYearly: protectedProcedure
      .input(z.object({ year: z.number() }))
      .query(async ({ input }) => {
        return db.getYearlyOperationalExpenses(input.year);
      }),

    getMonthlySalariesTotalByStatus: protectedProcedure
      .input(z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      }))
      .query(async ({ input }) => {
        return db.getMonthlySalariesTotalByStatus(input.year, input.month);
      }),

    addEmployeeSalaries: protectedProcedure
      .input(z.object({
        employeeIds: z.array(z.number()),
        month: z.number().min(1).max(12),
        year: z.number(),
      }))
      .mutation(async ({ input }) => {
        const employees = await db.listEmployees();
        const selectedEmployees = employees.filter(e => input.employeeIds.includes(e.id));
        
        let count = 0;
        for (const employee of selectedEmployees) {
          const salary = parseFloat(employee.salary || '0');
          if (salary > 0) {
            await db.createOperationalExpense({
              category: 'salaries',
              amount: salary.toString(),
              month: input.month,
              year: input.year,
              description: `راتب ${employee.name}`,
            });
            count++;
          }
        }
        
        return { count };
      }),
  }),

  // ============ SERVICE TEMPLATES ============
  serviceTemplates: router({
    list: protectedProcedure.query(async () => {
      return db.listServiceTemplates();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getServiceTemplateById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        serviceName: z.string().min(1),
        price: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.createServiceTemplate(input);
        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        serviceName: z.string().min(1).optional(),
        price: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateServiceTemplate(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteServiceTemplate(input.id);
        return { success: true };
      }),
  }),

  // ============ STRATEGIC TARGETS ============
  strategicTargets: router({
    list: protectedProcedure
      .input(z.object({ year: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.listStrategicTargets(input?.year);
      }),

    listAllYears: protectedProcedure.query(async () => {
      return db.getStrategicTargetsAllYears();
    }),

    getActuals: protectedProcedure
      .input(z.object({ year: z.number() }))
      .query(async ({ input }) => {
        return db.getStrategicTargetActuals(input.year);
      }),

    create: protectedProcedure
      .input(z.object({
        type: z.enum([
          "direct_courses", "new_courses", "recorded_courses", "customers", "annual_profit",
          "entity_partnerships", "individual_partnerships", "innovative_ideas",
          "service_quality", "customer_satisfaction", "website_quality"
        ]),
        customName: z.string().optional(),
        baseline: z.string().optional(),
        targetValue: z.string(),
        year: z.number(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createStrategicTarget(input);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        type: z.enum([
          "direct_courses", "new_courses", "recorded_courses", "customers", "annual_profit",
          "entity_partnerships", "individual_partnerships", "innovative_ideas",
          "service_quality", "customer_satisfaction", "website_quality"
        ]).optional(),
        customName: z.string().optional(),
        baseline: z.string().optional(),
        targetValue: z.string().optional(),
        year: z.number().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateStrategicTarget(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteStrategicTarget(input.id);
        return { success: true };
      }),
  }),

  // ============ PARTNERSHIPS ============
  partnerships: router({
    list: protectedProcedure
      .input(z.object({ type: z.enum(["entity", "individual"]).optional() }).optional())
      .query(async ({ input }) => {
        return db.listPartnerships(input?.type);
      }),

    stats: protectedProcedure.query(async () => {
      return db.getPartnershipStats();
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        type: z.enum(["entity", "individual"]),
        contactPerson: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        partnershipDate: z.string(),
        description: z.string().optional(),
        status: z.enum(["active", "inactive"]).optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createPartnership(input as any);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        type: z.enum(["entity", "individual"]).optional(),
        contactPerson: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        partnershipDate: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["active", "inactive"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updatePartnership(id, data as any);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePartnership(input.id);
        return { success: true };
      }),
  }),

  // ============ INNOVATIVE IDEAS ============
  innovativeIdeas: router({
    list: protectedProcedure
      .input(z.object({ status: z.enum(["pending", "approved", "implemented", "rejected"]).optional() }).optional())
      .query(async ({ input }) => {
        return db.listInnovativeIdeas(input?.status);
      }),

    stats: protectedProcedure.query(async () => {
      return db.getInnovativeIdeasStats();
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        submittedBy: z.string().optional(),
        submissionDate: z.string(),
        status: z.enum(["pending", "approved", "implemented", "rejected"]).optional(),
        implementationDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createInnovativeIdea(input as any);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        submittedBy: z.string().optional(),
        submissionDate: z.string().optional(),
        status: z.enum(["pending", "approved", "implemented", "rejected"]).optional(),
        implementationDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateInnovativeIdea(id, data as any);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteInnovativeIdea(input.id);
        return { success: true };
      }),
  }),

  // ============ USERS MANAGEMENT ============
  users: router({
    list: protectedProcedure.query(async () => {
      return db.listUsers();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getUserById(input.id);
      }),

    updateRole: protectedProcedure
      .input(z.object({
        userId: z.number(),
        roleId: z.number().nullable(),
      }))
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.userId, input.roleId);
        return { success: true };
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        userId: z.number(),
        status: z.enum(['active', 'inactive', 'pending']),
      }))
      .mutation(async ({ input }) => {
        await db.updateUserStatus(input.userId, input.status);
        return { success: true };
      }),

    linkEmployee: protectedProcedure
      .input(z.object({
        userId: z.number(),
        employeeId: z.number().nullable(),
      }))
      .mutation(async ({ input }) => {
        await db.linkUserToEmployee(input.userId, input.employeeId);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteUser(input.id);
        return { success: true };
      }),

    getPermissions: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getUserPermissions(input.userId);
      }),

    // Get current user's permissions
    myPermissions: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      return db.getUserPermissions(ctx.user.id);
    }),
  }),

  // ============ ROLES MANAGEMENT ============
  roles: router({
    list: protectedProcedure.query(async () => {
      return db.listRoles();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getRoleById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        displayName: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createRole({
          name: input.name,
          displayName: input.displayName,
          description: input.description,
          isSystem: false,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        displayName: z.string().min(1).optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateRole(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteRole(input.id);
        return { success: true };
      }),

    getPermissions: protectedProcedure
      .input(z.object({ roleId: z.number() }))
      .query(async ({ input }) => {
        return db.getRolePermissions(input.roleId);
      }),

    setPermissions: protectedProcedure
      .input(z.object({
        roleId: z.number(),
        permissionIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        await db.setRolePermissions(input.roleId, input.permissionIds);
        return { success: true };
      }),
  }),



  // ============ AUTH WITH PASSWORD ============
  passwordAuth: router({
    register: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createUserWithPassword({
          name: input.name,
          email: input.email,
          password: input.password,
        });
        return { 
          success: true, 
          id,
          message: 'تم إنشاء الحساب بنجاح. يرجى انتظار تفعيل الحساب من قبل مدير النظام.',
        };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.verifyPassword(input.email, input.password);
        if (!user) {
          throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }
        
        // Create session using SDK
        const { sdk } = await import('./_core/sdk');
        const sessionToken = await sdk.createSessionToken(user.openId || `pwd_${user.id}`, {
          name: user.name || '',
          expiresInMs: 365 * 24 * 60 * 60 * 1000, // 1 year
        });
        
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });
        
        return { 
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        };
      }),
  }),

  // ============ PROJECTS ============
  projects: router({
    list: protectedProcedure
      .input(z.object({ includeInactive: z.boolean().optional() }).optional())
      .query(async ({ input }) => {
        return db.listProjects(input?.includeInactive);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getProjectById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        includeInReports: z.boolean().optional(),
        status: z.enum(['active', 'inactive', 'completed']).optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createProject({
          name: input.name,
          description: input.description,
          includeInReports: input.includeInReports ?? true,
          status: input.status ?? 'active',
        });
        return { success: true, id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        includeInReports: z.boolean().optional(),
        status: z.enum(['active', 'inactive', 'completed']).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProject(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProject(input.id);
        return { success: true };
      }),

    toggleInReports: protectedProcedure
      .input(z.object({
        id: z.number(),
        includeInReports: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await db.toggleProjectInReports(input.id, input.includeInReports);
        return { success: true };
      }),

    getServices: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getProjectServices(input.projectId);
      }),

    assignService: protectedProcedure
      .input(z.object({
        serviceId: z.number(),
        projectId: z.number().nullable(),
      }))
      .mutation(async ({ input }) => {
        await db.assignServiceToProject(input.serviceId, input.projectId);
        return { success: true };
      }),

    getStats: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getProjectStats(input.projectId);
      }),

    getMonthlyReport: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        year: z.number(),
        month: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getProjectMonthlyReport(input.projectId, input.year, input.month);
      }),

    // Project Revenues
    listRevenues: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        year: z.number().optional(),
        month: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return db.listProjectRevenues(input.projectId, input.year, input.month);
      }),

    createRevenue: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        amount: z.string(),
        description: z.string().min(1),
        revenueDate: z.string(),
        category: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createProjectRevenue({
          projectId: input.projectId,
          amount: input.amount,
          description: input.description,
          revenueDate: input.revenueDate as any, // date string
          category: input.category,
          notes: input.notes,
        });
        return { success: true, id };
      }),

    updateRevenue: protectedProcedure
      .input(z.object({
        id: z.number(),
        amount: z.string().optional(),
        description: z.string().optional(),
        revenueDate: z.string().optional(),
        category: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, revenueDate, ...rest } = input;
        await db.updateProjectRevenue(id, {
          ...rest,
          ...(revenueDate ? { revenueDate: revenueDate as any } : {}),
        });
        return { success: true };
      }),

    deleteRevenue: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProjectRevenue(input.id);
        return { success: true };
      }),

    // Project Expenses
    listExpenses: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        year: z.number().optional(),
        month: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return db.listProjectExpenses(input.projectId, input.year, input.month);
      }),

    createExpense: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        amount: z.string(),
        description: z.string().min(1),
        expenseDate: z.string(),
        category: z.enum(['salaries', 'materials', 'marketing', 'operations', 'other']),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createProjectExpense({
          projectId: input.projectId,
          amount: input.amount,
          description: input.description,
          expenseDate: input.expenseDate as any, // date string
          category: input.category,
          notes: input.notes,
        });
        return { success: true, id };
      }),

    updateExpense: protectedProcedure
      .input(z.object({
        id: z.number(),
        amount: z.string().optional(),
        description: z.string().optional(),
        expenseDate: z.string().optional(),
        category: z.enum(['salaries', 'materials', 'marketing', 'operations', 'other']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, expenseDate, ...rest } = input;
        await db.updateProjectExpense(id, {
          ...rest,
          ...(expenseDate ? { expenseDate: expenseDate as any } : {}),
        });
        return { success: true };
      }),

    deleteExpense: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProjectExpense(input.id);
        return { success: true };
      }),

    // Financial Summary
    getFinancialSummary: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        year: z.number().optional(),
        month: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return db.getProjectFinancialSummary(input.projectId, input.year, input.month);
      }),

    // Project Employees
    listEmployees: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.listProjectEmployees(input.projectId);
      }),

    getAvailableEmployees: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getAvailableEmployeesForProject(input.projectId);
      }),

    addEmployee: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        employeeId: z.number(),
        salaryPercentage: z.number().min(0).max(100),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.addProjectEmployee(input);
        return { success: true };
      }),

    updateEmployee: protectedProcedure
      .input(z.object({
        id: z.number(),
        salaryPercentage: z.number().min(0).max(100).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProjectEmployee(id, data);
        return { success: true };
      }),

    removeEmployee: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProjectEmployee(input.id);
        return { success: true };
      }),

    getEmployeeCosts: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getProjectEmployeeCosts(input.projectId);
      }),
  }),

  // ============ SEED DATA ============
  seed: router({
    rolesAndPermissions: protectedProcedure.mutation(async () => {
      return db.seedRolesAndPermissions();
    }),
  }),

  // ============ EMPLOYEES ============
  employees: router({
    list: protectedProcedure
      .input(z.object({ specialization: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.listEmployees(input?.specialization);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getEmployeeById(input.id);
      }),

    getByUserId: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getEmployeeByUserId(input.userId);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        specialization: z.enum(["customer_service", "marketing", "executive_manager", "developer", "support"]),
        userId: z.number().optional(),
        nationalId: z.string().optional(), // رقم الهوية
        profileImage: z.string().optional(), // رابط صورة الموظف
        employeeCode: z.string().optional(), // رمز الموظف للربط مع WPForms
        hireDate: z.string(),
        salary: z.string().optional(),
        workType: z.enum(["remote", "onsite", "hybrid"]).optional(),
        status: z.enum(["active", "inactive", "on_leave"]).optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createEmployee(input as any);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        specialization: z.enum(["customer_service", "marketing", "executive_manager", "developer", "support"]).optional(),
        userId: z.number().optional(),
        nationalId: z.string().optional(), // رقم الهوية
        profileImage: z.string().optional(), // رابط صورة الموظف
        employeeCode: z.string().optional(), // رمز الموظف للربط مع WPForms
        hireDate: z.string().optional(),
        salary: z.string().optional(),
        workType: z.enum(["remote", "onsite", "hybrid"]).optional(),
        status: z.enum(["active", "inactive", "on_leave"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateEmployee(id, data as any);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteEmployee(input.id);
        return { success: true };
      }),

    stats: protectedProcedure.query(async () => {
      return db.getEmployeeStats();
    }),

    profile: protectedProcedure
      .input(z.object({ employeeId: z.number() }).optional())
      .query(async ({ input }) => {
        if (!input?.employeeId) throw new Error("No employee found");
        return db.getEmployeeProfile(input.employeeId);
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        profileImage: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateEmployeeProfile(input.employeeId, {
          email: input.email,
          phone: input.phone,
          profileImage: input.profileImage,
        });
        return { success: true };
      }),

    targetsWithProgress: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        month: z.number().optional(),
        year: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return db.getEmployeeTargetsWithProgress(input.employeeId, input.month, input.year);
      }),

    attendance: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        month: z.number().optional(),
        year: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return db.getEmployeeAttendance(input.employeeId, input.month, input.year);
      }),

    salaryRecords: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        year: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return db.getEmployeeSalaryRecords(input.employeeId, input.year);
      }),

    createWithUser: protectedProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        specialization: z.string(),
        hireDate: z.date(),
        salary: z.string().optional(),
        workType: z.string().optional(),
        status: z.string().optional(),
        roleId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createEmployeeWithUser(input, input.roleId);
      }),

    updateRole: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        roleId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.updateEmployeeRole(input.employeeId, input.roleId);
        return { success: true };
      }),

    getWithRole: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getEmployeeWithRole(input.employeeId);
      }),

        sendLoginCredentials: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        tempPassword: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        
        const employee = await db.getEmployeeProfile(input.employeeId);
        if (!employee || !employee.email) {
          throw new Error("Employee or email not found");
        }
        
        return db.sendEmployeeLoginCredentials(
          input.employeeId,
          employee.email,
          input.tempPassword
        );
      }),

        uploadProfileImage: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        fileKey: z.string(),
        fileData: z.array(z.number()),
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { storagePut } = await import("./storage");
          const buffer = Buffer.from(input.fileData);
          const { url } = await storagePut(input.fileKey, buffer, input.mimeType);
          
          await db.updateEmployeeProfile(input.employeeId, {
            profileImage: url,
          });
          
          return { url, success: true };
        } catch (error) {
          throw new Error("فشل رفع الصورة: " + (error instanceof Error ? error.message : "خطأ غير معروف"));
        }
      }),
  }),

  // ============ EMPLOYEE TARGETS ============
  employeeTargets: router({
    list: protectedProcedure
      .input(z.object({
        employeeId: z.number().optional(),
        year: z.number().optional(),
        month: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listEmployeeTargets(input?.employeeId, input?.year, input?.month);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getEmployeeTargetById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        targetType: z.enum([
          "daily_calls", "confirmed_customers", "registered_customers",
          "targeted_customers", "services_sold", "retargeting",
          "campaigns", "leads_generated", "conversion_rate",
          "features_completed", "bugs_fixed",
          "sales_amount", "customer_satisfaction", "attendance_hours", "other"
        ]),
        customName: z.string().optional(),
        targetValue: z.string(),
        currentValue: z.string().optional(),
        baseValue: z.string().optional(), // القيمة الأساسية المضافة من الأدمن
        period: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]).optional(),
        month: z.number().optional(),
        year: z.number(),
        rewardAmount: z.string().optional(),
        status: z.enum(["in_progress", "achieved", "not_achieved"]).optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createEmployeeTarget(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        targetValue: z.string().optional(),
        currentValue: z.string().optional(),
        baseValue: z.string().optional(), // القيمة الأساسية المضافة من الأدمن
        rewardAmount: z.string().optional(),
        status: z.enum(["in_progress", "achieved", "not_achieved"]).optional(),
        customName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateEmployeeTarget(id, data);
        
        // إعادة حساب القيمة المتحققة إذا تم تعديل القيمة الأساسية
        if (data.baseValue !== undefined) {
          const target = await db.getEmployeeTargetById(id);
          if (target) {
            await db.updateEmployeeTargetsFromDailyStats(target.employeeId);
          }
        }
        
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteEmployeeTarget(input.id);
        return { success: true };
      }),

    // إعادة تهيئة الإحصائيات - حذف جميع القيم المتحققة والإحصائيات اليومية
    resetStats: protectedProcedure
      .input(z.object({
        employeeId: z.number().optional(), // إذا لم يحدد، يتم إعادة تهيئة جميع الموظفين
        month: z.number().optional(),
        year: z.number().optional(),
        resetDailyStats: z.boolean().optional().default(true), // حذف الإحصائيات اليومية
        resetCurrentValues: z.boolean().optional().default(true), // إعادة القيم المتحققة للصفر
      }))
      .mutation(async ({ input }) => {
        return db.resetEmployeeStats(input);
      }),
  }),

  // ============ EMPLOYEE REWARDS ============
  employeeRewards: router({
    list: protectedProcedure
      .input(z.object({
        employeeId: z.number().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listEmployeeRewards(input?.employeeId, input?.status);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getEmployeeRewardById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        targetId: z.number().optional(),
        amount: z.string(),
        reason: z.string(),
        status: z.enum(["pending", "approved", "paid", "rejected"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createEmployeeReward(input);
      }),

    approve: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.approveReward(input.id, ctx.user!.id);
        return { success: true };
      }),

    markAsPaid: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markRewardAsPaid(input.id);
        return { success: true };
      }),

    reject: protectedProcedure
      .input(z.object({ id: z.number(), notes: z.string().optional() }))
      .mutation(async ({ input }) => {
        await db.rejectReward(input.id, input.notes);
        return { success: true };
      }),

    stats: protectedProcedure.query(async () => {
      return db.getRewardsStats();
    }),
  }),

  // ============ ATTENDANCE ============
  attendance: router({
    list: protectedProcedure
      .input(z.object({
        employeeId: z.number().optional(),
        date: z.string().optional(),
        month: z.number().optional(),
        year: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listAttendance(input?.employeeId, input?.date, input?.month, input?.year);
      }),

    checkIn: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        ipAddress: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.checkIn(input.employeeId, input.ipAddress);
      }),

    checkOut: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .mutation(async ({ input }) => {
        await db.checkOut(input.employeeId);
        return { success: true };
      }),

    stats: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        month: z.number(),
        year: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getAttendanceStats(input.employeeId, input.month, input.year);
      }),
  }),

  // ============ DAILY REPORTS ============
  dailyReports: router({
    list: protectedProcedure
      .input(z.object({
        employeeId: z.number().optional(),
        month: z.number().optional(),
        year: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listDailyReports(input?.employeeId, input?.month, input?.year);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getDailyReportById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        reportDate: z.string(),
        targetedCustomers: z.number(),
        confirmedCustomers: z.number(),
        registeredCustomers: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createDailyReport({
          ...input,
          reportDate: input.reportDate, // date type accepts string in format YYYY-MM-DD
        } as any);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        targetedCustomers: z.number().optional(),
        confirmedCustomers: z.number().optional(),
        registeredCustomers: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateDailyReport(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDailyReport(input.id);
        return { success: true };
      }),

    stats: protectedProcedure
      .input(z.object({
        employeeId: z.number().optional(),
        month: z.number(),
        year: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getDailyReportStats(input.employeeId, input.month, input.year);
      }),
  }),

  // ============ CUSTOMER STATS ============
  customerStats: router({
    get: protectedProcedure
      .input(z.object({
        month: z.number().optional(),
        year: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getCustomerStats(input?.month, input?.year);
      }),

    total: protectedProcedure
      .input(z.object({ year: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getTotalCustomers(input?.year);
      }),
  }),

  // ============ SALARIES ============
  salaries: router({
    list: protectedProcedure
      .input(z.object({
        year: z.number().optional(),
        month: z.number().optional(),
        employeeId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listMonthlySalaries(input?.year, input?.month, input?.employeeId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getMonthlySalaryById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        month: z.number().min(1).max(12),
        year: z.number(),
        baseSalary: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createMonthlySalary({
          employeeId: input.employeeId,
          month: input.month,
          year: input.year,
          baseSalary: input.baseSalary,
          totalDeductions: "0",
          totalBonuses: "0",
          netSalary: input.baseSalary,
          status: 'pending',
          notes: input.notes,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        baseSalary: z.string().optional(),
        notes: z.string().optional(),
        status: z.enum(['pending', 'paid', 'cancelled']).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateMonthlySalary(id, data);
        if (data.baseSalary) {
          await db.recalculateSalary(id);
        }
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMonthlySalary(input.id);
        return { success: true };
      }),

    markAsPaid: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markSalaryAsPaid(input.id);
        return { success: true };
      }),

    generate: protectedProcedure
      .input(z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      }))
      .mutation(async ({ input }) => {
        const ids = await db.generateMonthlySalaries(input.year, input.month);
        return { generatedCount: ids.length, ids };
      }),

    stats: protectedProcedure
      .input(z.object({ year: z.number() }))
      .query(async ({ input }) => {
        return db.getSalaryStats(input.year);
      }),

    monthlyTotal: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number() }))
      .query(async ({ input }) => {
        return db.getMonthlySalariesTotal(input.year, input.month);
      }),
  }),

  // ============ SALARY ADJUSTMENTS ============
  salaryAdjustments: router({
    list: protectedProcedure
      .input(z.object({ salaryId: z.number() }))
      .query(async ({ input }) => {
        return db.listSalaryAdjustments(input.salaryId);
      }),

    create: protectedProcedure
      .input(z.object({
        salaryId: z.number(),
        employeeId: z.number(),
        type: z.enum(['deduction', 'bonus']),
        amount: z.string(),
        reason: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createSalaryAdjustment(input);
        return { id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSalaryAdjustment(input.id);
        return { success: true };
      }),
  }),



  // ============ USER PERMISSIONS ============
  userPermissions: router({
    listUsers: protectedProcedure.query(async () => {
      return db.listUsers();
    }),

    listPermissions: protectedProcedure.query(async () => {
      return db.getAllPermissions();
    }),

    getUserPermissions: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getUserPermissions(input.userId);
      }),

    grantPermission: protectedProcedure
      .input(z.object({
        userId: z.number(),
        permissionId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.grantPermissionToUser(input.userId, input.permissionId);
        return { success: true };
      }),

    removePermission: protectedProcedure
      .input(z.object({
        userId: z.number(),
        permissionId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.removePermissionFromUser(input.userId, input.permissionId);
        return { success: true };
      }),

    setPermissions: protectedProcedure
      .input(z.object({
        userId: z.number(),
        permissionIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        await db.setUserPermissions(input.userId, input.permissionIds);
        return { success: true };
      }),

    createUserWithPermissions: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        permissionIds: z.array(z.number()).default([]),
      }))
      .mutation(async ({ input }) => {
        const userId = await db.createUserWithPassword({
          name: input.name,
          email: input.email,
          password: input.password,
        });

        if (input.permissionIds.length > 0) {
          await db.setUserPermissions(userId, input.permissionIds);
        }

        return { success: true, userId };
      }),
  }),

  // ============ PASSWORD MANAGEMENT ============
  passwords: router({
    changePassword: protectedProcedure
      .input(z.object({
        userId: z.number(),
        oldPassword: z.string().min(6),
        newPassword: z.string().min(6),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (input.userId !== ctx.user?.id) {
          const canChange = await db.canChangeUserPassword(ctx.user?.id || 0, input.userId);
          if (!canChange) {
            throw new Error("ليس لديك صلاحية لتغيير كلمة مرور هذا المستخدم");
          }
        }
        await db.changePassword(
          input.userId,
          input.oldPassword,
          input.newPassword,
          input.userId !== ctx.user?.id ? ctx.user?.id : undefined,
          input.reason
        );
        return { success: true };
      }),

    adminChangePassword: protectedProcedure
      .input(z.object({
        userId: z.number(),
        newPassword: z.string().min(1), // Allow weak passwords for admin changes
        sendEmail: z.boolean().optional().default(false), // Optional email notification
      }))
      .mutation(async ({ input, ctx }) => {
        const canChange = await db.canChangeUserPassword(ctx.user?.id || 0, input.userId);
        if (!canChange) {
          throw new Error("ليس لديك صلاحية لتغيير كلمات المرور");
        }
        await db.adminChangePassword(input.userId, input.newPassword, ctx.user?.id || 0, input.sendEmail);
        return { success: true, message: input.sendEmail ? "تم تغيير كلمة المرور وإرسال بريد إلكتروني" : "تم تغيير كلمة المرور" };
      }),

    resetPassword: protectedProcedure
      .input(z.object({
        userId: z.number(),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        const canChange = await db.canChangeUserPassword(ctx.user?.id || 0, input.userId);
        if (!canChange) {
          throw new Error("ليس لديك صلاحية لإعادة تعيين كلمات المرور");
        }
        await db.resetPassword(input.userId, input.newPassword);
        return { success: true };
      }),

    getHistory: protectedProcedure
      .input(z.object({
        userId: z.number(),
        limit: z.number().optional().default(10),
      }))
      .query(async ({ input, ctx }) => {
        if (input.userId !== ctx.user?.id) {
          const canChange = await db.canChangeUserPassword(ctx.user?.id || 0, input.userId);
          if (!canChange) {
            throw new Error("ليس لديك صلاحية لعرض سجل كلمات المرور");
          }
        }
        return db.getPasswordHistory(input.userId, input.limit);
      }),

    getAudit: protectedProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const canChange = await db.canChangeUserPassword(ctx.user?.id || 0, input.userId);
        if (!canChange) {
          throw new Error("ليس لديك صلاحية لعرض سجل التدقيق");
        }
        return db.getUserPasswordAudit(input.userId);
      }),

    canChangeOwnPassword: protectedProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.canChangeOwnPassword(input.userId);
      }),
  }),
  bulkDelete: router({
    deleteUsers: protectedProcedure
      .input(z.object({
        userIds: z.array(z.number()).min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.roleId !== 1) {
          throw new Error("ليس لديك صلاحية لحذف المستخدمين");
        }
        await db.deleteUsersByIds(input.userIds);
        return { success: true, deletedCount: input.userIds.length };
      }),

    deleteEmployees: protectedProcedure
      .input(z.object({
        employeeIds: z.array(z.number()).min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.roleId !== 1) {
          throw new Error("ليس لديك صلاحية لحذف الموظفين");
        }
        await db.deleteEmployeesByIds(input.employeeIds);
        return { success: true, deletedCount: input.employeeIds.length };
      }),
  }),
  resetPassword: router({
    resetUserPassword: protectedProcedure
      .input(z.object({
        userId: z.number(),
        newPassword: z.string().min(1, "كلمة المرور مطلوبة"),
      }))
      .mutation(async ({ input, ctx }) => {
        // Only admin can reset passwords
        if (ctx.user?.roleId !== 1) {
          throw new Error("ليس لديك صلاحية لإعادة تعيين كلمات المرور");
        }
        await db.resetUserPassword(input.userId, input.newPassword);
        return { success: true, message: "تم إعادة تعيين كلمة المرور بنجاح" };
      }),
  }),
  // ============ DAILY STATS ============
  dailyStats: router({
    list: protectedProcedure
      .input(z.object({
        employeeId: z.number().optional(),
        month: z.number().optional(),
        year: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listDailyStats(input?.employeeId, input?.month, input?.year);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getDailyStatById(input.id);
      }),

    getByDate: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        date: z.string(),
      }))
      .query(async ({ input }) => {
        return db.getDailyStatByDate(input.employeeId, input.date);
      }),

    create: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        courseId: z.number().optional(), // ربط بالدورة
        date: z.string(),
        confirmedCustomers: z.number().default(0),
        courseFee: z.number().optional(), // رسوم الدورة
        registeredCustomers: z.number().default(0),
        targetedCustomers: z.number().default(0),
        servicesSold: z.number().default(0),
        salesAmount: z.number().default(0),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createDailyStat({
          employeeId: input.employeeId,
          courseId: input.courseId,
          date: new Date(input.date),
          confirmedCustomers: input.confirmedCustomers,
          courseFee: input.courseFee ? String(input.courseFee) : undefined,
          registeredCustomers: input.registeredCustomers,
          targetedCustomers: input.targetedCustomers,
          servicesSold: input.servicesSold,
          salesAmount: String(input.salesAmount),
          notes: input.notes,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        courseId: z.number().optional(),
        courseFee: z.number().optional(),
        confirmedCustomers: z.number().optional(),
        registeredCustomers: z.number().optional(),
        targetedCustomers: z.number().optional(),
        servicesSold: z.number().optional(),
        salesAmount: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, salesAmount, courseFee, ...rest } = input;
        const data = {
          ...rest,
          ...(salesAmount !== undefined ? { salesAmount: String(salesAmount) } : {}),
          ...(courseFee !== undefined ? { courseFee: String(courseFee) } : {}),
        };
        await db.updateDailyStatWithSync(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDailyStat(input.id);
        return { success: true };
      }),

    monthlyTotal: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        month: z.number(),
        year: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getDailyStatsMonthlyTotal(input.employeeId, input.month, input.year);
      }),

    report: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
        employeeId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return db.getDailyStatsReport(input.startDate, input.endDate, input.employeeId);
      }),

    // API للمشرفين - عرض جميع الإحصائيات للمراجعة
    listForReview: protectedProcedure
      .input(z.object({
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        month: z.number().optional(),
        year: z.number().optional(),
        employeeId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listDailyStatsForReview(input?.status, input?.month, input?.year, input?.employeeId);
      }),

    // تأكيد الإحصائية
    approve: protectedProcedure
      .input(z.object({
        id: z.number(),
        reviewNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.approveDailyStat(input.id, ctx.user?.id || 0, input.reviewNotes);
        return { success: true };
      }),

    // رفض الإحصائية
    reject: protectedProcedure
      .input(z.object({
        id: z.number(),
        reviewNotes: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.rejectDailyStat(input.id, ctx.user?.id || 0, input.reviewNotes);
        return { success: true };
      }),

    // تأكيد مجموعة من الإحصائيات
    bulkApprove: protectedProcedure
      .input(z.object({
        ids: z.array(z.number()),
        reviewNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.bulkApproveDailyStats(input.ids, ctx.user?.id || 0, input.reviewNotes);
        return { success: true };
      }),

    // إحصائيات المراجعة
    reviewStats: protectedProcedure
      .input(z.object({
        month: z.number().optional(),
        year: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getDailyStatsReviewStats(input?.month, input?.year);
      }),
  }),

  userActivation: router({
    activateUser: protectedProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.roleId !== 1) {
          throw new Error("ليس لديك صلاحية لتفعيل المستخدمين");
        }
        await db.activateUser(input.userId);
        return { success: true, message: "تم تفعيل المستخدم بنجاح" };
      }),
    deactivateUser: protectedProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.roleId !== 1) {
          throw new Error("ليس لديك صلاحية لتعطيل المستخدمين");
        }
        await db.deactivateUser(input.userId);
        return { success: true, message: "تم تعطيل المستخدم بنجاح" };
      }),
  }),

  // ============ WEBHOOK - WPForms Integration ============
  webhook: router({
    // Webhook endpoint for WPForms to send form submissions
    wpforms: publicProcedure
      .input(z.object({
        employeeCode: z.string().min(1, "رمز الموظف مطلوب"),
        formId: z.string().optional(),
        formName: z.string().optional(),
        // Additional fields from WPForms can be added here
        clientName: z.string().optional(),
        clientEmail: z.string().optional(),
        clientPhone: z.string().optional(),
        // Secret key for authentication (optional but recommended)
        secretKey: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          // Optional: Verify secret key
          // if (input.secretKey !== ENV.wpformsSecretKey) {
          //   throw new Error("Invalid secret key");
          // }

          // Increment registered clients for the employee
          const result = await db.incrementRegisteredClientsFromWebhook(
            input.employeeCode,
            1 // Increment by 1 for each form submission
          );

          // Log the webhook call
          await db.logWebhookCall({
            source: 'wpforms',
            employeeCode: input.employeeCode,
            payload: input,
            result: result
          });

          return {
            success: true,
            message: `تم تحديث العملاء المسجلين للموظف ${result.employeeName}`,
            data: result
          };
        } catch (error: any) {
          // Log error
          await db.logWebhookCall({
            source: 'wpforms',
            employeeCode: input.employeeCode,
            payload: input,
            result: null,
            error: error.message
          });

          throw new Error(error.message || 'حدث خطأ أثناء معالجة الطلب');
        }
      }),

    // Get employee by code (for testing)
    getEmployeeByCode: publicProcedure
      .input(z.object({
        employeeCode: z.string().min(1),
      }))
      .query(async ({ input }) => {
        const employee = await db.getEmployeeByCode(input.employeeCode);
        if (!employee) {
          return { found: false, employee: null };
        }
        return {
          found: true,
          employee: {
            id: employee.id,
            name: employee.name,
            code: employee.employeeCode
          }
        };
      }),
  }),

  // ============ TEMPORARY ADMIN ENDPOINT (DELETE AFTER USE) ============
  tempAdmin: router({
    resetPasswordByEmail: publicProcedure
      .input(z.object({
        email: z.string().email(),
        newPassword: z.string().min(1),
        secret: z.string(), // Simple secret key for security
      }))
      .mutation(async ({ input }) => {
        // Simple security check
        if (input.secret !== 'reset_pwd_2024') {
          throw new Error('Invalid secret key');
        }
        
        // Find user by email
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new Error('User not found');
        }
        
        // Reset password without admin check
        await db.adminChangePassword(user.id, input.newPassword, 0, false);
        
        return { 
          success: true, 
          message: `Password updated for ${input.email}`,
          userId: user.id 
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
