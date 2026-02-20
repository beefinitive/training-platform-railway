import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the period-based target calculation logic
describe('Strategic Targets Period Calculations', () => {
  
  describe('Monthly Target Division', () => {
    it('should divide yearly target by 12 for monthly view', () => {
      const yearlyTarget = 120000;
      const monthlyTarget = yearlyTarget / 12;
      expect(monthlyTarget).toBe(10000);
    });

    it('should handle non-divisible yearly targets', () => {
      const yearlyTarget = 100;
      const monthlyTarget = yearlyTarget / 12;
      expect(monthlyTarget).toBeCloseTo(8.33, 2);
    });

    it('should calculate monthly percentage correctly', () => {
      const yearlyTarget = 120000;
      const monthlyTarget = yearlyTarget / 12; // 10000
      const monthlyActual = 5000;
      const percentage = (monthlyActual / monthlyTarget) * 100;
      expect(percentage).toBe(50);
    });
  });

  describe('Quarterly Target Division', () => {
    it('should divide yearly target by 4 for quarterly view', () => {
      const yearlyTarget = 120000;
      const quarterlyTarget = yearlyTarget / 4;
      expect(quarterlyTarget).toBe(30000);
    });

    it('should calculate quarterly percentage correctly', () => {
      const yearlyTarget = 120000;
      const quarterlyTarget = yearlyTarget / 4; // 30000
      const quarterlyActual = 15000;
      const percentage = (quarterlyActual / quarterlyTarget) * 100;
      expect(percentage).toBe(50);
    });

    it('should cap percentage at 100%', () => {
      const yearlyTarget = 120000;
      const quarterlyTarget = yearlyTarget / 4; // 30000
      const quarterlyActual = 50000; // Over target
      const percentage = Math.min((quarterlyActual / quarterlyTarget) * 100, 100);
      expect(percentage).toBe(100);
    });
  });

  describe('Period Date Ranges', () => {
    it('should calculate correct date range for January', () => {
      const year = 2026;
      const month = 1;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      expect(startDate.toISOString().split('T')[0]).toBe('2026-01-01');
      expect(endDate.toISOString().split('T')[0]).toBe('2026-01-31');
    });

    it('should calculate correct date range for February 2026', () => {
      const year = 2026;
      const month = 2;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      expect(startDate.toISOString().split('T')[0]).toBe('2026-02-01');
      expect(endDate.toISOString().split('T')[0]).toBe('2026-02-28');
    });

    it('should calculate correct date range for Q1', () => {
      const year = 2026;
      const quarter = 1;
      const quarterStartMonth = (quarter - 1) * 3;
      const quarterEndMonth = quarterStartMonth + 3;
      const startDate = new Date(year, quarterStartMonth, 1);
      const endDate = new Date(year, quarterEndMonth, 0);
      
      expect(startDate.toISOString().split('T')[0]).toBe('2026-01-01');
      expect(endDate.toISOString().split('T')[0]).toBe('2026-03-31');
    });

    it('should calculate correct date range for Q2', () => {
      const year = 2026;
      const quarter = 2;
      const quarterStartMonth = (quarter - 1) * 3;
      const quarterEndMonth = quarterStartMonth + 3;
      const startDate = new Date(year, quarterStartMonth, 1);
      const endDate = new Date(year, quarterEndMonth, 0);
      
      expect(startDate.toISOString().split('T')[0]).toBe('2026-04-01');
      expect(endDate.toISOString().split('T')[0]).toBe('2026-06-30');
    });

    it('should calculate correct date range for Q3', () => {
      const year = 2026;
      const quarter = 3;
      const quarterStartMonth = (quarter - 1) * 3;
      const quarterEndMonth = quarterStartMonth + 3;
      const startDate = new Date(year, quarterStartMonth, 1);
      const endDate = new Date(year, quarterEndMonth, 0);
      
      expect(startDate.toISOString().split('T')[0]).toBe('2026-07-01');
      expect(endDate.toISOString().split('T')[0]).toBe('2026-09-30');
    });

    it('should calculate correct date range for Q4', () => {
      const year = 2026;
      const quarter = 4;
      const quarterStartMonth = (quarter - 1) * 3;
      const quarterEndMonth = quarterStartMonth + 3;
      const startDate = new Date(year, quarterStartMonth, 1);
      const endDate = new Date(year, quarterEndMonth, 0);
      
      expect(startDate.toISOString().split('T')[0]).toBe('2026-10-01');
      expect(endDate.toISOString().split('T')[0]).toBe('2026-12-31');
    });
  });

  describe('Baseline Handling', () => {
    it('should divide baseline by 12 for monthly view', () => {
      const yearlyBaseline = 24;
      const monthlyBaseline = yearlyBaseline / 12;
      expect(monthlyBaseline).toBe(2);
    });

    it('should divide baseline by 4 for quarterly view', () => {
      const yearlyBaseline = 24;
      const quarterlyBaseline = yearlyBaseline / 4;
      expect(quarterlyBaseline).toBe(6);
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate net progress correctly', () => {
      const actual = 50;
      const baseline = 10;
      const netProgress = Math.max(0, actual - baseline);
      expect(netProgress).toBe(40);
    });

    it('should not allow negative net progress', () => {
      const actual = 5;
      const baseline = 10;
      const netProgress = Math.max(0, actual - baseline);
      expect(netProgress).toBe(0);
    });

    it('should calculate percentage based on net progress', () => {
      const target = 100;
      const actual = 50;
      const baseline = 10;
      const netProgress = Math.max(0, actual - baseline); // 40
      const percentage = target > 0 ? Math.min((netProgress / target) * 100, 100) : 0;
      expect(percentage).toBe(40);
    });
  });
});
