CREATE TABLE `monthly_salaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`baseSalary` decimal(10,2) NOT NULL,
	`totalDeductions` decimal(10,2) NOT NULL DEFAULT '0',
	`totalBonuses` decimal(10,2) NOT NULL DEFAULT '0',
	`netSalary` decimal(10,2) NOT NULL,
	`status` enum('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monthly_salaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `salary_adjustments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`salaryId` int NOT NULL,
	`employeeId` int NOT NULL,
	`type` enum('deduction','bonus') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`reason` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `salary_adjustments_id` PRIMARY KEY(`id`)
);
