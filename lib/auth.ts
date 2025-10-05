import { createHash } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin } from "better-auth/plugins";
import { z } from "zod";
import { db } from "./db/index.js";
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

type AuthInstance = any;

export function createAuthForRequest(options: {
	db: any;
	trustedOrigins?: string[];
}): AuthInstance {
	const { db, trustedOrigins } = options;

	return betterAuth({
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
			password: {
				hash: async (password: string) => {
					// Simple SHA-256 hash for demo - very fast, no security
					return createHash("sha256").update(password).digest("hex");
				},
				verify: async ({ password, hash }) => {
					// Simple verification for demo
					const hashedPassword = createHash("sha256")
						.update(password)
						.digest("hex");
					return hashedPassword === hash;
				},
			},
		},
		session: {
			expiresIn: 30 * 60 * 60 * 24,
			updateAge: 30 * 60 * 60 * 24,
		},
		advanced: {
			cookies: {
				session_token: {
					attributes: {
						httpOnly: true,
						secure: true,
						sameSite: "none",
					},
				},
			},
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
		trustedOrigins: trustedOrigins || [
			process.env["FRONTEND_URL"] || "http://localhost:3030",
			"http://localhost:3031",
		],
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
}

export type Session = any;

export function getAuth() {
	return createAuthForRequest({
		db,
	});
}
