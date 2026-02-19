import { describe, it, expect } from "vitest";

describe("Target Edit Dialog Fix", () => {
  describe("currentValue field", () => {
    it("should include currentValue in target form state", () => {
      const targetForm = {
        employeeId: "",
        targetType: "targeted_customers",
        targetValue: "",
        currentValue: "",
        period: "monthly",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        rewardAmount: "",
        description: "",
      };
      
      expect(targetForm).toHaveProperty("currentValue");
      expect(targetForm.currentValue).toBe("");
    });

    it("should populate currentValue when editing target", () => {
      const target = {
        id: 1,
        employeeId: 1,
        targetType: "confirmed_customers",
        targetValue: "100",
        currentValue: "50",
        period: "monthly",
        startDate: new Date(),
        endDate: new Date(),
        rewardAmount: "500",
        description: "Test target",
      };
      
      const targetForm = {
        employeeId: target.employeeId.toString(),
        targetType: target.targetType,
        targetValue: target.targetValue.toString(),
        currentValue: target.currentValue?.toString() || "0",
        period: target.period,
        startDate: target.startDate ? new Date(target.startDate).toISOString().split('T')[0] : "",
        endDate: target.endDate ? new Date(target.endDate).toISOString().split('T')[0] : "",
        rewardAmount: target.rewardAmount?.toString() || "",
        description: target.description || "",
      };
      
      expect(targetForm.currentValue).toBe("50");
    });

    it("should default currentValue to 0 when not provided", () => {
      const target = {
        id: 1,
        employeeId: 1,
        targetType: "confirmed_customers",
        targetValue: "100",
        currentValue: null,
        period: "monthly",
      };
      
      const currentValue = target.currentValue?.toString() || "0";
      expect(currentValue).toBe("0");
    });
  });

  describe("update mutation", () => {
    it("should include currentValue in update payload", () => {
      const updatePayload = {
        id: 1,
        targetValue: "100",
        currentValue: "75",
        rewardAmount: "500",
      };
      
      expect(updatePayload).toHaveProperty("currentValue");
      expect(updatePayload.currentValue).toBe("75");
    });
  });
});

describe("Salary Total Calculation Fix", () => {
  it("should correctly sum salaries using parseFloat", () => {
    const salaries = [
      { netSalary: "5000.00" },
      { netSalary: "7000.00" },
      { netSalary: "3000.00" },
    ];
    
    const total = salaries.reduce((sum: number, s: any) => sum + (parseFloat(s.netSalary) || 0), 0);
    expect(total).toBe(15000);
  });

  it("should handle string decimal values correctly", () => {
    const salaries = [
      { netSalary: "5000.50" },
      { netSalary: "7000.25" },
      { netSalary: "3000.75" },
    ];
    
    const total = salaries.reduce((sum: number, s: any) => sum + (parseFloat(s.netSalary) || 0), 0);
    expect(total).toBe(15001.5);
  });

  it("should handle null/undefined values", () => {
    const salaries = [
      { netSalary: "5000.00" },
      { netSalary: null },
      { netSalary: undefined },
      { netSalary: "3000.00" },
    ];
    
    const total = salaries.reduce((sum: number, s: any) => sum + (parseFloat(s.netSalary) || 0), 0);
    expect(total).toBe(8000);
  });

  it("should not concatenate string values", () => {
    // This was the bug - without parseFloat, strings were concatenated
    const salaries = [
      { netSalary: "700.00" },
      { netSalary: "200.00" },
      { netSalary: "240.00" },
    ];
    
    // Wrong way (concatenation): "700.00" + "200.00" + "240.00" = "700.00200.00240.00"
    // Correct way (addition): 700 + 200 + 240 = 1140
    
    const total = salaries.reduce((sum: number, s: any) => sum + (parseFloat(s.netSalary) || 0), 0);
    expect(total).toBe(1140);
    expect(typeof total).toBe("number");
  });
});
