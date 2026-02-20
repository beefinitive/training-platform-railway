CREATE TABLE `target_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`targetId` int NOT NULL,
	`alertType` enum('reached_80','reached_100') NOT NULL,
	`percentage` decimal(5,2) NOT NULL,
	`targetType` varchar(100) NOT NULL,
	`targetValue` decimal(10,2) NOT NULL,
	`achievedValue` decimal(10,2) NOT NULL,
	`message` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`notifiedOwner` boolean NOT NULL DEFAULT false,
	`month` int,
	`year` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `target_alerts_id` PRIMARY KEY(`id`)
);
