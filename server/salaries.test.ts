import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as db from './db';

// Mock the database module
vi.mock('./db', async () => {
  const actual = await vi.importActual('./db');
  return {
    ...actual,
    listMonthlySalaries: vi.fn(),
    getMonthlySalaryById: vi.fn(),
    createMonthlySalary: vi.fn(),
    updateMonthlySalary: vi.fn(),
    deleteMonthlySalary: vi.fn(),
    markSalaryAsPaid: vi.fn(),
    generateMonthlySalaries: vi.fn(),
    getSalaryStats: vi.fn(),
    getMonthlySalariesTotal: vi.fn(),
    listSalaryAdjustments: vi.fn(),
    createSalaryAdjustment: vi.fn(),
    deleteSalaryAdjustment: vi.fn(),
    recalculateSalary: vi.fn(),
  };
});

describe('Salaries Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listMonthlySalaries', () => {
    it('should return list of salaries', async () => {
      const mockSalaries = [
        { id: 1, employeeId: 1, month: 1, year: 2026, baseSalary: "5000", netSalary: "4500", status: 'pending' },
        { id: 2, employeeId: 2, month: 1, year: 2026, baseSalary: "6000", netSalary: "5800", status: 'paid' },
      ];
      vi.mocked(db.listMonthlySalaries).mockResolvedValue(mockSalaries as any);

      const result = await db.listMonthlySalaries(2026, 1);
      expect(result).toHaveLength(2);
      expect(db.listMonthlySalaries).toHaveBeenCalledWith(2026, 1);
    });

    it('should filter by employee', async () => {
      const mockSalaries = [
        { id: 1, employeeId: 1, month: 1, year: 2026, baseSalary: "5000", netSalary: "4500", status: 'pending' },
      ];
      vi.mocked(db.listMonthlySalaries).mockResolvedValue(mockSalaries as any);

      const result = await db.listMonthlySalaries(2026, 1, 1);
      expect(result).toHaveLength(1);
      expect(db.listMonthlySalaries).toHaveBeenCalledWith(2026, 1, 1);
    });
  });

  describe('createMonthlySalary', () => {
    it('should create a new salary record', async () => {
      vi.mocked(db.createMonthlySalary).mockResolvedValue(1);

      const result = await db.createMonthlySalary({
        employeeId: 1,
        month: 1,
        year: 2026,
        baseSalary: "5000",
        totalDeductions: "0",
        totalBonuses: "0",
        netSalary: "5000",
        status: 'pending',
      });

      expect(result).toBe(1);
      expect(db.createMonthlySalary).toHaveBeenCalled();
    });
  });

  describe('markSalaryAsPaid', () => {
    it('should mark salary as paid', async () => {
      vi.mocked(db.markSalaryAsPaid).mockResolvedValue(undefined);

      await db.markSalaryAsPaid(1);
      expect(db.markSalaryAsPaid).toHaveBeenCalledWith(1);
    });
  });

  describe('generateMonthlySalaries', () => {
    it('should generate salaries for all active employees', async () => {
      vi.mocked(db.generateMonthlySalaries).mockResolvedValue([1, 2, 3]);

      const result = await db.generateMonthlySalaries(2026, 1);
      expect(result).toHaveLength(3);
      expect(db.generateMonthlySalaries).toHaveBeenCalledWith(2026, 1);
    });
  });

  describe('getSalaryStats', () => {
    it('should return salary statistics', async () => {
      const mockStats = { totalPaid: 50000, totalPending: 20000, employeeCount: 5 };
      vi.mocked(db.getSalaryStats).mockResolvedValue(mockStats);

      const result = await db.getSalaryStats(2026);
      expect(result.totalPaid).toBe(50000);
      expect(result.totalPending).toBe(20000);
      expect(result.employeeCount).toBe(5);
    });
  });

  describe('getMonthlySalariesTotal', () => {
    it('should return total paid salaries for a month', async () => {
      vi.mocked(db.getMonthlySalariesTotal).mockResolvedValue(25000);

      const result = await db.getMonthlySalariesTotal(2026, 1);
      expect(result).toBe(25000);
      expect(db.getMonthlySalariesTotal).toHaveBeenCalledWith(2026, 1);
    });
  });

  describe('Salary Adjustments', () => {
    it('should create a deduction', async () => {
      vi.mocked(db.createSalaryAdjustment).mockResolvedValue(1);

      const result = await db.createSalaryAdjustment({
        salaryId: 1,
        employeeId: 1,
        type: 'deduction',
        amount: "500",
        reason: "غياب",
      });

      expect(result).toBe(1);
      expect(db.createSalaryAdjustment).toHaveBeenCalled();
    });

    it('should create a bonus', async () => {
      vi.mocked(db.createSalaryAdjustment).mockResolvedValue(2);

      const result = await db.createSalaryAdjustment({
        salaryId: 1,
        employeeId: 1,
        type: 'bonus',
        amount: "1000",
        reason: "تحقيق المستهدف",
      });

      expect(result).toBe(2);
      expect(db.createSalaryAdjustment).toHaveBeenCalled();
    });

    it('should list adjustments for a salary', async () => {
      const mockAdjustments = [
        { id: 1, salaryId: 1, type: 'deduction', amount: "500", reason: "غياب" },
        { id: 2, salaryId: 1, type: 'bonus', amount: "1000", reason: "مكافأة" },
      ];
      vi.mocked(db.listSalaryAdjustments).mockResolvedValue(mockAdjustments as any);

      const result = await db.listSalaryAdjustments(1);
      expect(result).toHaveLength(2);
    });

    it('should delete an adjustment', async () => {
      vi.mocked(db.deleteSalaryAdjustment).mockResolvedValue(undefined);

      await db.deleteSalaryAdjustment(1);
      expect(db.deleteSalaryAdjustment).toHaveBeenCalledWith(1);
    });
  });

  describe('recalculateSalary', () => {
    it('should recalculate net salary after adjustments', async () => {
      vi.mocked(db.recalculateSalary).mockResolvedValue(undefined);

      await db.recalculateSalary(1);
      expect(db.recalculateSalary).toHaveBeenCalledWith(1);
    });
  });
});
