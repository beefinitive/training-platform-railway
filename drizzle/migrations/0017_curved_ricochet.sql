CREATE TABLE `attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`date` date NOT NULL,
	`checkIn` timestamp,
	`checkOut` timestamp,
	`totalHours` decimal(5,2),
	`status` enum('present','absent','late','half_day','on_leave') NOT NULL DEFAULT 'present',
	`notes` text,
	`ipAddress` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customerStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`totalTargeted` int NOT NULL DEFAULT 0,
	`totalConfirmed` int NOT NULL DEFAULT 0,
	`totalRegistered` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customerStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailyReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`reportDate` date NOT NULL,
	`targetedCustomers` int NOT NULL DEFAULT 0,
	`confirmedCustomers` int NOT NULL DEFAULT 0,
	`registeredCustomers` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dailyReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employeeRewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`targetId` int,
	`amount` decimal(10,2) NOT NULL,
	`reason` varchar(500) NOT NULL,
	`status` enum('pending','approved','paid','rejected') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvedAt` timestamp,
	`paidAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employeeRewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employeeTargets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`targetType` enum('daily_calls','confirmed_customers','registered_customers','campaigns','leads_generated','conversion_rate','features_completed','bugs_fixed','sales_amount','customer_satisfaction','attendance_hours','other') NOT NULL,
	`customName` varchar(255),
	`targetValue` decimal(10,2) NOT NULL,
	`currentValue` decimal(10,2) NOT NULL DEFAULT '0',
	`period` enum('daily','weekly','monthly','quarterly','yearly') NOT NULL DEFAULT 'monthly',
	`month` int,
	`year` int NOT NULL,
	`rewardAmount` decimal(10,2),
	`status` enum('in_progress','achieved','not_achieved') NOT NULL DEFAULT 'in_progress',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employeeTargets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`specialization` enum('customer_service','marketing','executive_manager','developer','support') NOT NULL,
	`userId` int,
	`hireDate` date NOT NULL,
	`salary` decimal(10,2),
	`workType` enum('remote','onsite','hybrid') NOT NULL DEFAULT 'remote',
	`status` enum('active','inactive','on_leave') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`)
);
