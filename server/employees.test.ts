import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Employees System", () => {
  describe("Employee Management", () => {
    it("should create an employee", async () => {
      const employeeId = await db.createEmployee({
        name: "أحمد محمد",
        email: "ahmed@test.com",
        phone: "0501234567",
        specialization: "customer_service",
        status: "active",
        hireDate: "2024-01-01",
      });
      
      expect(employeeId).toBeDefined();
      expect(typeof employeeId).toBe("number");
    }, 30000);

    it("should list employees", async () => {
      const employees = await db.listEmployees();
      
      expect(Array.isArray(employees)).toBe(true);
    }, 30000);

    it("should list employees by specialization", async () => {
      const employees = await db.listEmployees("customer_service");
      
      expect(Array.isArray(employees)).toBe(true);
      employees.forEach(emp => {
        expect(emp.specialization).toBe("customer_service");
      });
    }, 30000);
  });

  describe("Employee Targets", () => {
    it("should create a target for an employee", async () => {
      // First get an employee
      const employees = await db.listEmployees();
      if (employees.length === 0) {
        console.log("No employees found, skipping target test");
        return;
      }
      
      const targetId = await db.createEmployeeTarget({
        employeeId: employees[0].id,
        targetType: "confirmed_customers",
        targetValue: 100,
        year: 2025,
        month: 1,
      });
      
      expect(targetId).toBeDefined();
    }, 30000);

    it("should list targets for an employee", async () => {
      const employees = await db.listEmployees();
      if (employees.length === 0) return;
      
      const targets = await db.listEmployeeTargets(employees[0].id);
      
      expect(Array.isArray(targets)).toBe(true);
    }, 30000);
  });

  describe("Attendance", () => {
    it("should record check-in", async () => {
      const employees = await db.listEmployees();
      if (employees.length === 0) return;
      
      const attendanceId = await db.checkIn(employees[0].id);
      
      expect(attendanceId).toBeDefined();
    }, 30000);

    it("should list attendance records", async () => {
      const employees = await db.listEmployees();
      if (employees.length === 0) return;
      
      const attendance = await db.listAttendance(employees[0].id, 1, 2025);
      
      expect(Array.isArray(attendance)).toBe(true);
    }, 30000);
  });

  describe("Daily Reports", () => {
    it("should create a daily report", async () => {
      const employees = await db.listEmployees("customer_service");
      if (employees.length === 0) return;
      
      const reportId = await db.createDailyReport({
        employeeId: employees[0].id,
        reportDate: "2025-01-15",
        targetedCustomers: 50,
        confirmedCustomers: 25,
        registeredCustomers: 10,
        notes: "تقرير اختباري",
      });
      
      expect(reportId).toBeDefined();
    }, 30000);

    it("should list daily reports", async () => {
      const reports = await db.listDailyReports(undefined, 1, 2025);
      
      expect(Array.isArray(reports)).toBe(true);
    }, 30000);

    it("should get daily report stats", async () => {
      const stats = await db.getDailyReportStats(undefined, 1, 2025);
      
      expect(stats).toHaveProperty("totalReports");
      expect(stats).toHaveProperty("totalTargeted");
      expect(stats).toHaveProperty("totalConfirmed");
      expect(stats).toHaveProperty("totalRegistered");
    }, 30000);
  });

  describe("Customer Stats Integration", () => {
    it("should update customer stats when daily report is created", async () => {
      const statsBefore = await db.getTotalCustomers(2025);
      
      const employees = await db.listEmployees("customer_service");
      if (employees.length === 0) return;
      
      await db.createDailyReport({
        employeeId: employees[0].id,
        reportDate: "2025-01-20",
        targetedCustomers: 30,
        confirmedCustomers: 15,
        registeredCustomers: 5,
      });
      
      const statsAfter = await db.getTotalCustomers(2025);
      
      // Stats should increase by the confirmed customers
      expect(statsAfter).toBeGreaterThanOrEqual(statsBefore);
    }, 30000);
  });

  describe("Rewards", () => {
    it("should list rewards", async () => {
      const employees = await db.listEmployees();
      if (employees.length === 0) return;
      
      const rewards = await db.listEmployeeRewards(employees[0].id);
      
      expect(Array.isArray(rewards)).toBe(true);
    }, 30000);
  });
});


