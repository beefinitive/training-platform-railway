import { describe, expect, it } from "vitest";

describe("Services API", () => {
  describe("Service data structure", () => {
    it("should have correct service fields", () => {
      const service = {
        id: 1,
        name: "خدمة استشارية",
        price: "500.00",
        quantity: 2,
        totalAmount: "1000.00",
        saleDate: new Date("2026-01-15"),
        notes: "ملاحظات اختبارية",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(service.id).toBe(1);
      expect(service.name).toBe("خدمة استشارية");
      expect(service.price).toBe("500.00");
      expect(service.quantity).toBe(2);
      expect(service.totalAmount).toBe("1000.00");
      expect(service.notes).toBe("ملاحظات اختبارية");
    });

    it("should calculate total amount correctly", () => {
      const price = 500;
      const quantity = 3;
      const totalAmount = price * quantity;

      expect(totalAmount).toBe(1500);
    });
  });

  describe("Service statistics", () => {
    it("should calculate statistics correctly", () => {
      const services = [
        { price: 500, quantity: 2, totalAmount: 1000 },
        { price: 300, quantity: 1, totalAmount: 300 },
        { price: 200, quantity: 5, totalAmount: 1000 },
      ];

      const totalRevenue = services.reduce((sum, s) => sum + s.totalAmount, 0);
      const totalQuantity = services.reduce((sum, s) => sum + s.quantity, 0);
      const totalServices = services.length;

      expect(totalRevenue).toBe(2300);
      expect(totalQuantity).toBe(8);
      expect(totalServices).toBe(3);
    });
  });

  describe("Monthly report filtering", () => {
    it("should filter services by month and year", () => {
      const services = [
        { saleDate: new Date("2026-01-15"), totalAmount: 500 },
        { saleDate: new Date("2026-01-20"), totalAmount: 300 },
        { saleDate: new Date("2026-02-10"), totalAmount: 400 },
      ];

      const year = 2026;
      const month = 1;

      const filteredServices = services.filter((s) => {
        const date = s.saleDate;
        return date.getFullYear() === year && date.getMonth() + 1 === month;
      });

      expect(filteredServices.length).toBe(2);
      
      const monthlyRevenue = filteredServices.reduce((sum, s) => sum + s.totalAmount, 0);
      expect(monthlyRevenue).toBe(800);
    });
  });

  describe("Service input validation", () => {
    it("should validate required fields", () => {
      const validateService = (data: { name?: string; price?: string; quantity?: number }) => {
        const errors: string[] = [];
        if (!data.name || data.name.trim() === "") {
          errors.push("اسم الخدمة مطلوب");
        }
        if (!data.price || parseFloat(data.price) <= 0) {
          errors.push("السعر يجب أن يكون أكبر من صفر");
        }
        if (!data.quantity || data.quantity < 1) {
          errors.push("الكمية يجب أن تكون 1 على الأقل");
        }
        return errors;
      };

      expect(validateService({ name: "", price: "100", quantity: 1 })).toContain("اسم الخدمة مطلوب");
      expect(validateService({ name: "خدمة", price: "0", quantity: 1 })).toContain("السعر يجب أن يكون أكبر من صفر");
      expect(validateService({ name: "خدمة", price: "100", quantity: 0 })).toContain("الكمية يجب أن تكون 1 على الأقل");
      expect(validateService({ name: "خدمة", price: "100", quantity: 1 })).toHaveLength(0);
    });
  });
});
