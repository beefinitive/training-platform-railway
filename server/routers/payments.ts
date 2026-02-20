import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

// =============================================
// Tap Payments Helper
// =============================================
async function createTapCharge(params: {
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description: string;
  redirectUrl: string;
  postUrl?: string;
  metadata?: Record<string, string>;
}) {
  const TAP_SECRET = process.env.TAP_SECRET_KEY;
  if (!TAP_SECRET) throw new Error("TAP_SECRET_KEY not configured");

  const nameParts = params.customerName.split(" ");
  const firstName = nameParts[0] || "Customer";
  const lastName = nameParts.slice(1).join(" ") || "User";

  const body: any = {
    amount: params.amount,
    currency: params.currency,
    customer_initiated: true,
    threeDSecure: true,
    save_card: false,
    description: params.description,
    metadata: params.metadata || {},
    receipt: { email: true, sms: false },
    customer: {
      first_name: firstName,
      last_name: lastName,
      email: params.customerEmail,
    },
    source: { id: "src_all" },
    redirect: { url: params.redirectUrl },
  };

  if (params.postUrl) {
    body.post = { url: params.postUrl };
  }

  if (params.customerPhone) {
    body.customer.phone = {
      country_code: "966",
      number: params.customerPhone.replace(/^0+/, "").replace(/^\+966/, ""),
    };
  }

  const response = await fetch("https://api.tap.company/v2/charges/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TAP_SECRET}`,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Tap] Create charge failed:", errorText);
    throw new Error(`Tap API error: ${response.status}`);
  }

  return response.json();
}

async function retrieveTapCharge(chargeId: string) {
  const TAP_SECRET = process.env.TAP_SECRET_KEY;
  if (!TAP_SECRET) throw new Error("TAP_SECRET_KEY not configured");

  const response = await fetch(`https://api.tap.company/v2/charges/${chargeId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${TAP_SECRET}`,
      accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Tap] Retrieve charge failed:", errorText);
    throw new Error(`Tap API error: ${response.status}`);
  }

  return response.json();
}

// =============================================
// Tabby Payments Helper
// =============================================
async function createTabbySession(params: {
  amount: number;
  currency: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  description: string;
  courseName: string;
  courseId: number;
  successUrl: string;
  cancelUrl: string;
  failureUrl: string;
  merchantCode?: string;
}) {
  const TABBY_SECRET = process.env.TABBY_SECRET_KEY;
  if (!TABBY_SECRET) throw new Error("TABBY_SECRET_KEY not configured");

  const body = {
    payment: {
      amount: params.amount.toString(),
      currency: params.currency,
      buyer: {
        name: params.buyerName,
        email: params.buyerEmail,
        phone: params.buyerPhone || "500000001",
      },
      shipping_address: {
        city: "Riyadh",
        address: "Saudi Arabia",
        zip: "12345",
      },
      order: {
        reference_id: `course-${params.courseId}`,
        items: [
          {
            title: params.courseName,
            quantity: 1,
            unit_price: params.amount.toString(),
            category: "Education",
            reference_id: `course-${params.courseId}`,
            description: params.description,
          },
        ],
      },
      description: params.description,
      meta: {
        course_id: params.courseId.toString(),
      },
    },
    lang: "ar",
    merchant_code: params.merchantCode || "default",
    merchant_urls: {
      success: params.successUrl,
      cancel: params.cancelUrl,
      failure: params.failureUrl,
    },
  };

  const response = await fetch("https://api.tabby.ai/api/v2/checkout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TABBY_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Tabby] Create session failed:", errorText);
    throw new Error(`Tabby API error: ${response.status}`);
  }

  return response.json();
}

