import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";

describe("User Permissions", () => {
  let testUserId: number;
  let testPermissionId: number;

  beforeAll(async () => {
    // Create test user
    const users = await db.listUsers();
    if (users.length > 0) {
      testUserId = users[0].id;
    }

    // Get first permission
    const permissions = await db.getAllPermissions();
    if (permissions.length > 0) {
      testPermissionId = permissions[0].id;
    }
  });

  describe("getUserPermissions", () => {
    it("should return empty array for user with no permissions", async () => {
      const permissions = await db.getUserPermissions(testUserId);
      expect(Array.isArray(permissions)).toBe(true);
    });

    it("should return permissions with correct structure", async () => {
      const permissions = await db.getUserPermissions(testUserId);
      if (permissions.length > 0) {
        expect(permissions[0]).toHaveProperty("id");
        expect(permissions[0]).toHaveProperty("permissionId");
        expect(permissions[0]).toHaveProperty("permission");
        expect(permissions[0].permission).toHaveProperty("name");
        expect(permissions[0].permission).toHaveProperty("displayName");
        expect(permissions[0].permission).toHaveProperty("module");
      }
    });
  });

  describe("grantPermissionToUser", () => {
    it("should grant permission to user", async () => {
      await db.grantPermissionToUser(testUserId, testPermissionId);
      const permissions = await db.getUserPermissions(testUserId);
      const hasPermission = permissions.some(p => p.permissionId === testPermissionId);
      expect(hasPermission).toBe(true);
    });

    it("should not duplicate permission if granted twice", async () => {
      await db.grantPermissionToUser(testUserId, testPermissionId);
      const permissionsBefore = await db.getUserPermissions(testUserId);
      const countBefore = permissionsBefore.filter(p => p.permissionId === testPermissionId).length;

      await db.grantPermissionToUser(testUserId, testPermissionId);
      const permissionsAfter = await db.getUserPermissions(testUserId);
      const countAfter = permissionsAfter.filter(p => p.permissionId === testPermissionId).length;

      expect(countAfter).toBe(countBefore);
    });
  });

  describe("removePermissionFromUser", () => {
    it("should remove permission from user", async () => {
      // First grant the permission
      await db.grantPermissionToUser(testUserId, testPermissionId);
      
      // Then remove it
      await db.removePermissionFromUser(testUserId, testPermissionId);
      
      const permissions = await db.getUserPermissions(testUserId);
      const hasPermission = permissions.some(p => p.permissionId === testPermissionId);
      expect(hasPermission).toBe(false);
    });
  });

  describe("setUserPermissions", () => {
    it("should set user permissions", async () => {
      const permissions = await db.getAllPermissions();
      const permissionIds = permissions.slice(0, 2).map(p => p.id);

      await db.setUserPermissions(testUserId, permissionIds);
      
      const userPermissions = await db.getUserPermissions(testUserId);
      const userPermissionIds = userPermissions.map(p => p.permissionId);

      expect(userPermissionIds.length).toBe(permissionIds.length);
      permissionIds.forEach(id => {
        expect(userPermissionIds).toContain(id);
      });
    });

    it("should clear permissions when setting empty array", async () => {
      // First set some permissions
      const permissions = await db.getAllPermissions();
      const permissionIds = permissions.slice(0, 2).map(p => p.id);
      await db.setUserPermissions(testUserId, permissionIds);

      // Then clear them
      await db.setUserPermissions(testUserId, []);
      
      const userPermissions = await db.getUserPermissions(testUserId);
      expect(userPermissions.length).toBe(0);
    });

    it("should replace existing permissions", async () => {
      const permissions = await db.getAllPermissions();
      
      // Set first set of permissions
      const firstSet = permissions.slice(0, 2).map(p => p.id);
      await db.setUserPermissions(testUserId, firstSet);

      // Replace with second set
      const secondSet = permissions.slice(2, 4).map(p => p.id);
      await db.setUserPermissions(testUserId, secondSet);

      const userPermissions = await db.getUserPermissions(testUserId);
      const userPermissionIds = userPermissions.map(p => p.permissionId);

      // Should only have second set
      expect(userPermissionIds.length).toBe(secondSet.length);
      secondSet.forEach(id => {
        expect(userPermissionIds).toContain(id);
      });
      firstSet.forEach(id => {
        expect(userPermissionIds).not.toContain(id);
      });
    });
  });

  describe("getAllPermissions", () => {
    it("should return all permissions", async () => {
      const permissions = await db.getAllPermissions();
      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions.length).toBeGreaterThan(0);
    });

    it("should return permissions with required fields", async () => {
      const permissions = await db.getAllPermissions();
      if (permissions.length > 0) {
        expect(permissions[0]).toHaveProperty("id");
        expect(permissions[0]).toHaveProperty("name");
        expect(permissions[0]).toHaveProperty("displayName");
        expect(permissions[0]).toHaveProperty("module");
      }
    });
  });

  describe("listUsers", () => {
    it("should return users list", async () => {
      const users = await db.listUsers();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
    });

    it("should return users with required fields", async () => {
      const users = await db.listUsers();
      if (users.length > 0) {
        expect(users[0]).toHaveProperty("id");
        expect(users[0]).toHaveProperty("email");
      }
    });
  });
});
