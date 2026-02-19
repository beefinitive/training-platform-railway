CREATE TABLE `passwordHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`oldPassword` varchar(255) NOT NULL,
	`newPassword` varchar(255) NOT NULL,
	`changedBy` int,
	`reason` varchar(255),
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passwordHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `customerStats` ADD `employeeId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `customerStats` ADD `targetedCustomers` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customerStats` ADD `registeredInForm` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customerStats` ADD `confirmedCustomers` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customerStats` ADD `oldCustomersContacted` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customerStats` ADD `servicesSold` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customerStats` DROP COLUMN `totalTargeted`;--> statement-breakpoint
ALTER TABLE `customerStats` DROP COLUMN `totalConfirmed`;--> statement-breakpoint
ALTER TABLE `customerStats` DROP COLUMN `totalRegistered`;