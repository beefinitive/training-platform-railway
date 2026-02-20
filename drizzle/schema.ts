import { int, mysqlEnum, mysqlTable, text, longtext, timestamp, varchar, decimal, date, boolean, json } from "drizzle-orm/mysql-core";

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
  originalPrice: decimal("originalPrice", { precision: 10, scale: 2 }), // السعر قبل الخصم
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
  feeBreakdown: text("feeBreakdown"), // تفاصيل الأسعار المتعددة (JSON) - يحتوي على {feeId, feeName, feeAmount, customerCount}[]
  registeredCustomers: int("registeredCustomers").notNull().default(0), // عدد العملاء المسجلين
  targetedCustomers: int("targetedCustomers").notNull().default(0), // عدد العملاء المستهدفين
  servicesSold: int("servicesSold").notNull().default(0), // عدد الخدمات المباعة
  targetedByServices: int("targetedByServices").notNull().default(0), // عدد المستهدفين بالخدمات
  salesAmount: decimal("salesAmount", { precision: 10, scale: 2 }).notNull().default("0"), // مبلغ المبيعات
  soldServices: text("soldServices"), // تفاصيل الخدمات المباعة (JSON) - يحتوي على {templateId, templateName, price, quantity}[]
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


/**
 * Public course registrations - stores registrations from the public website
 * Linked to courses and optionally to daily stats for employee tracking
 */
