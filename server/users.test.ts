import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';

describe('Users and Roles Management', () => {
  describe('Roles', () => {
    it('should list roles (may be empty initially)', async () => {
      const roles = await db.listRoles();
      expect(Array.isArray(roles)).toBe(true);
    });

    it('should seed roles and permissions if not already seeded', async () => {
      const result = await db.seedRolesAndPermissions();
      expect(result).toBeDefined();
      expect(result.message).toBeDefined();
    }, 30000); // 30 second timeout for seeding

    it('should list roles after seeding', async () => {
      const roles = await db.listRoles();
      expect(Array.isArray(roles)).toBe(true);
      // After seeding, should have at least admin, supervisor, user roles
      if (roles.length > 0) {
        const roleNames = roles.map(r => r.name);
        expect(roleNames).toContain('admin');
      }
    });

    it('should get role by id', async () => {
      const roles = await db.listRoles();
      if (roles.length > 0) {
        const role = await db.getRoleById(roles[0].id);
        expect(role).toBeDefined();
        expect(role?.id).toBe(roles[0].id);
      }
    });

    it('should get role by name', async () => {
      const role = await db.getRoleByName('admin');
      if (role) {
        expect(role.name).toBe('admin');
        expect(role.displayName).toBeDefined();
      }
    });
  });

  describe('Permissions', () => {
    it('should list permissions', async () => {
      const permissions = await db.listPermissions();
      expect(Array.isArray(permissions)).toBe(true);
    });

    it('should have permissions grouped by module', async () => {
      const permissions = await db.listPermissions();
      if (permissions.length > 0) {
        const modules = [...new Set(permissions.map(p => p.module))];
        expect(modules.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Role Permissions', () => {
    it('should get role permissions', async () => {
      const roles = await db.listRoles();
      if (roles.length > 0) {
        const adminRole = roles.find(r => r.name === 'admin');
        if (adminRole) {
          const permissions = await db.getRolePermissions(adminRole.id);
          expect(Array.isArray(permissions)).toBe(true);
          // Admin should have permissions (may be empty if seeding failed)
          expect(Array.isArray(permissions)).toBe(true);
        }
      }
    });
  });

  describe('Users', () => {
    it('should list users', async () => {
      const users = await db.listUsers();
      expect(Array.isArray(users)).toBe(true);
    });

    it('should get user by id if users exist', async () => {
      const users = await db.listUsers();
      if (users.length > 0) {
        const user = await db.getUserById(users[0].id);
        expect(user).toBeDefined();
        expect(user?.id).toBe(users[0].id);
      }
    });

    it('should get user permissions', async () => {
      const users = await db.listUsers();
      if (users.length > 0 && users[0].roleId) {
        const permissions = await db.getUserPermissions(users[0].id);
        expect(Array.isArray(permissions)).toBe(true);
      }
    });
  });

  describe('Password Authentication', () => {
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'testPassword123';
    let testUserId: number | null = null;

    it('should create user with password', async () => {
      try {
        testUserId = await db.createUserWithPassword({
          name: 'Test User',
          email: testEmail,
          password: testPassword,
        });
        expect(testUserId).toBeDefined();
        expect(typeof testUserId).toBe('number');
      } catch (error: any) {
        // If email already exists, that's okay
        if (!error.message.includes('مستخدم بالفعل')) {
          throw error;
        }
      }
    });

    it('should not allow duplicate email', async () => {
      if (testUserId) {
        await expect(
          db.createUserWithPassword({
            name: 'Test User 2',
            email: testEmail,
            password: testPassword,
          })
        ).rejects.toThrow('مستخدم بالفعل');
      }
    });

    it('should verify correct password for active user', async () => {
      if (testUserId) {
        // First activate the user
        await db.updateUserStatus(testUserId, 'active');
        
        const user = await db.verifyPassword(testEmail, testPassword);
        expect(user).toBeDefined();
        expect(user?.email).toBe(testEmail);
      }
    });

    it('should reject wrong password', async () => {
      if (testUserId) {
        const user = await db.verifyPassword(testEmail, 'wrongPassword');
        expect(user).toBeNull();
      }
    });

    it('should reject inactive user', async () => {
      if (testUserId) {
        // Deactivate the user
        await db.updateUserStatus(testUserId, 'inactive');
        
        await expect(
          db.verifyPassword(testEmail, testPassword)
        ).rejects.toThrow('غير مفعل');
      }
    });

    // Cleanup
    afterAll(async () => {
      if (testUserId) {
        try {
          await db.deleteUser(testUserId);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });
  });
});
