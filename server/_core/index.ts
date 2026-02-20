import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut } from "../storage";
import multer from "multer";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // File upload API
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'لم يتم رفع ملف' });
      }
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileName = `employees/${timestamp}-${randomSuffix}-${req.file.originalname}`;
      const { url } = await storagePut(fileName, req.file.buffer, req.file.mimetype);
      res.json({ url, key: fileName });
    } catch (error: any) {
      console.error('خطأ في رفع الملف:', error);
      res.status(500).json({ error: error.message || 'حدث خطأ في رفع الملف' });
    }
  });
  // Tap Payment Webhook
  app.post('/api/webhooks/tap', async (req, res) => {
    try {
      const { id, status, reference, metadata } = req.body;
      console.log('[Tap Webhook]', { id, status, reference });
      if (status === 'CAPTURED') {
        const dbModule = await import('../db');
        // Update payment status
        const payment = await dbModule.getPaymentByExternalId(id);
        if (payment && payment.paymentStatus !== 'completed') {
          await dbModule.updatePaymentStatus(payment.id, 'completed', id);
          // Create enrollment
          if (payment.recordedCourseId && payment.userId) {
            const existingEnrollment = await dbModule.getEnrollmentByUserAndCourse(payment.userId, payment.recordedCourseId);
            if (!existingEnrollment) {
              await dbModule.createRecordedEnrollment({
                courseId: payment.recordedCourseId,
                userId: payment.userId,
                fullName: 'User',
                email: 'user@example.com',
                paidAmount: payment.amount,
                paymentStatus: 'paid',
                paymentMethod: 'tap',
              });
            }
            // Create instructor earning
            const course = await dbModule.getRecordedCourseById(payment.recordedCourseId);
            if (course) {
              const amount = parseFloat(payment.amount);
              const platformFee = amount * 0.15;
              const instructorAmount = amount - platformFee;
              await dbModule.createInstructorEarning({
                instructorId: course.instructorId,
                courseId: payment.recordedCourseId,
                enrollmentId: 0,
                totalAmount: amount.toString(),
                platformCommission: platformFee.toString(),
                instructorAmount: instructorAmount.toString(),
              });
            }
          }
        }
      }
      res.json({ received: true });
    } catch (error: any) {
      console.error('[Tap Webhook Error]', error);
      res.status(200).json({ received: true });
    }
  });

  // Tabby Payment Webhook
  app.post('/api/webhooks/tabby', async (req, res) => {
    try {
      const { id, status, order } = req.body;
      console.log('[Tabby Webhook]', { id, status });
      if (status === 'AUTHORIZED' || status === 'CLOSED') {
        const dbModule = await import('../db');
        const payment = await dbModule.getPaymentByExternalId(id);
        if (payment && payment.paymentStatus !== 'completed') {
          await dbModule.updatePaymentStatus(payment.id, 'completed', id);
          if (payment.recordedCourseId && payment.userId) {
            const existingEnrollment = await dbModule.getEnrollmentByUserAndCourse(payment.userId, payment.recordedCourseId);
            if (!existingEnrollment) {
              await dbModule.createRecordedEnrollment({
                courseId: payment.recordedCourseId,
                userId: payment.userId,
                fullName: 'User',
                email: 'user@example.com',
                paidAmount: payment.amount,
                paymentStatus: 'paid',
                paymentMethod: 'tabby',
              });
            }
            const course = await dbModule.getRecordedCourseById(payment.recordedCourseId);
            if (course) {
              const amount = parseFloat(payment.amount);
              const platformFee = amount * 0.15;
              const instructorAmount = amount - platformFee;
              await dbModule.createInstructorEarning({
                instructorId: course.instructorId,
                courseId: payment.recordedCourseId,
                enrollmentId: 0,
                totalAmount: amount.toString(),
                platformCommission: platformFee.toString(),
                instructorAmount: instructorAmount.toString(),
              });
            }
          }
        }
      }
      res.json({ received: true });
    } catch (error: any) {
      console.error('[Tabby Webhook Error]', error);
      res.status(200).json({ received: true });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