async function retrieveTabbyPayment(paymentId: string) {
  const TABBY_SECRET = process.env.TABBY_SECRET_KEY;
  if (!TABBY_SECRET) throw new Error("TABBY_SECRET_KEY not configured");

  const response = await fetch(`https://api.tabby.ai/api/v2/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${TABBY_SECRET}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Tabby] Retrieve payment failed:", errorText);
    throw new Error(`Tabby API error: ${response.status}`);
  }

  return response.json();
}

// =============================================
// Certificate Helper
// =============================================
function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${year}${month}-${random}`;
}

// =============================================
// PAYMENTS ROUTER
// =============================================
export const paymentsRouter = router({
  // Create payment with Tap
  createTapPayment: protectedProcedure
    .input(z.object({
      recordedCourseId: z.number(),
      returnUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get course details
      const course = await db.getRecordedCourseById(input.recordedCourseId);
      if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "الدورة غير موجودة" });

      // Check if already enrolled
      const existingEnrollment = await db.getEnrollmentByUserAndCourse(ctx.user.id, input.recordedCourseId);
      if (existingEnrollment) throw new TRPCError({ code: "BAD_REQUEST", message: "أنت مسجل بالفعل في هذه الدورة" });

      const amount = parseFloat(course.discountPrice || course.price || "0");
      if (amount <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "سعر الدورة غير صالح" });

      const origin = ctx.req.headers.origin || "https://localhost:3000";
      const redirectUrl = `${origin}/payment/callback?method=tap`;

      // Create Tap charge
      const charge = await createTapCharge({
        amount,
        currency: "SAR",
        customerName: ctx.user.name || "Customer",
        customerEmail: ctx.user.email,
        description: `تسجيل في دورة: ${course.title}`,
        redirectUrl,
        metadata: {
          user_id: ctx.user.id.toString(),
          course_id: input.recordedCourseId.toString(),
        },
      });

      // Save payment record
      const paymentId = await db.createPayment({
        userId: ctx.user.id,
        recordedCourseId: input.recordedCourseId,
        amount: amount.toString(),
        currency: "SAR",
        paymentMethod: "tap",
        paymentStatus: "pending",
        externalPaymentId: charge.id,
        redirectUrl: charge.transaction?.url || null,
        metadata: { chargeId: charge.id },
      });

      return {
        paymentId,
        chargeId: charge.id,
        redirectUrl: charge.transaction?.url,
        status: charge.status,
      };
    }),

  // Create payment with Tabby
  createTabbyPayment: protectedProcedure
    .input(z.object({
      recordedCourseId: z.number(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const course = await db.getRecordedCourseById(input.recordedCourseId);
      if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "الدورة غير موجودة" });

      const existingEnrollment = await db.getEnrollmentByUserAndCourse(ctx.user.id, input.recordedCourseId);
      if (existingEnrollment) throw new TRPCError({ code: "BAD_REQUEST", message: "أنت مسجل بالفعل في هذه الدورة" });

      const amount = parseFloat(course.discountPrice || course.price || "0");
      if (amount <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "سعر الدورة غير صالح" });

      const origin = ctx.req.headers.origin || "https://localhost:3000";

      const session = await createTabbySession({
        amount,
        currency: "SAR",
        buyerName: ctx.user.name || "Customer",
        buyerEmail: ctx.user.email,
        buyerPhone: input.phone || "500000001",
        description: `تسجيل في دورة: ${course.title}`,
        courseName: course.title,
        courseId: input.recordedCourseId,
        successUrl: `${origin}/payment/callback?method=tabby&status=success`,
        cancelUrl: `${origin}/payment/callback?method=tabby&status=cancel`,
        failureUrl: `${origin}/payment/callback?method=tabby&status=failure`,
      });

      // Get checkout URL from Tabby response
      const checkoutUrl = session.configuration?.available_products?.installments?.[0]?.web_url;
      const isAvailable = session.configuration?.products?.installments?.is_available;

      if (!isAvailable || !checkoutUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "خدمة التقسيط غير متاحة حالياً لهذا المبلغ. يرجى استخدام الدفع المباشر.",
        });
      }

      const paymentId = await db.createPayment({
        userId: ctx.user.id,
        recordedCourseId: input.recordedCourseId,
        amount: amount.toString(),
        currency: "SAR",
        paymentMethod: "tabby",
        paymentStatus: "pending",
        externalSessionId: session.id,
        externalPaymentId: session.payment?.id || null,
        redirectUrl: checkoutUrl,
        metadata: { sessionId: session.id, paymentId: session.payment?.id },
      });

      return {
        paymentId,
        sessionId: session.id,
        checkoutUrl,
        isAvailable,
      };
    }),

  // Verify Tap payment after redirect
  verifyTapPayment: protectedProcedure
    .input(z.object({ chargeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const charge = await retrieveTapCharge(input.chargeId);
      const payment = await db.getPaymentByExternalId(input.chargeId);

      if (!payment) throw new TRPCError({ code: "NOT_FOUND", message: "الدفعة غير موجودة" });
      if (payment.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      if (charge.status === "CAPTURED") {
        await db.updatePaymentStatus(payment.id, "completed", charge.id, new Date());
        
        // Auto-enroll user
        const existingEnrollment = await db.getEnrollmentByUserAndCourse(ctx.user.id, payment.recordedCourseId);
        if (!existingEnrollment) {
          await db.createRecordedEnrollment({
            courseId: payment.recordedCourseId,
            userId: ctx.user.id,
            fullName: ctx.user.name || ctx.user.email,
            email: ctx.user.email,
            paymentStatus: "paid",
            paidAmount: payment.amount,
            paymentMethod: "tap",
          });
        }

        // Add instructor earning
        const course = await db.getRecordedCourseById(payment.recordedCourseId);
        if (course) {
          const commissionRate = parseFloat(course.commissionRate || "30");
          const platformAmount = (parseFloat(payment.amount) * commissionRate) / 100;
          const instructorAmount = parseFloat(payment.amount) - platformAmount;
          await db.createInstructorEarning({
            courseId: payment.recordedCourseId,
            instructorId: course.instructorId,
            enrollmentId: 0,
            totalAmount: payment.amount,
            platformCommission: platformAmount.toFixed(2),
            instructorAmount: instructorAmount.toFixed(2),
            status: "pending",
          });
        }

        return { success: true, status: "completed" };
      } else {
        const status = charge.status === "FAILED" ? "failed" : "cancelled";
        await db.updatePaymentStatus(payment.id, status);
        return { success: false, status };
      }
    }),

  // Verify Tabby payment after redirect
  verifyTabbyPayment: protectedProcedure
    .input(z.object({ paymentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const payment = await db.getPaymentById(input.paymentId);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND", message: "الدفعة غير موجودة" });
      if (payment.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      if (payment.externalPaymentId) {
        try {
          const tabbyPayment = await retrieveTabbyPayment(payment.externalPaymentId);
          
          if (tabbyPayment.status === "AUTHORIZED" || tabbyPayment.status === "CLOSED") {
            await db.updatePaymentStatus(payment.id, "completed", payment.externalPaymentId, new Date());
            
            // Auto-enroll user
            const existingEnrollment = await db.getEnrollmentByUserAndCourse(ctx.user.id, payment.recordedCourseId);
            if (!existingEnrollment) {
          await db.createRecordedEnrollment({
            courseId: payment.recordedCourseId,
            userId: ctx.user.id,
            fullName: ctx.user.name || ctx.user.email,
            email: ctx.user.email,
            paymentStatus: "paid",
            paidAmount: payment.amount,
            paymentMethod: "tabby",
          });
            }

            // Add instructor earning
            const course = await db.getRecordedCourseById(payment.recordedCourseId);
            if (course) {
              const commissionRate = parseFloat(course.commissionRate || "30");
              const platformAmount = (parseFloat(payment.amount) * commissionRate) / 100;
              const instructorAmount = parseFloat(payment.amount) - platformAmount;
              await db.createInstructorEarning({
                courseId: payment.recordedCourseId,
                instructorId: course.instructorId,
                enrollmentId: 0,
                totalAmount: payment.amount,
                platformCommission: platformAmount.toFixed(2),
                instructorAmount: instructorAmount.toFixed(2),
                status: "pending",
              });
            }

            return { success: true, status: "completed" };
          }
        } catch (e) {
          console.error("[Tabby] Verify error:", e);
        }
      }

      return { success: false, status: "pending" };
    }),

  // Get user's payments
  myPayments: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserPayments(ctx.user.id);
  }),

  // Admin: list all payments
  listAll: protectedProcedure.query(async ({ ctx }) => {
    // Check admin role
    if (!ctx.user.roleId) throw new TRPCError({ code: "FORBIDDEN" });
    const role = await db.getRoleById(ctx.user.roleId);
    if (role?.name !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    return db.getAllPayments();
  }),
});

// =============================================
// REVIEWS ROUTER
// =============================================
export const reviewsRouter = router({
  // Get reviews for a course
  getCourseReviews: publicProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input }) => {
      const reviews = await db.getCourseReviewsNew(input.courseId);
      const stats = await db.getCourseAverageRating(input.courseId);
      return { reviews, ...stats };
    }),

  // Add a review
  addReview: protectedProcedure
    .input(z.object({
      recordedCourseId: z.number(),
      rating: z.number().min(1).max(5),
      reviewText: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is enrolled
      const enrollment = await db.getEnrollmentByUserAndCourse(ctx.user.id, input.recordedCourseId);
      if (!enrollment) throw new TRPCError({ code: "FORBIDDEN", message: "يجب أن تكون مسجلاً في الدورة لإضافة تقييم" });

      // Check if already reviewed
      const existing = await db.getUserCourseReview(input.recordedCourseId, ctx.user.id);
      if (existing) {
        // Update existing review
        await db.updateCourseReviewNew(existing.id, {
          rating: input.rating,
          reviewText: input.reviewText || null,
        });
        return { success: true, updated: true };
      }

      await db.createCourseReviewNew({
        recordedCourseId: input.recordedCourseId,
        userId: ctx.user.id,
        rating: input.rating,
        reviewText: input.reviewText || null,
      });
      return { success: true, updated: false };
    }),

  // Delete own review
  deleteReview: protectedProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteCourseReviewNew(input.reviewId);
      return { success: true };
    }),

  // Admin: list all reviews
  listAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.roleId) throw new TRPCError({ code: "FORBIDDEN" });
    const role = await db.getRoleById(ctx.user.roleId);
    if (role?.name !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    return db.getAllCourseReviewsAdmin();
  }),

  // Admin: toggle review visibility
  toggleVisibility: protectedProcedure
    .input(z.object({ reviewId: z.number(), isVisible: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.roleId) throw new TRPCError({ code: "FORBIDDEN" });
      const role = await db.getRoleById(ctx.user.roleId);
      if (role?.name !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await db.updateCourseReviewNew(input.reviewId, { isVisible: input.isVisible });
      return { success: true };
    }),
});

