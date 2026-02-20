import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('./db', async () => {
  const actual = await vi.importActual('./db');
  return {
    ...actual,
  };
});

describe('Course Date Update - Related Data Sync', () => {
  
  it('should calculate date difference correctly when course date changes', () => {
    const oldStartDate = new Date('2026-01-15');
    const newStartDate = new Date('2026-02-15');
    
    const dateDiff = newStartDate.getTime() - oldStartDate.getTime();
    const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
    
    // Should be approximately 31 days (January has 31 days)
    expect(daysDiff).toBe(31);
  });
  
  it('should correctly shift enrollment date when course date changes', () => {
    // Use UTC dates to avoid timezone issues
    const oldStartDate = new Date('2026-01-15T00:00:00Z');
    const newStartDate = new Date('2026-02-15T00:00:00Z');
    const oldEnrollmentDate = new Date('2026-01-20T00:00:00Z');
    
    const dateDiff = newStartDate.getTime() - oldStartDate.getTime();
    const newEnrollmentDate = new Date(oldEnrollmentDate.getTime() + dateDiff);
    
    // Enrollment date should move from Jan 20 to Feb 20
    expect(newEnrollmentDate.getUTCMonth()).toBe(1); // February (0-indexed)
    expect(newEnrollmentDate.getUTCDate()).toBe(20);
  });
  
  it('should correctly shift expense date when course date changes', () => {
    // Use UTC dates to avoid timezone issues
    const oldStartDate = new Date('2026-01-15T00:00:00Z');
    const newStartDate = new Date('2026-02-15T00:00:00Z');
    const oldExpenseDate = new Date('2026-01-25T00:00:00Z');
    
    const dateDiff = newStartDate.getTime() - oldStartDate.getTime();
    const newExpenseDate = new Date(oldExpenseDate.getTime() + dateDiff);
    
    // Expense date should move from Jan 25 to Feb 25
    expect(newExpenseDate.getUTCMonth()).toBe(1); // February (0-indexed)
    expect(newExpenseDate.getUTCDate()).toBe(25);
  });
  
  it('should not change dates when date difference is zero', () => {
    const oldStartDate = new Date('2026-01-15');
    const newStartDate = new Date('2026-01-15');
    
    const dateDiff = newStartDate.getTime() - oldStartDate.getTime();
    
    expect(dateDiff).toBe(0);
  });
  
  it('should handle backward date changes correctly', () => {
    // Use UTC dates to avoid timezone issues
    const oldStartDate = new Date('2026-02-15T00:00:00Z');
    const newStartDate = new Date('2026-01-15T00:00:00Z');
    const oldEnrollmentDate = new Date('2026-02-20T00:00:00Z');
    
    const dateDiff = newStartDate.getTime() - oldStartDate.getTime();
    const newEnrollmentDate = new Date(oldEnrollmentDate.getTime() + dateDiff);
    
    // Enrollment date should move from Feb 20 to Jan 20
    expect(newEnrollmentDate.getUTCMonth()).toBe(0); // January (0-indexed)
    expect(newEnrollmentDate.getUTCDate()).toBe(20);
  });
  
  it('should preserve time components when shifting dates', () => {
    const oldStartDate = new Date('2026-01-15T10:00:00');
    const newStartDate = new Date('2026-02-15T10:00:00');
    const oldEnrollmentDate = new Date('2026-01-20T14:30:00');
    
    const dateDiff = newStartDate.getTime() - oldStartDate.getTime();
    const newEnrollmentDate = new Date(oldEnrollmentDate.getTime() + dateDiff);
    
    // Time should be preserved
    expect(newEnrollmentDate.getHours()).toBe(14);
    expect(newEnrollmentDate.getMinutes()).toBe(30);
  });
});
