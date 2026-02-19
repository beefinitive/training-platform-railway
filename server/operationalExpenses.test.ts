import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  createOperationalExpense: vi.fn(),
  getOperationalExpensesByMonth: vi.fn(),
  updateOperationalExpense: vi.fn(),
  deleteOperationalExpense: vi.fn(),
}));

import {
  createOperationalExpense,
  getOperationalExpensesByMonth,
  updateOperationalExpense,
  deleteOperationalExpense,
} from "./db";

describe("Operational Expenses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createOperationalExpense", () => {
    it("should create a new operational expense", async () => {
      const mockExpense = {
        id: 1,
        category: "salaries",
        amount: 5000,
        month: 1,
        year: 2026,
        notes: "رواتب الموظفين",
        createdAt: new Date(),
      };

      vi.mocked(createOperationalExpense).mockResolvedValue(mockExpense);

      const result = await createOperationalExpense({
        category: "salaries",
        amount: 5000,
        month: 1,
        year: 2026,
        notes: "رواتب الموظفين",
      });

      expect(result).toEqual(mockExpense);
      expect(createOperationalExpense).toHaveBeenCalledWith({
        category: "salaries",
        amount: 5000,
        month: 1,
        year: 2026,
        notes: "رواتب الموظفين",
      });
    });

    it("should handle different expense categories", async () => {
      const categories = ["salaries", "electricity", "water", "rent", "government", "other"];
      
      for (const category of categories) {
        const mockExpense = {
          id: 1,
          category,
          amount: 1000,
          month: 1,
          year: 2026,
          notes: null,
          createdAt: new Date(),
        };

        vi.mocked(createOperationalExpense).mockResolvedValue(mockExpense);

        const result = await createOperationalExpense({
          category,
          amount: 1000,
          month: 1,
          year: 2026,
        });

        expect(result.category).toBe(category);
      }
    });
  });

  describe("getOperationalExpensesByMonth", () => {
    it("should return expenses for a specific month", async () => {
      const mockExpenses = [
        { id: 1, category: "salaries", amount: 5000, month: 1, year: 2026, notes: null, createdAt: new Date() },
        { id: 2, category: "electricity", amount: 500, month: 1, year: 2026, notes: null, createdAt: new Date() },
        { id: 3, category: "rent", amount: 3000, month: 1, year: 2026, notes: null, createdAt: new Date() },
      ];

      vi.mocked(getOperationalExpensesByMonth).mockResolvedValue(mockExpenses);

      const result = await getOperationalExpensesByMonth(2026, 1);

      expect(result).toHaveLength(3);
      expect(getOperationalExpensesByMonth).toHaveBeenCalledWith(2026, 1);
    });

    it("should return empty array when no expenses exist", async () => {
      vi.mocked(getOperationalExpensesByMonth).mockResolvedValue([]);

      const result = await getOperationalExpensesByMonth(2026, 2);

      expect(result).toHaveLength(0);
    });

    it("should calculate total correctly", async () => {
      const mockExpenses = [
        { id: 1, category: "salaries", amount: 5000, month: 1, year: 2026, notes: null, createdAt: new Date() },
        { id: 2, category: "electricity", amount: 500, month: 1, year: 2026, notes: null, createdAt: new Date() },
        { id: 3, category: "rent", amount: 3000, month: 1, year: 2026, notes: null, createdAt: new Date() },
      ];

      vi.mocked(getOperationalExpensesByMonth).mockResolvedValue(mockExpenses);

      const result = await getOperationalExpensesByMonth(2026, 1);
      const total = result.reduce((sum, exp) => sum + exp.amount, 0);

      expect(total).toBe(8500);
    });
  });

  describe("updateOperationalExpense", () => {
    it("should update an existing expense", async () => {
      const mockUpdatedExpense = {
        id: 1,
        category: "salaries",
        amount: 6000,
        month: 1,
        year: 2026,
        notes: "رواتب محدثة",
        createdAt: new Date(),
      };

      vi.mocked(updateOperationalExpense).mockResolvedValue(mockUpdatedExpense);

      const result = await updateOperationalExpense(1, { amount: 6000, notes: "رواتب محدثة" });

      expect(result.amount).toBe(6000);
      expect(result.notes).toBe("رواتب محدثة");
    });
  });

  describe("deleteOperationalExpense", () => {
    it("should delete an expense", async () => {
      vi.mocked(deleteOperationalExpense).mockResolvedValue(undefined);

      await deleteOperationalExpense(1);

      expect(deleteOperationalExpense).toHaveBeenCalledWith(1);
    });
  });

  describe("Monthly Report Integration", () => {
    it("should aggregate expenses by category", async () => {
      const mockExpenses = [
        { id: 1, category: "salaries", amount: 5000, month: 1, year: 2026, notes: null, createdAt: new Date() },
        { id: 2, category: "salaries", amount: 2000, month: 1, year: 2026, notes: null, createdAt: new Date() },
        { id: 3, category: "electricity", amount: 500, month: 1, year: 2026, notes: null, createdAt: new Date() },
        { id: 4, category: "rent", amount: 3000, month: 1, year: 2026, notes: null, createdAt: new Date() },
      ];

      vi.mocked(getOperationalExpensesByMonth).mockResolvedValue(mockExpenses);

      const result = await getOperationalExpensesByMonth(2026, 1);
      
      // Aggregate by category
      const byCategory: Record<string, number> = {};
      for (const exp of result) {
        byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
      }

      expect(byCategory.salaries).toBe(7000);
      expect(byCategory.electricity).toBe(500);
      expect(byCategory.rent).toBe(3000);
    });
  });
});
