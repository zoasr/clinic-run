import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

// Patients table
export const patients = sqliteTable("patients", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	patientId: text("patient_id").notNull().unique(), // Custom patient ID (e.g., P001)
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	dateOfBirth: integer("date_of_birth", { mode: "timestamp" }).notNull(),
	gender: text("gender").notNull(),
	phone: text("phone"),
	email: text("email"),
	address: text("address"),
	emergencyContact: text("emergency_contact"),
	emergencyPhone: text("emergency_phone"),
	bloodType: text("blood_type"),
	allergies: text("allergies"),
	medicalHistory: text("medical_history"),
	isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

// Appointments table
export const appointments = sqliteTable("appointments", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	patientId: integer("patient_id")
		.notNull()
		.references(() => patients.id),
	doctorId: text("doctor_id")
		.notNull()
		.references(() => user.id),
	appointmentDate: integer("appointment_date", { mode: "timestamp" }).notNull(),
	appointmentTime: text("appointment_time").notNull(),
	duration: integer("duration").notNull().default(30), // minutes
	type: text("type").notNull(), // consultation, checkup, follow-up, emergency
	status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled, no-show
	notes: text("notes"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

// Medical records table
export const medicalRecords = sqliteTable("medical_records", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	patientId: integer("patient_id")
		.notNull()
		.references(() => patients.id),
	doctorId: text("doctor_id")
		.notNull()
		.references(() => user.id),
	appointmentId: integer("appointment_id").references(() => appointments.id),
	visitDate: integer("visit_date", { mode: "timestamp" }).notNull(),
	chiefComplaint: text("chief_complaint"),
	diagnosis: text("diagnosis"),
	treatment: text("treatment"),
	prescription: text("prescription"),
	notes: text("notes"),
	vitalSigns: text("vital_signs"), // JSON string for BP, temp, pulse, etc.
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

// Medications/Inventory table
export const medications = sqliteTable("medications", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	genericName: text("generic_name"),
	dosage: text("dosage"),
	form: text("form"), // tablet, capsule, syrup, injection
	manufacturer: text("manufacturer"),
	batchNumber: text("batch_number"),
	expiryDate: integer("expiry_date", { mode: "timestamp" }),
	quantity: integer("quantity").notNull().default(0),
	minStockLevel: integer("min_stock_level").notNull().default(10),
	unitPrice: real("unit_price").notNull().default(0),
	isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

// Prescriptions table
export const prescriptions = sqliteTable("prescriptions", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	patientId: integer("patient_id")
		.notNull()
		.references(() => patients.id),
	doctorId: text("doctor_id")
		.notNull()
		.references(() => user.id),
	medicationId: integer("medication_id")
		.notNull()
		.references(() => medications.id),
	medicalRecordId: integer("medical_record_id").references(
		() => medicalRecords.id,
	),
	dosage: text("dosage").notNull(),
	frequency: text("frequency").notNull(),
	duration: text("duration").notNull(),
	instructions: text("instructions"),
	quantity: integer("quantity").notNull(),
	isDispensed: integer("is_dispensed", { mode: "boolean" })
		.notNull()
		.default(false),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

// Billing/Invoices table
export const invoices = sqliteTable("invoices", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	invoiceNumber: text("invoice_number").notNull().unique(),
	patientId: integer("patient_id")
		.notNull()
		.references(() => patients.id),
	appointmentId: integer("appointment_id").references(() => appointments.id),
	totalAmount: real("total_amount").notNull().default(0),
	paidAmount: real("paid_amount").notNull().default(0),
	status: text("status").notNull().default("pending"), // pending, paid, overdue
	dueDate: integer("due_date", { mode: "timestamp" }),
	items: text("items"), // JSON string for itemized billing
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

// Lab tests table
export const labTests = sqliteTable("lab_tests", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	patientId: integer("patient_id")
		.notNull()
		.references(() => patients.id),
	doctorId: text("doctor_id")
		.notNull()
		.references(() => user.id),
	testName: text("test_name").notNull(),
	testType: text("test_type").notNull(),
	status: text("status").notNull().default("ordered"), // ordered, in-progress, completed
	orderDate: integer("order_date", { mode: "timestamp" }).notNull(),
	completedDate: integer("completed_date", { mode: "timestamp" }),
	results: text("results"),
	normalRange: text("normal_range"),
	notes: text("notes"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

// System settings table
export const systemSettings = sqliteTable("system_settings", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	key: text("key").notNull().unique(),
	value: text("value").notNull(),
	description: text("description"),
	category: text("category").notNull().default("general"), // general, clinic, security, notifications
	isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
	updatedBy: text("updated_by").references(() => user.id),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});
