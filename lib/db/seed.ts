import { auth } from "../auth";
import { db } from "./index";
import * as authSchema from "./schema/auth-schema";
import * as schema from "./schema/schema";
import { eq } from "drizzle-orm";

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

		// Add sample medications
		const medicationExists = await db
			.select()
			.from(schema.medications)
			.limit(1);

		if (medicationExists.length === 0) {
			await db.insert(schema.medications).values([
				{
					name: "Paracetamol",
					genericName: "Acetaminophen",
					dosage: "500mg",
					form: "tablet",
					manufacturer: "Generic Pharma",
					quantity: 100,
					minStockLevel: 20,
					unitPrice: 0.5,
				},
				{
					name: "Amoxicillin",
					genericName: "Amoxicillin",
					dosage: "250mg",
					form: "capsule",
					manufacturer: "Generic Pharma",
					quantity: 50,
					minStockLevel: 10,
					unitPrice: 1.25,
				},
			]);
		}

		console.log("Database seeded successfully");
	} catch (error) {
		console.error("Failed to seed database:", error);
		throw error;
	}
}

seedDatabase();
