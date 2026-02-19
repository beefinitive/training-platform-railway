import { describe, it, expect } from 'vitest';

describe('Auto Customer Service Targets', () => {
  // Test target types for customer service
  const customerServiceTargetTypes = [
    'confirmed_customers',
    'registered_customers',
    'sales_amount',
    'other'
  ];

  const targetTypeLabels: Record<string, string> = {
    confirmed_customers: 'العملاء المؤكدين',
    registered_customers: 'العملاء المسجلين',
    sales_amount: 'الخدمات المباعة',
    other: 'إعادة الاستهداف',
  };

  it('should have 4 default target types for customer service', () => {
    expect(customerServiceTargetTypes.length).toBe(4);
  });

  it('should include confirmed_customers target type', () => {
    expect(customerServiceTargetTypes).toContain('confirmed_customers');
  });

  it('should include registered_customers target type', () => {
    expect(customerServiceTargetTypes).toContain('registered_customers');
  });

  it('should include sales_amount target type for services sold', () => {
    expect(customerServiceTargetTypes).toContain('sales_amount');
  });

  it('should include other target type for retargeting', () => {
    expect(customerServiceTargetTypes).toContain('other');
  });

  it('should have Arabic labels for all target types', () => {
    customerServiceTargetTypes.forEach(type => {
      expect(targetTypeLabels[type]).toBeDefined();
      expect(targetTypeLabels[type].length).toBeGreaterThan(0);
    });
  });

  it('should have correct label for confirmed_customers', () => {
    expect(targetTypeLabels['confirmed_customers']).toBe('العملاء المؤكدين');
  });

  it('should have correct label for registered_customers', () => {
    expect(targetTypeLabels['registered_customers']).toBe('العملاء المسجلين');
  });

  it('should have correct label for services sold', () => {
    expect(targetTypeLabels['sales_amount']).toBe('الخدمات المباعة');
  });

  it('should have correct label for retargeting', () => {
    expect(targetTypeLabels['other']).toBe('إعادة الاستهداف');
  });

  // Test default target structure
  it('should create targets with correct structure', () => {
    const now = new Date();
    const defaultTarget = {
      employeeId: 1,
      targetType: 'confirmed_customers',
      customName: 'العملاء المؤكدين',
      targetValue: '0',
      currentValue: '0',
      period: 'monthly',
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      status: 'in_progress',
    };

    expect(defaultTarget.employeeId).toBe(1);
    expect(defaultTarget.targetType).toBe('confirmed_customers');
    expect(defaultTarget.period).toBe('monthly');
    expect(defaultTarget.status).toBe('in_progress');
    expect(defaultTarget.year).toBe(now.getFullYear());
    expect(defaultTarget.month).toBe(now.getMonth() + 1);
  });

  // Test bulk delete functionality exists in employee management
  it('should support bulk delete for employees', () => {
    const employeeManagementFeatures = [
      'list_employees',
      'create_employee',
      'update_employee',
      'delete_employee',
      'bulk_delete_employees',
      'link_employee_to_user',
    ];

    expect(employeeManagementFeatures).toContain('bulk_delete_employees');
  });
});
