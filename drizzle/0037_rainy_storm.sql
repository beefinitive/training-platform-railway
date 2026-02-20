CREATE TABLE `course_display_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`isPublic` boolean NOT NULL DEFAULT false,
	`courseType` enum('online_live','onsite','recorded') NOT NULL DEFAULT 'online_live',
	`imageUrl` text,
	`shortDescription` varchar(500),
	`detailedDescription` text,
	`highlights` text,
	`targetAudience` text,
	`maxSeats` int,
	`currentSeats` int DEFAULT 0,
	`location` varchar(255),
	`meetingLink` text,
	`videoPreviewUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_display_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `course_display_settings_courseId_unique` UNIQUE(`courseId`)
);
--> statement-breakpoint
CREATE TABLE `public_registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`city` varchar(100),
	`organization` varchar(255),
	`notes` text,
	`source` varchar(100) DEFAULT 'website',
	`status` enum('pending','confirmed','cancelled','attended') NOT NULL DEFAULT 'pending',
	`paymentStatus` enum('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
	`feeId` int,
	`paidAmount` decimal(10,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `public_registrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `public_services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`shortDescription` varchar(500),
	`category` enum('marketing','training','consulting','design','other') NOT NULL DEFAULT 'other',
	`price` decimal(10,2) NOT NULL,
	`originalPrice` decimal(10,2),
	`imageUrl` text,
	`features` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `public_services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`organization` varchar(255),
	`requirements` text,
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`paymentStatus` enum('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
	`paidAmount` decimal(10,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `service_orders_id` PRIMARY KEY(`id`)
);
