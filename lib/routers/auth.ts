import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { auth } from "../auth.js";

export const authRouter = router({
	signIn: publicProcedure
		.input(
			z.object({
				email: z.string().email(),
				password: z.string(),
			})
		)
		.mutation(async ({ input }) => {
			return auth.api.signInEmail({
				body: input,
			});
		}),

	signUp: publicProcedure
		.input(
			z.object({
				email: z.string().email(),
				password: z.string(),
				name: z.string(),
				username: z.string(),
				firstName: z.string(),
				lastName: z.string(),
				role: z.string().optional(),
			})
		)
		.mutation(async ({ input }) => {
			return auth.api.signUpEmail({
				body: input,
			});
		}),

	signOut: protectedProcedure.mutation(async ({ ctx }) => {
		return auth.api.signOut({
			headers: ctx.req.headers,
		});
	}),

	getSession: publicProcedure.query(async ({ ctx }) => {
		return ctx.session;
	}),

	refreshSession: protectedProcedure.mutation(async ({ ctx }) => {
		// Refresh session logic if needed
		return ctx.session;
	}),
});
