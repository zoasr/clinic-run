PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_appointments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` integer NOT NULL,
	`doctor_id` text NOT NULL,
	`appointment_date` integer NOT NULL,
	`appointment_time` text NOT NULL,
	`duration` integer DEFAULT 30 NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`doctor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_appointments`("id", "patient_id", "doctor_id", "appointment_date", "appointment_time", "duration", "type", "status", "notes", "created_at", "updated_at") SELECT "id", "patient_id", "doctor_id", "appointment_date", "appointment_time", "duration", "type", "status", "notes", "created_at", "updated_at" FROM `appointments`;--> statement-breakpoint
DROP TABLE `appointments`;--> statement-breakpoint
ALTER TABLE `__new_appointments` RENAME TO `appointments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_number` text NOT NULL,
	`patient_id` integer NOT NULL,
	`appointment_id` integer,
	`total_amount` real DEFAULT 0 NOT NULL,
	`paid_amount` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`due_date` integer,
	`items` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_invoices`("id", "invoice_number", "patient_id", "appointment_id", "total_amount", "paid_amount", "status", "due_date", "items", "created_at", "updated_at") SELECT "id", "invoice_number", "patient_id", "appointment_id", "total_amount", "paid_amount", "status", "due_date", "items", "created_at", "updated_at" FROM `invoices`;--> statement-breakpoint
DROP TABLE `invoices`;--> statement-breakpoint
ALTER TABLE `__new_invoices` RENAME TO `invoices`;--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);--> statement-breakpoint
CREATE TABLE `__new_lab_tests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` integer NOT NULL,
	`doctor_id` text NOT NULL,
	`test_name` text NOT NULL,
	`test_type` text NOT NULL,
	`status` text DEFAULT 'ordered' NOT NULL,
	`order_date` integer NOT NULL,
	`completed_date` integer,
	`results` text,
	`normal_range` text,
	`notes` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`doctor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_lab_tests`("id", "patient_id", "doctor_id", "test_name", "test_type", "status", "order_date", "completed_date", "results", "normal_range", "notes", "created_at", "updated_at") SELECT "id", "patient_id", "doctor_id", "test_name", "test_type", "status", "order_date", "completed_date", "results", "normal_range", "notes", "created_at", "updated_at" FROM `lab_tests`;--> statement-breakpoint
DROP TABLE `lab_tests`;--> statement-breakpoint
ALTER TABLE `__new_lab_tests` RENAME TO `lab_tests`;--> statement-breakpoint
CREATE TABLE `__new_medical_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` integer NOT NULL,
	`doctor_id` text NOT NULL,
	`appointment_id` integer,
	`visit_date` integer NOT NULL,
	`chief_complaint` text,
	`diagnosis` text,
	`treatment` text,
	`prescription` text,
	`notes` text,
	`vital_signs` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`doctor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_medical_records`("id", "patient_id", "doctor_id", "appointment_id", "visit_date", "chief_complaint", "diagnosis", "treatment", "prescription", "notes", "vital_signs", "created_at", "updated_at") SELECT "id", "patient_id", "doctor_id", "appointment_id", "visit_date", "chief_complaint", "diagnosis", "treatment", "prescription", "notes", "vital_signs", "created_at", "updated_at" FROM `medical_records`;--> statement-breakpoint
DROP TABLE `medical_records`;--> statement-breakpoint
ALTER TABLE `__new_medical_records` RENAME TO `medical_records`;--> statement-breakpoint
CREATE TABLE `__new_medications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`generic_name` text,
	`dosage` text,
	`form` text,
	`manufacturer` text,
	`batch_number` text,
	`expiry_date` integer,
	`quantity` integer DEFAULT 0 NOT NULL,
	`min_stock_level` integer DEFAULT 10 NOT NULL,
	`unit_price` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_medications`("id", "name", "generic_name", "dosage", "form", "manufacturer", "batch_number", "expiry_date", "quantity", "min_stock_level", "unit_price", "is_active", "created_at", "updated_at") SELECT "id", "name", "generic_name", "dosage", "form", "manufacturer", "batch_number", "expiry_date", "quantity", "min_stock_level", "unit_price", "is_active", "created_at", "updated_at" FROM `medications`;--> statement-breakpoint
DROP TABLE `medications`;--> statement-breakpoint
ALTER TABLE `__new_medications` RENAME TO `medications`;--> statement-breakpoint
CREATE TABLE `__new_patients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`date_of_birth` integer NOT NULL,
	`gender` text NOT NULL,
	`phone` text,
	`email` text,
	`address` text,
	`emergency_contact` text,
	`emergency_phone` text,
	`blood_type` text,
	`allergies` text,
	`medical_history` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_patients`("id", "patient_id", "first_name", "last_name", "date_of_birth", "gender", "phone", "email", "address", "emergency_contact", "emergency_phone", "blood_type", "allergies", "medical_history", "is_active", "created_at", "updated_at") SELECT "id", "patient_id", "first_name", "last_name", "date_of_birth", "gender", "phone", "email", "address", "emergency_contact", "emergency_phone", "blood_type", "allergies", "medical_history", "is_active", "created_at", "updated_at" FROM `patients`;--> statement-breakpoint
DROP TABLE `patients`;--> statement-breakpoint
ALTER TABLE `__new_patients` RENAME TO `patients`;--> statement-breakpoint
CREATE UNIQUE INDEX `patients_patient_id_unique` ON `patients` (`patient_id`);--> statement-breakpoint
CREATE TABLE `__new_prescriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` integer NOT NULL,
	`doctor_id` text NOT NULL,
	`medication_id` integer NOT NULL,
	`medical_record_id` integer,
	`dosage` text NOT NULL,
	`frequency` text NOT NULL,
	`duration` text NOT NULL,
	`instructions` text,
	`quantity` integer NOT NULL,
	`is_dispensed` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`doctor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`medication_id`) REFERENCES `medications`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_prescriptions`("id", "patient_id", "doctor_id", "medication_id", "medical_record_id", "dosage", "frequency", "duration", "instructions", "quantity", "is_dispensed", "created_at", "updated_at") SELECT "id", "patient_id", "doctor_id", "medication_id", "medical_record_id", "dosage", "frequency", "duration", "instructions", "quantity", "is_dispensed", "created_at", "updated_at" FROM `prescriptions`;--> statement-breakpoint
DROP TABLE `prescriptions`;--> statement-breakpoint
ALTER TABLE `__new_prescriptions` RENAME TO `prescriptions`;--> statement-breakpoint
CREATE TABLE `__new_system_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`category` text DEFAULT 'general' NOT NULL,
	`is_public` integer DEFAULT false NOT NULL,
	`updated_by` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_system_settings`("id", "key", "value", "description", "category", "is_public", "updated_by", "created_at", "updated_at") SELECT "id", "key", "value", "description", "category", "is_public", "updated_by", "created_at", "updated_at" FROM `system_settings`;--> statement-breakpoint
DROP TABLE `system_settings`;--> statement-breakpoint
ALTER TABLE `__new_system_settings` RENAME TO `system_settings`;--> statement-breakpoint
CREATE UNIQUE INDEX `system_settings_key_unique` ON `system_settings` (`key`);