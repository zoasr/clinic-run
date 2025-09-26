import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";
import z from "zod";

const baseURL = import.meta.env.VITE_SERVER_URL || "http://localhost:3031";

export const authClient = createAuthClient({
	baseURL: baseURL,
	fetchOptions: {
		onRequest: (context) => {
			const demoToken = sessionStorage.getItem("demoToken");
			if (demoToken) {
				return {
					...context,
					headers: {
						...context.headers,
						["X-Demo-Token"]: `Bearer ${demoToken}`,
						["Content-Type"]: "application/json",
					},
				};
			}
			return context;
		},
	},
	features: {
		session: {
			enabled: true,
		},
	},
	credentials: "include",
	plugins: [adminClient()],
});

export const roles = ["staff", "doctor", "admin"] as const;
export type Role = (typeof roles)[number];
export const roleSchema = z.enum(roles);

// Export types for better type safety
// Better-Auth wraps responses in a data property
export type Session = typeof authClient.$Infer.Session;
export type User = (typeof authClient.$Infer.Session)["user"];
