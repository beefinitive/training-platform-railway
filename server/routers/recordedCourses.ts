import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { adminProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { storagePut } from "../storage";
import { TRPCError } from "@trpc/server";

export const recordedCoursesRouter = router({
  // --- CRUD for recorded courses ---
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      instructorId: z.number(),
      category: z.string().optional(),
      level: z.enum(["beginner", "intermediate", "advanced", "all_levels"]).optional(),
      language: z.string().optional(),
      shortDescription: z.string().optional(),
      detailedDescription: z.string().optional(),
      requirements: z.string().optional(), // JSON
      whatYouLearn: z.string().optional(), // JSON
      thumbnailUrl: z.string().optional(),
      promoVideoUrl: z.string().optional(),
      price: z.string().optional(),
      discountPrice: z.string().optional(),
      commissionRate: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Generate slug from title
      const slug = input.title
        .toLowerCase()
        .replace(/[^\u0621-\u064Aa-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 200) + '-' + Date.now().toString(36);

      const id = await db.createRecordedCourse({
        ...input,
        slug,
        submittedByUserId: ctx.user.id,
        price: input.price || "0",
        status: "draft",
      });
      return { success: true, id };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getRecordedCourseWithContent(input.id);
    }),

  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      instructorId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.listRecordedCourses(input);
    }),

  // Get courses submitted by the current user (trainer view)
  myCourses: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getRecordedCoursesByInstructorUser(ctx.user.id);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      category: z.string().optional(),
      level: z.enum(["beginner", "intermediate", "advanced", "all_levels"]).optional(),
      language: z.string().optional(),
      shortDescription: z.string().optional(),
      detailedDescription: z.string().optional(),
      requirements: z.string().optional(),
      whatYouLearn: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      promoVideoUrl: z.string().optional(),
      price: z.string().optional(),
      discountPrice: z.string().nullable().optional(),
      commissionRate: z.string().optional(),
      isFeatured: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateRecordedCourse(id, data as any);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteRecordedCourse(input.id);
      return { success: true };
    }),

  // Submit for review
  submitForReview: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const course = await db.getRecordedCourseById(input.id);
      if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "الدورة غير موجودة" });
      if (course.submittedByUserId !== ctx.user.id && ctx.user.roleId !== 1) {
        throw new TRPCError({ code: "FORBIDDEN", message: "غير مصرح" });
      }
      await db.updateRecordedCourse(input.id, { status: "pending_review" });
      return { success: true };
    }),

  // Admin: Review course
  reviewCourse: adminProcedure
    .input(z.object({
      id: z.number(),
      action: z.enum(["approve", "request_changes", "reject"]),
      reviewNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const statusMap = {
        approve: "approved" as const,
        request_changes: "changes_requested" as const,
        reject: "rejected" as const,
      };
      await db.updateRecordedCourse(input.id, {
        status: statusMap[input.action],
        reviewedBy: ctx.user.id,
        reviewedAt: new Date(),
        reviewNotes: input.reviewNotes,
      });
      return { success: true };
    }),

  // Admin: Publish/Unpublish course
  togglePublish: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const course = await db.getRecordedCourseById(input.id);
      if (!course) throw new TRPCError({ code: "NOT_FOUND" });
      const newStatus = course.status === "published" ? "unpublished" : "published";
      await db.updateRecordedCourse(input.id, {
        status: newStatus,
        publishedAt: newStatus === "published" ? new Date() : undefined,
      });
      return { success: true, status: newStatus };
    }),

  // --- Sections ---
  sections: router({
    create: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createSection(input);
        return { success: true, id };
      }),

    list: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ input }) => {
        return db.listSections(input.courseId);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateSection(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSection(input.id);
        return { success: true };
      }),
  }),

  // --- Lessons ---
  lessons: router({
    create: protectedProcedure
      .input(z.object({
        sectionId: z.number(),
        courseId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        lessonType: z.enum(["video", "quiz", "text"]).optional(),
        videoUrl: z.string().optional(),
        videoSource: z.enum(["upload", "youtube", "vimeo"]).optional(),
        duration: z.number().optional(),
        textContent: z.string().optional(),
        sortOrder: z.number().optional(),
        isFreePreview: z.boolean().optional(),
        resourcesUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createLesson(input);
        await db.updateRecordedCourseStats(input.courseId);
        return { success: true, id };
      }),

    list: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ input }) => {
        return db.listLessons(input.courseId);
      }),

    listBySection: protectedProcedure
      .input(z.object({ sectionId: z.number() }))
      .query(async ({ input }) => {
        return db.listLessonsBySection(input.sectionId);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        courseId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        lessonType: z.enum(["video", "quiz", "text"]).optional(),
        videoUrl: z.string().optional(),
        videoSource: z.enum(["upload", "youtube", "vimeo"]).optional(),
        duration: z.number().optional(),
        textContent: z.string().optional(),
        sortOrder: z.number().optional(),
        isFreePreview: z.boolean().optional(),
        resourcesUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, courseId, ...data } = input;
        await db.updateLesson(id, data);
        await db.updateRecordedCourseStats(courseId);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number(), courseId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteLesson(input.id);
        await db.updateRecordedCourseStats(input.courseId);
        return { success: true };
      }),
  }),

  // --- Enrollments ---
  enrollments: router({
    create: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        fullName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        paidAmount: z.string().optional(),
        paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional(),
        paymentMethod: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if already enrolled
        const existing = await db.getEnrollmentByUserAndCourse(ctx.user.id, input.courseId);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "أنت مسجل بالفعل في هذه الدورة" });

        const id = await db.createRecordedEnrollment({
          ...input,
          userId: ctx.user.id,
          paidAmount: input.paidAmount || "0",
        });

        // Create earning record for instructor
        const course = await db.getRecordedCourseById(input.courseId);
        if (course && parseFloat(input.paidAmount || "0") > 0) {
          const totalAmount = parseFloat(input.paidAmount || "0");
          const commissionRate = parseFloat(course.commissionRate as string || "30") / 100;
          const platformCommission = totalAmount * commissionRate;
          const instructorAmount = totalAmount - platformCommission;
          await db.createInstructorEarning({
            instructorId: course.instructorId,
            courseId: input.courseId,
            enrollmentId: id,
            totalAmount: totalAmount.toFixed(2),
            platformCommission: platformCommission.toFixed(2),
            instructorAmount: instructorAmount.toFixed(2),
          });
        }

        return { success: true, id };
      }),

    list: adminProcedure
      .input(z.object({ courseId: z.number().optional() }))
      .query(async ({ input }) => {
        return db.listRecordedEnrollments(input.courseId);
      }),

    myEnrollments: protectedProcedure
      .query(async ({ ctx }) => {
        const db2 = await db.getDb();
        if (!db2) return [];
        const { recordedCourseEnrollments } = await import("../../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        return db2.select().from(recordedCourseEnrollments)
          .where(eq(recordedCourseEnrollments.userId, ctx.user.id))
          .orderBy(desc(recordedCourseEnrollments.enrolledAt));
      }),
  }),

  // --- Progress ---
  progress: router({
    update: protectedProcedure
      .input(z.object({
        enrollmentId: z.number(),
        lessonId: z.number(),
        courseId: z.number(),
        isCompleted: z.boolean().optional(),
        watchedSeconds: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.upsertLessonProgress({
          ...input,
          userId: ctx.user.id,
          completedAt: input.isCompleted ? new Date() : undefined,
        });
        return { success: true };
      }),

    getForEnrollment: protectedProcedure
      .input(z.object({ enrollmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getLessonProgressForEnrollment(input.enrollmentId);
      }),
  }),

  // --- Reviews ---
  reviews: router({
    create: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        enrollmentId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createReview({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true, id };
      }),

    list: publicProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ input }) => {
        return db.listReviews(input.courseId);
      }),
  }),

  // --- Instructor Earnings ---
  earnings: router({
    myEarnings: protectedProcedure
      .query(async ({ ctx }) => {
        // Get instructor linked to this user
        const db2 = await db.getDb();
        if (!db2) return { earnings: [], summary: { totalEarnings: 0, pendingEarnings: 0, paidEarnings: 0, totalEnrollments: 0 } };
        const { instructors } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        // Find courses submitted by this user to get instructor ID
        const courses = await db.getRecordedCoursesByInstructorUser(ctx.user.id);
        if (courses.length === 0) return { earnings: [], summary: { totalEarnings: 0, pendingEarnings: 0, paidEarnings: 0, totalEnrollments: 0 } };
        
        const instructorId = courses[0].instructorId;
        const earnings = await db.getInstructorEarnings(instructorId);
        const summary = await db.getInstructorEarningsSummary(instructorId);
        return { earnings, summary };
      }),

    listAll: adminProcedure
      .input(z.object({ instructorId: z.number().optional() }))
      .query(async ({ input }) => {
        if (input.instructorId) {
          return db.getInstructorEarnings(input.instructorId);
        }
        const db2 = await db.getDb();
        if (!db2) return [];
        const { instructorEarnings } = await import("../../drizzle/schema");
        const { desc } = await import("drizzle-orm");
        return db2.select().from(instructorEarnings).orderBy(desc(instructorEarnings.createdAt));
      }),

    markPaid: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db2 = await db.getDb();
        if (!db2) throw new Error("Database not available");
        const { instructorEarnings } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db2.update(instructorEarnings)
          .set({ status: "paid", paidAt: new Date() })
          .where(eq(instructorEarnings.id, input.id));
        return { success: true };
      }),
  }),

  // --- Public endpoints ---
  public: router({
    listPublished: publicProcedure
      .query(async () => {
        return db.listPublishedRecordedCourses();
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const db2 = await db.getDb();
        if (!db2) return null;
        const { recordedCourses } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [course] = await db2.select().from(recordedCourses)
          .where(eq(recordedCourses.slug, input.slug));
        if (!course) return null;
        return db.getRecordedCourseWithContent(course.id);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getRecordedCourseWithContent(input.id);
      }),

    logView: publicProcedure
      .input(z.object({ courseId: z.number(), source: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        await db.logCourseView(input.courseId, ctx.user?.id, input.source);
        return { success: true };
      }),
  }),

  // --- Stats for admin dashboard ---
  stats: adminProcedure
    .query(async () => {
      const db2 = await db.getDb();
      if (!db2) return { totalCourses: 0, publishedCourses: 0, pendingReview: 0, totalEnrollments: 0, totalRevenue: 0 };
      const { recordedCourses, recordedCourseEnrollments } = await import("../../drizzle/schema");
      const { eq, sql } = await import("drizzle-orm");
      
      const allCourses = await db2.select().from(recordedCourses);
      const totalCourses = allCourses.length;
      const publishedCourses = allCourses.filter(c => c.status === "published").length;
      const pendingReview = allCourses.filter(c => c.status === "pending_review").length;
      const totalEnrollments = allCourses.reduce((sum, c) => sum + (c.totalEnrollments || 0), 0);
      const totalRevenue = allCourses.reduce((sum, c) => sum + parseFloat(c.totalRevenue as string || "0"), 0);
      
      return { totalCourses, publishedCourses, pendingReview, totalEnrollments, totalRevenue };
    }),

  // --- Quizzes ---
  quizzes: router({
    create: protectedProcedure
      .input(z.object({
        lessonId: z.number(),
        courseId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        passingScore: z.number().min(0).max(100).optional(),
        timeLimit: z.number().optional(),
        maxAttempts: z.number().optional(),
        shuffleQuestions: z.boolean().optional(),
        showCorrectAnswers: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createQuiz(input);
        // Update lesson to reference quiz
        await db.updateLesson(input.lessonId, { quizId: id, lessonType: "quiz" });
        return { success: true, id };
      }),

    getByLesson: protectedProcedure
      .input(z.object({ lessonId: z.number() }))
      .query(async ({ input }) => {
        return db.getQuizByLessonId(input.lessonId);
      }),

    getWithQuestions: protectedProcedure
      .input(z.object({ quizId: z.number() }))
      .query(async ({ input }) => {
        return db.getQuizWithQuestions(input.quizId);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        passingScore: z.number().min(0).max(100).optional(),
        timeLimit: z.number().nullable().optional(),
        maxAttempts: z.number().optional(),
        shuffleQuestions: z.boolean().optional(),
        showCorrectAnswers: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateQuiz(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number(), lessonId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteQuiz(input.id);
        await db.updateLesson(input.lessonId, { quizId: null, lessonType: "video" });
        return { success: true };
      }),

    // --- Questions ---
    addQuestion: protectedProcedure
      .input(z.object({
        quizId: z.number(),
        questionType: z.enum(["multiple_choice", "true_false", "short_answer"]),
        questionText: z.string().min(1),
        questionImage: z.string().optional(),
        explanation: z.string().optional(),
        points: z.number().optional(),
        sortOrder: z.number().optional(),
        answers: z.array(z.object({
          answerText: z.string().min(1),
          isCorrect: z.boolean(),
          sortOrder: z.number().optional(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const { answers, ...questionData } = input;
        const questionId = await db.createQuizQuestion(questionData);
        if (answers && answers.length > 0) {
          await db.setQuizAnswers(Number(questionId), answers.map((a, i) => ({
            questionId: Number(questionId),
            answerText: a.answerText,
            isCorrect: a.isCorrect,
            sortOrder: a.sortOrder ?? i,
          })));
        }
        return { success: true, id: questionId };
      }),

    updateQuestion: protectedProcedure
      .input(z.object({
        id: z.number(),
        questionType: z.enum(["multiple_choice", "true_false", "short_answer"]).optional(),
        questionText: z.string().optional(),
        questionImage: z.string().nullable().optional(),
        explanation: z.string().nullable().optional(),
        points: z.number().optional(),
        sortOrder: z.number().optional(),
        answers: z.array(z.object({
          answerText: z.string().min(1),
          isCorrect: z.boolean(),
          sortOrder: z.number().optional(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, answers, ...data } = input;
        await db.updateQuizQuestion(id, data);
        if (answers) {
          await db.setQuizAnswers(id, answers.map((a, i) => ({
            questionId: id,
            answerText: a.answerText,
            isCorrect: a.isCorrect,
            sortOrder: a.sortOrder ?? i,
          })));
        }
        return { success: true };
      }),

    deleteQuestion: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteQuizQuestion(input.id);
        return { success: true };
      }),

    // --- Student quiz attempts ---
    submitAttempt: protectedProcedure
      .input(z.object({
        quizId: z.number(),
        enrollmentId: z.number(),
        answers: z.array(z.object({
          questionId: z.number(),
          selectedAnswerId: z.number().optional(),
          shortAnswer: z.string().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const quiz = await db.getQuizWithQuestions(input.quizId);
        if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });

        // Check max attempts
        if (quiz.maxAttempts && quiz.maxAttempts > 0) {
          const attempts = await db.getQuizAttempts(input.quizId, ctx.user.id);
          if (attempts.length >= (quiz.maxAttempts || 0)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "لقد استنفذت جميع المحاولات المتاحة" });
          }
        }

        // Grade the quiz
        let totalPoints = 0;
        let earnedPoints = 0;
        const gradedAnswers = input.answers.map(ans => {
          const question = quiz.questions.find(q => q.id === ans.questionId);
          if (!question) return { ...ans, isCorrect: false };
          totalPoints += question.points;

          let isCorrect = false;
          if (question.questionType === "short_answer") {
            const correctAnswer = question.answers.find(a => a.isCorrect);
            isCorrect = correctAnswer ? correctAnswer.answerText.trim().toLowerCase() === (ans.shortAnswer || "").trim().toLowerCase() : false;
          } else {
            const correctAnswer = question.answers.find(a => a.isCorrect);
            isCorrect = correctAnswer ? correctAnswer.id === ans.selectedAnswerId : false;
          }

          if (isCorrect) earnedPoints += question.points;
          return { ...ans, isCorrect };
        });

        const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        const isPassed = score >= quiz.passingScore;

        const attemptId = await db.createQuizAttempt({
          quizId: input.quizId,
          userId: ctx.user.id,
          enrollmentId: input.enrollmentId,
          score,
          totalPoints: earnedPoints,
          maxPoints: totalPoints,
          isPassed,
          answers: gradedAnswers,
          completedAt: new Date(),
        });

        return { success: true, attemptId, score, isPassed, totalPoints: earnedPoints, maxPoints: totalPoints, gradedAnswers };
      }),

    getAttempts: protectedProcedure
      .input(z.object({ quizId: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getQuizAttempts(input.quizId, ctx.user.id);
      }),
  }),

  // --- File upload for videos ---
  uploadVideo: protectedProcedure
    .input(z.object({
      courseId: z.number(),
      fileName: z.string(),
      contentType: z.string(),
      fileData: z.string(), // base64
    }))
    .mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.fileData, "base64");
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const fileKey = `recorded-courses/${input.courseId}/videos/${input.fileName}-${randomSuffix}`;
      const { url } = await storagePut(fileKey, buffer, input.contentType);
      return { success: true, url };
    }),
});
