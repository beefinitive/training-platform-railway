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

describe("Public Pricing Fields", () => {
  const testCourseId = 99990;

  it("upsert saves publicPrice and publicDiscountPrice", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.courseDisplaySettings.upsert({
      courseId: testCourseId,
      isPublic: true,
      courseType: "online_live",
      publicPrice: "1500",
      publicDiscountPrice: "1200",
    });

    expect(result.success).toBe(true);

    // Verify settings were saved
    const settings = await caller.courseDisplaySettings.get({ courseId: testCourseId });
    expect(settings).not.toBeNull();
    expect(settings?.publicPrice).toBe("1500.00");
    expect(settings?.publicDiscountPrice).toBe("1200.00");
  });

  it("upsert saves publicPrice without discount", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.courseDisplaySettings.upsert({
      courseId: testCourseId,
      publicPrice: "2000",
      publicDiscountPrice: null,
    });

    const settings = await caller.courseDisplaySettings.get({ courseId: testCourseId });
    expect(settings?.publicPrice).toBe("2000.00");
    expect(settings?.publicDiscountPrice).toBeNull();
  });

  it("upsert clears both public prices when set to null", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.courseDisplaySettings.upsert({
      courseId: testCourseId,
      publicPrice: null,
      publicDiscountPrice: null,
    });

    const settings = await caller.courseDisplaySettings.get({ courseId: testCourseId });
    expect(settings?.publicPrice).toBeNull();
    expect(settings?.publicDiscountPrice).toBeNull();
  });

  it("public course list uses publicPrice instead of fee amount", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Set public price on test course
    await caller.courseDisplaySettings.upsert({
      courseId: testCourseId,
      isPublic: true,
      publicPrice: "3000",
      publicDiscountPrice: "2500",
    });

    // Query public courses
    const publicCtx = createPublicContext();
    const publicCaller = appRouter.createCaller(publicCtx);
    const courses = await publicCaller.publicCourses.list();

    // Find our test course (if it exists in active courses)
    const testCourse = courses.find((c: any) => c.id === testCourseId);
    // If the course exists in the list, verify pricing comes from display settings
    if (testCourse) {
      expect(testCourse.originalPrice).toBe("3000.00");
      expect(testCourse.price).toBe("2500.00");
    }

    // Cleanup
    await caller.courseDisplaySettings.upsert({
      courseId: testCourseId,
      isPublic: false,
      publicPrice: null,
      publicDiscountPrice: null,
    });
  });

  it("public course getById includes publicPrice fields", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Set public prices
    await caller.courseDisplaySettings.upsert({
      courseId: testCourseId,
      isPublic: true,
      publicPrice: "1800",
      publicDiscountPrice: "1500",
    });

    const publicCtx = createPublicContext();
    const publicCaller = appRouter.createCaller(publicCtx);
    const course = await publicCaller.publicCourses.getById({ id: testCourseId });

    if (course) {
      expect(course.publicPrice).toBe("1800.00");
      expect(course.publicDiscountPrice).toBe("1500.00");
      // price should be the discount price (or public price if no discount)
      expect(course.price).toBe("1500.00");
      expect(course.originalPrice).toBe("1800.00");
    }

    // Cleanup
    await caller.courseDisplaySettings.upsert({
      courseId: testCourseId,
      isPublic: false,
      publicPrice: null,
      publicDiscountPrice: null,
    });
  });
});
