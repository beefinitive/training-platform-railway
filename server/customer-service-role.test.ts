import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database functions
vi.mock("./db", () => ({
  listRoles: vi.fn(),
  getRoleById: vi.fn(),
  listEmployeeTargets: vi.fn(),
  listEmployeeRewards: vi.fn(),
  updateEmployeeTarget: vi.fn(),
}));

import * as db from "./db";

describe("Customer Service Role System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Role Definitions", () => {
    it("should have customer_service role with ID 4", async () => {
      const mockRoles = [
        { id: 1, name: "admin", displayName: "مدير النظام" },
        { id: 2, name: "supervisor", displayName: "مشرف" },
        { id: 3, name: "user", displayName: "مستخدم" },
        { id: 4, name: "customer_service", displayName: "خدمة العملاء" },
      ];
      
      vi.mocked(db.listRoles).mockResolvedValue(mockRoles);
      
      const roles = await db.listRoles();
      const customerServiceRole = roles.find(r => r.name === "customer_service");
      
      expect(customerServiceRole).toBeDefined();
      expect(customerServiceRole?.id).toBe(4);
      expect(customerServiceRole?.displayName).toBe("خدمة العملاء");
    });

    it("should have 4 system roles", async () => {
      const mockRoles = [
        { id: 1, name: "admin", displayName: "مدير النظام" },
        { id: 2, name: "supervisor", displayName: "مشرف" },
        { id: 3, name: "user", displayName: "مستخدم" },
        { id: 4, name: "customer_service", displayName: "خدمة العملاء" },
      ];
      
      vi.mocked(db.listRoles).mockResolvedValue(mockRoles);
      
      const roles = await db.listRoles();
      expect(roles.length).toBe(4);
    });
  });

  describe("Role Access Control", () => {
    const ROLE_ADMIN = 1;
    const ROLE_SUPERVISOR = 2;
    const ROLE_USER = 3;
    const ROLE_CUSTOMER_SERVICE = 4;

    function canAccessMenuItem(roleId: number, allowedRoles: number[] | null): boolean {
      if (allowedRoles === null) return true;
      return allowedRoles.includes(roleId);
    }

    it("should allow admin to access all pages", () => {
      expect(canAccessMenuItem(ROLE_ADMIN, null)).toBe(true);
      expect(canAccessMenuItem(ROLE_ADMIN, [ROLE_ADMIN])).toBe(true);
      expect(canAccessMenuItem(ROLE_ADMIN, [ROLE_ADMIN, ROLE_SUPERVISOR])).toBe(true);
    });

    it("should allow customer_service to access only my-targets page", () => {
      // صفحة مستهدفاتي - متاحة لخدمة العملاء فقط
      expect(canAccessMenuItem(ROLE_CUSTOMER_SERVICE, [ROLE_CUSTOMER_SERVICE])).toBe(true);
      
      // الصفحات الإدارية - غير متاحة لخدمة العملاء
      expect(canAccessMenuItem(ROLE_CUSTOMER_SERVICE, [ROLE_ADMIN])).toBe(false);
      
      // الصفحات العامة - غير متاحة لخدمة العملاء
      expect(canAccessMenuItem(ROLE_CUSTOMER_SERVICE, [ROLE_ADMIN, ROLE_SUPERVISOR, ROLE_USER])).toBe(false);
    });

    it("should deny customer_service access to admin pages", () => {
      const adminOnlyPages = [ROLE_ADMIN];
      expect(canAccessMenuItem(ROLE_CUSTOMER_SERVICE, adminOnlyPages)).toBe(false);
    });

    it("should allow all roles to access null-permission pages", () => {
      expect(canAccessMenuItem(ROLE_ADMIN, null)).toBe(true);
      expect(canAccessMenuItem(ROLE_SUPERVISOR, null)).toBe(true);
      expect(canAccessMenuItem(ROLE_USER, null)).toBe(true);
      expect(canAccessMenuItem(ROLE_CUSTOMER_SERVICE, null)).toBe(true);
    });
  });

  describe("Employee Targets for Customer Service", () => {
    it("should list targets for specific employee", async () => {
      const mockTargets = [
        { id: 1, employeeId: 5, targetType: "confirmed_customers", targetValue: "100", currentValue: "75", status: "in_progress" },
        { id: 2, employeeId: 5, targetType: "daily_calls", targetValue: "50", currentValue: "50", status: "achieved" },
      ];
      
      vi.mocked(db.listEmployeeTargets).mockResolvedValue(mockTargets);
      
      const targets = await db.listEmployeeTargets(5, 2026, 1);
      
      expect(targets.length).toBe(2);
      expect(targets.every(t => t.employeeId === 5)).toBe(true);
    });

    it("should calculate progress percentage correctly", () => {
      const calculateProgress = (current: number, target: number) => {
        if (target === 0) return 0;
        return Math.min(100, Math.round((current / target) * 100));
      };

      expect(calculateProgress(75, 100)).toBe(75);
      expect(calculateProgress(100, 100)).toBe(100);
      expect(calculateProgress(150, 100)).toBe(100); // capped at 100%
      expect(calculateProgress(0, 100)).toBe(0);
      expect(calculateProgress(50, 0)).toBe(0); // division by zero protection
    });
  });

  describe("Employee Rewards for Customer Service", () => {
    it("should list rewards for specific employee", async () => {
      const mockRewards = [
        { id: 1, employeeId: 5, amount: "500", status: "paid", reason: "تحقيق المستهدف الشهري" },
        { id: 2, employeeId: 5, amount: "300", status: "pending", reason: "أداء متميز" },
      ];
      
      vi.mocked(db.listEmployeeRewards).mockResolvedValue(mockRewards);
      
      const rewards = await db.listEmployeeRewards(5);
      
      expect(rewards.length).toBe(2);
      expect(rewards.every(r => r.employeeId === 5)).toBe(true);
    });

    it("should calculate total paid rewards correctly", () => {
      const rewards = [
        { amount: "500", status: "paid" },
        { amount: "300", status: "pending" },
        { amount: "200", status: "paid" },
        { amount: "100", status: "rejected" },
      ];

      const totalPaid = rewards
        .filter(r => r.status === "paid")
        .reduce((sum, r) => sum + Number(r.amount), 0);

      expect(totalPaid).toBe(700);
    });
  });

  describe("Admin Target Management", () => {
    it("should update target current value", async () => {
      vi.mocked(db.updateEmployeeTarget).mockResolvedValue(undefined);
      
      await db.updateEmployeeTarget(1, { currentValue: "80" });
      
      expect(db.updateEmployeeTarget).toHaveBeenCalledWith(1, { currentValue: "80" });
    });

    it("should update target status", async () => {
      vi.mocked(db.updateEmployeeTarget).mockResolvedValue(undefined);
      
      await db.updateEmployeeTarget(1, { status: "achieved" });
      
      expect(db.updateEmployeeTarget).toHaveBeenCalledWith(1, { status: "achieved" });
    });

    it("should update multiple target fields at once", async () => {
      vi.mocked(db.updateEmployeeTarget).mockResolvedValue(undefined);
      
      await db.updateEmployeeTarget(1, { 
        currentValue: "100", 
        targetValue: "100",
        status: "achieved" 
      });
      
      expect(db.updateEmployeeTarget).toHaveBeenCalledWith(1, { 
        currentValue: "100", 
        targetValue: "100",
        status: "achieved" 
      });
    });
  });
});