// =============================================
// CERTIFICATES ROUTER
// =============================================
export const certificatesRouter = router({
  // Check and issue certificate
  checkAndIssue: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Get enrollment - search by user and find matching
      const enrollments = await db.getUserCertificates(ctx.user.id);
      // We need to get enrollment from recorded enrollments
      const allEnrollments = await db.listRecordedEnrollments();
      const enrollment = allEnrollments.find(e => e.id === input.enrollmentId);
      if (!enrollment) throw new TRPCError({ code: "NOT_FOUND" });
      if (enrollment.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      // Check if already has certificate
      const existing = await db.getCertificateByEnrollment(input.enrollmentId);
      if (existing) return existing;

      // Check completion
      if (parseFloat(enrollment.completionPercentage || "0") < 100) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "يجب إكمال جميع الدروس أولاً" });
      }

      // Get course info
      const course = await db.getRecordedCourseById(enrollment.courseId);
      if (!course) throw new TRPCError({ code: "NOT_FOUND" });

      // Get instructor name
      const instructor = await db.getInstructorById(course.instructorId);

      const certNumber = generateCertificateNumber();
      const certId = await db.createCertificate({
        enrollmentId: input.enrollmentId,
        userId: ctx.user.id,
        recordedCourseId: enrollment.courseId,
        certificateNumber: certNumber,
        studentName: ctx.user.name || ctx.user.email,
        courseName: course.title,
        instructorName: instructor?.name || null,
        completionDate: new Date(),
      });

      return db.getCertificateByEnrollment(input.enrollmentId);
    }),

  // Get my certificates
  myCertificates: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserCertificates(ctx.user.id);
  }),

  // Verify certificate by number (public)
  verify: publicProcedure
    .input(z.object({ certificateNumber: z.string() }))
    .query(async ({ input }) => {
      const cert = await db.getCertificateByNumber(input.certificateNumber);
      if (!cert) return null;
      return {
        certificateNumber: cert.certificateNumber,
        studentName: cert.studentName,
        courseName: cert.courseName,
        instructorName: cert.instructorName,
        completionDate: cert.completionDate,
        issuedAt: cert.issuedAt,
      };
    }),
});
