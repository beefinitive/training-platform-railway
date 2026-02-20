CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollmentId` int NOT NULL,
	`userId` int NOT NULL,
	`recordedCourseId` int NOT NULL,
	`certificateNumber` varchar(100) NOT NULL,
	`studentName` varchar(255) NOT NULL,
	`courseName` varchar(500) NOT NULL,
	`instructorName` varchar(255),
	`completionDate` timestamp NOT NULL,
	`certificateUrl` text,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `certificates_certificateNumber_unique` UNIQUE(`certificateNumber`)
);
--> statement-breakpoint
CREATE TABLE `course_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recordedCourseId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`reviewText` text,
	`isApproved` boolean NOT NULL DEFAULT true,
	`isVisible` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`recordedCourseId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'SAR',
	`paymentMethod` enum('tap','tabby') NOT NULL,
	`paymentStatus` enum('pending','completed','failed','refunded','cancelled') NOT NULL DEFAULT 'pending',
	`externalPaymentId` varchar(255),
	`externalSessionId` varchar(255),
	`redirectUrl` text,
	`metadata` json,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
