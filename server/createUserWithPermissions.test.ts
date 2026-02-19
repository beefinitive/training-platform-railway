import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";

describe("createUserWithPermissions", () => {
  let testUserId: number;
  const testEmail = `test-user-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Setup: Get some permissions to use in tests
  });

  afterAll(async () => {
    // Cleanup: Delete test user if created
    if (testUserId) {
      try {
        await db.deleteUser(testUserId);
      } catch (error) {
        console.error("Cleanup error:", error);
      }
    }
  });

  it("should create a user with password", async () => {
    const userId = await db.createUserWithPassword({
      name: "Test User",
      email: testEmail,
      password: "TestPassword123",
    });

    testUserId = userId;
    expect(userId).toBeDefined();
    expect(typeof userId).toBe("number");
    expect(userId).toBeGreaterThan(0);
  });

  it("should create a user and set permissions", async () => {
    const email = `test-permissions-${Date.now()}@example.com`;
    const userId = await db.createUserWithPassword({
      name: "Test User With Permissions",
      email: email,
      password: "TestPassword123",
    });

    // Get some permissions
    const permissions = await db.getAllPermissions();
    expect(permissions.length).toBeGreaterThan(0);

    // Set permissions for the user
    const permissionIds = permissions.slice(0, 2).map(p => p.id);
    await db.setUserPermissions(userId, permissionIds);

    // Verify permissions were set
    const userPermissions = await db.getUserPermissions(userId);
    expect(userPermissions.length).toBe(permissionIds.length);

    // Cleanup
    await db.deleteUser(userId);
  });

  it("should not create user with duplicate email", async () => {
    const email = `duplicate-test-${Date.now()}@example.com`;

    // Create first user
    const userId1 = await db.createUserWithPassword({
      name: "User 1",
      email: email,
      password: "Password123",
    });

    // Try to create second user with same email
    try {
      await db.createUserWithPassword({
        name: "User 2",
        email: email,
        password: "Password456",
      });
      expect.fail("Should have thrown an error for duplicate email");
    } catch (error) {
      expect(error).toBeDefined();
    }

    // Cleanup
    await db.deleteUser(userId1);
  });

  it("should create user with empty permissions array", async () => {
    const email = `empty-perms-${Date.now()}@example.com`;
    const userId = await db.createUserWithPassword({
      name: "User With No Permissions",
      email: email,
      password: "Password123",
    });

    // Verify user has no permissions
    const userPermissions = await db.getUserPermissions(userId);
    expect(userPermissions.length).toBe(0);

    // Cleanup
    await db.deleteUser(userId);
  });

  it("should grant and remove permissions from user", async () => {
    const email = `grant-remove-${Date.now()}@example.com`;
    const userId = await db.createUserWithPassword({
      name: "Test Grant Remove",
      email: email,
      password: "Password123",
    });

    // Get a permission
    const permissions = await db.getAllPermissions();
    expect(permissions.length).toBeGreaterThan(0);
    const permissionId = permissions[0].id;

    // Grant permission
    await db.grantPermissionToUser(userId, permissionId);
    let userPermissions = await db.getUserPermissions(userId);
    expect(userPermissions.length).toBe(1);
    expect(userPermissions[0].permissionId).toBe(permissionId);

    // Remove permission
    await db.removePermissionFromUser(userId, permissionId);
    userPermissions = await db.getUserPermissions(userId);
    expect(userPermissions.length).toBe(0);

    // Cleanup
    await db.deleteUser(userId);
  });

  it("should set multiple permissions at once", async () => {
    const email = `set-multiple-${Date.now()}@example.com`;
    const userId = await db.createUserWithPassword({
      name: "Test Set Multiple",
      email: email,
      password: "Password123",
    });

    // Get permissions
    const permissions = await db.getAllPermissions();
    expect(permissions.length).toBeGreaterThanOrEqual(3);

    const permissionIds = permissions.slice(0, 3).map(p => p.id);

    // Set multiple permissions
    await db.setUserPermissions(userId, permissionIds);

    // Verify all permissions were set
    const userPermissions = await db.getUserPermissions(userId);
    expect(userPermissions.length).toBe(3);
    const userPermIds = userPermissions.map(p => p.permissionId);
    permissionIds.forEach(id => {
      expect(userPermIds).toContain(id);
    });

    // Cleanup
    await db.deleteUser(userId);
  });

  it("should replace permissions when setting new ones", async () => {
    const email = `replace-perms-${Date.now()}@example.com`;
    const userId = await db.createUserWithPassword({
      name: "Test Replace Permissions",
      email: email,
      password: "Password123",
    });

    // Get permissions
    const permissions = await db.getAllPermissions();
    expect(permissions.length).toBeGreaterThanOrEqual(4);

    // Set first batch of permissions
    const firstBatch = permissions.slice(0, 2).map(p => p.id);
    await db.setUserPermissions(userId, firstBatch);

    let userPermissions = await db.getUserPermissions(userId);
    expect(userPermissions.length).toBe(2);

    // Replace with second batch
    const secondBatch = permissions.slice(2, 4).map(p => p.id);
    await db.setUserPermissions(userId, secondBatch);

    userPermissions = await db.getUserPermissions(userId);
    expect(userPermissions.length).toBe(2);
    const userPermIds = userPermissions.map(p => p.permissionId);
    secondBatch.forEach(id => {
      expect(userPermIds).toContain(id);
    });

    // Cleanup
    await db.deleteUser(userId);
  });
});
