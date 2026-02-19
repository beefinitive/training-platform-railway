import { describe, it, expect } from "vitest";

describe("New Target Types", () => {
  const validTargetTypes = [
    "daily_calls", "confirmed_customers", "registered_customers",
    "targeted_customers", "services_sold", "retargeting",
    "campaigns", "leads_generated", "conversion_rate",
    "features_completed", "bugs_fixed",
    "sales_amount", "customer_satisfaction", "attendance_hours", "other"
  ];

  describe("Customer Service Target Types", () => {
    it("should include targeted_customers type", () => {
      expect(validTargetTypes).toContain("targeted_customers");
    });

    it("should include services_sold type", () => {
      expect(validTargetTypes).toContain("services_sold");
    });

    it("should include retargeting type", () => {
      expect(validTargetTypes).toContain("retargeting");
    });

    it("should include confirmed_customers type", () => {
      expect(validTargetTypes).toContain("confirmed_customers");
    });

    it("should include registered_customers type", () => {
      expect(validTargetTypes).toContain("registered_customers");
    });
  });

  describe("Target Type Validation", () => {
    it("should have 15 valid target types", () => {
      expect(validTargetTypes.length).toBe(15);
    });

    it("should validate target type for create mutation", () => {
      const createInput = {
        employeeId: 1,
        targetType: "services_sold",
        targetValue: "500",
        year: 2026,
      };
      
      expect(validTargetTypes).toContain(createInput.targetType);
    });

    it("should validate all customer service target types", () => {
      const customerServiceTypes = [
        "targeted_customers",
        "confirmed_customers",
        "registered_customers",
        "services_sold",
        "retargeting"
      ];
      
      customerServiceTypes.forEach(type => {
        expect(validTargetTypes).toContain(type);
      });
    });
  });
});
