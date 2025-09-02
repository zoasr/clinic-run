import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin } from "better-auth/plugins";
import { db } from "./db/index.js";
import { z } from "zod";
import * as authSchema from "./db/schema/auth-schema.js";

import { ac, admin, doctor, staff } from "./permissions";

const rolesObj = {
	admin,
	doctor,
	staff,
} as const;

export const roles = Object.keys(rolesObj) as Array<keyof typeof rolesObj>;
export type Role = (typeof roles)[number];
export const roleSchema = z.enum(roles);

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
	trustedOrigins: [process.env["FRONTEND_URL"] || "http://localhost:3030"],
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false, // Disabled for offline clinic system
	},
	session: {
		// Server-side session expiry is set to 24 hours
		// Client-side timeout is managed dynamically via SessionManager component
		// using the session_timeout setting from the database
		expiresIn: 30 * 60 * 60 * 24, // 24 hours (server max)
		updateAge: 30 * 60 * 60 * 24, // 24 hours (server max)
		// The actual session timeout is enforced client-side based on settings
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

export type Session = typeof auth.$Infer.Session;
// export type User = typeof auth.$Infer.User;
