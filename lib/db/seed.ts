/** biome-ignore-all lint/style/noNonNullAssertion: databse inserts will always return with an id */
import { eq } from "drizzle-orm";
import { auth } from "../auth";
import { db } from "./index";
import * as authSchema from "./schema/auth-schema";
import * as schema from "./schema/schema";

// Seed initial data
export async function seedDatabase() {
	try {
		// Create default admin user
		const adminExists = await db
			.select()
			.from(authSchema.user)
			.where(eq(authSchema.user.username, "admin"))
			.limit(1);

		if (adminExists.length === 0) {
			const newUser = await auth.api.createUser({
				body: {
					email: "admin@clinic.local", // required
					password: "admin123", // required
					name: "Admin User", // required
					role: "admin",
					data: {
						firstName: "System",
						lastName: "Administrator",
						username: "admin",
					},
				},
			});
			console.log("Added admin user: ", newUser);
		}

		// Create sample doctors
		const doctor1Exists = await db
			.select()
			.from(authSchema.user)
			.where(eq(authSchema.user.username, "dr.smith"))
			.limit(1);

		if (doctor1Exists.length === 0) {
			const doctor1 = await auth.api.createUser({
				body: {
					email: "dr.smith@clinic.local",
					password: "doctor123",
					name: "Dr. John Smith",
					role: "doctor",
					data: {
						firstName: "John",
						lastName: "Smith",
						username: "dr.smith",
					},
				},
			});
			console.log("Added doctor: ", doctor1);
		}

		const doctor2Exists = await db
			.select()
			.from(authSchema.user)
			.where(eq(authSchema.user.username, "dr.jones"))
			.limit(1);

		if (doctor2Exists.length === 0) {
			const doctor2 = await auth.api.createUser({
				body: {
					email: "dr.jones@clinic.local",
					password: "doctor123",
					name: "Dr. Sarah Jones",
					role: "doctor",
					data: {
						firstName: "Sarah",
						lastName: "Jones",
						username: "dr.jones",
					},
				},
			});
			console.log("Added doctor: ", doctor2);
		}

		const doctor3Exists = await db
			.select()
			.from(authSchema.user)
			.where(eq(authSchema.user.username, "dr.brown"))
			.limit(1);

		if (doctor3Exists.length === 0) {
			const doctor3 = await auth.api.createUser({
				body: {
					email: "dr.brown@clinic.local",
					password: "doctor123",
					name: "Dr. Michael Brown",
					role: "doctor",
					data: {
						firstName: "Michael",
						lastName: "Brown",
						username: "dr.brown",
					},
				},
			});
			console.log("Added doctor: ", doctor3);
		}

		// Add sample suppliers
		const supplierExists = await db
			.select()
			.from(schema.medicationSuppliers)
			.limit(1);

		let supplier1Id: number;
		let supplier2Id: number;
		let supplier3Id: number;

		if (supplierExists.length === 0) {
			const suppliers = await db
				.insert(schema.medicationSuppliers)
				.values([
					{
						name: "MediCorp Pharmaceuticals",
						contactInfo:
							"Phone: +1-555-0101\nEmail: orders@medicorp.com\nWebsite: www.medicorp.com",
						address: "123 Pharma Street, Medical City, MC 12345",
					},
					{
						name: "Global Health Supplies",
						contactInfo: "Phone: +1-555-0202\nEmail: sales@globalhealth.com",
						address: "456 Health Avenue, Wellness Town, WT 67890",
					},
					{
						name: "BioTech Laboratories",
						contactInfo: "Phone: +1-555-0303\nEmail: contact@biotechlabs.com",
						address: "789 Science Boulevard, Research City, RC 54321",
					},
				])
				.returning({ id: schema.medicationSuppliers.id });

			supplier1Id = suppliers[0]!.id;
			supplier2Id = suppliers[1]!.id;
			supplier3Id = suppliers[2]!.id;

			console.log("Added suppliers");
		} else {
			// Get existing supplier IDs
			const suppliers = await db
				.select({ id: schema.medicationSuppliers.id })
				.from(schema.medicationSuppliers)
				.limit(3);
			if (suppliers.length >= 3) {
				supplier1Id = suppliers[0]!.id;
				supplier2Id = suppliers[1]!.id;
				supplier3Id = suppliers[2]!.id;
			} else {
				throw new Error("Not enough suppliers found");
			}
		}

		// Add sample medications with supplier references
		const medicationExists = await db
			.select()
			.from(schema.medications)
			.limit(1);

		if (medicationExists.length === 0) {
			const medications = await db
				.insert(schema.medications)
				.values([
					{
						name: "Paracetamol",
						genericName: "Acetaminophen",
						dosage: "500mg",
						form: "tablet",
						manufacturer: "MediCorp Pharmaceuticals",
						supplierId: supplier1Id,
						batchNumber: "PAR2024001",
						expiryDate: new Date("2026-12-31"),
						quantity: 150,
						minStockLevel: 25,
						unitPrice: 0.5,
					},
					{
						name: "Amoxicillin",
						genericName: "Amoxicillin",
						dosage: "250mg",
						form: "capsule",
						manufacturer: "Global Health Supplies",
						supplierId: supplier2Id,
						batchNumber: "AMX2024002",
						expiryDate: new Date("2026-08-15"),
						quantity: 75,
						minStockLevel: 15,
						unitPrice: 1.25,
					},
					{
						name: "Ibuprofen",
						genericName: "Ibuprofen",
						dosage: "200mg",
						form: "tablet",
						manufacturer: "BioTech Laboratories",
						supplierId: supplier3Id,
						batchNumber: "IBU2024003",
						expiryDate: new Date("2026-10-20"),
						quantity: 200,
						minStockLevel: 30,
						unitPrice: 0.75,
					},
					{
						name: "Omeprazole",
						genericName: "Omeprazole",
						dosage: "20mg",
						form: "capsule",
						manufacturer: "MediCorp Pharmaceuticals",
						supplierId: supplier1Id,
						batchNumber: "OME2024004",
						expiryDate: new Date("2026-06-30"),
						quantity: 60,
						minStockLevel: 12,
						unitPrice: 2.0,
					},
					{
						name: "Aspirin",
						genericName: "Acetylsalicylic Acid",
						dosage: "100mg",
						form: "tablet",
						manufacturer: "Global Health Supplies",
						supplierId: supplier2Id,
						batchNumber: "ASP2024005",
						expiryDate: new Date("2026-11-10"),
						quantity: 120,
						minStockLevel: 20,
						unitPrice: 0.3,
					},
					{
						name: "Cetirizine",
						genericName: "Cetirizine",
						dosage: "10mg",
						form: "tablet",
						manufacturer: "BioTech Laboratories",
						supplierId: supplier3Id,
						batchNumber: "CET2024006",
						expiryDate: new Date("2027-01-15"),
						quantity: 90,
						minStockLevel: 18,
						unitPrice: 1.5,
					},
					{
						name: "Metformin",
						genericName: "Metformin",
						dosage: "500mg",
						form: "tablet",
						manufacturer: "MediCorp Pharmaceuticals",
						supplierId: supplier1Id,
						batchNumber: "MET2024007",
						expiryDate: new Date("2026-09-05"),
						quantity: 45,
						minStockLevel: 10,
						unitPrice: 0.8,
					},
					{
						name: "Losartan",
						genericName: "Losartan",
						dosage: "50mg",
						form: "tablet",
						manufacturer: "Global Health Supplies",
						supplierId: supplier2Id,
						batchNumber: "LOS2024008",
						expiryDate: new Date("2026-07-22"),
						quantity: 30,
						minStockLevel: 8,
						unitPrice: 1.8,
					},
				])
				.returning({ id: schema.medications.id });

			console.log("Added medications");

			// Add some stock log entries to simulate usage history
			const paracetamolId = medications[0]!.id;
			const amoxicillinId = medications[1]!.id;
			const ibuprofenId = medications[2]!.id;

			await db.insert(schema.medicationStockLog).values([
				// Paracetamol stock history
				{
					medicationId: paracetamolId,
					changeType: "addition",
					quantityChanged: 200,
					reason: "Initial stock delivery",
				},
				{
					medicationId: paracetamolId,
					changeType: "reduction",
					quantityChanged: -50,
					reason: "Prescription dispensing",
				},
				// Amoxicillin stock history
				{
					medicationId: amoxicillinId,
					changeType: "addition",
					quantityChanged: 100,
					reason: "Restock delivery",
				},
				{
					medicationId: amoxicillinId,
					changeType: "reduction",
					quantityChanged: -25,
					reason: "Prescription dispensing",
				},
				// Ibuprofen stock history
				{
					medicationId: ibuprofenId,
					changeType: "addition",
					quantityChanged: 250,
					reason: "Bulk delivery",
				},
				{
					medicationId: ibuprofenId,
					changeType: "reduction",
					quantityChanged: -50,
					reason: "Prescription dispensing",
				},
			]);

			console.log("Added stock log entries");
		}

		// Add sample patients
		const patientExists = await db.select().from(schema.patients).limit(1);

		let patient1Id: number;
		let patient2Id: number;
		let patient3Id: number;

		if (patientExists.length === 0) {
			const patients = await db
				.insert(schema.patients)
				.values([
					{
						patientId: "P001",
						firstName: "Ahmed",
						lastName: "Mohamed",
						dateOfBirth: new Date("1985-03-15"),
						gender: "male",
						phone: "+20-123-456-7890",
						email: "ahmed.mohamed@email.com",
						address: "123 Nile Street, Cairo, Egypt",
						bloodType: "A+",
						allergies: "Penicillin",
					},
					{
						patientId: "P002",
						firstName: "Fatima",
						lastName: "Ali",
						dateOfBirth: new Date("1990-07-22"),
						gender: "female",
						phone: "+20-123-456-7891",
						email: "fatima.ali@email.com",
						address: "456 Pyramid Avenue, Giza, Egypt",
						bloodType: "O-",
						medicalHistory: "Hypertension",
					},
					{
						patientId: "P003",
						firstName: "Omar",
						lastName: "Hassan",
						dateOfBirth: new Date("1978-11-08"),
						gender: "male",
						phone: "+20-123-456-7892",
						email: "omar.hassan@email.com",
						address: "789 Sphinx Road, Alexandria, Egypt",
						bloodType: "B+",
						allergies: "Sulfa drugs",
					},
				])
				.returning({ id: schema.patients.id });

			patient1Id = patients[0]!.id;
			patient2Id = patients[1]!.id;
			patient3Id = patients[2]!.id;

			console.log("Added patients");
		} else {
			const patients = await db
				.select({ id: schema.patients.id })
				.from(schema.patients)
				.limit(3);
			if (patients.length >= 3) {
				patient1Id = patients[0]!.id;
				patient2Id = patients[1]!.id;
				patient3Id = patients[2]!.id;
			} else {
				throw new Error("Not enough patients found");
			}
		}

		// Add sample appointments
		const appointmentExists = await db
			.select()
			.from(schema.appointments)
			.limit(1);

		if (appointmentExists.length === 0) {
			// Get doctor IDs
			const doctors = await db
				.select({ id: authSchema.user.id })
				.from(authSchema.user)
				.where(eq(authSchema.user.role, "doctor"))
				.limit(2);

			if (doctors.length < 2) {
				throw new Error("Not enough doctors found for appointments");
			}

			const doctor1Id = doctors[0]!.id;
			const doctor2Id = doctors[1]!.id;

			await db.insert(schema.appointments).values([
				{
					patientId: patient1Id,
					doctorId: doctor1Id,
					appointmentDate: new Date("2025-11-01T10:00:00"),
					appointmentTime: "10:00",
					duration: 30,
					type: "consultation",
					status: "completed",
					notes: "Regular checkup - patient reports feeling well",
				},
				{
					patientId: patient2Id,
					doctorId: doctor2Id,
					appointmentDate: new Date("2025-11-02T14:30:00"),
					appointmentTime: "14:30",
					duration: 45,
					type: "follow-up",
					status: "scheduled",
					notes: "Follow-up for hypertension management",
				},
				{
					patientId: patient3Id,
					doctorId: doctor1Id,
					appointmentDate: new Date("2025-11-03T09:15:00"),
					appointmentTime: "09:15",
					duration: 30,
					type: "consultation",
					status: "completed",
					notes: "Patient complaining of persistent cough",
				},
			]);

			console.log("Added appointments");
		}

		// Add sample prescriptions
		const prescriptionExists = await db
			.select()
			.from(schema.prescriptions)
			.limit(1);

		if (prescriptionExists.length === 0) {
			// Get medication IDs
			const medications = await db
				.select({ id: schema.medications.id })
				.from(schema.medications)
				.limit(4);

			if (medications.length < 4) {
				throw new Error("Not enough medications found for prescriptions");
			}

			const paracetamolId = medications[0]!.id;
			const amoxicillinId = medications[1]!.id;
			const ibuprofenId = medications[2]!.id;
			const cetirizineId = medications[3]!.id;

			// Get doctor IDs
			const doctors = await db
				.select({ id: authSchema.user.id })
				.from(authSchema.user)
				.where(eq(authSchema.user.role, "doctor"))
				.limit(2);

			if (doctors.length < 2) {
				throw new Error("Not enough doctors found for prescriptions");
			}

			const doctor1Id = doctors[0]!.id;
			const doctor2Id = doctors[1]!.id;

			await db.insert(schema.prescriptions).values([
				{
					patientId: patient1Id,
					doctorId: doctor1Id,
					medicationId: paracetamolId,
					dosage: "500mg",
					frequency: "Every 6 hours",
					duration: "5 days",
					quantity: 20,
					instructions: "Take with food. Do not exceed recommended dose.",
				},
				{
					patientId: patient2Id,
					doctorId: doctor2Id,
					medicationId: amoxicillinId,
					dosage: "250mg",
					frequency: "Three times daily",
					duration: "7 days",
					quantity: 21,
					instructions: "Complete full course even if symptoms improve.",
				},
				{
					patientId: patient3Id,
					doctorId: doctor1Id,
					medicationId: ibuprofenId,
					dosage: "200mg",
					frequency: "Every 8 hours as needed",
					duration: "3 days",
					quantity: 9,
					instructions: "Take with food to avoid stomach upset.",
				},
				{
					patientId: patient1Id,
					doctorId: doctor2Id,
					medicationId: cetirizineId,
					dosage: "10mg",
					frequency: "Once daily",
					duration: "14 days",
					quantity: 14,
					instructions: "Take in the evening for best allergy relief.",
				},
			]);

			console.log("Added prescriptions");
		}

		// Seed system settings
		const settingsExists = await db
			.select()
			.from(schema.systemSettings)
			.limit(1);

		if (settingsExists.length === 0) {
			await db.insert(schema.systemSettings).values([
				// Clinic settings
				{
					key: "clinic_name",
					value: "City General Hospital",
					description: "Name of the clinic/hospital",
					category: "clinic",
					isPublic: true,
				},
				{
					key: "clinic_address",
					value: "123 Main Street, Downtown, City 12345",
					description: "Physical address of the clinic",
					category: "clinic",
					isPublic: true,
				},
				{
					key: "clinic_phone",
					value: "+1 (555) 123-4567",
					description: "Primary contact phone number",
					category: "clinic",
					isPublic: true,
				},
				{
					key: "clinic_email",
					value: "info@citygeneral.com",
					description: "Primary contact email address",
					category: "clinic",
					isPublic: true,
				},
				{
					key: "currency",
					value: "USD",
					description: "Default currency for invoices and pricing",
					category: "clinic",
					isPublic: true,
				},
				{
					key: "working_hours",
					value: "Mon-Fri: 9:00 AM - 6:00 PM, Sat: 9:00 AM - 2:00 PM",
					description: "Clinic working hours",
					category: "clinic",
					isPublic: true,
				},
				// Security settings
				{
					key: "session_timeout",
					value: "1440", // 24 hours in minutes
					description: "Session timeout in minutes",
					category: "security",
					isPublic: true,
				},
				{
					key: "password_min_length",
					value: "8",
					description: "Minimum password length",
					category: "security",
					isPublic: false,
				},
				// Appearance settings
				{
					key: "theme_mode",
					value: "system",
					description: "Application theme mode",
					category: "appearance",
					isPublic: true,
				},
				{
					key: "sidebar_collapsed",
					value: "false",
					description: "Whether sidebar should be collapsed by default",
					category: "appearance",
					isPublic: true,
				},
				{
					key: "compact_mode",
					value: "false",
					description: "Use compact layout mode",
					category: "appearance",
					isPublic: true,
				},
				// Notification settings
				{
					key: "email_notifications",
					value: "false",
					description: "Enable email notifications for alerts",
					category: "notifications",
					isPublic: true,
				},
				{
					key: "sms_notifications",
					value: "false",
					description: "Enable SMS notifications for alerts",
					category: "notifications",
					isPublic: true,
				},
				{
					key: "low_stock_alert_threshold",
					value: "10",
					description: "Alert when medication stock falls below this level",
					category: "notifications",
					isPublic: true,
				},
				{
					key: "expiry_alert_days",
					value: "30",
					description: "Alert when medications expire within this many days",
					category: "notifications",
					isPublic: true,
				},
				// Demo credentials
				{
					key: "demo_email",
					value: "admin@clinic.local",
					description: "Demo admin email for development",
					category: "demo",
					isPublic: true,
				},
				{
					key: "demo_password",
					value: "admin123",
					description: "Demo admin password for development",
					category: "demo",
					isPublic: false,
				},
			]);

			console.log("Added system settings");
		}

		console.log("Database seeded successfully!");
	} catch (error) {
		console.error("Error seeding database:", error);
		throw error;
	}
}

seedDatabase();
