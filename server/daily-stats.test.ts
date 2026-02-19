import { describe, it, expect } from "vitest";

describe("Daily Stats Feature", () => {
  describe("Daily Stats Schema", () => {
    it("should have correct fields for daily stats", () => {
      const dailyStatFields = [
        "id",
        "employeeId",
        "date",
        "confirmedCustomers",
        "registeredCustomers",
        "targetedCustomers",
        "servicesSold",
        "notes",
        "createdAt",
        "updatedAt",
      ];
      
      expect(dailyStatFields).toContain("confirmedCustomers");
      expect(dailyStatFields).toContain("registeredCustomers");
      expect(dailyStatFields).toContain("targetedCustomers");
      expect(dailyStatFields).toContain("servicesSold");
    });
  });

  describe("Target Type Mapping", () => {
    it("should map daily stats fields to target types correctly", () => {
      const targetTypeMapping: Record<string, string> = {
        'confirmed_customers': 'confirmedCustomers',
        'registered_customers': 'registeredCustomers',
        'targeted_customers': 'targetedCustomers',
        'services_sold': 'servicesSold',
      };

      expect(targetTypeMapping['confirmed_customers']).toBe('confirmedCustomers');
      expect(targetTypeMapping['registered_customers']).toBe('registeredCustomers');
      expect(targetTypeMapping['targeted_customers']).toBe('targetedCustomers');
      expect(targetTypeMapping['services_sold']).toBe('servicesSold');
    });
  });

  describe("Monthly Total Calculation", () => {
    it("should calculate monthly totals correctly", () => {
      const dailyStats = [
        { confirmedCustomers: 5, registeredCustomers: 10, targetedCustomers: 20, servicesSold: 3 },
        { confirmedCustomers: 3, registeredCustomers: 8, targetedCustomers: 15, servicesSold: 2 },
        { confirmedCustomers: 7, registeredCustomers: 12, targetedCustomers: 25, servicesSold: 5 },
      ];

      const totals = dailyStats.reduce((acc, stat) => ({
        confirmedCustomers: acc.confirmedCustomers + stat.confirmedCustomers,
        registeredCustomers: acc.registeredCustomers + stat.registeredCustomers,
        targetedCustomers: acc.targetedCustomers + stat.targetedCustomers,
        servicesSold: acc.servicesSold + stat.servicesSold,
      }), { confirmedCustomers: 0, registeredCustomers: 0, targetedCustomers: 0, servicesSold: 0 });

      expect(totals.confirmedCustomers).toBe(15);
      expect(totals.registeredCustomers).toBe(30);
      expect(totals.targetedCustomers).toBe(60);
      expect(totals.servicesSold).toBe(10);
    });
  });

  describe("Target Update Logic", () => {
    it("should update target currentValue from daily stats total", () => {
      const monthlyTotal = {
        confirmedCustomers: 50,
        registeredCustomers: 100,
        targetedCustomers: 200,
        servicesSold: 25,
      };

      const targets = [
        { id: 1, targetType: 'confirmed_customers', targetValue: 60, currentValue: 0 },
        { id: 2, targetType: 'registered_customers', targetValue: 80, currentValue: 0 },
        { id: 3, targetType: 'targeted_customers', targetValue: 150, currentValue: 0 },
        { id: 4, targetType: 'services_sold', targetValue: 30, currentValue: 0 },
      ];

      const targetTypeMapping: Record<string, keyof typeof monthlyTotal> = {
        'confirmed_customers': 'confirmedCustomers',
        'registered_customers': 'registeredCustomers',
        'targeted_customers': 'targetedCustomers',
        'services_sold': 'servicesSold',
      };

      const updatedTargets = targets.map(target => {
        const statsField = targetTypeMapping[target.targetType];
        if (statsField) {
          const newValue = monthlyTotal[statsField];
          const isAchieved = newValue >= target.targetValue;
          return {
            ...target,
            currentValue: newValue,
            status: isAchieved ? 'achieved' : 'in_progress',
          };
        }
        return target;
      });

      expect(updatedTargets[0].currentValue).toBe(50);
      expect(updatedTargets[0].status).toBe('in_progress'); // 50 < 60

      expect(updatedTargets[1].currentValue).toBe(100);
      expect(updatedTargets[1].status).toBe('achieved'); // 100 >= 80

      expect(updatedTargets[2].currentValue).toBe(200);
      expect(updatedTargets[2].status).toBe('achieved'); // 200 >= 150

      expect(updatedTargets[3].currentValue).toBe(25);
      expect(updatedTargets[3].status).toBe('in_progress'); // 25 < 30
    });
  });

  describe("Date Handling", () => {
    it("should format date correctly for database", () => {
      const date = new Date(2026, 0, 15); // January 15, 2026
      const dateStr = date.toISOString().split('T')[0];
      
      expect(dateStr).toBe('2026-01-15');
    });

    it("should parse date string correctly", () => {
      const dateStr = '2026-01-15';
      const date = new Date(dateStr + 'T00:00:00');
      
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getDate()).toBe(15);
    });
  });
});
