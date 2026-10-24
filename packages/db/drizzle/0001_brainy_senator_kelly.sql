CREATE TABLE `biometric_consent_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`institution_id` text NOT NULL,
	`guardian_cpf` text NOT NULL,
	`guardian_name` text NOT NULL,
	`consent_version` text DEFAULT 'v2.1' NOT NULL,
	`status` text DEFAULT 'granted' NOT NULL,
	`granted_at` integer NOT NULL,
	`revoked_at` integer,
	`audit_signature_sha256` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`institution_id`) REFERENCES `institutions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `biometric_consent_student_idx` ON `biometric_consent_logs` (`student_id`);--> statement-breakpoint
CREATE INDEX `biometric_consent_institution_idx` ON `biometric_consent_logs` (`institution_id`);--> statement-breakpoint
CREATE INDEX `biometric_consent_guardian_idx` ON `biometric_consent_logs` (`guardian_cpf`);--> statement-breakpoint
CREATE TABLE `biometric_purge_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`institution_id` text NOT NULL,
	`reason` text NOT NULL,
	`purged_by_user_id` text,
	`purged_at` integer NOT NULL,
	`evidence_hash_sha256` text NOT NULL,
	FOREIGN KEY (`institution_id`) REFERENCES `institutions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`purged_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `biometric_purge_student_idx` ON `biometric_purge_logs` (`student_id`);--> statement-breakpoint
CREATE INDEX `biometric_purge_institution_idx` ON `biometric_purge_logs` (`institution_id`);