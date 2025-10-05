import { z } from "zod";
import { getAuth } from "../auth.js";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";

const auth = getAuth();
export const authRouter = router({
	signIn: publicProcedure
		.input(
			z.object({
				email: z.string().email(),
				password: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			const start = Date.now();
			try {
				const result = await auth.signIn.email(input);
				const duration = Date.now() - start;
				console.log(`Sign-in completed in ${duration}ms for ${input.email}`);
				return result;
			} catch (error) {
				const duration = Date.now() - start;
				console.log(
					`Sign-in failed in ${duration}ms for ${input.email}:`,
					error,
				);
				throw error;
			}
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
			}),
		)
		.mutation(async ({ input }) => {
			return auth.signUp.email(input);
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
