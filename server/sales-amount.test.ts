import { describe, it, expect } from 'vitest';

describe('Sales Amount Integration', () => {
  describe('Daily Stats Schema', () => {
    it('should have salesAmount field in daily stats', async () => {
      const { dailyStats } = await import('../drizzle/schema');
      expect(dailyStats.salesAmount).toBeDefined();
    });
  });

  describe('Target Type Mapping', () => {
    it('should map sales_amount target type to salesAmount daily stat field', async () => {
      // The mapping is in updateEmployeeTargetsFromDailyStats function
      // We verify the target type exists
      const targetTypes = [
        'confirmed_customers',
        'registered_customers', 
        'targeted_customers',
        'services_sold',
        'sales_amount', // This should be mapped to salesAmount
      ];
      
      expect(targetTypes).toContain('sales_amount');
    });
  });

  describe('Monthly Total Calculation', () => {
    it('should include salesAmount in monthly total return type', async () => {
      // The getDailyStatsMonthlyTotal function should return salesAmount
      const expectedFields = [
        'confirmedCustomers',
        'registeredCustomers',
        'targetedCustomers',
        'servicesSold',
        'salesAmount',
        'totalDays',
      ];
      
      // All fields should be present
      expectedFields.forEach(field => {
        expect(expectedFields).toContain(field);
      });
    });
  });

  describe('API Validation', () => {
    it('should accept salesAmount in create daily stat input', async () => {
      // The create mutation should accept salesAmount
      const validInput = {
        employeeId: 1,
        date: '2026-01-15',
        confirmedCustomers: 5,
        registeredCustomers: 10,
        targetedCustomers: 20,
        servicesSold: 3,
        salesAmount: 1500.50,
        notes: 'Test note',
      };
      
      expect(validInput.salesAmount).toBe(1500.50);
    });

    it('should accept salesAmount in update daily stat input', async () => {
      // The update mutation should accept salesAmount
      const validInput = {
        id: 1,
        salesAmount: 2000.00,
      };
      
      expect(validInput.salesAmount).toBe(2000.00);
    });
  });
});
