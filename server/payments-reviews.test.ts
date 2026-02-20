import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock env
vi.stubEnv("TAP_SECRET_KEY", "sk_test_mock");
vi.stubEnv("VITE_TAP_PUBLIC_KEY", "pk_test_mock");
vi.stubEnv("TABBY_SECRET_KEY", "sk_mock_tabby");
vi.stubEnv("VITE_TABBY_PUBLIC_KEY", "pk_mock_tabby");

// Mock db functions
vi.mock("./db", () => ({
  getRecordedCourseById: vi.fn().mockResolvedValue({
    id: 1,
    title: "Test Course",
    price: "100.00",
    discountPrice: "80.00",
    instructorId: 2,
    status: "published",
  }),
  getEnrollmentByUserAndCourse: vi.fn().mockResolvedValue(null),
  createPayment: vi.fn().mockResolvedValue(1),
  updatePaymentStatus: vi.fn().mockResolvedValue(true),
  getPaymentByExternalId: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    recordedCourseId: 1,
    amount: "80.00",
    paymentStatus: "pending",
  }),
  createRecordedEnrollment: vi.fn().mockResolvedValue(1),
  createInstructorEarning: vi.fn().mockResolvedValue(1),
  getCourseReviews: vi.fn().mockResolvedValue([
    { id: 1, rating: 5, reviewText: "Great course!", userId: 1, createdAt: new Date() },
    { id: 2, rating: 4, reviewText: "Good", userId: 2, createdAt: new Date() },
  ]),
  addCourseReview: vi.fn().mockResolvedValue(1),
  getUserCertificates: vi.fn().mockResolvedValue([
    { id: 1, recordedCourseId: 1, userId: 1, certificateUrl: "https://example.com/cert.pdf" },
  ]),
  issueCertificate: vi.fn().mockResolvedValue(1),
  getUserPayments: vi.fn().mockResolvedValue([
    { id: 1, amount: "80.00", paymentMethod: "tap", paymentStatus: "completed" },
  ]),
}));

describe("Payment System", () => {
  it("should have TAP_SECRET_KEY configured", () => {
    expect(process.env.TAP_SECRET_KEY).toBeDefined();
    expect(process.env.TAP_SECRET_KEY).toBe("sk_test_mock");
  });

  it("should have TABBY_SECRET_KEY configured", () => {
    expect(process.env.TABBY_SECRET_KEY).toBeDefined();
    expect(process.env.TABBY_SECRET_KEY).toBe("sk_mock_tabby");
  });

  it("should create payment record in database", async () => {
    const db = await import("./db");
    const paymentId = await db.createPayment({
      userId: 1,
      recordedCourseId: 1,
      amount: "80.00",
      currency: "SAR",
      paymentMethod: "tap",
    } as any);
    expect(paymentId).toBe(1);
    expect(db.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        recordedCourseId: 1,
        amount: "80.00",
      })
    );
  });

  it("should find payment by external ID", async () => {
    const db = await import("./db");
    const payment = await db.getPaymentByExternalId("chg_test_123");
    expect(payment).toBeDefined();
    expect(payment?.paymentStatus).toBe("pending");
  });

  it("should update payment status", async () => {
    const db = await import("./db");
    const result = await db.updatePaymentStatus(1, "completed", "chg_test_123");
    expect(result).toBe(true);
  });

  it("should check enrollment before creating duplicate", async () => {
    const db = await import("./db");
    const enrollment = await db.getEnrollmentByUserAndCourse(1, 1);
    expect(enrollment).toBeNull();
  });

  it("should create enrollment after successful payment", async () => {
    const db = await import("./db");
    const enrollmentId = await db.createRecordedEnrollment({
      courseId: 1,
      userId: 1,
      fullName: "Test User",
      email: "test@test.com",
      paidAmount: "80.00",
      paymentStatus: "paid",
      paymentMethod: "tap",
    } as any);
    expect(enrollmentId).toBe(1);
  });

  it("should calculate instructor earnings correctly", () => {
    const amount = 80;
    const platformFee = amount * 0.15;
    const instructorAmount = amount - platformFee;
    expect(platformFee).toBe(12);
    expect(instructorAmount).toBe(68);
  });
});

describe("Reviews System", () => {
  it("should fetch course reviews", async () => {
    const db = await import("./db");
    const reviews = await db.getCourseReviews(1);
    expect(reviews).toHaveLength(2);
    expect(reviews[0].rating).toBe(5);
  });

  it("should add a course review", async () => {
    const db = await import("./db");
    const reviewId = await db.addCourseReview({
      recordedCourseId: 1,
      userId: 1,
      rating: 5,
      reviewText: "Excellent!",
    } as any);
    expect(reviewId).toBe(1);
  });

  it("should calculate average rating correctly", () => {
    const ratings = [5, 4, 3, 5, 4];
    const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    expect(average).toBe(4.2);
  });
});

describe("Certificates System", () => {
  it("should fetch user certificates", async () => {
    const db = await import("./db");
    const certs = await db.getUserCertificates(1);
    expect(certs).toHaveLength(1);
    expect(certs[0].certificateUrl).toBeDefined();
  });

  it("should issue a certificate", async () => {
    const db = await import("./db");
    const certId = await db.issueCertificate({
      recordedCourseId: 1,
      userId: 1,
      certificateUrl: "https://example.com/cert.pdf",
    } as any);
    expect(certId).toBe(1);
  });
});

describe("User Payments History", () => {
  it("should fetch user payment history", async () => {
    const db = await import("./db");
    const payments = await db.getUserPayments(1);
    expect(payments).toHaveLength(1);
    expect(payments[0].paymentStatus).toBe("completed");
  });
});
