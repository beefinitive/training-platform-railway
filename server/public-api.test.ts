import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for public-facing API endpoints (no auth required)
 * These endpoints power the public website: courses listing, course details, registration, services
 */

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

describe("publicCourses", () => {
  it("lists public courses without authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const courses = await caller.publicCourses.list();

    expect(Array.isArray(courses)).toBe(true);
    // Each course should have expected fields
    if (courses.length > 0) {
      const course = courses[0];
      expect(course).toHaveProperty("id");
      expect(course).toHaveProperty("name");
      expect(course).toHaveProperty("instructorName");
      expect(course).toHaveProperty("courseType");
      expect(course).toHaveProperty("isPublic");
      expect(course).toHaveProperty("fees");
      expect(Array.isArray(course.fees)).toBe(true);
    }
  });

  it("gets a public course by ID", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // First get list to find a valid ID
    const courses = await caller.publicCourses.list();
    if (courses.length === 0) {
      // Skip if no courses exist
      return;
    }

    const courseId = courses[0].id;
    const course = await caller.publicCourses.getById({ id: courseId });

    expect(course).not.toBeNull();
    expect(course!.id).toBe(courseId);
    expect(course!.name).toBeTruthy();
    expect(course!).toHaveProperty("fees");
    expect(course!).toHaveProperty("courseType");
    expect(course!).toHaveProperty("registrationCount");
    expect(typeof course!.registrationCount).toBe("number");
  });

  it("returns null for non-existent course", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const course = await caller.publicCourses.getById({ id: 999999 });
    expect(course).toBeNull();
  });

  it("validates registration input", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Should reject invalid email
    await expect(
      caller.publicCourses.register({
        courseId: 1,
        fullName: "Test User",
        email: "invalid-email",
        phone: "+966500000000",
      })
    ).rejects.toThrow();
  });

  it("validates required fields for registration", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Should reject empty name
    await expect(
      caller.publicCourses.register({
        courseId: 1,
        fullName: "",
        email: "test@example.com",
        phone: "+966500000000",
      })
    ).rejects.toThrow();
  });
});

describe("publicServices", () => {
  it("lists active public services without authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const services = await caller.publicServices.list();

    expect(Array.isArray(services)).toBe(true);
    // All returned services should be active
    for (const service of services) {
      expect(service.isActive).toBe(true);
    }
  });

  it("gets a public service by ID", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const services = await caller.publicServices.list();
    if (services.length === 0) {
      return; // Skip if no services exist
    }

    const serviceId = services[0].id;
    const service = await caller.publicServices.getById({ id: serviceId });

    expect(service).not.toBeNull();
    expect(service!.id).toBe(serviceId);
    expect(service!.name).toBeTruthy();
  });

  it("returns null for non-existent service", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const service = await caller.publicServices.getById({ id: 999999 });
    expect(service).toBeNull();
  });

  it("validates service order input", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Should reject invalid email
    await expect(
      caller.publicServices.order({
        serviceId: 1,
        fullName: "Test User",
        email: "invalid-email",
        phone: "+966500000000",
      })
    ).rejects.toThrow();
  });

  it("validates required fields for service order", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Should reject empty name
    await expect(
      caller.publicServices.order({
        serviceId: 1,
        fullName: "",
        email: "test@example.com",
        phone: "+966500000000",
      })
    ).rejects.toThrow();
  });
});

describe("publicCourses.listRegistrations requires auth", () => {
  it("rejects unauthenticated access to listRegistrations", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // listRegistrations is a protected procedure
    await expect(
      caller.publicCourses.listRegistrations({})
    ).rejects.toThrow();
  });
});

describe("publicServices.listOrders requires auth", () => {
  it("rejects unauthenticated access to listOrders", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // listOrders is a protected procedure
    await expect(
      caller.publicServices.listOrders({})
    ).rejects.toThrow();
  });
});
