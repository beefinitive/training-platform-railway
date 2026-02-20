CREATE TABLE `quiz_answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questionId` int NOT NULL,
	`answerText` text NOT NULL,
	`isCorrect` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quiz_answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quizId` int NOT NULL,
	`userId` int NOT NULL,
	`enrollmentId` int NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`totalPoints` int NOT NULL DEFAULT 0,
	`maxPoints` int NOT NULL DEFAULT 0,
	`isPassed` boolean NOT NULL DEFAULT false,
	`answers` json,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quiz_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quizId` int NOT NULL,
	`questionType` enum('multiple_choice','true_false','short_answer') NOT NULL DEFAULT 'multiple_choice',
	`questionText` text NOT NULL,
	`questionImage` text,
	`explanation` text,
	`points` int NOT NULL DEFAULT 1,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quiz_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizzes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`courseId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`passingScore` int NOT NULL DEFAULT 70,
	`timeLimit` int,
	`maxAttempts` int DEFAULT 0,
	`shuffleQuestions` boolean NOT NULL DEFAULT false,
	`showCorrectAnswers` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quizzes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `recorded_course_lessons` ADD `lessonType` enum('video','quiz','text') DEFAULT 'video' NOT NULL;--> statement-breakpoint
ALTER TABLE `recorded_course_lessons` ADD `videoSource` enum('upload','youtube','vimeo') DEFAULT 'upload';--> statement-breakpoint
ALTER TABLE `recorded_course_lessons` ADD `textContent` text;--> statement-breakpoint
ALTER TABLE `recorded_course_lessons` ADD `quizId` int;