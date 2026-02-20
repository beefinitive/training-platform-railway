CREATE TABLE `projectEmployees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`employeeId` int NOT NULL,
	`salaryPercentage` decimal(5,2) NOT NULL DEFAULT '100',
	`calculatedCost` decimal(10,2) NOT NULL DEFAULT '0',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectEmployees_id` PRIMARY KEY(`id`)
);
