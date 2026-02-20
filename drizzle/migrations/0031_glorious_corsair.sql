CREATE TABLE `projectExpenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`description` varchar(500) NOT NULL,
	`expenseDate` date NOT NULL,
	`category` enum('salaries','materials','marketing','operations','other') NOT NULL DEFAULT 'other',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectExpenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectRevenues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`description` varchar(500) NOT NULL,
	`revenueDate` date NOT NULL,
	`category` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectRevenues_id` PRIMARY KEY(`id`)
);
