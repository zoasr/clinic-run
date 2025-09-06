import { db as testDb } from "./index";
import * as schema from "./schema/schema";
import * as authSchema from "./schema/auth-schema";
import { faker } from "@faker-js/faker";
import { auth } from "../auth";
import { eq } from "drizzle-orm";

// Configuration for data generation
const CONFIG = {
	patients: 3000, // 3k patients
	doctors: 30, // 30 doctors
	admins: 10, // 10 admins
	appointments: 5000, // 5k appointments
	medicalRecords: 3000, // 3k medical records
	medications: 1000, // 1k medications
	prescriptions: 2500, // 2.5k prescriptions
	invoices: 2000, // 2k invoices
	labTests: 1500, // 1.5k lab tests
};

// Utility functions for generating fake data
function generatePatientId(index: number): string {
	return `P${String(index + 1).padStart(6, "0")}`;
}

function generateInvoiceNumber(index: number): string {
	const date = new Date();
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	return `INV-${year}${month}-${String(index + 1).padStart(6, "0")}`;
}

function generateVitalSigns(): string {
	return JSON.stringify({
		bloodPressure: `${faker.number.int({ min: 90, max: 180 })}/${faker.number.int({ min: 60, max: 120 })}`,
		temperature: faker.number.float({
			min: 96.0,
			max: 104.0,
			fractionDigits: 1,
		}),
		pulse: faker.number.int({ min: 60, max: 120 }),
		weight: faker.number.float({ min: 100, max: 300, fractionDigits: 1 }),
		height: faker.number.float({ min: 150, max: 200, fractionDigits: 1 }),
	});
}

function generateBillingItems(): string {
	const items = [];
	const itemCount = faker.number.int({ min: 1, max: 5 });

	for (let i = 0; i < itemCount; i++) {
		items.push({
			description: faker.helpers.arrayElement([
				"Consultation Fee",
				"Lab Test",
				"Medication",
				"Procedure",
				"Follow-up Visit",
			]),
			quantity: faker.number.int({ min: 1, max: 3 }),
			unitPrice: faker.number.float({
				min: 10,
				max: 500,
				fractionDigits: 2,
			}),
		});
	}

	return JSON.stringify(items);
}

