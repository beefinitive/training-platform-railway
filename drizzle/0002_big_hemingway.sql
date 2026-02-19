CREATE TABLE `courseEnrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`feeId` int NOT NULL,
	`traineeCount` int NOT NULL DEFAULT 0,
	`paidAmount` decimal(10,2) NOT NULL,
	`enrollmentDate` date NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courseEnrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courseExpenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`category` enum('certificates','instructor','marketing','tax','other') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`description` text,
	`expenseDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `courseExpenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `enrollments`;--> statement-breakpoint
DROP TABLE `expenses`;--> statement-breakpoint
DROP TABLE `trainees`;--> statement-breakpoint
ALTER TABLE `courseFees` DROP FOREIGN KEY `courseFees_courseId_courses_id_fk`;
--> statement-breakpoint
ALTER TABLE `courses` DROP FOREIGN KEY `courses_createdBy_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `courses` DROP COLUMN `createdBy`;