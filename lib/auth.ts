import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/index.js";
import * as authSchema from "./db/schema/auth-schema.js";

// Initialize auth with database
export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: {
			user: authSchema.user,
			session: authSchema.session,
			account: authSchema.account,
			verification: authSchema.verification,
		},
	}),
	trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:3030"],
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false, // Disabled for offline clinic system
	},
	session: {
		expiresIn: 30 * 60 * 60 * 24, // 24 hours
		updateAge: 30 * 60 * 60 * 24, // 24 hours
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
});

export type Session = typeof auth.$Infer.Session;
// export type User = typeof auth.$Infer.User;