// Performance seeding function
export async function seedPerformanceData() {
	console.log("🚀 Starting performance data seeding...");
	const startTime = Date.now();

	try {
		// 1. Create doctors first (needed for foreign keys)
		console.log(
			`📊 Creating ${CONFIG.doctors} doctors with login accounts...`
		);
		// const doctors = [];

		for (let i = 0; i < CONFIG.doctors; i++) {
			const firstName = faker.person.firstName();
			const lastName = faker.person.lastName();
			const username = `dr.${firstName.toLowerCase()}.${lastName.toLowerCase()}`;

			// Create auth user account for login
			try {
				await auth.api.createUser({
					body: {
						email: `${username}@clinic.local`,
						password: "doctor123", // Default password for test doctors
						name: `Dr. ${firstName} ${lastName}`,
						role: "doctor",
						data: {
							firstName,
							lastName,
							username,
						},
					},
				});
				console.log(
					`✅ Created login account for Dr. ${firstName} ${lastName}`
				);
			} catch (error) {
				console.log(
					`⚠️  Login account for Dr. ${firstName} ${lastName} may already exist`
				);
			}

			// doctors.push({
			// 	id: `doctor-${i + 1}`,
			// 	email: `${username}@clinic.local`,
			// 	emailVerified: true,
			// 	name: `Dr. ${firstName} ${lastName}`,
			// 	image: null,
			// 	username,
			// 	firstName,
			// 	lastName,
			// 	role: "doctor" as const,
			// 	banned: false,
			// 	banReason: null,
			// 	banExpires: null,
			// 	createdAt: new Date(),
			// 	updatedAt: new Date(),
			// });
		}

		// await testDb.insert(authSchema.user).values(doctors);
		console.log(`✅ Created ${CONFIG.doctors} doctors with login accounts`);

		// 1.5. Create nurses with login accounts
		console.log(
			`📊 Creating ${CONFIG.admins} admins with login accounts...`
		);

		for (let i = 0; i < CONFIG.admins; i++) {
			const firstName = faker.person.firstName();
			const lastName = faker.person.lastName();
			const username = `admin.${firstName.toLowerCase()}.${lastName.toLowerCase()}`;

			// Create auth user account for login
			try {
				await auth.api.createUser({
					body: {
						email: `${username}@clinic.local`,
						password: "admin123", // Default password for test nurses
						name: `${firstName} ${lastName}`,
						role: "admin",
						data: {
							firstName,
							lastName,
							username,
						},
					},
				});
				console.log(
					`✅ Created login account for Admin ${firstName} ${lastName}`
				);
			} catch (error) {
				console.log(
					`⚠️  Login account for Admin ${firstName} ${lastName} may already exist`
				);
			}

			// admins.push({
			// 	id: `admin-${i + 1}`,
			// 	email: `${username}@clinic.local`,
			// 	emailVerified: true,
			// 	name: `${firstName} ${lastName}`,
			// 	image: null,
			// 	username,
			// 	firstName,
			// 	lastName,
			// 	role: "admin" as const,
			// 	banned: false,
			// 	banReason: null,
			// 	banExpires: null,
			// 	createdAt: new Date(),
			// 	updatedAt: new Date(),
			// });
		}

		// 2. Create patients
		console.log(`📊 Creating ${CONFIG.patients} patients...`);
		const patients = [];

		for (let i = 0; i < CONFIG.patients; i++) {
			patients.push({
				patientId: generatePatientId(i),
				firstName: faker.person.firstName(),
				lastName: faker.person.lastName(),
				dateOfBirth: faker.date.birthdate({
					min: 18,
					max: 80,
					mode: "age",
				}),
				gender: faker.helpers.arrayElement(["Male", "Female", "Other"]),
				phone: faker.phone.number(),
				email: faker.internet.email(),
				address: faker.location.streetAddress(),
				emergencyContact: faker.person.fullName(),
				emergencyPhone: faker.phone.number(),
				bloodType: faker.helpers.arrayElement([
					"A+",
					"A-",
					"B+",
					"B-",
					"AB+",
					"AB-",
					"O+",
					"O-",
				]),
				allergies: faker.helpers.maybe(() => faker.lorem.words(3), {
					probability: 0.3,
				}),
				medicalHistory: faker.helpers.maybe(
					() => faker.lorem.sentences(2),
					{ probability: 0.5 }
				),
				isActive: faker.datatype.boolean(),
			});
		}

		await testDb.insert(schema.patients).values(patients);
		console.log(`✅ Created ${CONFIG.patients} patients`);

		// 3. Create medications
		console.log(`📊 Creating ${CONFIG.medications} medications...`);
		const medications = [];

		for (let i = 0; i < CONFIG.medications; i++) {
			medications.push({
				name: faker.lorem.words(2),
				genericName: faker.lorem.words(1),
				dosage: faker.helpers.arrayElement([
					"50mg",
					"100mg",
					"250mg",
					"500mg",
					"1g",
				]),
				form: faker.helpers.arrayElement([
					"tablet",
					"capsule",
					"syrup",
					"injection",
					"cream",
				]),
				manufacturer: faker.company.name(),
				batchNumber: `BATCH-${faker.string.alphanumeric(8).toUpperCase()}`,
				expiryDate: faker.date.future({ years: 1 }),

				quantity: faker.number.int({ min: 0, max: 1000 }),
				minStockLevel: faker.number.int({ min: 5, max: 50 }),
				unitPrice: faker.number.float({
					min: 0.5,
					max: 100,
					fractionDigits: 2,
				}),
				isActive: faker.datatype.boolean(),
			});
		}

		await testDb.insert(schema.medications).values(medications);
		console.log(`✅ Created ${CONFIG.medications} medications`);

		// 4. Create appointments
		console.log(`📊 Creating ${CONFIG.appointments} appointments...`);
		const appointments = [];

		const doctors = await testDb
			.select()
			.from(authSchema.user)
			.where(eq(authSchema.user.role, "doctor"));
		for (let i = 0; i < CONFIG.appointments; i++) {
			const patientId = faker.number.int({
				min: 1,
				max: CONFIG.patients,
			});
			const doctor = faker.helpers.arrayElement(doctors);
			const doctorId = doctor.id;

			appointments.push({
				patientId,
				doctorId,
				appointmentDate: faker.date.between({
					from: new Date(2023, 0, 1),
					to: new Date(2025, 11, 31),
				}),
				appointmentTime: faker.helpers.arrayElement([
					"09:00",
					"09:30",
					"10:00",
					"10:30",
					"11:00",
					"11:30",
					"14:00",
					"14:30",
					"15:00",
					"15:30",
					"16:00",
					"16:30",
				]),
				duration: faker.helpers.arrayElement([15, 30, 45, 60]),
				type: faker.helpers.arrayElement([
					"consultation",
					"checkup",
					"follow-up",
					"emergency",
				]),
				status: faker.helpers.arrayElement([
					"scheduled",
					"completed",
					"cancelled",
					"no-show",
				]),
				notes: faker.helpers.maybe(() => faker.lorem.sentences(2), {
					probability: 0.4,
				}),
			});
		}

		await testDb.insert(schema.appointments).values(appointments);
		console.log(`✅ Created ${CONFIG.appointments} appointments`);

		// 5. Create medical records
		console.log(`📊 Creating ${CONFIG.medicalRecords} medical records...`);
		const medicalRecords = [];

		for (let i = 0; i < CONFIG.medicalRecords; i++) {
			const patientId = faker.number.int({
				min: 1,
				max: CONFIG.patients,
			});
			const doctor = faker.helpers.arrayElement(doctors);
			const doctorId = doctor.id;
			const appointmentId = faker.helpers.maybe(
				() => faker.number.int({ min: 1, max: CONFIG.appointments }),
				{ probability: 0.7 }
			);

			medicalRecords.push({
				patientId,
				doctorId,
				appointmentId,
				visitDate: faker.date.between({
					from: new Date(2023, 0, 1),
					to: new Date(),
				}),
				chiefComplaint: faker.lorem.sentences(1),
				diagnosis: faker.helpers.arrayElement([
					"Hypertension",
					"Diabetes",
					"Common Cold",
					"Migraine",
					"Back Pain",
					"Allergic Reaction",
					"Gastroenteritis",
					"Bronchitis",
					"Anxiety",
					"Depression",
				]),
				treatment: faker.lorem.sentences(2),
				prescription: faker.helpers.maybe(
					() => faker.lorem.sentences(1),
					{ probability: 0.6 }
				),
				notes: faker.helpers.maybe(() => faker.lorem.sentences(3), {
					probability: 0.5,
				}),
				vitalSigns: generateVitalSigns(),
			});
		}

		await testDb.insert(schema.medicalRecords).values(medicalRecords);
		console.log(`✅ Created ${CONFIG.medicalRecords} medical records`);

		// 6. Create prescriptions
		console.log(`📊 Creating ${CONFIG.prescriptions} prescriptions...`);
		const prescriptions = [];

		for (let i = 0; i < CONFIG.prescriptions; i++) {
			const patientId = faker.number.int({
				min: 1,
				max: CONFIG.patients,
			});
			const doctor = faker.helpers.arrayElement(doctors);
			const doctorId = doctor.id;
			const medicationId = faker.number.int({
				min: 1,
				max: CONFIG.medications,
			});
			const medicalRecordId = faker.helpers.maybe(
				() => faker.number.int({ min: 1, max: CONFIG.medicalRecords }),
				{ probability: 0.8 }
			);

			prescriptions.push({
				patientId,
				doctorId,
				medicationId,
				medicalRecordId,
				dosage: faker.helpers.arrayElement([
					"1 tablet twice daily",
					"2 tablets once daily",
					"5ml three times daily",
					"1 capsule every 8 hours",
					"Apply twice daily",
				]),
				frequency: faker.helpers.arrayElement([
					"Once daily",
					"Twice daily",
					"Three times daily",
					"Every 8 hours",
					"As needed",
				]),
				duration: faker.helpers.arrayElement([
					"7 days",
					"10 days",
					"14 days",
					"21 days",
					"30 days",
					"As needed",
				]),
				instructions: faker.lorem.sentences(1),
				quantity: faker.number.int({ min: 10, max: 100 }),
				isDispensed: faker.datatype.boolean(),
			});
		}

		await testDb.insert(schema.prescriptions).values(prescriptions);
		console.log(`✅ Created ${CONFIG.prescriptions} prescriptions`);

		// 7. Create invoices
		console.log(`📊 Creating ${CONFIG.invoices} invoices...`);
		const invoices = [];

		for (let i = 0; i < CONFIG.invoices; i++) {
			const patientId = faker.number.int({
				min: 1,
				max: CONFIG.patients,
			});
			const appointmentId = faker.helpers.maybe(
				() => faker.number.int({ min: 1, max: CONFIG.appointments }),
				{ probability: 0.6 }
			);
			const totalAmount = faker.number.float({
				min: 50,
				max: 1000,
				fractionDigits: 2,
			});
			const paidAmount = faker.number.float({
				min: 0,
				max: totalAmount,
				fractionDigits: 2,
			});

			invoices.push({
				invoiceNumber: generateInvoiceNumber(i),
				patientId,
				appointmentId,
				totalAmount,
				paidAmount,
				status:
					paidAmount >= totalAmount
						? "paid"
						: faker.helpers.arrayElement(["pending", "overdue"]),
				dueDate: faker.date.between({
					from: new Date(),
					to: new Date(2025, 11, 31),
				}),
				items: generateBillingItems(),
			});
		}

		await testDb.insert(schema.invoices).values(invoices);
		console.log(`✅ Created ${CONFIG.invoices} invoices`);

		// 8. Create lab tests
		console.log(`📊 Creating ${CONFIG.labTests} lab tests...`);
		const labTests = [];

		for (let i = 0; i < CONFIG.labTests; i++) {
			const patientId = faker.number.int({
				min: 1,
				max: CONFIG.patients,
			});
			const doctor = faker.helpers.arrayElement(doctors);
			const doctorIndex = doctors.indexOf(doctor);
			const doctorId = `doctor-${doctorIndex + 1}`;

			labTests.push({
				patientId,
				doctorId,
				testName: faker.helpers.arrayElement([
					"Complete Blood Count",
					"Lipid Profile",
					"Blood Glucose",
					"Liver Function Test",
					"Kidney Function Test",
					"Thyroid Function Test",
					"Urinalysis",
					"Chest X-Ray",
				]),
				testType: faker.helpers.arrayElement([
					"blood",
					"urine",
					"imaging",
					"other",
				]),
				status: faker.helpers.arrayElement([
					"ordered",
					"in-progress",
					"completed",
				]),
				orderDate: faker.date.between({
					from: new Date(2023, 0, 1),
					to: new Date(),
				}),
				completedDate: faker.helpers.maybe(
					() =>
						faker.date.between({
							from: new Date(2023, 0, 1),
							to: new Date(),
						}),
					{ probability: 0.7 }
				),
				results: faker.helpers.maybe(() => faker.lorem.sentences(2), {
					probability: 0.6,
				}),
				normalRange: faker.helpers.maybe(() => "Normal range: 0-100", {
					probability: 0.5,
				}),
				notes: faker.helpers.maybe(() => faker.lorem.sentences(1), {
					probability: 0.3,
				}),
			});
		}

		await testDb.insert(schema.labTests).values(labTests);
		console.log(`✅ Created ${CONFIG.labTests} lab tests`);

		// 9. Create system settings
		console.log("📊 Creating system settings...");
		await testDb.insert(schema.systemSettings).values([
			{
				key: "clinic_name",
				value: "Performance Test Clinic",
				description: "Name of the clinic for testing",
				category: "clinic",
				isPublic: true,
			},
		]);
		console.log("✅ Created system settings");

		const endTime = Date.now();
		const duration = (endTime - startTime) / 1000;

		console.log("\n🎉 Performance data seeding completed!");
		console.log(`⏱️  Total time: ${duration.toFixed(2)} seconds`);
		console.log(
			`📈 Generated approximately ${(CONFIG.patients + CONFIG.appointments + CONFIG.medicalRecords + CONFIG.prescriptions + CONFIG.invoices + CONFIG.labTests).toLocaleString()} records`
		);
		console.log(
			`👥 Created ${CONFIG.doctors} doctors, ${CONFIG.admins} admins with login accounts`
		);
		console.log("\n🔐 Test Login Credentials:");
		console.log("   Admin: admin@clinic.local / admin123");
		console.log("   Doctors: [username]@clinic.local / doctor123");
	} catch (error) {
		console.error("❌ Failed to seed performance data:", error);
		throw error;
	}
}

// Run the seeder if this file is executed directly
if (import.meta.main) {
	seedPerformanceData();
}
