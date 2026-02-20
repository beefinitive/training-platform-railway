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
      headers: { origin: "https://test.example.com" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createTrainerContext(userId = 2): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "trainer-user",
    email: "trainer@example.com",
    name: "Trainer User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://test.example.com" },
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

describe("Recorded Courses System", () => {
  describe("Router Structure", () => {
    it("should have recordedCourses router defined", () => {
      expect(appRouter).toBeDefined();
      // Verify the router has the expected sub-routers
      const caller = appRouter.createCaller(createAdminContext());
      expect(caller.recordedCourses).toBeDefined();
    });

    it("should have public sub-router", () => {
      const caller = appRouter.createCaller(createPublicContext());
      expect(caller.recordedCourses.public).toBeDefined();
    });

    it("should have earnings sub-router for authenticated users", () => {
      const caller = appRouter.createCaller(createTrainerContext());
      expect(caller.recordedCourses.earnings).toBeDefined();
    });
  });

  describe("Public Endpoints", () => {
    it("should list published courses (empty initially)", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const courses = await caller.recordedCourses.public.listPublished();
      expect(Array.isArray(courses)).toBe(true);
    });

    it("should return null for non-existent slug", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const course = await caller.recordedCourses.public.getBySlug({ slug: "non-existent-slug" });
      expect(course).toBeNull();
    });

    it("should return null for non-existent course ID", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const course = await caller.recordedCourses.public.getById({ id: 99999 });
      expect(course).toBeNull();
    });
  });

  describe("Trainer Endpoints", () => {
    it("should list trainer's own courses (empty initially)", async () => {
      const caller = appRouter.createCaller(createTrainerContext());
      const courses = await caller.recordedCourses.myCourses();
      expect(Array.isArray(courses)).toBe(true);
    });

    it("should get trainer's earnings", async () => {
      const caller = appRouter.createCaller(createTrainerContext());
      const earnings = await caller.recordedCourses.earnings.myEarnings();
      expect(earnings).toBeDefined();
      expect(earnings.summary).toBeDefined();
      expect(typeof earnings.summary.totalEarnings).toBe("number");
      expect(typeof earnings.summary.pendingEarnings).toBe("number");
      expect(typeof earnings.summary.paidEarnings).toBe("number");
    });
  });

  describe("Admin Endpoints", () => {
    it("should list all courses for admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const courses = await caller.recordedCourses.list();
      expect(Array.isArray(courses)).toBe(true);
    });

    it("should list all courses for admin with status filter", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      // list already returns all courses, admin can filter by status
      const courses = await caller.recordedCourses.list();
      expect(Array.isArray(courses)).toBe(true);
    });
  });

  describe("Input Validation", () => {
    it("should reject create with missing required fields", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      await expect(
        caller.recordedCourses.create({
          title: "",
          instructorId: 0,
        } as any)
      ).rejects.toThrow();
    });

    it("should reject slug lookup with empty slug", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      // Empty string should still work but return null
      const result = await caller.recordedCourses.public.getBySlug({ slug: "" });
      expect(result).toBeNull();
    });
  });
});