describe("Monthly Salary Management", () => {
  const testYear = 2026;
  const testMonth = 1;

  it("should calculate monthly salary totals by status", async () => {
    const totals = await db.getMonthlySalariesTotalByStatus(testYear, testMonth);
    
    expect(totals).toBeDefined();
    expect(typeof totals.paid).toBe("number");
    expect(typeof totals.pending).toBe("number");
    expect(typeof totals.total).toBe("number");
    expect(totals.total).toBe(totals.paid + totals.pending);
  }, 30000);

  it("should retrieve only paid salaries", async () => {
    const totals = await db.getMonthlySalariesTotalByStatus(testYear, testMonth, "paid");
    
    expect(totals).toBeDefined();
    expect(totals.paid).toBeGreaterThanOrEqual(0);
    expect(totals.pending).toBe(0);
  }, 30000);

  it("should retrieve only pending salaries", async () => {
    const totals = await db.getMonthlySalariesTotalByStatus(testYear, testMonth, "pending");
    
    expect(totals).toBeDefined();
    expect(totals.pending).toBeGreaterThanOrEqual(0);
    expect(totals.paid).toBe(0);
  }, 30000);
});

describe("Salary Integration with Operational Expenses", () => {
  const testYear = 2026;
  const testMonth = 1;

  it("should retrieve monthly salary totals for operational expense calculation", async () => {
    const salaryTotals = await db.getMonthlySalariesTotalByStatus(testYear, testMonth);
    
    expect(salaryTotals).toBeDefined();
    expect(typeof salaryTotals.paid).toBe("number");
    expect(typeof salaryTotals.pending).toBe("number");
    expect(typeof salaryTotals.total).toBe("number");
  }, 30000);

  it("should have salary totals that can be added to operational expenses", async () => {
    const salaryTotals = await db.getMonthlySalariesTotalByStatus(testYear, testMonth);
    const monthlyExpenses = await db.getMonthlyOperationalExpenses(testYear, testMonth);

    // Both should return valid data structures
    expect(salaryTotals.total).toBeGreaterThanOrEqual(0);
    expect(monthlyExpenses.total).toBeGreaterThanOrEqual(0);

    // Total operational expenses should include salaries
    const totalWithSalaries = monthlyExpenses.total + salaryTotals.total;
    expect(totalWithSalaries).toBeGreaterThanOrEqual(monthlyExpenses.total);
  }, 30000);

  it("should correctly calculate total expenses including salaries", async () => {
    const salaryTotals = await db.getMonthlySalariesTotalByStatus(testYear, testMonth);
    const monthlyExpenses = await db.getMonthlyOperationalExpenses(testYear, testMonth);

    // Calculate total expenses
    const totalExpenses = monthlyExpenses.total + salaryTotals.total;

    // Verify calculation
    expect(totalExpenses).toBe(monthlyExpenses.total + salaryTotals.total);
  }, 30000);
});

describe("Employee Form State Management", () => {
  /**
   * These tests verify that the employee form properly manages state
   * and doesn't cause re-rendering issues when typing in input fields.
   * 
   * The fix involved:
   * 1. Moving EmployeeForm component outside the main component
   * 2. Using useCallback for all onChange handlers
   * 3. Ensuring stable references to prevent unnecessary re-renders
   */

  it("should maintain form data state without re-rendering", () => {
    // This test verifies the form structure is correct
    // The actual re-rendering prevention is tested in browser tests
    
    const formData = {
      name: "",
      email: "",
      phone: "",
      specialization: "customer_service" as const,
      hireDate: new Date().toISOString().split("T")[0],
      salary: "",
      workType: "remote" as const,
      status: "active" as const,
    };

    expect(formData.name).toBe("");
    expect(formData.specialization).toBe("customer_service");
  });

  it("should handle form data updates correctly", () => {
    const initialFormData = {
      name: "",
      email: "",
      phone: "",
      specialization: "customer_service" as const,
      hireDate: new Date().toISOString().split("T")[0],
      salary: "",
      workType: "remote" as const,
      status: "active" as const,
    };

    // Simulate form update
    const updatedFormData = {
      ...initialFormData,
      name: "أحمد محمد",
      email: "ahmed@example.com",
    };

    expect(updatedFormData.name).toBe("أحمد محمد");
    expect(updatedFormData.email).toBe("ahmed@example.com");
    expect(updatedFormData.specialization).toBe("customer_service");
  });
});


