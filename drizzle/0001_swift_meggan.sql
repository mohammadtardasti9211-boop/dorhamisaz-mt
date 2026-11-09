CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`author_id` text NOT NULL,
	`topic` text DEFAULT 'general' NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `gatherings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `comments_event_idx` ON `comments` (`event_id`);--> statement-breakpoint
ALTER TABLE `members` ADD `attendance` text DEFAULT 'pending' NOT NULL;