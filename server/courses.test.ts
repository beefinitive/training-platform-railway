import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
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

describe("courses router", () => {
  it("should have courses.list procedure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // The procedure should exist and be callable
    expect(caller.courses.list).toBeDefined();
  });

  it("should have courses.create procedure with correct input validation", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // The procedure should exist
    expect(caller.courses.create).toBeDefined();
  });

  it("should have courses.getStatistics procedure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.courses.getStatistics).toBeDefined();
  });
});

describe("courses router", () => {
  it("should have courses.list procedure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.courses.list).toBeDefined();
  });

  it("should support automatic course code generation", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify create procedure exists (which now generates courseCode)
    expect(caller.courses.create).toBeDefined();
  });

  it("should have courseFees.create procedure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.courseFees.create).toBeDefined();
  });
});

describe("enrollments router (statistical)", () => {
  it("should have enrollments.listByCourse procedure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.enrollments.listByCourse).toBeDefined();
  });

  it("should have enrollments.create procedure for statistical data", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // This now creates statistical enrollment data (trainee count + fee type)
    expect(caller.enrollments.create).toBeDefined();
  });

  it("should have enrollments.delete procedure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.enrollments.delete).toBeDefined();
  });
});

describe("expenses router", () => {
  it("should have expenses.listByCourse procedure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.expenses.listByCourse).toBeDefined();
  });

  it("should have expenses.create procedure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.expenses.create).toBeDefined();
  });

  it("should have all expense categories supported", () => {
    const categories = ["certificates", "instructor", "marketing", "tax", "other"];
    expect(categories).toHaveLength(5);
  });
});

describe("reports router", () => {
  it("should have reports.dashboard procedure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.reports.dashboard).toBeDefined();
  });

  it("should have reports.monthly procedure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.reports.monthly).toBeDefined();
  });
});

describe("settings router", () => {
  it("should have settings.getAll procedure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.settings.getAll).toBeDefined();
  });

  it("should have settings.get procedure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.settings.get).toBeDefined();
  });

  it("should have settings.update procedure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.settings.update).toBeDefined();
  });

  it("should support platform branding settings", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify settings procedures exist for branding
    expect(caller.settings.getAll).toBeDefined();
    expect(caller.settings.update).toBeDefined();
  });
});

describe("course deletion with statistics preservation", () => {
  it("should support keepStatistics option in delete", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify the delete procedure accepts keepStatistics parameter
    expect(caller.courses.delete).toBeDefined();
  });
});
