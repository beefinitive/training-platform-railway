import { describe, it, expect, vi } from 'vitest';

// Test the target type mapping logic
describe('Employee Targets Auto-Calculation', () => {
  const targetTypeMapping: Record<string, string> = {
    'confirmed_customers': 'confirmedCustomers',
    'registered_customers': 'registeredCustomers',
    'targeted_customers': 'targetedCustomers',
    'services_sold': 'servicesSold',
    'sales_amount': 'totalRevenue',
    'daily_calls': 'targetedCustomers',
  };

  it('should map confirmed_customers target type to confirmedCustomers stat field', () => {
    expect(targetTypeMapping['confirmed_customers']).toBe('confirmedCustomers');
  });

  it('should map registered_customers target type to registeredCustomers stat field', () => {
    expect(targetTypeMapping['registered_customers']).toBe('registeredCustomers');
  });

  it('should map targeted_customers target type to targetedCustomers stat field', () => {
    expect(targetTypeMapping['targeted_customers']).toBe('targetedCustomers');
  });

  it('should map services_sold target type to servicesSold stat field', () => {
    expect(targetTypeMapping['services_sold']).toBe('servicesSold');
  });

  it('should map sales_amount target type to totalRevenue stat field', () => {
    expect(targetTypeMapping['sales_amount']).toBe('totalRevenue');
  });

  it('should map daily_calls target type to targetedCustomers stat field', () => {
    expect(targetTypeMapping['daily_calls']).toBe('targetedCustomers');
  });

  // Test progress calculation logic
  describe('Progress Calculation', () => {
    function calculateProgress(baseValue: number, dailyStatsAchieved: number, targetValue: number) {
      const totalAchieved = baseValue + dailyStatsAchieved;
      const remaining = Math.max(0, targetValue - totalAchieved);
      const percentage = targetValue > 0 ? Math.min((totalAchieved / targetValue) * 100, 100) : 0;
      const isAchieved = totalAchieved >= targetValue && targetValue > 0;
      const newStatus = isAchieved ? 'achieved' : 'in_progress';
      
      return { totalAchieved, remaining, percentage, isAchieved, newStatus };
    }

    it('should calculate correct progress for Ghada scenario (18/30)', () => {
      const result = calculateProgress(0, 18, 30);
      expect(result.totalAchieved).toBe(18);
      expect(result.remaining).toBe(12);
      expect(result.percentage).toBe(60);
      expect(result.isAchieved).toBe(false);
      expect(result.newStatus).toBe('in_progress');
    });

    it('should mark as achieved when target is met', () => {
      const result = calculateProgress(0, 30, 30);
      expect(result.totalAchieved).toBe(30);
      expect(result.remaining).toBe(0);
      expect(result.isAchieved).toBe(true);
      expect(result.newStatus).toBe('achieved');
    });

    it('should include baseValue in total achieved', () => {
      const result = calculateProgress(5, 18, 30);
      expect(result.totalAchieved).toBe(23);
      expect(result.remaining).toBe(7);
    });

    it('should cap percentage at 100 when over-achieved', () => {
      const result = calculateProgress(0, 35, 30);
      expect(result.totalAchieved).toBe(35);
      expect(result.remaining).toBe(0);
      expect(result.percentage).toBe(100);
      expect(result.isAchieved).toBe(true);
    });

    it('should handle zero target value', () => {
      const result = calculateProgress(0, 5, 0);
      expect(result.percentage).toBe(0);
      expect(result.isAchieved).toBe(false);
    });

    it('should handle all zeros', () => {
      const result = calculateProgress(0, 0, 0);
      expect(result.totalAchieved).toBe(0);
      expect(result.remaining).toBe(0);
      expect(result.percentage).toBe(0);
    });
  });
});
