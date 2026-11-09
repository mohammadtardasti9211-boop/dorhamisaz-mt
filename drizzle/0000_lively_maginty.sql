CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`title` text NOT NULL,
	`amount` integer NOT NULL,
	`payer_id` text NOT NULL,
	`participant_ids` text NOT NULL,
	`author_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `gatherings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `gatherings` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`budget` integer DEFAULT 0 NOT NULL,
	`final_time_id` text,
	`final_place_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'guest' NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `gatherings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `members_event_idx` ON `members` (`event_id`);--> statement-breakpoint
CREATE TABLE `options` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`kind` text NOT NULL,
	`label` text DEFAULT '' NOT NULL,
	`date` text DEFAULT '' NOT NULL,
	`time` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`url` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `gatherings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`title` text NOT NULL,
	`quantity` text DEFAULT '' NOT NULL,
	`assignee_id` text,
	`done` integer DEFAULT 0 NOT NULL,
	`author_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `gatherings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assignee_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`option_id` text NOT NULL,
	`member_id` text NOT NULL,
	`value` text NOT NULL,
	PRIMARY KEY(`option_id`, `member_id`),
	FOREIGN KEY (`option_id`) REFERENCES `options`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
