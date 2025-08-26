import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc.js";
import { eq } from "drizzle-orm";
import * as authSchema from "../db/schema/auth-schema.js";
import { auth } from "../auth.js";

const userInputSchema = z.object({
	username: z.string(),
	email: z.email(),
	password: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	role: z.string().optional(),
});

export const usersRouter = router({
	getAll: adminProcedure.query(async ({ ctx }) => {
		const users = await ctx.db
			.select({
				id: authSchema.user.id,
				username: authSchema.user.username,
				email: authSchema.user.email,
				name: authSchema.user.name,
				firstName: authSchema.user.firstName,
				lastName: authSchema.user.lastName,
				role: authSchema.user.role,
				isActive: authSchema.user.isActive,
				createdAt: authSchema.user.createdAt,
			})
			.from(authSchema.user)
			.where(eq(authSchema.user.isActive, true));

		return users;
	}),

	getById: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			})
		)
		.query(async ({ input, ctx }) => {
			const user = await ctx.db
				.select({
					id: authSchema.user.id,
					username: authSchema.user.username,
					email: authSchema.user.email,
					name: authSchema.user.name,
					firstName: authSchema.user.firstName,
					lastName: authSchema.user.lastName,
					role: authSchema.user.role,
					isActive: authSchema.user.isActive,
					createdAt: authSchema.user.createdAt,
				})
				.from(authSchema.user)
				.where(eq(authSchema.user.id, input.id))
				.limit(1);

			if (user.length === 0) {
				throw new Error("User not found");
			}

			return user[0];
		}),

	getByRole: adminProcedure
		.input(
			z.object({
				role: z.string(),
			})
		)
		.query(async ({ input, ctx }) => {
			const users = await ctx.db
				.select({
					id: authSchema.user.id,
					username: authSchema.user.username,
					email: authSchema.user.email,
					name: authSchema.user.name,
					firstName: authSchema.user.firstName,
					lastName: authSchema.user.lastName,
					role: authSchema.user.role,
					isActive: authSchema.user.isActive,
					createdAt: authSchema.user.createdAt,
				})
				.from(authSchema.user)
				.where(eq(authSchema.user.role, input.role));
			console.log(users);

			return users;
		}),

	create: adminProcedure
		.input(userInputSchema)
		.mutation(async ({ input }) => {
			const newUser = await auth.api.signUpEmail({
				body: {
					name: input.firstName + " " + input.lastName,
					email: input.email,
					password: input.password,
					username: input.username,
					firstName: input.firstName,
					lastName: input.lastName,
					role: input.role || "staff",
				},
			});

			return newUser.user;
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string(),
				data: userInputSchema.partial().omit({ password: true }),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const updatedUser = await ctx.db
				.update(authSchema.user)
				.set({
					...input.data,
					name:
						input.data.firstName && input.data.lastName
							? input.data.firstName + " " + input.data.lastName
							: undefined,
					updatedAt: new Date(),
				})
				.where(eq(authSchema.user.id, input.id))
				.returning();

			if (updatedUser.length === 0) {
				throw new Error("User not found");
			}

			return updatedUser[0];
		}),

	deactivate: adminProcedure
		.input(
			z.object({
				id: z.string(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const deactivatedUser = await ctx.db
				.update(authSchema.user)
				.set({
					isActive: false,
					updatedAt: new Date(),
				})
				.where(eq(authSchema.user.id, input.id))
				.returning();

			if (deactivatedUser.length === 0) {
				throw new Error("User not found");
			}

			return { success: true };
		}),

	changePassword: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				currentPassword: z.string(),
				newPassword: z.string(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			// Verify current password first
			try {
				await auth.api.signInEmail({
					body: {
						email: ctx.user.email,
						password: input.currentPassword,
					},
				});
			} catch (error) {
				throw new Error("Current password is incorrect");
			}

			// Update password in database
			const updatedUser = await ctx.db
				.update(authSchema.user)
				.set({
					updatedAt: new Date(),
				})
				.where(eq(authSchema.user.id, input.id))
				.returning();

			if (updatedUser.length === 0) {
				throw new Error("User not found");
			}

			return { success: true };
		}),
});
