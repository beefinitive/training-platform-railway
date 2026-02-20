ALTER TABLE `daily_stats` ADD `courseId` int;--> statement-breakpoint
ALTER TABLE `daily_stats` ADD `courseFee` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `daily_stats` ADD `calculatedRevenue` decimal(10,2) DEFAULT '0';