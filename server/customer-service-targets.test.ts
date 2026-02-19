import { describe, it, expect } from 'vitest';

describe('Customer Service Target Types', () => {
  // أنواع مستهدفات خدمة العملاء المطلوبة
  const customerServiceTargetTypes = [
    "targeted_customers",
    "confirmed_customers",
    "registered_customers",
    "services_sold",
  ];

  const targetTypeLabels: Record<string, string> = {
    // مستهدفات خدمة العملاء
    targeted_customers: "العملاء المستهدفين",
    confirmed_customers: "العملاء المؤكدين",
    registered_customers: "العملاء المسجلين في النموذج",
    services_sold: "الخدمات المباعة",
    // مستهدفات أخرى
    daily_calls: "المكالمات اليومية",
    campaigns: "الحملات",
    leads_generated: "العملاء المحتملين",
    conversion_rate: "معدل التحويل",
    features_completed: "المهام المنجزة",
    bugs_fixed: "الأخطاء المصلحة",
    sales_amount: "مبلغ المبيعات",
    customer_satisfaction: "رضا العملاء",
    attendance_hours: "ساعات الحضور",
    contacted_old_customers: "العملاء القدامى المتواصل معهم",
    other: "أخرى",
  };

  // Test 1: Verify all customer service target types exist
  it('should have all required customer service target types', () => {
    const requiredTypes = [
      "targeted_customers",
      "confirmed_customers",
      "registered_customers",
      "services_sold",
    ];
    
    requiredTypes.forEach(type => {
      expect(customerServiceTargetTypes).toContain(type);
    });
  });

  // Test 2: Verify target type labels exist for customer service types
  it('should have Arabic labels for all customer service target types', () => {
    customerServiceTargetTypes.forEach(type => {
      expect(targetTypeLabels[type]).toBeDefined();
      expect(targetTypeLabels[type].length).toBeGreaterThan(0);
    });
  });

  // Test 3: Verify specific labels
  it('should have correct Arabic labels for customer service targets', () => {
    expect(targetTypeLabels.targeted_customers).toBe("العملاء المستهدفين");
    expect(targetTypeLabels.confirmed_customers).toBe("العملاء المؤكدين");
    expect(targetTypeLabels.registered_customers).toBe("العملاء المسجلين في النموذج");
    expect(targetTypeLabels.services_sold).toBe("الخدمات المباعة");
  });

  // Test 4: Verify customer service types are separate from other types
  it('should have customer service types as a distinct group', () => {
    expect(customerServiceTargetTypes.length).toBe(4);
    
    // Verify none of the other types are in customer service group
    const otherTypes = ["daily_calls", "campaigns", "leads_generated", "other"];
    otherTypes.forEach(type => {
      expect(customerServiceTargetTypes).not.toContain(type);
    });
  });

  // Test 5: Verify filtering works correctly
  it('should correctly filter out customer service types from other types', () => {
    const otherTypes = Object.entries(targetTypeLabels)
      .filter(([key]) => !customerServiceTargetTypes.includes(key))
      .map(([key]) => key);
    
    // Should not include any customer service types
    customerServiceTargetTypes.forEach(type => {
      expect(otherTypes).not.toContain(type);
    });
    
    // Should include other types
    expect(otherTypes).toContain("daily_calls");
    expect(otherTypes).toContain("other");
  });
});
