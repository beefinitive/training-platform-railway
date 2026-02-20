CREATE TABLE `innovativeIdeas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`submittedBy` varchar(255),
	`submissionDate` date NOT NULL,
	`status` enum('pending','approved','implemented','rejected') NOT NULL DEFAULT 'pending',
	`implementationDate` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `innovativeIdeas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partnerships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('entity','individual') NOT NULL,
	`contactPerson` varchar(255),
	`phone` varchar(50),
	`email` varchar(320),
	`partnershipDate` date NOT NULL,
	`description` text,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partnerships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strategicTargets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('direct_courses','recorded_courses','customers','annual_profit','entity_partnerships','individual_partnerships','innovative_ideas','service_quality','customer_satisfaction','website_quality') NOT NULL,
	`targetValue` decimal(10,2) NOT NULL,
	`year` int NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategicTargets_id` PRIMARY KEY(`id`)
);