export const publicRegistrations = mysqlTable("public_registrations", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(), // Reference to courses table
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  city: varchar("city", { length: 100 }),
  organization: varchar("organization", { length: 255 }), // جهة العمل
  notes: text("notes"),
  source: varchar("source", { length: 100 }).default("website"), // مصدر التسجيل: website, referral, social
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "attended"]).default("pending").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "paid", "refunded"]).default("unpaid").notNull(),
  feeId: int("feeId"), // Reference to courseFees for the selected price tier
  paidAmount: decimal("paidAmount", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PublicRegistration = typeof publicRegistrations.$inferSelect;
export type InsertPublicRegistration = typeof publicRegistrations.$inferInsert;

/**
 * Public services catalog - services displayed on the public website store
 */
export const publicServices = mysqlTable("public_services", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  shortDescription: varchar("shortDescription", { length: 500 }),
  category: mysqlEnum("category", ["marketing", "training", "consulting", "design", "other"]).default("other").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("originalPrice", { precision: 10, scale: 2 }), // السعر قبل الخصم
  imageUrl: text("imageUrl"),
  features: text("features"), // JSON array of features
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PublicService = typeof publicServices.$inferSelect;
export type InsertPublicService = typeof publicServices.$inferInsert;

/**
 * Service orders - orders from the public services store
 */
export const serviceOrders = mysqlTable("service_orders", {
  id: int("id").autoincrement().primaryKey(),
  serviceId: int("serviceId").notNull(), // Reference to public_services
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  organization: varchar("organization", { length: 255 }),
  requirements: text("requirements"), // متطلبات العميل
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "paid", "refunded"]).default("unpaid").notNull(),
  paidAmount: decimal("paidAmount", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServiceOrder = typeof serviceOrders.$inferSelect;
export type InsertServiceOrder = typeof serviceOrders.$inferInsert;

/**
 * Public course display settings - additional fields for public display
 */
export const courseDisplaySettings = mysqlTable("course_display_settings", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull().unique(), // Reference to courses table
  isPublic: boolean("isPublic").default(false).notNull(), // عرض في الموقع العام
  courseType: mysqlEnum("courseType", ["online_live", "onsite", "recorded"]).default("online_live").notNull(),
  imageUrl: text("imageUrl"),
  shortDescription: varchar("shortDescription", { length: 500 }),
  detailedDescription: text("detailedDescription"),
  highlights: text("highlights"), // JSON array of course highlights
  targetAudience: text("targetAudience"),
  maxSeats: int("maxSeats"),
  currentSeats: int("currentSeats").default(0),
  location: varchar("location", { length: 255 }), // for onsite courses
  meetingLink: text("meetingLink"), // for online courses
  videoPreviewUrl: text("videoPreviewUrl"), // for recorded courses
  thumbnailUrl: text("thumbnailUrl"), // صورة مصغرة للدورة
  publicPrice: decimal("publicPrice", { precision: 10, scale: 2 }), // السعر الأساسي للعرض العام
  publicDiscountPrice: decimal("publicDiscountPrice", { precision: 10, scale: 2 }), // السعر بعد الخصم للعرض العام
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourseDisplaySetting = typeof courseDisplaySettings.$inferSelect;
export type InsertCourseDisplaySetting = typeof courseDisplaySettings.$inferInsert;


// ============================================================
// RECORDED COURSES SYSTEM (نظام الدورات المسجلة)
// ============================================================

/**
 * Recorded courses - main table for recorded/on-demand courses
 * Instructors submit courses, admin reviews and publishes them
 */
export const recordedCourses = mysqlTable("recorded_courses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 300 }).unique(), // URL-friendly slug
  instructorId: int("instructorId").notNull(), // Reference to instructors table
  submittedByUserId: int("submittedByUserId"), // The user who submitted (trainer)
  category: varchar("category", { length: 100 }), // تصنيف الدورة
  level: mysqlEnum("level", ["beginner", "intermediate", "advanced", "all_levels"]).default("all_levels").notNull(),
  language: varchar("language", { length: 50 }).default("العربية"),
  shortDescription: varchar("shortDescription", { length: 500 }),
  detailedDescription: text("detailedDescription"),
  requirements: text("requirements"), // JSON array of prerequisites
  whatYouLearn: text("whatYouLearn"), // JSON array of learning outcomes
  thumbnailUrl: text("thumbnailUrl"),
  promoVideoUrl: text("promoVideoUrl"), // فيديو ترويجي
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"), // سعر الدورة
  discountPrice: decimal("discountPrice", { precision: 10, scale: 2 }), // سعر بعد الخصم
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).default("30"), // نسبة عمولة المنصة (%)
  totalDuration: int("totalDuration").default(0), // إجمالي المدة بالدقائق
  totalLessons: int("totalLessons").default(0), // إجمالي عدد الدروس
  // Review workflow
  status: mysqlEnum("status", [
    "draft",           // مسودة - المدرب لم يقدمها بعد
    "pending_review",  // بانتظار المراجعة
    "changes_requested", // مطلوب تعديلات
    "approved",        // معتمدة
    "published",       // منشورة على الموقع
    "unpublished",     // تم إلغاء النشر
    "rejected"         // مرفوضة
  ]).default("draft").notNull(),
  reviewedBy: int("reviewedBy"), // Admin who reviewed
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"), // ملاحظات المراجعة
  publishedAt: timestamp("publishedAt"),
  // Stats (cached, updated periodically)
  totalEnrollments: int("totalEnrollments").default(0),
  totalViews: int("totalViews").default(0),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("0"),
  totalRevenue: decimal("totalRevenue", { precision: 12, scale: 2 }).default("0"),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RecordedCourse = typeof recordedCourses.$inferSelect;
export type InsertRecordedCourse = typeof recordedCourses.$inferInsert;

/**
 * Recorded course sections - chapters/modules within a recorded course
 */
export const recordedCourseSections = mysqlTable("recorded_course_sections", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(), // Reference to recorded_courses
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RecordedCourseSection = typeof recordedCourseSections.$inferSelect;
export type InsertRecordedCourseSection = typeof recordedCourseSections.$inferInsert;

/**
 * Recorded course lessons - individual videos/lessons within sections
 */
export const recordedCourseLessons = mysqlTable("recorded_course_lessons", {
  id: int("id").autoincrement().primaryKey(),
  sectionId: int("sectionId").notNull(), // Reference to recorded_course_sections
  courseId: int("courseId").notNull(), // Reference to recorded_courses (denormalized for queries)
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  // Lesson type: video, quiz, text
  lessonType: mysqlEnum("lessonType", ["video", "quiz", "text"]).default("video").notNull(),
  // Video fields
  videoUrl: text("videoUrl"), // رابط الفيديو (S3 / YouTube / Vimeo)
  videoSource: mysqlEnum("videoSource", ["upload", "youtube", "vimeo"]).default("upload"), // مصدر الفيديو
  duration: int("duration").default(0), // المدة بالثواني
  // Text content (for text type lessons)
  textContent: text("textContent"), // محتوى نصي (HTML/Markdown)
  // Quiz reference
  quizId: int("quizId"), // Reference to quizzes table
  sortOrder: int("sortOrder").default(0).notNull(),
  isFreePreview: boolean("isFreePreview").default(false).notNull(), // معاينة مجانية
  resourcesUrl: text("resourcesUrl"), // ملفات مرفقة (JSON array of URLs)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RecordedCourseLesson = typeof recordedCourseLessons.$inferSelect;
export type InsertRecordedCourseLesson = typeof recordedCourseLessons.$inferInsert;

/**
 * Recorded course enrollments - students enrolled in recorded courses
 */
export const recordedCourseEnrollments = mysqlTable("recorded_course_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(), // Reference to recorded_courses
  userId: int("userId"), // Reference to users (if logged in)
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  paidAmount: decimal("paidAmount", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "paid", "refunded"]).default("unpaid").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }), // stripe, manual, free
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // null = lifetime access
  status: mysqlEnum("status", ["active", "expired", "cancelled", "refunded"]).default("active").notNull(),
  completionPercentage: decimal("completionPercentage", { precision: 5, scale: 2 }).default("0"),
  lastAccessedAt: timestamp("lastAccessedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RecordedCourseEnrollment = typeof recordedCourseEnrollments.$inferSelect;
export type InsertRecordedCourseEnrollment = typeof recordedCourseEnrollments.$inferInsert;

/**
 * Lesson progress - tracks which lessons a student has completed
 */
export const lessonProgress = mysqlTable("lesson_progress", {
  id: int("id").autoincrement().primaryKey(),
  enrollmentId: int("enrollmentId").notNull(), // Reference to recorded_course_enrollments
  lessonId: int("lessonId").notNull(), // Reference to recorded_course_lessons
  courseId: int("courseId").notNull(), // Reference to recorded_courses (denormalized)
  userId: int("userId"), // Reference to users
  isCompleted: boolean("isCompleted").default(false).notNull(),
  watchedSeconds: int("watchedSeconds").default(0), // الوقت المشاهد بالثواني
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LessonProgress = typeof lessonProgress.$inferSelect;
export type InsertLessonProgress = typeof lessonProgress.$inferInsert;

/**
 * Recorded course reviews - student ratings and reviews
 */
export const recordedCourseReviews = mysqlTable("recorded_course_reviews", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(), // Reference to recorded_courses
  enrollmentId: int("enrollmentId").notNull(), // Reference to recorded_course_enrollments
  userId: int("userId"), // Reference to users
  rating: int("rating").notNull(), // 1-5
  comment: text("comment"),
  isApproved: boolean("isApproved").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RecordedCourseReview = typeof recordedCourseReviews.$inferSelect;
export type InsertRecordedCourseReview = typeof recordedCourseReviews.$inferInsert;

/**
 * Instructor earnings - tracks instructor earnings from recorded courses
 */
export const instructorEarnings = mysqlTable("instructor_earnings", {
  id: int("id").autoincrement().primaryKey(),
  instructorId: int("instructorId").notNull(), // Reference to instructors
  courseId: int("courseId").notNull(), // Reference to recorded_courses
  enrollmentId: int("enrollmentId").notNull(), // Reference to recorded_course_enrollments
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(), // المبلغ الإجمالي
  platformCommission: decimal("platformCommission", { precision: 10, scale: 2 }).notNull(), // عمولة المنصة
  instructorAmount: decimal("instructorAmount", { precision: 10, scale: 2 }).notNull(), // نصيب المدرب
  status: mysqlEnum("status", ["pending", "approved", "paid"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InstructorEarning = typeof instructorEarnings.$inferSelect;
export type InsertInstructorEarning = typeof instructorEarnings.$inferInsert;

/**
 * Course view logs - tracks page views for analytics
 */
export const courseViewLogs = mysqlTable("course_view_logs", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(), // Reference to recorded_courses
  userId: int("userId"), // null for anonymous views
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
  source: varchar("source", { length: 100 }), // direct, search, social, referral
});

export type CourseViewLog = typeof courseViewLogs.$inferSelect;
export type InsertCourseViewLog = typeof courseViewLogs.$inferInsert;


/**
 * Payments table - tracks all payment transactions (Tap & Tabby)
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Reference to users
  recordedCourseId: int("recordedCourseId").notNull(), // Reference to recorded_courses
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("SAR").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["tap", "tabby"]).notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "completed", "failed", "refunded", "cancelled"]).default("pending").notNull(),
  externalPaymentId: varchar("externalPaymentId", { length: 255 }), // Tap charge_id or Tabby payment_id
  externalSessionId: varchar("externalSessionId", { length: 255 }), // Tabby session_id
  redirectUrl: text("redirectUrl"), // Payment redirect URL
  metadata: json("metadata"), // Additional payment data
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Course reviews - ratings and reviews for recorded courses
 */
export const courseReviews = mysqlTable("course_reviews", {
  id: int("id").autoincrement().primaryKey(),
  recordedCourseId: int("recordedCourseId").notNull(), // Reference to recorded_courses
  userId: int("userId").notNull(), // Reference to users
  rating: int("rating").notNull(), // 1-5 stars
  reviewText: text("reviewText"),
  isApproved: boolean("isApproved").default(true).notNull(), // Admin can moderate
  isVisible: boolean("isVisible").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourseReview = typeof courseReviews.$inferSelect;
export type InsertCourseReview = typeof courseReviews.$inferInsert;

/**
 * Completion certificates - auto-generated when course is completed
 */
export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  enrollmentId: int("enrollmentId").notNull(), // Reference to course_enrollments
  userId: int("userId").notNull(), // Reference to users
  recordedCourseId: int("recordedCourseId").notNull(), // Reference to recorded_courses
  certificateNumber: varchar("certificateNumber", { length: 100 }).notNull().unique(), // Unique cert number
  studentName: varchar("studentName", { length: 255 }).notNull(),
  courseName: varchar("courseName", { length: 500 }).notNull(),
  instructorName: varchar("instructorName", { length: 255 }),
  completionDate: timestamp("completionDate").notNull(),
  certificateUrl: text("certificateUrl"), // URL to generated certificate PDF/image
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
});

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;


/**
 * Quizzes - quiz attached to a lesson
 */
export const quizzes = mysqlTable("quizzes", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull(), // Reference to recorded_course_lessons
  courseId: int("courseId").notNull(), // Reference to recorded_courses
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  passingScore: int("passingScore").default(70).notNull(), // نسبة النجاح (%)
  timeLimit: int("timeLimit"), // الوقت المحدد بالدقائق (null = بدون حد)
  maxAttempts: int("maxAttempts").default(0), // 0 = unlimited
  shuffleQuestions: boolean("shuffleQuestions").default(false).notNull(),
  showCorrectAnswers: boolean("showCorrectAnswers").default(true).notNull(), // عرض الإجابات الصحيحة بعد الانتهاء
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;

/**
 * Quiz questions - individual questions in a quiz
 */
export const quizQuestions = mysqlTable("quiz_questions", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(), // Reference to quizzes
  questionType: mysqlEnum("questionType", [
    "multiple_choice",   // اختيار من متعدد
    "true_false",        // صح أو خطأ
    "short_answer",      // إجابة قصيرة
  ]).default("multiple_choice").notNull(),
  questionText: text("questionText").notNull(), // نص السؤال
  questionImage: text("questionImage"), // صورة مرفقة بالسؤال (اختياري)
  explanation: text("explanation"), // شرح الإجابة الصحيحة
  points: int("points").default(1).notNull(), // عدد النقاط
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = typeof quizQuestions.$inferInsert;

/**
 * Quiz answers/options - answer choices for questions
 */
export const quizAnswers = mysqlTable("quiz_answers", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("questionId").notNull(), // Reference to quiz_questions
  answerText: text("answerText").notNull(), // نص الإجابة
  isCorrect: boolean("isCorrect").default(false).notNull(), // هل هي الإجابة الصحيحة
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type InsertQuizAnswer = typeof quizAnswers.$inferInsert;

/**
 * Quiz attempts - student attempts at quizzes
 */
export const quizAttempts = mysqlTable("quiz_attempts", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(), // Reference to quizzes
  userId: int("userId").notNull(), // Reference to users
  enrollmentId: int("enrollmentId").notNull(), // Reference to recorded_course_enrollments
  score: int("score").default(0).notNull(), // النتيجة (%)
  totalPoints: int("totalPoints").default(0).notNull(), // إجمالي النقاط المحصلة
  maxPoints: int("maxPoints").default(0).notNull(), // إجمالي النقاط الممكنة
  isPassed: boolean("isPassed").default(false).notNull(),
  answers: json("answers"), // JSON: [{questionId, selectedAnswerId, isCorrect}]
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;


/**
 * Target alerts - تنبيهات المستهدفات
 * يتم إنشاء تنبيه تلقائي عند وصول الموظف لـ 80% أو 100% من المستهدف
 */
export const targetAlerts = mysqlTable("target_alerts", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(), // الموظف
  targetId: int("targetId").notNull(), // المستهدف المرتبط
  alertType: mysqlEnum("alertType", [
    "reached_80",   // وصل لـ 80% - تحفيز
    "reached_100",  // وصل لـ 100% - إنجاز
  ]).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(), // النسبة المئوية عند التنبيه
  targetType: varchar("targetType", { length: 100 }).notNull(), // نوع المستهدف
  targetValue: decimal("targetValue", { precision: 10, scale: 2 }).notNull(), // القيمة المستهدفة
  achievedValue: decimal("achievedValue", { precision: 10, scale: 2 }).notNull(), // القيمة المتحققة
  message: text("message"), // رسالة التنبيه
  isRead: boolean("isRead").default(false).notNull(), // هل تم قراءة التنبيه
  notifiedOwner: boolean("notifiedOwner").default(false).notNull(), // هل تم إشعار المالك
  month: int("month"), // الشهر
  year: int("year").notNull(), // السنة
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TargetAlert = typeof targetAlerts.$inferSelect;
export type InsertTargetAlert = typeof targetAlerts.$inferInsert;
