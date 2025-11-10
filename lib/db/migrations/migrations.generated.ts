
// This file is auto-generated. Do not edit by hand.
export const migrations = [
  {
    "sql": [
      "CREATE TABLE `account` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`account_id` text NOT NULL,\n\t`provider_id` text NOT NULL,\n\t`user_id` text NOT NULL,\n\t`access_token` text,\n\t`refresh_token` text,\n\t`id_token` text,\n\t`access_token_expires_at` integer,\n\t`refresh_token_expires_at` integer,\n\t`scope` text,\n\t`password` text,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL,\n\tFOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade\n);\n",
      "\nCREATE TABLE `session` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`expires_at` integer NOT NULL,\n\t`token` text NOT NULL,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL,\n\t`ip_address` text,\n\t`user_agent` text,\n\t`user_id` text NOT NULL,\n\tFOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade\n);\n",
      "\nCREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);",
      "\nCREATE TABLE `user` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`name` text NOT NULL,\n\t`email` text NOT NULL,\n\t`email_verified` integer NOT NULL,\n\t`image` text,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL,\n\t`username` text NOT NULL,\n\t`first_name` text NOT NULL,\n\t`last_name` text NOT NULL,\n\t`role` text DEFAULT 'staff' NOT NULL,\n\t`is_active` integer DEFAULT true NOT NULL\n);\n",
      "\nCREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);",
      "\nCREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);",
      "\nCREATE TABLE `verification` (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`identifier` text NOT NULL,\n\t`value` text NOT NULL,\n\t`expires_at` integer NOT NULL,\n\t`created_at` integer,\n\t`updated_at` integer\n);\n",
      "\nCREATE TABLE `appointments` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`patient_id` integer NOT NULL,\n\t`doctor_id` text NOT NULL,\n\t`appointment_date` text NOT NULL,\n\t`appointment_time` text NOT NULL,\n\t`duration` integer DEFAULT 30 NOT NULL,\n\t`type` text NOT NULL,\n\t`status` text DEFAULT 'scheduled' NOT NULL,\n\t`notes` text,\n\t`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\t`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\tFOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`doctor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action\n);\n",
      "\nCREATE TABLE `invoices` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`invoice_number` text NOT NULL,\n\t`patient_id` integer NOT NULL,\n\t`appointment_id` integer,\n\t`total_amount` real DEFAULT 0 NOT NULL,\n\t`paid_amount` real DEFAULT 0 NOT NULL,\n\t`status` text DEFAULT 'pending' NOT NULL,\n\t`due_date` text,\n\t`items` text,\n\t`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\t`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\tFOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE no action\n);\n",
      "\nCREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);",
      "\nCREATE TABLE `lab_tests` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`patient_id` integer NOT NULL,\n\t`doctor_id` text NOT NULL,\n\t`test_name` text NOT NULL,\n\t`test_type` text NOT NULL,\n\t`status` text DEFAULT 'ordered' NOT NULL,\n\t`order_date` text NOT NULL,\n\t`completed_date` text,\n\t`results` text,\n\t`normal_range` text,\n\t`notes` text,\n\t`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\t`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\tFOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`doctor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action\n);\n",
      "\nCREATE TABLE `medical_records` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`patient_id` integer NOT NULL,\n\t`doctor_id` text NOT NULL,\n\t`appointment_id` integer,\n\t`visit_date` text NOT NULL,\n\t`chief_complaint` text,\n\t`diagnosis` text,\n\t`treatment` text,\n\t`prescription` text,\n\t`notes` text,\n\t`vital_signs` text,\n\t`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\t`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\tFOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`doctor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE no action\n);\n",
      "\nCREATE TABLE `medications` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`name` text NOT NULL,\n\t`generic_name` text,\n\t`dosage` text,\n\t`form` text,\n\t`manufacturer` text,\n\t`batch_number` text,\n\t`expiry_date` text,\n\t`quantity` integer DEFAULT 0 NOT NULL,\n\t`min_stock_level` integer DEFAULT 10 NOT NULL,\n\t`unit_price` real DEFAULT 0 NOT NULL,\n\t`is_active` integer DEFAULT true NOT NULL,\n\t`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\t`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL\n);\n",
      "\nCREATE TABLE `patients` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`patient_id` text NOT NULL,\n\t`first_name` text NOT NULL,\n\t`last_name` text NOT NULL,\n\t`date_of_birth` text NOT NULL,\n\t`gender` text NOT NULL,\n\t`phone` text,\n\t`email` text,\n\t`address` text,\n\t`emergency_contact` text,\n\t`emergency_phone` text,\n\t`blood_type` text,\n\t`allergies` text,\n\t`medical_history` text,\n\t`is_active` integer DEFAULT true NOT NULL,\n\t`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\t`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL\n);\n",
      "\nCREATE UNIQUE INDEX `patients_patient_id_unique` ON `patients` (`patient_id`);",
      "\nCREATE TABLE `prescriptions` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`patient_id` integer NOT NULL,\n\t`doctor_id` text NOT NULL,\n\t`medication_id` integer NOT NULL,\n\t`medical_record_id` integer,\n\t`dosage` text NOT NULL,\n\t`frequency` text NOT NULL,\n\t`duration` text NOT NULL,\n\t`instructions` text,\n\t`quantity` integer NOT NULL,\n\t`is_dispensed` integer DEFAULT false NOT NULL,\n\t`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\t`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\tFOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`doctor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`medication_id`) REFERENCES `medications`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`medical_record_id`) REFERENCES `medical_records`(`id`) ON UPDATE no action ON DELETE no action\n);\n"
    ],
    "bps": true,
    "folderMillis": 1756064201275,
    "hash": "37d44e0f6a0cc35b7dd6fbe57b1cd7413805645491b62c3e159a9d2656211eeb"
  },
  {
    "sql": [
      "ALTER TABLE `session` ADD `impersonated_by` text;",
      "\nALTER TABLE `user` ADD `banned` integer;",
      "\nALTER TABLE `user` ADD `ban_reason` text;",
      "\nALTER TABLE `user` ADD `ban_expires` integer;"
    ],
    "bps": true,
    "folderMillis": 1756217206883,
    "hash": "c12c74f58eb42d3ab2f20efdc6a793b11de5a2b27901b4dc743a56b48c3b6ad1"
  },
  {
    "sql": [
      "CREATE TABLE `system_settings` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`key` text NOT NULL,\n\t`value` text NOT NULL,\n\t`description` text,\n\t`category` text DEFAULT 'general' NOT NULL,\n\t`is_public` integer DEFAULT false NOT NULL,\n\t`updated_by` text,\n\t`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\t`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\tFOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action\n);\n",
      "\nCREATE UNIQUE INDEX `system_settings_key_unique` ON `system_settings` (`key`);"
    ],
    "bps": true,
    "folderMillis": 1756348225520,
    "hash": "3cf5dfbe7ab422eb2222271286fa92efcdfcfb8224a72bb2fa47556ef5fcaf6e"
  },
  {
    "sql": [
      "PRAGMA foreign_keys=OFF;",
      "\nCREATE TABLE `__new_appointments` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`patient_id` integer NOT NULL,\n\t`doctor_id` text NOT NULL,\n\t`appointment_date` integer NOT NULL,\n\t`appointment_time` text NOT NULL,\n\t`duration` integer DEFAULT 30 NOT NULL,\n\t`type` text NOT NULL,\n\t`status` text DEFAULT 'scheduled' NOT NULL,\n\t`notes` text,\n\t`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\t`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\tFOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`doctor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action\n);\n",
      "\nINSERT INTO `__new_appointments`(\"id\", \"patient_id\", \"doctor_id\", \"appointment_date\", \"appointment_time\", \"duration\", \"type\", \"status\", \"notes\", \"created_at\", \"updated_at\") SELECT \"id\", \"patient_id\", \"doctor_id\", \"appointment_date\", \"appointment_time\", \"duration\", \"type\", \"status\", \"notes\", \"created_at\", \"updated_at\" FROM `appointments`;",
      "\nDROP TABLE `appointments`;",
      "\nALTER TABLE `__new_appointments` RENAME TO `appointments`;",
      "\nPRAGMA foreign_keys=ON;",
      "\nCREATE TABLE `__new_invoices` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`invoice_number` text NOT NULL,\n\t`patient_id` integer NOT NULL,\n\t`appointment_id` integer,\n\t`total_amount` real DEFAULT 0 NOT NULL,\n\t`paid_amount` real DEFAULT 0 NOT NULL,\n\t`status` text DEFAULT 'pending' NOT NULL,\n\t`due_date` integer,\n\t`items` text,\n\t`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\t`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\tFOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE no action\n);\n",
      "\nINSERT INTO `__new_invoices`(\"id\", \"invoice_number\", \"patient_id\", \"appointment_id\", \"total_amount\", \"paid_amount\", \"status\", \"due_date\", \"items\", \"created_at\", \"updated_at\") SELECT \"id\", \"invoice_number\", \"patient_id\", \"appointment_id\", \"total_amount\", \"paid_amount\", \"status\", \"due_date\", \"items\", \"created_at\", \"updated_at\" FROM `invoices`;",
      "\nDROP TABLE `invoices`;",
      "\nALTER TABLE `__new_invoices` RENAME TO `invoices`;",
      "\nCREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);",
      "\nCREATE TABLE `__new_lab_tests` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`patient_id` integer NOT NULL,\n\t`doctor_id` text NOT NULL,\n\t`test_name` text NOT NULL,\n\t`test_type` text NOT NULL,\n\t`status` text DEFAULT 'ordered' NOT NULL,\n\t`order_date` integer NOT NULL,\n\t`completed_date` integer,\n\t`results` text,\n\t`normal_range` text,\n\t`notes` text,\n\t`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\t`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\tFOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`doctor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action\n);\n",
      "\nINSERT INTO `__new_lab_tests`(\"id\", \"patient_id\", \"doctor_id\", \"test_name\", \"test_type\", \"status\", \"order_date\", \"completed_date\", \"results\", \"normal_range\", \"notes\", \"created_at\", \"updated_at\") SELECT \"id\", \"patient_id\", \"doctor_id\", \"test_name\", \"test_type\", \"status\", \"order_date\", \"completed_date\", \"results\", \"normal_range\", \"notes\", \"created_at\", \"updated_at\" FROM `lab_tests`;",
      "\nDROP TABLE `lab_tests`;",
      "\nALTER TABLE `__new_lab_tests` RENAME TO `lab_tests`;",
      "\nCREATE TABLE `__new_medical_records` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`patient_id` integer NOT NULL,\n\t`doctor_id` text NOT NULL,\n\t`appointment_id` integer,\n\t`visit_date` integer NOT NULL,\n\t`chief_complaint` text,\n\t`diagnosis` text,\n\t`treatment` text,\n\t`prescription` text,\n\t`notes` text,\n\t`vital_signs` text,\n\t`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\t`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\tFOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`doctor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE no action\n);\n",
      "\nINSERT INTO `__new_medical_records`(\"id\", \"patient_id\", \"doctor_id\", \"appointment_id\", \"visit_date\", \"chief_complaint\", \"diagnosis\", \"treatment\", \"prescription\", \"notes\", \"vital_signs\", \"created_at\", \"updated_at\") SELECT \"id\", \"patient_id\", \"doctor_id\", \"appointment_id\", \"visit_date\", \"chief_complaint\", \"diagnosis\", \"treatment\", \"prescription\", \"notes\", \"vital_signs\", \"created_at\", \"updated_at\" FROM `medical_records`;",
      "\nDROP TABLE `medical_records`;",
      "\nALTER TABLE `__new_medical_records` RENAME TO `medical_records`;",
      "\nCREATE TABLE `__new_medications` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`name` text NOT NULL,\n\t`generic_name` text,\n\t`dosage` text,\n\t`form` text,\n\t`manufacturer` text,\n\t`batch_number` text,\n\t`expiry_date` integer,\n\t`quantity` integer DEFAULT 0 NOT NULL,\n\t`min_stock_level` integer DEFAULT 10 NOT NULL,\n\t`unit_price` real DEFAULT 0 NOT NULL,\n\t`is_active` integer DEFAULT true NOT NULL,\n\t`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\t`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL\n);\n",
      "\nINSERT INTO `__new_medications`(\"id\", \"name\", \"generic_name\", \"dosage\", \"form\", \"manufacturer\", \"batch_number\", \"expiry_date\", \"quantity\", \"min_stock_level\", \"unit_price\", \"is_active\", \"created_at\", \"updated_at\") SELECT \"id\", \"name\", \"generic_name\", \"dosage\", \"form\", \"manufacturer\", \"batch_number\", \"expiry_date\", \"quantity\", \"min_stock_level\", \"unit_price\", \"is_active\", \"created_at\", \"updated_at\" FROM `medications`;",
      "\nDROP TABLE `medications`;",
      "\nALTER TABLE `__new_medications` RENAME TO `medications`;",
      "\nCREATE TABLE `__new_patients` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`patient_id` text NOT NULL,\n\t`first_name` text NOT NULL,\n\t`last_name` text NOT NULL,\n\t`date_of_birth` integer NOT NULL,\n\t`gender` text NOT NULL,\n\t`phone` text,\n\t`email` text,\n\t`address` text,\n\t`emergency_contact` text,\n\t`emergency_phone` text,\n\t`blood_type` text,\n\t`allergies` text,\n\t`medical_history` text,\n\t`is_active` integer DEFAULT true NOT NULL,\n\t`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\t`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL\n);\n",
      "\nINSERT INTO `__new_patients`(\"id\", \"patient_id\", \"first_name\", \"last_name\", \"date_of_birth\", \"gender\", \"phone\", \"email\", \"address\", \"emergency_contact\", \"emergency_phone\", \"blood_type\", \"allergies\", \"medical_history\", \"is_active\", \"created_at\", \"updated_at\") SELECT \"id\", \"patient_id\", \"first_name\", \"last_name\", \"date_of_birth\", \"gender\", \"phone\", \"email\", \"address\", \"emergency_contact\", \"emergency_phone\", \"blood_type\", \"allergies\", \"medical_history\", \"is_active\", \"created_at\", \"updated_at\" FROM `patients`;",
      "\nDROP TABLE `patients`;",
      "\nALTER TABLE `__new_patients` RENAME TO `patients`;",
      "\nCREATE UNIQUE INDEX `patients_patient_id_unique` ON `patients` (`patient_id`);",
      "\nCREATE TABLE `__new_prescriptions` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`patient_id` integer NOT NULL,\n\t`doctor_id` text NOT NULL,\n\t`medication_id` integer NOT NULL,\n\t`medical_record_id` integer,\n\t`dosage` text NOT NULL,\n\t`frequency` text NOT NULL,\n\t`duration` text NOT NULL,\n\t`instructions` text,\n\t`quantity` integer NOT NULL,\n\t`is_dispensed` integer DEFAULT false NOT NULL,\n\t`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\t`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\tFOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`doctor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`medication_id`) REFERENCES `medications`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`medical_record_id`) REFERENCES `medical_records`(`id`) ON UPDATE no action ON DELETE no action\n);\n",
      "\nINSERT INTO `__new_prescriptions`(\"id\", \"patient_id\", \"doctor_id\", \"medication_id\", \"medical_record_id\", \"dosage\", \"frequency\", \"duration\", \"instructions\", \"quantity\", \"is_dispensed\", \"created_at\", \"updated_at\") SELECT \"id\", \"patient_id\", \"doctor_id\", \"medication_id\", \"medical_record_id\", \"dosage\", \"frequency\", \"duration\", \"instructions\", \"quantity\", \"is_dispensed\", \"created_at\", \"updated_at\" FROM `prescriptions`;",
      "\nDROP TABLE `prescriptions`;",
      "\nALTER TABLE `__new_prescriptions` RENAME TO `prescriptions`;",
      "\nCREATE TABLE `__new_system_settings` (\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\n\t`key` text NOT NULL,\n\t`value` text NOT NULL,\n\t`description` text,\n\t`category` text DEFAULT 'general' NOT NULL,\n\t`is_public` integer DEFAULT false NOT NULL,\n\t`updated_by` text,\n\t`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\t`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,\n\tFOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action\n);\n",
      "\nINSERT INTO `__new_system_settings`(\"id\", \"key\", \"value\", \"description\", \"category\", \"is_public\", \"updated_by\", \"created_at\", \"updated_at\") SELECT \"id\", \"key\", \"value\", \"description\", \"category\", \"is_public\", \"updated_by\", \"created_at\", \"updated_at\" FROM `system_settings`;",
      "\nDROP TABLE `system_settings`;",
      "\nALTER TABLE `__new_system_settings` RENAME TO `system_settings`;",
      "\nCREATE UNIQUE INDEX `system_settings_key_unique` ON `system_settings` (`key`);"
    ],
    "bps": true,
    "folderMillis": 1756751191922,
    "hash": "f5ba83acd99446deb9196eefc4f08021a44bf13c541f4e99ef648deb1271b660"
  },
  {
    "sql": [
      "CREATE TABLE `medication_stock_log` (\r\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\r\n\t`medication_id` integer NOT NULL,\r\n\t`change_type` text NOT NULL,\r\n\t`quantity_changed` integer NOT NULL,\r\n\t`reason` text,\r\n\t`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,\r\n\tFOREIGN KEY (`medication_id`) REFERENCES `medications`(`id`) ON UPDATE no action ON DELETE no action\r\n);\r\n",
      "\r\nCREATE TABLE `medication_suppliers` (\r\n\t`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\r\n\t`name` text NOT NULL,\r\n\t`contact_info` text,\r\n\t`address` text,\r\n\t`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL\r\n);\r\n"
    ],
    "bps": true,
    "folderMillis": 1761157504577,
    "hash": "53705780eaa0e5e1b7a73c1136678cadc06c17e8e4528ab8a8dec9c1102261ca"
  },
  {
    "sql": [
      "ALTER TABLE `medications` ADD `supplier_id` integer REFERENCES medication_suppliers(id);"
    ],
    "bps": true,
    "folderMillis": 1761221700584,
    "hash": "17f233b1e3bcc60cfab4e8348bbc8e71148f4c52443443031f59e01138eb0841"
  }
];