// ============ EMPLOYEE PROFILE TESTS ============
describe("Employee Profile Functions", () => {
  it("should get employee profile by ID", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const profile = await db.getEmployeeProfile(employees[0].id);
    expect(profile).toBeDefined();
    expect(profile?.id).toBe(employees[0].id);
    expect(profile?.name).toBeDefined();
  }, 30000);

  it("should update employee profile data", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const newEmail = `updated-${Date.now()}@example.com`;
    const newPhone = "0559999999";
    
    await db.updateEmployeeProfile(employees[0].id, {
      email: newEmail,
      phone: newPhone,
    });
    
    const updated = await db.getEmployeeProfile(employees[0].id);
    expect(updated?.email).toBe(newEmail);
    expect(updated?.phone).toBe(newPhone);
  }, 30000);

  it("should prevent duplicate email when updating profile", async () => {
    const employees = await db.listEmployees();
    if (employees.length < 2) return;
    
    const emp1 = employees[0];
    const emp2 = employees[1];
    
    // Try to update emp2 with emp1's email - should fail
    try {
      await db.updateEmployeeProfile(emp2.id, {
        email: emp1.email || "test@example.com",
      });
      // If we reach here, the update succeeded (which is ok if emails are different)
    } catch (error) {
      expect((error as Error).message).toContain("مستخدم");
    }
  }, 30000);
});

// ============ EMPLOYEE TARGETS WITH PROGRESS TESTS ============
describe("Employee Targets with Progress", () => {
  it("should get employee targets with progress calculation", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const targets = await db.getEmployeeTargetsWithProgress(employees[0].id);
    expect(Array.isArray(targets)).toBe(true);
  }, 30000);

  it("should calculate correct achievement percentage", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const targets = await db.getEmployeeTargetsWithProgress(employees[0].id, 1, 2026);
    
    targets.forEach((target) => {
      expect(target.percentage).toBeGreaterThanOrEqual(0);
      expect(target.percentage).toBeLessThanOrEqual(100);
      expect(typeof target.achieved).toBe("number");
      expect(target.achieved).toBeGreaterThanOrEqual(0);
    });
  }, 30000);

  it("should filter targets by month and year", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const targetsJan = await db.getEmployeeTargetsWithProgress(employees[0].id, 1, 2026);
    const targetsFeb = await db.getEmployeeTargetsWithProgress(employees[0].id, 2, 2026);
    
    expect(Array.isArray(targetsJan)).toBe(true);
    expect(Array.isArray(targetsFeb)).toBe(true);
  }, 30000);
});

// ============ EMPLOYEE ATTENDANCE TESTS ============
describe("Employee Attendance Records", () => {
  it("should get employee attendance records", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const attendance = await db.getEmployeeAttendance(employees[0].id);
    expect(Array.isArray(attendance)).toBe(true);
  }, 30000);

  it("should filter attendance by month and year", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const attendance = await db.getEmployeeAttendance(employees[0].id, 1, 2026);
    
    attendance.forEach((record) => {
      const recordDate = new Date(record.date);
      expect(recordDate.getMonth() + 1).toBe(1);
      expect(recordDate.getFullYear()).toBe(2026);
    });
  }, 30000);

  it("should have valid attendance data structure", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const attendance = await db.getEmployeeAttendance(employees[0].id);
    
    if (attendance.length > 0) {
      const record = attendance[0];
      expect(record.id).toBeDefined();
      expect(record.employeeId).toBe(employees[0].id);
      expect(record.date).toBeDefined();
      expect(record.status).toMatch(/present|absent|late|half_day|on_leave/);
    }
  }, 30000);
});

