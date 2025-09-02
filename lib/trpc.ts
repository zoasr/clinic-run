import { initTRPC, TRPCError } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { auth } from "./auth.js";
import { db } from "./db/index.js";
import * as authSchema from "./db/schema/auth-schema.js";
import superjson from "superjson";

export type CreateContextOptions = FetchCreateContextFnOptions;

export const createContext = async (opts: CreateContextOptions) => {
	let session = null;

	try {
		// Try to get the session from the request
		// Better-Auth will handle the session extraction from cookies automatically
		session = await auth.api.getSession(opts.req);
	} catch (error) {
		console.error("Failed to get session in tRPC context:", error);
		session = null;
	}

	return {
		session,
		db,
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
		throw new TRPCError({ code: "UNAUTHORIZED" });
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
const extractRoles = (user: any): string[] => {
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
const hasAnyRole = (...required: string[]) =>
	t.middleware(({ ctx, next }) => {
		const roles = extractRoles((ctx as any).session?.user);
		// If checking for doctor, allow admin as well
		const needed = new Set(
			required.flatMap((r) =>
				r === "doctor" ? ["doctor", "admin"] : [r]
			)
		);
		const ok = roles.some((r) => needed.has(r));
		if (!ok) {
			throw new TRPCError({ code: "FORBIDDEN" });
		}
		return next();
	});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure
	.use(isAuthed)
	.use(hasAnyRole("admin"));
export const doctorProcedure = t.procedure
	.use(isAuthed)
	.use(hasAnyRole("doctor"));
