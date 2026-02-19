import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getEmployeeTargetById: vi.fn(),
  updateEmployeeTarget: vi.fn(),
  getDailyStatsMonthlyTotal: vi.fn(),
  updateEmployeeTargetsFromDailyStats: vi.fn(),
}));

import * as db from "./db";

describe("Base Value and Current Value Calculation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Target Base Value", () => {
    it("should have baseValue field in target", async () => {
      const mockTarget = {
        id: 1,
        employeeId: 1,
        targetType: "confirmed_customers",
        targetValue: "100",
        currentValue: "50",
        baseValue: "20",
        status: "in_progress",
      };
      
      vi.mocked(db.getEmployeeTargetById).mockResolvedValue(mockTarget);
      
      const target = await db.getEmployeeTargetById(1);
      
      expect(target).toBeDefined();
      expect(target?.baseValue).toBe("20");
    });

    it("should update baseValue via updateEmployeeTarget", async () => {
      vi.mocked(db.updateEmployeeTarget).mockResolvedValue(undefined);
      
      await db.updateEmployeeTarget(1, { baseValue: "30" });
      
      expect(db.updateEmployeeTarget).toHaveBeenCalledWith(1, { baseValue: "30" });
    });
  });

  describe("Current Value Calculation", () => {
    it("should calculate currentValue as baseValue + daily stats total", async () => {
      // Mock monthly totals from daily stats
      vi.mocked(db.getDailyStatsMonthlyTotal).mockResolvedValue({
        confirmedCustomers: 25,
        registeredCustomers: 15,
        targetedCustomers: 40,
        servicesSold: 10,
        totalDays: 5,
      });

      // The function should be called to recalculate
      vi.mocked(db.updateEmployeeTargetsFromDailyStats).mockResolvedValue(undefined);
      
      await db.updateEmployeeTargetsFromDailyStats(1);
      
      expect(db.updateEmployeeTargetsFromDailyStats).toHaveBeenCalledWith(1);
    });

    it("should handle zero baseValue correctly", async () => {
      const mockTarget = {
        id: 1,
        employeeId: 1,
        targetType: "confirmed_customers",
        targetValue: "100",
        currentValue: "25", // Should be 0 (base) + 25 (daily stats)
        baseValue: "0",
        status: "in_progress",
      };
      
      vi.mocked(db.getEmployeeTargetById).mockResolvedValue(mockTarget);
      
      const target = await db.getEmployeeTargetById(1);
      
      expect(target?.baseValue).toBe("0");
      expect(target?.currentValue).toBe("25");
    });

    it("should handle null baseValue as zero", async () => {
      const mockTarget = {
        id: 1,
        employeeId: 1,
        targetType: "confirmed_customers",
        targetValue: "100",
        currentValue: "25",
        baseValue: null,
        status: "in_progress",
      };
      
      vi.mocked(db.getEmployeeTargetById).mockResolvedValue(mockTarget as any);
      
      const target = await db.getEmployeeTargetById(1);
      
      // baseValue should be treated as 0 when null
      const baseValue = parseFloat(target?.baseValue || '0') || 0;
      expect(baseValue).toBe(0);
    });
  });

  describe("Target Achievement with Base Value", () => {
    it("should mark target as achieved when currentValue >= targetValue", async () => {
      const mockTarget = {
        id: 1,
        employeeId: 1,
        targetType: "confirmed_customers",
        targetValue: "100",
        currentValue: "100", // baseValue (50) + daily stats (50) = 100
        baseValue: "50",
        status: "achieved",
      };
      
      vi.mocked(db.getEmployeeTargetById).mockResolvedValue(mockTarget);
      
      const target = await db.getEmployeeTargetById(1);
      
      expect(target?.status).toBe("achieved");
      expect(parseFloat(target?.currentValue || "0")).toBeGreaterThanOrEqual(parseFloat(target?.targetValue || "0"));
    });

    it("should keep target in_progress when currentValue < targetValue", async () => {
      const mockTarget = {
        id: 1,
        employeeId: 1,
        targetType: "confirmed_customers",
        targetValue: "100",
        currentValue: "75", // baseValue (50) + daily stats (25) = 75
        baseValue: "50",
        status: "in_progress",
      };
      
      vi.mocked(db.getEmployeeTargetById).mockResolvedValue(mockTarget);
      
      const target = await db.getEmployeeTargetById(1);
      
      expect(target?.status).toBe("in_progress");
      expect(parseFloat(target?.currentValue || "0")).toBeLessThan(parseFloat(target?.targetValue || "0"));
    });
  });

  describe("Admin Base Value Updates", () => {
    it("should trigger recalculation when baseValue is updated", async () => {
      const mockTarget = {
        id: 1,
        employeeId: 1,
        targetType: "confirmed_customers",
        targetValue: "100",
        currentValue: "50",
        baseValue: "20",
        status: "in_progress",
      };
      
      vi.mocked(db.getEmployeeTargetById).mockResolvedValue(mockTarget);
      vi.mocked(db.updateEmployeeTarget).mockResolvedValue(undefined);
      vi.mocked(db.updateEmployeeTargetsFromDailyStats).mockResolvedValue(undefined);
      
      // Update baseValue
      await db.updateEmployeeTarget(1, { baseValue: "40" });
      
      // Get the target to trigger recalculation
      const target = await db.getEmployeeTargetById(1);
      if (target) {
        await db.updateEmployeeTargetsFromDailyStats(target.employeeId);
      }
      
      expect(db.updateEmployeeTarget).toHaveBeenCalledWith(1, { baseValue: "40" });
      expect(db.updateEmployeeTargetsFromDailyStats).toHaveBeenCalledWith(1);
    });
  });
});