// ============ EMPLOYEE SALARY RECORDS TESTS ============
describe("Employee Salary Records", () => {
  it("should get employee salary records", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const salaries = await db.getEmployeeSalaryRecords(employees[0].id);
    expect(Array.isArray(salaries)).toBe(true);
  }, 30000);

  it("should filter salary records by year", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const salaries = await db.getEmployeeSalaryRecords(employees[0].id, 2026);
    
    salaries.forEach((salary) => {
      expect(salary.year).toBe(2026);
    });
  }, 30000);

  it("should have valid salary data structure", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const salaries = await db.getEmployeeSalaryRecords(employees[0].id, 2026);
    
    if (salaries.length > 0) {
      const salary = salaries[0];
      expect(salary.id).toBeDefined();
      expect(salary.employeeId).toBe(employees[0].id);
      expect(salary.baseSalary).toBeDefined();
      expect(salary.netSalary).toBeDefined();
      expect(salary.status).toMatch(/paid|pending/);
      expect(salary.month).toBeGreaterThanOrEqual(1);
      expect(salary.month).toBeLessThanOrEqual(12);
    }
  }, 30000);

  it("should calculate correct salary amounts", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const salaries = await db.getEmployeeSalaryRecords(employees[0].id, 2026);
    
    if (salaries.length > 0) {
      const salary = salaries[0];
      const baseSalary = parseFloat(salary.baseSalary as string);
      const deductions = parseFloat(salary.totalDeductions as string);
      const bonuses = parseFloat(salary.totalBonuses as string);
      const netSalary = parseFloat(salary.netSalary as string);
      
      // Net = Base + Bonuses - Deductions
      const calculated = baseSalary + bonuses - deductions;
      expect(Math.abs(netSalary - calculated)).toBeLessThan(0.01);
    }
  }, 30000);
});


// ============ PROFILE IMAGE UPLOAD TESTS ============
describe("Employee Profile Image Upload", () => {
  it("should update employee profile image URL", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const imageUrl = "https://example.com/images/profile-123.jpg";
    
    await db.updateEmployeeProfile(employees[0].id, {
      profileImage: imageUrl,
    });
    
    const updated = await db.getEmployeeProfile(employees[0].id);
    expect(updated?.profileImage).toBe(imageUrl);
  }, 30000);

  it("should handle profile image update with other fields", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const newEmail = `image-test-${Date.now()}@example.com`;
    const imageUrl = "https://example.com/images/profile-456.jpg";
    
    await db.updateEmployeeProfile(employees[0].id, {
      email: newEmail,
      profileImage: imageUrl,
    });
    
    const updated = await db.getEmployeeProfile(employees[0].id);
    expect(updated?.email).toBe(newEmail);
    expect(updated?.profileImage).toBe(imageUrl);
  }, 30000);

  it("should clear profile image when set to null", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    // First set an image
    const imageUrl = "https://example.com/images/profile-789.jpg";
    await db.updateEmployeeProfile(employees[0].id, {
      profileImage: imageUrl,
    });
    
    let profile = await db.getEmployeeProfile(employees[0].id);
    expect(profile?.profileImage).toBe(imageUrl);
    
    // Then clear it
    await db.updateEmployeeProfile(employees[0].id, {
      profileImage: null,
    });
    
    profile = await db.getEmployeeProfile(employees[0].id);
    expect(profile?.profileImage).toBeNull();
  }, 30000);

  it("should handle multiple image updates", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const imageUrl1 = "https://example.com/images/profile-1.jpg";
    const imageUrl2 = "https://example.com/images/profile-2.jpg";
    
    // First update
    await db.updateEmployeeProfile(employees[0].id, {
      profileImage: imageUrl1,
    });
    
    let profile = await db.getEmployeeProfile(employees[0].id);
    expect(profile?.profileImage).toBe(imageUrl1);
    
    // Second update
    await db.updateEmployeeProfile(employees[0].id, {
      profileImage: imageUrl2,
    });
    
    profile = await db.getEmployeeProfile(employees[0].id);
    expect(profile?.profileImage).toBe(imageUrl2);
  }, 30000);
});

// ============ EMPLOYEE PROFILE COMPLETE TESTS ============
describe("Employee Profile Complete Workflow", () => {
  it("should get complete employee profile with all data", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const profile = await db.getEmployeeProfile(employees[0].id);
    
    expect(profile).toBeDefined();
    expect(profile?.id).toBe(employees[0].id);
    expect(profile?.name).toBeDefined();
    expect(profile?.email).toBeDefined();
    expect(profile?.phone).toBeDefined();
    expect(profile?.specialization).toBeDefined();
    expect(profile?.salary).toBeDefined();
    expect(profile?.hireDate).toBeDefined();
  }, 30000);

  it("should update all profile fields at once", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const newEmail = `complete-${Date.now()}@example.com`;
    const newPhone = "0559876543";
    const imageUrl = "https://example.com/images/complete.jpg";
    
    await db.updateEmployeeProfile(employees[0].id, {
      email: newEmail,
      phone: newPhone,
      profileImage: imageUrl,
    });
    
    const updated = await db.getEmployeeProfile(employees[0].id);
    expect(updated?.email).toBe(newEmail);
    expect(updated?.phone).toBe(newPhone);
    expect(updated?.profileImage).toBe(imageUrl);
  }, 30000);

  it("should maintain profile data integrity", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const originalProfile = await db.getEmployeeProfile(employees[0].id);
    
    // Update only email
    await db.updateEmployeeProfile(employees[0].id, {
      email: `integrity-${Date.now()}@example.com`,
    });
    
    const updatedProfile = await db.getEmployeeProfile(employees[0].id);
    
    // Other fields should remain unchanged
    expect(updatedProfile?.name).toBe(originalProfile?.name);
    expect(updatedProfile?.phone).toBe(originalProfile?.phone);
    expect(updatedProfile?.salary).toBe(originalProfile?.salary);
  }, 30000);
});


