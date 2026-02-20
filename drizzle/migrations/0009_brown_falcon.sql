CREATE TABLE `operationalExpenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('salaries','electricity','water','rent','government','other') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operationalExpenses_id` PRIMARY KEY(`id`)
);
