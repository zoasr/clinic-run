import { initTRPC, TRPCError } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { auth } from "./auth.js";
import { db } from "./db/index.js";
import * as authSchema from "./db/schema/auth-schema.js";
import { eq } from "drizzle-orm";

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

const t = initTRPC.context<typeof createContext>().create();

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

	console.log("Session validated successfully in middleware:", {
		userId: ctx.session.user.id,
		email: ctx.session.user.email,
	});

	return next({
		ctx: {
			...ctx,
			session: ctx.session,
			user: ctx.session.user,
		},
	});
});

// Middleware to check if user has specific role
const hasRole = (role: string) =>
	t.middleware(({ ctx, next }) => {
		if (ctx.session?.user.role !== role) {
			throw new TRPCError({ code: "FORBIDDEN" });
		}
		return next();
	});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure.use(isAuthed).use(hasRole("admin"));
export const doctorProcedure = t.procedure.use(isAuthed).use(hasRole("doctor"));
