import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin } from "better-auth/plugins";
import { withCloudflare } from "better-auth-cloudflare";
import { Hono } from "hono";
import { cors } from "hono/cors";
import * as jose from "jose";
import { createDbForUrl } from "./db/factory.js";
import { db } from "./db/index.js";
import * as authSchema from "./db/schema/auth-schema.js";
import { seedDatabase } from "./db/seed.js";
import { appRouter } from "./index.js";
import { migrate } from "./migrator/migrator.js";
import { ac, admin, doctor, staff } from "./permissions";
import { createContext } from "./trpc.js";

interface Env {
	DEMO_JWT_SECRET: string;
	TURSO_AUTH_TOKEN: string;
	TURSO_ORG: string;
	TURSO_DB: string;
	DEMO_SESSION_TTL_MINUTES?: string;
}

const app = new Hono<{ Bindings: Env }>();

// Rate limiting store (in-memory for MVP)
const rateLimit = new Map();

const rolesObj = {
	admin,
	doctor,
	staff,
} as const;

// Enhanced CORS configuration
app.use(
	"*",
	cors({
		origin: [
			"https://clinic-run-demo.vercel.app",
			process.env["FRONTEND_URL"] || "http://localhost:3030",
		], // Update with actual Vercel URL
		credentials: true,
		allowHeaders: ["Content-Type", "Authorization", "Cookie"],
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		exposeHeaders: ["Set-Cookie"],
	}),
);

// Auth routes
app.on(["POST", "GET"], "/api/auth/*", async (c) => {
	let currentDb = db; // start with default db

	const authHeader = c.req.header("authorization");
	if (authHeader?.startsWith("Bearer ")) {
		const token = authHeader.slice(7);
		try {
			const secret = new TextEncoder().encode(c.env.DEMO_JWT_SECRET);
			const { payload } = await jose.jwtVerify(token, secret);
			const branchUrl = payload["branchUrl"] as string;
			currentDb = await createDbForUrl(branchUrl, c.env.TURSO_AUTH_TOKEN);
		} catch {
			// use default db
		}
	}

	// Create auth instance with the current database
	const localAuth = betterAuth({
		...withCloudflare(
			{
				autoDetectIpAddress: false,
				geolocationTracking: false,
				cf: (c.req.raw as any).cf || {},
			},
			{
				database: drizzleAdapter(currentDb, {
					provider: "sqlite",
					schema: {
						user: authSchema.user,
						session: authSchema.session,
						account: authSchema.account,
						verification: authSchema.verification,
					},
				}),
				trustedOrigins: [
					"https://clinic-run-demo.vercel.app",
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

	return localAuth.handler(c.req.raw);
});

// tRPC API handler
app.all("/api/trpc/*", async (c) => {
	return fetchRequestHandler({
		endpoint: "/api/trpc",
		req: c.req.raw,
		router: appRouter,
		createContext: () =>
			createContext({
				req: c.req.raw,
				resHeaders: new Headers(),
				info: {} as any,
				env: c.env as Env,
			}),
		onError: ({ path, error }) => {
			console.error(`❌ tRPC failed on ${path ?? "<no-path>"}: ${error}`);
		},
	});
});

// Demo initialization route
app.post("/demo/init", async (c) => {
	// Rate limiting
	const ip =
		c.req.header("CF-Connecting-IP") ||
		c.req.header("X-Forwarded-For") ||
		"unknown";
	const now = Date.now();
	const windowMs = 60 * 1000; // 1 minute
	const maxRequests = 5;

	const key = ip;
	const entry = rateLimit.get(key);

	if (entry && entry.count >= maxRequests && now - entry.reset < windowMs) {
		return c.json({ error: "Rate limit exceeded. Try again later." }, 429);
	}

	if (!entry || now - entry.reset > windowMs) {
		rateLimit.set(key, { count: 1, reset: now });
	} else {
		entry.count++;
	}

	try {
		const org = c.env.TURSO_ORG;
		const authToken = c.env.TURSO_AUTH_TOKEN;
		const secret = new TextEncoder().encode(c.env.DEMO_JWT_SECRET);
		const ttl = Number(c.env.DEMO_SESSION_TTL_MINUTES) || 30;

		console.log(authToken);

		// Generate unique database name
		const random = Math.random().toString(36).substring(2, 15);
		const timestamp = Date.now().toString(36);
		const dbName = `demo-${random}-${timestamp}`;

		// Create database via Turso API
		const res = await fetch(
			`https://api.turso.tech/v1/organizations/${org}/databases`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${authToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: dbName,
					group: "default",
				}),
			},
		);

		if (!res.ok) {
			const error = await res.text();
			console.error("Failed to create database:", error);
			return c.json({ error: "Failed to create demo database" }, 500);
		}

		const dbData = (await res.json()) as {
			database?: { Hostname?: string };
		};
		const tokenRes = await fetch(
			`https://api.turso.tech/v1/organizations/${org}/databases/${dbName}/auth/tokens`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${authToken}`,
				},
			},
		);
		if (!tokenRes.ok) {
			const error = await tokenRes.text();
			console.error("Failed to create database token:", error);
			return c.json({ error: "Failed to create database token" }, 500);
		}
		const dbToken = ((await tokenRes.json()) as { jwt: string }).jwt;
		const dbUrl = dbData.database?.Hostname
			? `libsql://${dbData.database?.Hostname}`
			: `libsql://${dbName}-${org}.turso.io`;

		try {
			// Create DB client for the new database
			const dbClient = await createDbForUrl(dbUrl, dbToken);

			// migrate database
			await migrate(dbClient, {});

			// Seed the database
			await seedDatabase(dbClient);

			// Generate JWT token
			const payload = {
				branchUrl: dbUrl,
				expiry: Date.now() + ttl * 60 * 1000,
			};
			const token = await new jose.SignJWT(payload)
				.setProtectedHeader({ alg: "HS256" })
				.setExpirationTime(`${ttl}m`)
				.sign(secret);

			return c.json({ token });
		} catch (error) {
			// delete database from turso
			const deleteDbRes = await fetch(
				`https://api.turso.tech/v1/organizations/${org}/databases/${dbName}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${authToken}`,
						"Content-Type": "application/json",
					},
				},
			);
			console.log(await deleteDbRes.json());
			throw error as Error;
		}
	} catch (error) {
		console.error("Demo init error:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// Health check route
app.get("/api/health", (c) => {
	return c.json({ status: "OK", timestamp: new Date().toISOString() });
});

export default app;
