import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin } from "better-auth/plugins";
import { withCloudflare } from "better-auth-cloudflare";
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
	cf: unknown;
	db: unknown;
	trustedOrigins?: string[];
}): AuthInstance {
	const { cf, db, trustedOrigins } = options;
	return betterAuth({
		...withCloudflare(
			{
				autoDetectIpAddress: false,
				geolocationTracking: false,
				cf: (cf as any) || {},
			},
			{
				database: drizzleAdapter(db as any, {
					provider: "sqlite",
					schema: {
						user: authSchema.user,
						session: authSchema.session,
						account: authSchema.account,
						verification: authSchema.verification,
					},
				}),
				trustedOrigins: trustedOrigins || [
					process.env["FRONTEND_URL"] || "http://localhost:3030",
				],
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
				plugins: [
					adminPlugin({
						ac,
						defaultRole: "staff",
						adminRoles: ["admin"],
						roles: rolesObj,
					}),
				],
			},
		),
	});
}

export type Session = any;

export function getAuth() {
	return createAuthForRequest({
		cf: {},
		db,
	});
}
