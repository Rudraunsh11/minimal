CREATE TABLE `minimal_user_states` (
	`user_id` text PRIMARY KEY NOT NULL,
	`payload` text,
	`revision` integer DEFAULT 0 NOT NULL,
	`previous_payload` text,
	`updated_at` integer DEFAULT 0 NOT NULL
);
