import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { ac, admin, doctor, staff } from "../permissions";
import * as authSchema from "./schema/auth-schema";
import * as schema from "./schema/schema";

const rolesObj = {
	admin,
	doctor,
	staff,
} as const;

// Fast seed for demo initialization - direct inserts with pre-hashed passwords
export async function seedDatabaseDemo(db: any) {
	try {
		// Pre-computed scrypt hash for "admin123" using Better Auth's hashPassword
		// Generated using: await hashPassword("admin123")
		const adminPasswordHash =
			"4e7c46465cbe5903b2d371b3c4b64c1d:92c4145b6c910e49b8832f2cc2d666d70e91698e2a87c4c7c81f73e741c3f749c172d7cd0fb3cce40246fe78f222389ccc6ec82f4f7eaf7b60c72b7658c81118";

		const adminId = `demo-admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		await db.insert(authSchema.user).values({
			id: adminId,
			name: "System Administrator",
			email: "admin@clinic.local",
			emailVerified: true,
			username: "admin",
			firstName: "System",
			lastName: "Administrator",
			role: "admin",
			isActive: true,
			banned: null,
			banReason: null,
			banExpires: null,
			image: null,
		});

		// Insert account with pre-hashed password
		await db.insert(authSchema.account).values({
			id: `acc-${adminId}`,
			accountId: "admin@clinic.local",
			providerId: "credential",
			userId: adminId,
			password: adminPasswordHash,
			createdAt: new Date(),
			updatedAt: new Date(),
			accessToken: null,
			refreshToken: null,
			idToken: null,
			accessTokenExpiresAt: null,
			refreshTokenExpiresAt: null,
			scope: null,
		});

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
		]);

		console.log("Demo database seeded successfully");
	} catch (error) {
		console.error("Failed to seed demo database:", error);
		throw error;
	}
}

// Seed initial data
export async function seedDatabase(db: any) {
	const localAuth = betterAuth({
		database: drizzleAdapter(db, {
			provider: "sqlite",
			schema: {
				user: authSchema.user,
				session: authSchema.session,
				account: authSchema.account,
				verification: authSchema.verification,
			},
		}),
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
		},
		session: {
			expiresIn: 30 * 60 * 60 * 24,
			updateAge: 30 * 60 * 60 * 24,
		},
		user: {
			additionalFields: {
				username: {
					type: "string",
					required: true,
					unique: true,
				},
				firstName: {
					type: "string",
					required: true,
				},
				lastName: {
					type: "string",
					required: true,
				},
				role: {
					type: "string",
					required: true,
					defaultValue: "staff",
				},
				isActive: {
					type: "boolean",
					required: true,
					defaultValue: true,
				},
			},
		},
		trustedOrigins: [process.env["FRONTEND_URL"] || "http://localhost:3030"],
		plugins: [
			// Better Auth Admin plugin to manage roles/permissions, bans, and impersonation
			adminPlugin({
				ac,
				defaultRole: "staff",
				adminRoles: ["admin"],
				roles: rolesObj,
			}),
		],
	});
	try {
		// Create default admin user
		const adminExists = await db
			.select()
			.from(authSchema.user)
			.where(eq(authSchema.user.username, "admin"))
			.limit(1);

		if (adminExists.length === 0) {
			const newUser = await localAuth.api.createUser({
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
			const doctor1 = await localAuth.api.createUser({
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
			const doctor2 = await localAuth.api.createUser({
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
			const doctor3 = await localAuth.api.createUser({
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
