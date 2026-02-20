CREATE TABLE `daily_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`date` date NOT NULL,
	`confirmedCustomers` int NOT NULL DEFAULT 0,
	`registeredCustomers` int NOT NULL DEFAULT 0,
	`targetedCustomers` int NOT NULL DEFAULT 0,
	`servicesSold` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_stats_id` PRIMARY KEY(`id`)
);
