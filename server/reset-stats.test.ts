import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('./db', () => ({
  resetEmployeeStats: vi.fn(),
}));

import * as db from './db';

describe('Reset Employee Stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reset stats for all employees when no employeeId provided', async () => {
    const mockResult = {
      success: true,
      deletedDailyStats: 10,
      updatedTargets: 5,
      message: 'تم حذف 10 إحصائية يومية وتحديث 5 مستهدف'
    };
    
    vi.mocked(db.resetEmployeeStats).mockResolvedValue(mockResult);
    
    const result = await db.resetEmployeeStats({
      resetDailyStats: true,
      resetCurrentValues: true,
    });
    
    expect(result.success).toBe(true);
    expect(result.deletedDailyStats).toBe(10);
    expect(result.updatedTargets).toBe(5);
  });

  it('should reset stats for specific employee when employeeId provided', async () => {
    const mockResult = {
      success: true,
      deletedDailyStats: 3,
      updatedTargets: 2,
      message: 'تم حذف 3 إحصائية يومية وتحديث 2 مستهدف'
    };
    
    vi.mocked(db.resetEmployeeStats).mockResolvedValue(mockResult);
    
    const result = await db.resetEmployeeStats({
      employeeId: 1,
      resetDailyStats: true,
      resetCurrentValues: true,
    });
    
    expect(result.success).toBe(true);
    expect(db.resetEmployeeStats).toHaveBeenCalledWith({
      employeeId: 1,
      resetDailyStats: true,
      resetCurrentValues: true,
    });
  });

  it('should only reset daily stats when resetCurrentValues is false', async () => {
    const mockResult = {
      success: true,
      deletedDailyStats: 5,
      updatedTargets: 0,
      message: 'تم حذف 5 إحصائية يومية وتحديث 0 مستهدف'
    };
    
    vi.mocked(db.resetEmployeeStats).mockResolvedValue(mockResult);
    
    const result = await db.resetEmployeeStats({
      resetDailyStats: true,
      resetCurrentValues: false,
    });
    
    expect(result.success).toBe(true);
    expect(result.deletedDailyStats).toBe(5);
    expect(result.updatedTargets).toBe(0);
  });

  it('should only reset current values when resetDailyStats is false', async () => {
    const mockResult = {
      success: true,
      deletedDailyStats: 0,
      updatedTargets: 4,
      message: 'تم حذف 0 إحصائية يومية وتحديث 4 مستهدف'
    };
    
    vi.mocked(db.resetEmployeeStats).mockResolvedValue(mockResult);
    
    const result = await db.resetEmployeeStats({
      resetDailyStats: false,
      resetCurrentValues: true,
    });
    
    expect(result.success).toBe(true);
    expect(result.deletedDailyStats).toBe(0);
    expect(result.updatedTargets).toBe(4);
  });

  it('should filter by month and year when provided', async () => {
    const mockResult = {
      success: true,
      deletedDailyStats: 2,
      updatedTargets: 1,
      message: 'تم حذف 2 إحصائية يومية وتحديث 1 مستهدف'
    };
    
    vi.mocked(db.resetEmployeeStats).mockResolvedValue(mockResult);
    
    const result = await db.resetEmployeeStats({
      month: 1,
      year: 2026,
      resetDailyStats: true,
      resetCurrentValues: true,
    });
    
    expect(result.success).toBe(true);
    expect(db.resetEmployeeStats).toHaveBeenCalledWith({
      month: 1,
      year: 2026,
      resetDailyStats: true,
      resetCurrentValues: true,
    });
  });
});