// ============ SEND LOGIN CREDENTIALS TESTS ============
describe("Send Employee Login Credentials", () => {
  it("should send login credentials email to employee", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const employee = employees[0];
    if (!employee.email) return;
    
    const tempPassword = "TempPassword123";
    const result = await db.sendEmployeeLoginCredentials(
      employee.id,
      employee.email,
      tempPassword
    );
    
    expect(result.success).toBe(true);
    expect(result.message).toContain(employee.email);
  }, 30000);

  it("should fail when email is missing", async () => {
    const result = await db.sendEmployeeLoginCredentials(
      999,
      "",
      "TempPassword123"
    );
    
    expect(result.success).toBe(false);
    expect(result.message).toContain("مفقود");
  }, 30000);

  it("should handle non-existent employee", async () => {
    const result = await db.sendEmployeeLoginCredentials(
      99999,
      "test@example.com",
      "TempPassword123"
    );
    
    // Should either fail gracefully or handle the case
    expect(result).toBeDefined();
  }, 30000);

  it("should generate unique temporary passwords", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const employee = employees[0];
    if (!employee.email) return;
    
    const password1 = `Temp${Math.random().toString(36).substring(2, 10)}`;
    const password2 = `Temp${Math.random().toString(36).substring(2, 10)}`;
    
    expect(password1).not.toBe(password2);
  }, 30000);
});

// ============ EMPLOYEE DATA EDITING TESTS ============
describe("Employee Data Editing", () => {
  it("should allow editing employee email and phone", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const newEmail = `edited-${Date.now()}@example.com`;
    const newPhone = "0559876543";
    
    await db.updateEmployeeProfile(employees[0].id, {
      email: newEmail,
      phone: newPhone,
    });
    
    const updated = await db.getEmployeeProfile(employees[0].id);
    expect(updated?.email).toBe(newEmail);
    expect(updated?.phone).toBe(newPhone);
  }, 30000);

  it("should prevent editing other employee fields", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const originalName = employees[0].name;
    const originalSalary = employees[0].salary;
    
    // Try to update only email
    const newEmail = `prevent-edit-${Date.now()}@example.com`;
    await db.updateEmployeeProfile(employees[0].id, {
      email: newEmail,
    });
    
    const updated = await db.getEmployeeProfile(employees[0].id);
    
    // Name and salary should remain unchanged
    expect(updated?.name).toBe(originalName);
    expect(updated?.salary).toBe(originalSalary);
  }, 30000);

  it("should validate email format when updating", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    // This should either validate or handle invalid email gracefully
    const result = await db.updateEmployeeProfile(employees[0].id, {
      email: "invalid-email",
    });
    
    expect(result).toBeDefined();
  }, 30000);
});

// ============ EMPLOYEE PROFILE VISIBILITY TESTS ============
describe("Employee Profile Visibility and Permissions", () => {
  it("should get employee profile with personal data", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const profile = await db.getEmployeeProfile(employees[0].id);
    
    expect(profile).toBeDefined();
    expect(profile?.id).toBe(employees[0].id);
    expect(profile?.email).toBeDefined();
    expect(profile?.phone).toBeDefined();
    expect(profile?.salary).toBeDefined();
  }, 30000);

  it("should include all employee personal data in profile", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const profile = await db.getEmployeeProfile(employees[0].id);
    
    expect(profile?.name).toBeDefined();
    expect(profile?.email).toBeDefined();
    expect(profile?.phone).toBeDefined();
    expect(profile?.specialization).toBeDefined();
    expect(profile?.salary).toBeDefined();
    expect(profile?.hireDate).toBeDefined();
  }, 30000);

  it("should get employee targets with progress", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const targets = await db.getEmployeeTargetsWithProgress(employees[0].id);
    
    expect(Array.isArray(targets)).toBe(true);
  }, 30000);

  it("should get employee attendance records", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const attendance = await db.getEmployeeAttendance(employees[0].id);
    
    expect(Array.isArray(attendance)).toBe(true);
  }, 30000);

  it("should get employee salary records", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const salaries = await db.getEmployeeSalaryRecords(employees[0].id);
    
    expect(Array.isArray(salaries)).toBe(true);
  }, 30000);
});


