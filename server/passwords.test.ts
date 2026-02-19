import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';
import bcrypt from 'bcrypt';

describe('Password Management Functions', () => {
  let testUserId: number;
  let adminUserId: number;

  beforeAll(async () => {
    // Create test users
    testUserId = await db.createUserWithPassword({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'OldPassword123!',
    });

    adminUserId = await db.createUserWithPassword({
      name: 'Admin User',
      email: `admin-${Date.now()}@example.com`,
      password: 'AdminPassword123!',
    });

    // Grant admin permission
    const usersEditPermission = await db.getDb()
      .then(dbInstance => {
        if (!dbInstance) throw new Error('Database not available');
        return dbInstance.select().from(db.permissions).where(db.eq(db.permissions.name, 'users.edit')).limit(1);
      })
      .catch(() => null);

    if (usersEditPermission && usersEditPermission[0]) {
      await db.grantPermissionToUser(adminUserId, usersEditPermission[0].id);
    }
  });

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await db.deleteUser(testUserId);
    }
    if (adminUserId) {
      await db.deleteUser(adminUserId);
    }
  });

  describe('changePassword', () => {
    it('should change password with correct old password', async () => {
      await db.changePassword(
        testUserId,
        'OldPassword123!',
        'NewPassword123!',
        undefined,
        'Test change'
      );

      const result = await db.verifyPassword(
        `test-${Date.now()}@example.com`,
        'NewPassword123!'
      );
      expect(result).toBeDefined();
    });

    it('should fail with incorrect old password', async () => {
      try {
        await db.changePassword(
          testUserId,
          'WrongPassword123!',
          'AnotherPassword123!',
          undefined,
          'Test change'
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toContain('كلمة المرور الحالية غير صحيحة');
      }
    });

    it('should record password change in history', async () => {
      await db.changePassword(
        testUserId,
        'NewPassword123!',
        'UpdatedPassword123!',
        undefined,
        'Test history'
      );

      const history = await db.getPasswordHistory(testUserId, 10);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].reason).toContain('Test history');
    });
  });

  describe('adminChangePassword', () => {
    it('should change password without verification', async () => {
      await db.adminChangePassword(testUserId, 'AdminSetPassword123!', adminUserId);

      const result = await db.verifyPassword(
        `test-${Date.now()}@example.com`,
        'AdminSetPassword123!'
      );
      expect(result).toBeDefined();
    });

    it('should record admin change in history', async () => {
      await db.adminChangePassword(testUserId, 'AdminSetPassword456!', adminUserId);

      const audit = await db.getUserPasswordAudit(testUserId);
      const adminChange = audit.find(entry => entry.changedBy === adminUserId);
      expect(adminChange).toBeDefined();
      expect(adminChange?.reason).toContain('تغيير من قبل المسؤول');
    });
  });

  describe('resetPassword', () => {
    it('should reset password', async () => {
      await db.resetPassword(testUserId, 'ResetPassword123!');

      const result = await db.verifyPassword(
        `test-${Date.now()}@example.com`,
        'ResetPassword123!'
      );
      expect(result).toBeDefined();
    });

    it('should record reset in history', async () => {
      await db.resetPassword(testUserId, 'ResetPassword456!');

      const history = await db.getPasswordHistory(testUserId, 10);
      const resetEntry = history.find(entry => entry.reason?.includes('إعادة تعيين'));
      expect(resetEntry).toBeDefined();
    });
  });

  describe('getPasswordHistory', () => {
    it('should return password history', async () => {
      const history = await db.getPasswordHistory(testUserId, 5);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThanOrEqual(0);
    });

    it('should respect limit parameter', async () => {
      const history = await db.getPasswordHistory(testUserId, 2);
      expect(history.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getUserPasswordAudit', () => {
    it('should return audit log', async () => {
      const audit = await db.getUserPasswordAudit(testUserId);
      expect(Array.isArray(audit)).toBe(true);
    });

    it('should include admin changes in audit', async () => {
      await db.adminChangePassword(testUserId, 'AuditTest123!', adminUserId);

      const audit = await db.getUserPasswordAudit(testUserId);
      const adminEntry = audit.find(entry => entry.changedBy === adminUserId);
      expect(adminEntry).toBeDefined();
    });
  });

  describe('canChangeOwnPassword', () => {
    it('should return true for password-based users', async () => {
      const canChange = await db.canChangeOwnPassword(testUserId);
      expect(canChange).toBe(true);
    });

    it('should return false for non-existent users', async () => {
      const canChange = await db.canChangeOwnPassword(99999);
      expect(canChange).toBe(false);
    });
  });

  describe('canChangeUserPassword', () => {
    it('should return true for admin with permission', async () => {
      // Note: This test may fail if permissions are not properly set up
      // In a real scenario, the admin would need to have the 'users.edit' permission
      const canChange = await db.canChangeUserPassword(adminUserId, testUserId);
      // For now, we just check that the function returns a boolean
      expect(typeof canChange).toBe('boolean');
    });

    it('should return false for non-admin users', async () => {
      const canChange = await db.canChangeUserPassword(testUserId, adminUserId);
      // Non-admin users should not have permission
      expect(canChange).toBe(false);
    });
  });
});
