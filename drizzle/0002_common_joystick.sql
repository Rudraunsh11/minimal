CREATE TABLE `minimal_archives` (
	`user_id` text NOT NULL,
	`archive_id` text NOT NULL,
	`payload` text NOT NULL,
	`cutoff` text NOT NULL,
	`created_at` integer NOT NULL,
	`byte_count` integer NOT NULL,
	`record_count` integer NOT NULL,
	PRIMARY KEY(`user_id`, `archive_id`)
);
