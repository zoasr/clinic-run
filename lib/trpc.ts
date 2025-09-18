import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import * as jose from "jose";
import { getAuth } from "./auth.js";
import { db } from "./db/index.js";
import { createDbForUrl } from "./db/factory.js";
import * as authSchema from "./db/schema/auth-schema.js";

export type CreateContextOptions = FetchCreateContextFnOptions & {
	env: { DEMO_JWT_SECRET: string; TURSO_AUTH_TOKEN: string };
};

export const createContext = async (opts: CreateContextOptions) => {
	let session = null;
	let dbInstance = db; // default

	// Check for demo token
	const authHeader = opts.req.headers.get("authorization");
	if (authHeader?.startsWith("Bearer ")) {
		const token = authHeader.slice(7);
		try {
			const secret = new TextEncoder().encode(opts.env.DEMO_JWT_SECRET);
			const { payload } = await jose.jwtVerify(token, secret);
			const branchUrl = payload["branchUrl"] as string;
			dbInstance = await createDbForUrl(branchUrl, opts.env.TURSO_AUTH_TOKEN);
		} catch (error) {
			console.error("Invalid demo token:", error);
			// Use default db
		}
	}

	try {
		// Try to get the session from the request
		// Better-Auth will handle the session extraction from cookies automatically
		session = await getAuth().api.getSession(opts.req);
	} catch (error) {
		console.error("Failed to get session in tRPC context:", error);
		session = null;
	}

	return {
		session,
		db: dbInstance,
		authSchema,
		req: opts.req,
	};
};

const t = initTRPC.context<typeof createContext>().create({
	transformer: superjson,
});

// Middleware to check if user is authenticated
const isAuthed = t.middleware(({ ctx, next }) => {
	if (!ctx.session) {
		console.log("No session found in middleware");
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Not authenticated",
		});
	}

	// Check if session is still valid
	if (ctx.session.session.expiresAt < new Date()) {
		console.log("Session expired in middleware");
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Session expired",
		});
	}

	return next({
		ctx: {
			...ctx,
			session: ctx.session,
			user: ctx.session.user,
		},
	});
});

// Extract roles from session user accommodating different storage formats
const extractRoles = (
	user: { role?: unknown; roles?: unknown } | null | undefined,
): string[] => {
	const value = user?.role ?? user?.roles; // support either 'role' or 'roles'
	if (!value) return [];
	if (Array.isArray(value)) return value.map(String);
	if (typeof value === "string")
		return value
			.split(",")
			.map((r) => r.trim())
			.filter(Boolean);
	return [String(value)];
};

// Middleware to check if user has at least one required role
const hasAnyRole = (required: string[]) =>
	t.middleware(({ ctx, next }) => {
		const roles = extractRoles(
			(ctx as { session?: { user?: unknown } }).session?.user as
				| { role?: unknown; roles?: unknown }
				| null
				| undefined,
		);
		// If checking for doctor, allow admin as well
		const needed = new Set(
			required.flatMap((r) => (r === "doctor" ? ["doctor", "admin"] : [r])),
		);
		const ok = roles.some((r) => needed.has(r));
		if (!ok) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: `Not authorized to perform this action your role is: ${roles}, required roles: ${required}`,
			});
		}
		return next();
	});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export const authorizedProcedure = t.procedure
	.use(isAuthed)
	.use(hasAnyRole(["admin", "doctor"]));
export const adminProcedure = t.procedure
	.use(isAuthed)
	.use(hasAnyRole(["admin"]));
export const doctorProcedure = t.procedure
	.use(isAuthed)
	.use(hasAnyRole(["doctor"]));
