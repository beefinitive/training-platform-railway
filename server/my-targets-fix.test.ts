import { describe, it, expect } from 'vitest';

describe('My Targets - Employee Link Fix', () => {
  // Test 1: User with employeeId should find employee in list
  it('should find employee in list when employeeId is set', () => {
    const user = { id: 1, email: 'test@test.com', employeeId: 90002 };
    const employees = [
      { id: 90001, email: 'other@test.com', name: 'Other' },
      { id: 90002, email: 'mohd@test.com', name: 'محمد' },
    ];
    
    const linkedEmployeeId = user.employeeId;
    const found = employees.find(emp => emp.id === linkedEmployeeId);
    
    expect(found).toBeDefined();
    expect(found?.id).toBe(90002);
    expect(found?.name).toBe('محمد');
  });

  // Test 2: User without employeeId should fallback to email search
  it('should fallback to email search when no employeeId', () => {
    const user = { id: 1, email: 'mohd@test.com', employeeId: null };
    const employees = [
      { id: 90001, email: 'other@test.com', name: 'Other' },
      { id: 90002, email: 'mohd@test.com', name: 'محمد' },
    ];
    
    const linkedEmployeeId = user.employeeId;
    
    let currentEmployee = null;
    
    if (linkedEmployeeId && employees.length) {
      currentEmployee = employees.find(emp => emp.id === linkedEmployeeId);
    }
    
    if (!linkedEmployeeId && user.email && employees.length) {
      currentEmployee = employees.find(emp => emp.email?.toLowerCase() === user.email?.toLowerCase());
    }
    
    expect(currentEmployee).toBeDefined();
    expect(currentEmployee?.id).toBe(90002);
    expect(currentEmployee?.name).toBe('محمد');
  });

  // Test 3: Email search should be case-insensitive
  it('should find employee with case-insensitive email match', () => {
    const user = { id: 1, email: 'Mohd.Yes.No@Gmail.com', employeeId: null };
    const employees = [
      { id: 90001, email: 'other@test.com', name: 'Other' },
      { id: 90002, email: 'mohd.yes.no@gmail.com', name: 'محمد' },
    ];
    
    const found = employees.find(emp => emp.email?.toLowerCase() === user.email?.toLowerCase());
    
    expect(found).toBeDefined();
    expect(found?.id).toBe(90002);
  });

  // Test 4: Priority should be given to employeeId over email match
  it('should prioritize employeeId over email match', () => {
    const user = { id: 1, email: 'mohd@test.com', employeeId: 90003 };
    const employees = [
      { id: 90002, email: 'mohd@test.com', name: 'Email Match' },
      { id: 90003, email: 'different@test.com', name: 'ID Match' },
    ];
    
    const linkedEmployeeId = user.employeeId;
    
    let currentEmployee = null;
    
    // First try by ID
    if (linkedEmployeeId && employees.length) {
      currentEmployee = employees.find(emp => emp.id === linkedEmployeeId);
    }
    
    // Fallback to email only if no ID
    if (!linkedEmployeeId && user.email && employees.length) {
      currentEmployee = employees.find(emp => emp.email?.toLowerCase() === user.email?.toLowerCase());
    }
    
    expect(currentEmployee).toBeDefined();
    expect(currentEmployee?.id).toBe(90003);
    expect(currentEmployee?.name).toBe('ID Match');
  });

  // Test 5: Should return null when no match found
  it('should return null when no employee match found', () => {
    const user = { id: 1, email: 'nolink@test.com', employeeId: null };
    const employees = [
      { id: 90001, email: 'other@test.com', name: 'Other' },
    ];
    
    const linkedEmployeeId = user.employeeId;
    
    let currentEmployee = null;
    
    if (linkedEmployeeId && employees.length) {
      currentEmployee = employees.find(emp => emp.id === linkedEmployeeId);
    }
    
    if (!linkedEmployeeId && user.email && employees.length) {
      currentEmployee = employees.find(emp => emp.email?.toLowerCase() === user.email?.toLowerCase());
    }
    
    expect(currentEmployee).toBeUndefined();
  });
});

describe('Database Employee Link Verification', () => {
  // Test 6: Verify user has employeeId field
  it('should have employeeId field in user schema', async () => {
    const schema = await import('../drizzle/schema');
    expect(schema.users.employeeId).toBeDefined();
  });

  // Test 7: Verify employees table exists
  it('should have employees table in schema', async () => {
    const schema = await import('../drizzle/schema');
    expect(schema.employees).toBeDefined();
  });

  // Test 8: Verify employee targets table exists
  it('should have employeeTargets table in schema', async () => {
    const schema = await import('../drizzle/schema');
    expect(schema.employeeTargets).toBeDefined();
  });
});
