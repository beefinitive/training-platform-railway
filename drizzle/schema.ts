import { int, mysqlEnum, mysqlTable, text, longtext, timestamp, varchar, decimal, date, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // Optional for password-based auth
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }), // Hashed password for password-based auth
  loginMethod: mysqlEnum("loginMethod", ["password", "oauth", "google"]).default("oauth").notNull(),
  roleId: int("roleId"), // Reference to roles table
  employeeId: int("employeeId"), // Reference to employees table - ربط المستخدم بالموظف
  status: mysqlEnum("status", ["active", "inactive", "pending"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Roles table - defines user roles (admin, supervisor, user)
 */
export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(), // e.g., "admin", "supervisor", "user"
  displayName: varchar("displayName", { length: 255 }).notNull(), // e.g., "مدير النظام", "مشرف", "مستخدم"
  description: text("description"),
  isSystem: boolean("isSystem").default(false).notNull(), // System roles cannot be deleted
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;

/**
 * Permissions table - defines available permissions
 */
export const permissions = mysqlTable("permissions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(), // e.g., "courses.view", "courses.create"
  displayName: varchar("displayName", { length: 255 }).notNull(), // e.g., "عرض الدورات"
  module: varchar("module", { length: 100 }).notNull(), // e.g., "courses", "instructors", "reports"
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

/**
 * Role permissions table - links roles to permissions
 */
export const rolePermissions = mysqlTable("rolePermissions", {
  id: int("id").autoincrement().primaryKey(),
  roleId: int("roleId").notNull(),
  permissionId: int("permissionId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;

/**
 * User permissions table - links users directly to permissions (bypassing roles)
 */
export const userPermissions = mysqlTable("userPermissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  permissionId: int("permissionId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;

/**
 * Courses table - stores training course information
 */
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  courseCode: varchar("courseCode", { length: 20 }).unique(), // الرقم الرمزي التلقائي (e.g., C-01-01-2026)
  name: varchar("name", { length: 255 }).notNull(),
  templateId: int("templateId"), // Reference to course templates table
  instructorId: int("instructorId"), // Reference to instructors table
  instructorName: varchar("instructorName", { length: 255 }).notNull(), // Keep for backward compatibility
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

/**
 * Course fees table - supports multiple fee tiers per course (for discounts)
 */
export const courseFees = mysqlTable("courseFees", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "السعر الأساسي", "خصم الطلاب"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CourseFee = typeof courseFees.$inferSelect;
export type InsertCourseFee = typeof courseFees.$inferInsert;

/**
 * Course enrollments - statistical data (number of trainees per fee type)
 * Instead of storing individual trainee data, we store counts
 */
export const courseEnrollments = mysqlTable("courseEnrollments", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  feeId: int("feeId").notNull(),
  traineeCount: int("traineeCount").notNull().default(0), // عدد المتدربين
  paidAmount: decimal("paidAmount", { precision: 10, scale: 2 }).notNull(), // المبلغ المدفوع لكل متدرب
  enrollmentDate: date("enrollmentDate").notNull(),
  dailyStatId: int("dailyStatId"), // ربط بالإحصائية اليومية للموظف (اختياري)
  employeeId: int("employeeId"), // الموظف الذي أدخل التسجيل (اختياري)
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type InsertCourseEnrollment = typeof courseEnrollments.$inferInsert;

/**
 * Course expenses table - tracks all course-related expenses
 */
export const courseExpenses = mysqlTable("courseExpenses", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  category: mysqlEnum("category", ["certificates", "instructor", "marketing", "tax", "other"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  expenseDate: date("expenseDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CourseExpense = typeof courseExpenses.$inferSelect;
export type InsertCourseExpense = typeof courseExpenses.$inferInsert;


/**
 * Platform settings table - stores customizable platform settings
 */
export const platformSettings = mysqlTable("platformSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: longtext("value"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlatformSetting = typeof platformSettings.$inferSelect;
export type InsertPlatformSetting = typeof platformSettings.$inferInsert;

/**
 * Instructors table - stores instructor information
 */
export const instructors = mysqlTable("instructors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  photoUrl: text("photoUrl"),
  bio: text("bio"),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Instructor = typeof instructors.$inferSelect;
export type InsertInstructor = typeof instructors.$inferInsert;

/**
 * Course templates table - stores reusable course configurations
 */
export const courseTemplates = mysqlTable("courseTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  instructorId: int("instructorId"),
  description: text("description"),
  defaultFees: text("defaultFees"), // JSON string of fee configurations
  isActive: boolean("isActive").default(true).notNull(), // Whether the template is active (not from deleted course)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourseTemplate = typeof courseTemplates.$inferSelect;
export type InsertCourseTemplate = typeof courseTemplates.$inferInsert;

/**
 * Services table - stores sold services information
 */
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: int("quantity").notNull().default(1),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(), // price * quantity
  saleDate: date("saleDate").notNull(),
  projectId: int("projectId"), // Reference to projects table (null = main account)
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

/**
 * Service templates table - stores reusable service configurations
 */
export const serviceTemplates = mysqlTable("serviceTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // اسم القالب
  serviceName: varchar("serviceName", { length: 255 }).notNull(), // اسم الخدمة
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // السعر الافتراضي
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServiceTemplate = typeof serviceTemplates.$inferSelect;
export type InsertServiceTemplate = typeof serviceTemplates.$inferInsert;


/**
 * Operational expenses table - stores monthly operational expenses
 * Categories: salaries, electricity, water, rent, government, other
 */
export const operationalExpenses = mysqlTable("operationalExpenses", {
  id: int("id").autoincrement().primaryKey(),
  category: mysqlEnum("category", ["salaries", "electricity", "water", "rent", "government", "other"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  month: int("month").notNull(), // 1-12
  year: int("year").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OperationalExpense = typeof operationalExpenses.$inferSelect;
export type InsertOperationalExpense = typeof operationalExpenses.$inferInsert;


/**
 * Strategic targets table - stores annual strategic targets
 * Types: direct_courses, recorded_courses, customers, annual_profit, entity_partnerships, individual_partnerships, innovative_ideas
 */
export const strategicTargets = mysqlTable("strategicTargets", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", [
    "direct_courses",      // زيادة عدد الدورات التدريبية المباشرة
    "new_courses",         // زيادة عدد الدورات الجديدة (قوالب فريدة)
    "recorded_courses",    // زيادة عدد الدورات المسجلة
    "customers",           // زيادة أعداد العملاء
    "annual_profit",       // زيادة الربح السنوي للشركة
    "entity_partnerships", // زيادة عدد الشراكات الفاعلة مع الجهات
    "individual_partnerships", // زيادة أعداد الشراكات مع الأفراد
    "innovative_ideas",    // زيادة عدد الأفكار النوعية
    "service_quality",     // ارتفاع مستوى جودة تقديم الخدمة
    "customer_satisfaction", // ارتفاع نسبة رضا العملاء
    "website_quality"      // جودة الموقع وتحسين تجربة العميل
  ]).notNull(),
  customName: varchar("customName", { length: 255 }), // الاسم المخصص للمستهدف
  baseline: decimal("baseline", { precision: 10, scale: 2 }).default("0"), // خط الأساس (يتصفر كل سنة)
  targetValue: decimal("targetValue", { precision: 10, scale: 2 }).notNull(), // القيمة المستهدفة
  year: int("year").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StrategicTarget = typeof strategicTargets.$inferSelect;
export type InsertStrategicTarget = typeof strategicTargets.$inferInsert;

/**
 * Partnerships table - stores partnerships with entities and individuals
 */
export const partnerships = mysqlTable("partnerships", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // اسم الشريك
  type: mysqlEnum("type", ["entity", "individual"]).notNull(), // نوع الشراكة: جهة أو فرد
  contactPerson: varchar("contactPerson", { length: 255 }), // الشخص المسؤول
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  partnershipDate: date("partnershipDate").notNull(), // تاريخ بدء الشراكة
  description: text("description"),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Partnership = typeof partnerships.$inferSelect;
export type InsertPartnership = typeof partnerships.$inferInsert;

/**
 * Innovative ideas table - stores innovative ideas
 */
export const innovativeIdeas = mysqlTable("innovativeIdeas", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(), // عنوان الفكرة
  description: text("description"), // وصف الفكرة
  category: varchar("category", { length: 100 }), // تصنيف الفكرة
  submittedBy: varchar("submittedBy", { length: 255 }), // مقدم الفكرة
  submissionDate: date("submissionDate").notNull(), // تاريخ تقديم الفكرة
  status: mysqlEnum("status", ["pending", "approved", "implemented", "rejected"]).default("pending").notNull(),
  implementationDate: date("implementationDate"), // تاريخ التنفيذ
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InnovativeIdea = typeof innovativeIdeas.$inferSelect;
export type InsertInnovativeIdea = typeof innovativeIdeas.$inferInsert;


/**
 * Projects table - stores separate projects/initiatives with their own accounting
 * Projects can be included or excluded from main reports
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // اسم المشروع
  description: text("description"), // وصف المشروع
  includeInReports: boolean("includeInReports").default(true).notNull(), // تضمين في التقارير الرئيسية
  status: mysqlEnum("status", ["active", "inactive", "completed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Project revenues table - stores revenues for independent projects
 */
export const projectRevenues = mysqlTable("projectRevenues", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(), // Reference to projects table
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(), // وصف الإيراد
  revenueDate: date("revenueDate").notNull(),
  category: varchar("category", { length: 100 }), // تصنيف الإيراد
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectRevenue = typeof projectRevenues.$inferSelect;
export type InsertProjectRevenue = typeof projectRevenues.$inferInsert;

/**
 * Project expenses table - stores expenses for independent projects
 */
export const projectExpenses = mysqlTable("projectExpenses", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(), // Reference to projects table
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(), // وصف المصروف
  expenseDate: date("expenseDate").notNull(),
  category: mysqlEnum("category", [
    "salaries",      // رواتب
    "materials",     // مواد
    "marketing",     // تسويق
    "operations",    // تشغيل
    "other"          // أخرى
  ]).default("other").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectExpense = typeof projectExpenses.$inferSelect;
export type InsertProjectExpense = typeof projectExpenses.$inferInsert;

/**
 * Employees table - stores employee information
 * Specializations: customer_service, marketing, executive_manager, developer, support
 */
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  specialization: mysqlEnum("specialization", [
    "customer_service",    // خدمة عملاء
    "marketing",           // تسويق
    "executive_manager",   // مدير تنفيذي
    "developer",           // مبرمج
    "support"              // داعم
  ]).notNull(),
  userId: int("userId"), // Link to users table for login
  nationalId: varchar("nationalId", { length: 20 }), // رقم الهوية
  employeeCode: varchar("employeeCode", { length: 50 }).unique(), // رمز الموظف للربط مع WPForms
  profileImage: text("profileImage"), // URL to profile image in S3
  hireDate: date("hireDate").notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  workType: mysqlEnum("workType", ["remote", "onsite", "hybrid"]).default("remote").notNull(),
  status: mysqlEnum("status", ["active", "inactive", "on_leave"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

/**
 * Employee targets table - individual targets for each employee
 * Target types vary by specialization
 */
export const employeeTargets = mysqlTable("employeeTargets", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  targetType: mysqlEnum("targetType", [
    // Customer service targets
    "daily_calls",           // عدد المكالمات اليومية
    "confirmed_customers",   // العملاء المؤكدين
    "registered_customers",  // العملاء المسجلين
    "targeted_customers",    // العملاء المستهدفين
    "services_sold",         // الخدمات المباعة
    "retargeting",           // إعادة الاستهداف
    // Marketing targets
    "campaigns",             // عدد الحملات
    "leads_generated",       // العملاء المحتملين
    "conversion_rate",       // نسبة التحويل
    // Developer targets
    "features_completed",    // المهام المنجزة
    "bugs_fixed",            // الأخطاء المصلحة
    // General targets
    "sales_amount",          // مبلغ المبيعات
    "customer_satisfaction", // رضا العملاء
    "attendance_hours",      // ساعات الحضور
    "other"                  // أخرى
  ]).notNull(),
  customName: varchar("customName", { length: 255 }), // اسم مخصص للمستهدف
  targetValue: decimal("targetValue", { precision: 10, scale: 2 }).notNull(), // القيمة المستهدفة
  currentValue: decimal("currentValue", { precision: 10, scale: 2 }).default("0").notNull(), // القيمة الحالية (القيمة الأساسية + الإحصائيات اليومية)
  baseValue: decimal("baseValue", { precision: 10, scale: 2 }).default("0").notNull(), // القيمة الأساسية المضافة من الأدمن
  period: mysqlEnum("period", ["daily", "weekly", "monthly", "quarterly", "yearly"]).default("monthly").notNull(),
  month: int("month"), // الشهر (1-12) للمستهدفات الشهرية
  year: int("year").notNull(), // السنة
  rewardAmount: decimal("rewardAmount", { precision: 10, scale: 2 }), // قيمة المكافأة عند تحقيق المستهدف
  status: mysqlEnum("status", ["in_progress", "achieved", "not_achieved"]).default("in_progress").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmployeeTarget = typeof employeeTargets.$inferSelect;
export type InsertEmployeeTarget = typeof employeeTargets.$inferInsert;

/**
 * Employee rewards table - tracks rewards earned by employees
 */
export const employeeRewards = mysqlTable("employeeRewards", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  targetId: int("targetId"), // Reference to the target that triggered the reward
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: varchar("reason", { length: 500 }).notNull(), // سبب المكافأة
  status: mysqlEnum("status", ["pending", "approved", "paid", "rejected"]).default("pending").notNull(),
  approvedBy: int("approvedBy"), // User who approved the reward
  approvedAt: timestamp("approvedAt"),
  paidAt: timestamp("paidAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmployeeReward = typeof employeeRewards.$inferSelect;
export type InsertEmployeeReward = typeof employeeRewards.$inferInsert;

/**
 * Attendance table - tracks employee check-in/check-out for remote work
 */
export const attendance = mysqlTable("attendance", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  date: date("date").notNull(),
  checkIn: timestamp("checkIn"), // وقت تسجيل الدخول
  checkOut: timestamp("checkOut"), // وقت تسجيل الخروج
  totalHours: decimal("totalHours", { precision: 5, scale: 2 }), // إجمالي ساعات العمل
  status: mysqlEnum("status", ["present", "absent", "late", "half_day", "on_leave"]).default("present").notNull(),
  notes: text("notes"),
  ipAddress: varchar("ipAddress", { length: 50 }), // للتحقق من موقع العمل عن بعد
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = typeof attendance.$inferInsert;

/**
 * Daily reports table - daily achievement reports for customer service
 */
export const dailyReports = mysqlTable("dailyReports", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  reportDate: date("reportDate").notNull(),
  targetedCustomers: int("targetedCustomers").notNull().default(0), // العملاء المستهدفين
  confirmedCustomers: int("confirmedCustomers").notNull().default(0), // العملاء المؤكدين
  registeredCustomers: int("registeredCustomers").notNull().default(0), // العملاء المسجلين في النموذج
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyReport = typeof dailyReports.$inferSelect;
export type InsertDailyReport = typeof dailyReports.$inferInsert;

/**
 * Customer stats table - tracks total customer counts (fed from daily reports)
 */
export const customerStats = mysqlTable("customerStats", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(), // Reference to employees table
  month: int("month").notNull(), // 1-12
  year: int("year").notNull(),
  targetedCustomers: int("targetedCustomers").notNull().default(0), // العملاء المستهدفين
  registeredInForm: int("registeredInForm").notNull().default(0), // العملاء المسجلين في النموذج
  confirmedCustomers: int("confirmedCustomers").notNull().default(0), // العملاء المؤكدين
  oldCustomersContacted: int("oldCustomersContacted").notNull().default(0), // عملاء قدامى تم التواصل معهم
  servicesSold: int("servicesSold").notNull().default(0), // عدد الخدمات المباعة
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomerStat = typeof customerStats.$inferSelect;
export type InsertCustomerStat = typeof customerStats.$inferInsert;


/**
 * Monthly Salaries table - stores monthly salary records for employees
 */
export const monthlySalaries = mysqlTable("monthly_salaries", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(), // Reference to employees table
  month: int("month").notNull(), // 1-12
  year: int("year").notNull(),
  baseSalary: decimal("baseSalary", { precision: 10, scale: 2 }).notNull(), // الراتب الأساسي
  totalDeductions: decimal("totalDeductions", { precision: 10, scale: 2 }).default("0").notNull(), // إجمالي الحسومات
  totalBonuses: decimal("totalBonuses", { precision: 10, scale: 2 }).default("0").notNull(), // إجمالي المكافآت
  netSalary: decimal("netSalary", { precision: 10, scale: 2 }).notNull(), // صافي الراتب
  status: mysqlEnum("status", ["pending", "paid", "cancelled"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MonthlySalary = typeof monthlySalaries.$inferSelect;
export type InsertMonthlySalary = typeof monthlySalaries.$inferInsert;

/**
 * Salary Adjustments table - stores deductions and bonuses for salaries
 */
export const salaryAdjustments = mysqlTable("salary_adjustments", {
  id: int("id").autoincrement().primaryKey(),
  salaryId: int("salaryId").notNull(), // Reference to monthly_salaries table
  employeeId: int("employeeId").notNull(), // Reference to employees table
  type: mysqlEnum("type", ["deduction", "bonus"]).notNull(), // حسم أو مكافأة
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: varchar("reason", { length: 255 }).notNull(), // سبب الحسم أو المكافأة
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SalaryAdjustment = typeof salaryAdjustments.$inferSelect;
export type InsertSalaryAdjustment = typeof salaryAdjustments.$inferInsert;

/**
 * Password history table - tracks password changes for audit and security
 */
export const passwordHistory = mysqlTable("passwordHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  oldPassword: varchar("oldPassword", { length: 255 }).notNull(),
  newPassword: varchar("newPassword", { length: 255 }).notNull(),
  changedBy: int("changedBy"),
  reason: varchar("reason", { length: 255 }),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});

export type PasswordHistory = typeof passwordHistory.$inferSelect;
export type InsertPasswordHistory = typeof passwordHistory.$inferInsert;


/**
 * Daily statistics table - tracks daily customer service statistics
 * Used by customer service employees to log their daily achievements
 */
export const dailyStats = mysqlTable("daily_stats", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(), // Reference to employees table
  courseId: int("courseId"), // Reference to courses table - ربط الإحصائية بالدورة
  date: date("date").notNull(), // تاريخ الإحصائية
  confirmedCustomers: int("confirmedCustomers").notNull().default(0), // عدد العملاء المؤكدين
  courseFee: decimal("courseFee", { precision: 10, scale: 2 }).default("0"), // رسوم الدورة المستخدمة في الحساب
  calculatedRevenue: decimal("calculatedRevenue", { precision: 10, scale: 2 }).default("0"), // الإيراد المحسوب (عدد المؤكدين × رسوم الدورة)
  registeredCustomers: int("registeredCustomers").notNull().default(0), // عدد العملاء المسجلين
  targetedCustomers: int("targetedCustomers").notNull().default(0), // عدد العملاء المستهدفين
  servicesSold: int("servicesSold").notNull().default(0), // عدد الخدمات المباعة
  salesAmount: decimal("salesAmount", { precision: 10, scale: 2 }).notNull().default("0"), // مبلغ المبيعات
  notes: text("notes"),
  // حقول المراجعة
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(), // حالة الإحصائية
  reviewedBy: int("reviewedBy"), // معرف المشرف الذي راجع الإحصائية
  reviewedAt: timestamp("reviewedAt"), // تاريخ المراجعة
  reviewNotes: text("reviewNotes"), // ملاحظات المراجعة
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyStat = typeof dailyStats.$inferSelect;
export type InsertDailyStat = typeof dailyStats.$inferInsert;


/**
 * Project employees table - links employees to projects with salary percentage
 * Used to calculate employee costs as project expenses
 */
export const projectEmployees = mysqlTable("projectEmployees", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(), // Reference to projects table
  employeeId: int("employeeId").notNull(), // Reference to employees table
  salaryPercentage: decimal("salaryPercentage", { precision: 5, scale: 2 }).notNull().default("100"), // نسبة الراتب (0-100%)
  calculatedCost: decimal("calculatedCost", { precision: 10, scale: 2 }).notNull().default("0"), // التكلفة المحسوبة
  notes: text("notes"), // ملاحظات
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectEmployee = typeof projectEmployees.$inferSelect;
export type InsertProjectEmployee = typeof projectEmployees.$inferInsert;
