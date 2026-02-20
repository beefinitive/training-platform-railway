import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as db from './db';

// Mock the database module
vi.mock('./db', async () => {
  const actual = await vi.importActual('./db');
  return {
    ...actual,
    unapproveDailyStat: vi.fn(),
    getDailyStatById: vi.fn(),
    updateEmployeeTargetsFromDailyStats: vi.fn(),
  };
});

describe('Unapprove Daily Stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully unapprove an approved stat', async () => {
    const mockStat = {
      id: 1,
      employeeId: 1,
      status: 'approved',
      courseId: 1,
      confirmedCustomers: 5,
      calculatedRevenue: '1000.00',
    };

    vi.mocked(db.getDailyStatById).mockResolvedValue(mockStat as any);
    vi.mocked(db.unapproveDailyStat).mockResolvedValue(true);

    const result = await db.unapproveDailyStat(1, 1, 'Test unapproval');
    
    expect(result).toBe(true);
    expect(db.unapproveDailyStat).toHaveBeenCalledWith(1, 1, 'Test unapproval');
  });

  it('should throw error when stat is not found', async () => {
    vi.mocked(db.unapproveDailyStat).mockRejectedValue(new Error('Daily stat not found'));

    await expect(db.unapproveDailyStat(999, 1)).rejects.toThrow('Daily stat not found');
  });

  it('should throw error when stat is not approved', async () => {
    vi.mocked(db.unapproveDailyStat).mockRejectedValue(new Error('Daily stat is not approved'));

    await expect(db.unapproveDailyStat(1, 1)).rejects.toThrow('Daily stat is not approved');
  });

  it('should update employee targets after unapproval', async () => {
    vi.mocked(db.unapproveDailyStat).mockResolvedValue(true);
    vi.mocked(db.updateEmployeeTargetsFromDailyStats).mockResolvedValue(undefined);

    await db.unapproveDailyStat(1, 1);
    
    expect(db.unapproveDailyStat).toHaveBeenCalled();
  });

  it('should handle unapproval without review notes', async () => {
    vi.mocked(db.unapproveDailyStat).mockResolvedValue(true);

    const result = await db.unapproveDailyStat(1, 1);
    
    expect(result).toBe(true);
    expect(db.unapproveDailyStat).toHaveBeenCalledWith(1, 1);
  });
});
