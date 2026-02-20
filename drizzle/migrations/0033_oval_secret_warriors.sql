ALTER TABLE `employees` ADD `employeeCode` varchar(50);--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_employeeCode_unique` UNIQUE(`employeeCode`);