ALTER TABLE `courses` ADD `courseCode` varchar(20);--> statement-breakpoint
ALTER TABLE `courses` ADD CONSTRAINT `courses_courseCode_unique` UNIQUE(`courseCode`);