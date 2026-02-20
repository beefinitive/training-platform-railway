ALTER TABLE `daily_stats` ADD `status` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `daily_stats` ADD `reviewedBy` int;--> statement-breakpoint
ALTER TABLE `daily_stats` ADD `reviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `daily_stats` ADD `reviewNotes` text;