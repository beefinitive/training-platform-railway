CREATE TABLE `course_view_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`userId` int,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	`source` varchar(100),
	CONSTRAINT `course_view_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `instructor_earnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instructorId` int NOT NULL,
	`courseId` int NOT NULL,
	`enrollmentId` int NOT NULL,
	`totalAmount` decimal(10,2) NOT NULL,
	`platformCommission` decimal(10,2) NOT NULL,
	`instructorAmount` decimal(10,2) NOT NULL,
	`status` enum('pending','approved','paid') NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `instructor_earnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollmentId` int NOT NULL,
	`lessonId` int NOT NULL,
	`courseId` int NOT NULL,
	`userId` int,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`watchedSeconds` int DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recorded_course_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`userId` int,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`paidAmount` decimal(10,2) NOT NULL DEFAULT '0',
	`paymentStatus` enum('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
	`paymentMethod` varchar(50),
	`stripePaymentIntentId` varchar(255),
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`status` enum('active','expired','cancelled','refunded') NOT NULL DEFAULT 'active',
	`completionPercentage` decimal(5,2) DEFAULT '0',
	`lastAccessedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recorded_course_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recorded_course_lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectionId` int NOT NULL,
	`courseId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`videoUrl` text,
	`duration` int DEFAULT 0,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isFreePreview` boolean NOT NULL DEFAULT false,
	`resourcesUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recorded_course_lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recorded_course_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`enrollmentId` int NOT NULL,
	`userId` int,
	`rating` int NOT NULL,
	`comment` text,
	`isApproved` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recorded_course_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recorded_course_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recorded_course_sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recorded_courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(300),
	`instructorId` int NOT NULL,
	`submittedByUserId` int,
	`category` varchar(100),
	`level` enum('beginner','intermediate','advanced','all_levels') NOT NULL DEFAULT 'all_levels',
	`language` varchar(50) DEFAULT 'العربية',
	`shortDescription` varchar(500),
	`detailedDescription` text,
	`requirements` text,
	`whatYouLearn` text,
	`thumbnailUrl` text,
	`promoVideoUrl` text,
	`price` decimal(10,2) NOT NULL DEFAULT '0',
	`discountPrice` decimal(10,2),
	`commissionRate` decimal(5,2) DEFAULT '30',
	`totalDuration` int DEFAULT 0,
	`totalLessons` int DEFAULT 0,
	`status` enum('draft','pending_review','changes_requested','approved','published','unpublished','rejected') NOT NULL DEFAULT 'draft',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`publishedAt` timestamp,
	`totalEnrollments` int DEFAULT 0,
	`totalViews` int DEFAULT 0,
	`averageRating` decimal(3,2) DEFAULT '0',
	`totalRevenue` decimal(12,2) DEFAULT '0',
	`isFeatured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recorded_courses_id` PRIMARY KEY(`id`),
	CONSTRAINT `recorded_courses_slug_unique` UNIQUE(`slug`)
);
