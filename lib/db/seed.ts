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
			await auth.api.signUpEmail({
				body: {
					name: "admin",
					email: "admin@clinic.local",
					password: "admin123",
					firstName: "System",
					lastName: "Administrator",
					username: "admin",
					role: "admin",
				},
			});
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
