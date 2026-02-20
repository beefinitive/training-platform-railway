import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("courseDisplaySettings", () => {
  it("get returns null for non-existent course display settings", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.courseDisplaySettings.get({ courseId: 99999 });
    expect(result).toBeNull();
  });

  it("upsert creates display settings for a course", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // Use a high courseId to avoid conflicts with real data
    const testCourseId = 99998;
    
    const result = await caller.courseDisplaySettings.upsert({
      courseId: testCourseId,
      isPublic: true,
      courseType: "online_live",
      shortDescription: "Test course description",
      targetAudience: "Test audience",
      maxSeats: 50,
    });
    
    expect(result.success).toBe(true);
    
    // Verify settings were saved
    const settings = await caller.courseDisplaySettings.get({ courseId: testCourseId });
    expect(settings).not.toBeNull();
    expect(settings?.isPublic).toBe(true);
    expect(settings?.courseType).toBe("online_live");
    expect(settings?.shortDescription).toBe("Test course description");
    expect(settings?.maxSeats).toBe(50);
    
    // Cleanup - set back to not public
    await caller.courseDisplaySettings.upsert({
      courseId: testCourseId,
      isPublic: false,
    });
  });

  it("upsert updates existing display settings", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    const testCourseId = 99997;
    
    // Create initial settings
    await caller.courseDisplaySettings.upsert({
      courseId: testCourseId,
      isPublic: false,
      courseType: "onsite",
      location: "Riyadh",
    });
    
    // Update settings
    await caller.courseDisplaySettings.upsert({
      courseId: testCourseId,
      isPublic: true,
      courseType: "recorded",
      shortDescription: "Updated description",
    });
    
    const settings = await caller.courseDisplaySettings.get({ courseId: testCourseId });
    expect(settings?.isPublic).toBe(true);
    expect(settings?.courseType).toBe("recorded");
    expect(settings?.shortDescription).toBe("Updated description");
    
    // Cleanup
    await caller.courseDisplaySettings.upsert({
      courseId: testCourseId,
      isPublic: false,
    });
  });
});

describe("courseFees with originalPrice", () => {
  it("creates a fee with originalPrice", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // Use course ID 1 which exists
    const result = await caller.courseFees.create({
      courseId: 1,
      name: "Test Fee with Discount",
      amount: "500",
      originalPrice: "800",
      description: "Test discount fee",
    });
    
    expect(result.id).toBeDefined();
    
    // Verify fee was created
    const fees = await caller.courseFees.list({ courseId: 1 });
    const createdFee = fees.find((f: any) => f.id === result.id);
    expect(createdFee).toBeDefined();
    expect(createdFee?.amount).toBe("500.00");
    expect((createdFee as any)?.originalPrice).toBe("800.00");
    
    // Cleanup - delete the test fee
    await caller.courseFees.delete({ id: result.id });
  });

  it("creates a fee without originalPrice", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.courseFees.create({
      courseId: 1,
      name: "Test Fee No Discount",
      amount: "300",
    });
    
    expect(result.id).toBeDefined();
    
    // Verify fee was created
    const fees = await caller.courseFees.list({ courseId: 1 });
    const createdFee = fees.find((f: any) => f.id === result.id);
    expect(createdFee).toBeDefined();
    expect(createdFee?.amount).toBe("300.00");
    
    // Cleanup
    await caller.courseFees.delete({ id: result.id });
  });

  it("updates fee originalPrice", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // Create a fee first
    const createResult = await caller.courseFees.create({
      courseId: 1,
      name: "Test Update Fee",
      amount: "400",
    });
    
    // Update with originalPrice
    await caller.courseFees.update({
      id: createResult.id,
      originalPrice: "600",
    });
    
    // Verify update
    const fees = await caller.courseFees.list({ courseId: 1 });
    const updatedFee = fees.find((f: any) => f.id === createResult.id);
    expect((updatedFee as any)?.originalPrice).toBe("600.00");
    
    // Cleanup
    await caller.courseFees.delete({ id: createResult.id });
  });
});

describe("publicCourses", () => {
  it("list returns only public courses", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const courses = await caller.publicCourses.list();
    // All returned courses should be public
    courses.forEach((course: any) => {
      expect(course.isPublic).toBe(true);
    });
  });

  it("getById returns course details with fees", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const course = await caller.publicCourses.getById({ id: 1 });
    if (course) {
      expect(course.fees).toBeDefined();
      expect(Array.isArray(course.fees)).toBe(true);
    }
  });
});