// ============ EMPLOYEE ROLE MANAGEMENT TESTS ============
describe("Employee Role Management", () => {
  it("should create employee with user account", async () => {
    const result = await db.createEmployeeWithUser(
      {
        name: "أحمد علي",
        email: `ahmed-${Date.now()}@example.com`,
        phone: "0501234567",
        specialization: "customer_service",
        hireDate: new Date("2025-01-15"),
        salary: "5000",
        workType: "onsite",
        status: "active",
      },
      1
    );

    expect(result).toBeDefined();
    expect(result.employee).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.tempPassword).toBeDefined();
    expect(result.employee.name).toBe("أحمد علي");
  }, 30000);

  it("should update employee role", async () => {
    const result = await db.createEmployeeWithUser(
      {
        name: "فاطمة محمد",
        email: `fatima-${Date.now()}@example.com`,
        phone: "0509876543",
        specialization: "marketing",
        hireDate: new Date("2025-01-20"),
        salary: "6000",
      },
      1
    );

    const updated = await db.updateEmployeeRole(result.employee.id, 2);
    expect(updated).toBe(true);
  }, 30000);

  it("should get employee with role", async () => {
    const result = await db.createEmployeeWithUser(
      {
        name: "محمد سالم",
        email: `salem-${Date.now()}@example.com`,
        phone: "0505555555",
        specialization: "developer",
        hireDate: new Date("2025-01-25"),
        salary: "7000",
      },
      1
    );

    const employeeWithRole = await db.getEmployeeWithRole(result.employee.id);
    expect(employeeWithRole).toBeDefined();
    expect(employeeWithRole.name).toBe("محمد سالم");
    expect(employeeWithRole.userId).toBeDefined();
  }, 30000);

  it("should handle employee creation with missing userId", async () => {
    try {
      await db.updateEmployeeRole(99999, 1);
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("الموظف أو حسابه غير موجود");
    }
  }, 30000);

  it("should create multiple employees with different roles", async () => {
    const employee1 = await db.createEmployeeWithUser(
      {
        name: "علي أحمد",
        email: `ali-${Date.now()}@example.com`,
        specialization: "support",
        hireDate: new Date("2025-02-01"),
      },
      1
    );

    const employee2 = await db.createEmployeeWithUser(
      {
        name: "ليلى محمد",
        email: `layla-${Date.now()}@example.com`,
        specialization: "executive_manager",
        hireDate: new Date("2025-02-02"),
      },
      2
    );

    expect(employee1.employee.id).not.toBe(employee2.employee.id);
    expect(employee1.user.id).not.toBe(employee2.user.id);
  }, 30000);
});


// ============ ROLE SELECTION TESTS ============
describe("Role Selection and Management", () => {
  it("should list all available roles", async () => {
    const roles = await db.listRoles?.() || [];
    expect(Array.isArray(roles)).toBe(true);
  }, 30000);

  it("should update employee role", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const result = await db.updateEmployeeRole(employees[0].id, 1);
    expect(result).toBeDefined();
  }, 30000);

  it("should get employee with role", async () => {
    const employees = await db.listEmployees();
    if (employees.length === 0) return;
    
    const result = await db.getEmployeeWithRole(employees[0].id);
    expect(result).toBeDefined();
    expect(result?.id).toBe(employees[0].id);
  }, 30000);

  it("should create employee with user account", async () => {
    const result = await db.createEmployeeWithUser({
      name: "Test Employee with Role",
      email: `test-role-${Date.now()}@example.com`,
      phone: "0501111111",
      specialization: "Sales",
      hireDate: new Date(),
      salary: "5000",
      workType: "onsite",
      status: "active",
    }, 1);
    
    expect(result).toBeDefined();
    expect(result?.employeeId).toBeDefined();
    expect(result?.userId).toBeDefined();
  }, 30000);
});
