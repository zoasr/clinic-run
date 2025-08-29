import { z } from "zod";
import {
	router,
	protectedProcedure,
	adminProcedure,
	publicProcedure,
} from "../trpc.js";
import { eq } from "drizzle-orm";
import * as authSchema from "../db/schema/auth-schema.js";
import { auth } from "../auth.js";

const userInputSchema = z.object({
	username: z.string(),
	email: z.email(),
	password: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	role: z
		.union([z.literal("staff"), z.literal("doctor"), z.literal("admin")])
		.optional(),
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
				role: z.union([
					z.literal("staff"),
					z.literal("doctor"),
					z.literal("admin"),
				]),
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

			return users;
		}),
	getDoctors: publicProcedure.query(async ({ ctx }) => {
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
			.where(eq(authSchema.user.role, "doctor"));

		return users;
	}),

	create: adminProcedure
		.input(userInputSchema)
		.mutation(async ({ input }) => {
			const newUser = await auth.api.createUser({
				body: {
					name: input.firstName + " " + input.lastName,
					email: input.email,
					password: input.password,
					role: input.role || "staff",
					data: {
						username: input.username,
						firstName: input.firstName,
						lastName: input.lastName,
					},
				},
			});
			// auth.api.signUpEmail({
			// 	body: {
			// 		name: input.firstName + " " + input.lastName,
			// 		email: input.email,
			// 		password: input.password,
			// 		username: input.username,
			// 		firstName: input.firstName,
			// 		lastName: input.lastName,
			// 		role: input.role,
			// 	},
			// });

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
			if (input.data.role) {
				await auth.api.setRole({
					body: {
						userId: input.id,
						role: input.data.role,
					},
					headers: ctx.req.headers,
				});
			}
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
			const data = await auth.api.changePassword({
				body: {
					newPassword: input.newPassword, // required
					currentPassword: input.currentPassword, // required
					revokeOtherSessions: true,
				},
				headers: ctx.req.headers,
			});
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

			return { user: data.user };
		}),

	updateProfile: protectedProcedure
		.input(
			z.object({
				firstName: z.string().min(1, "First name is required"),
				lastName: z.string().min(1, "Last name is required"),
				email: z.string().email("Invalid email address"),
				username: z
					.string()
					.min(3, "Username must be at least 3 characters"),
			})
		)
		.mutation(async ({ input, ctx }) => {
			// Users can only update their own profile, or admins can update any profile
			const userId = ctx.user.id;

			const updatedUser = await ctx.db
				.update(authSchema.user)
				.set({
					firstName: input.firstName,
					lastName: input.lastName,
					email: input.email,
					username: input.username,
					name: `${input.firstName} ${input.lastName}`,
					updatedAt: new Date(),
				})
				.where(eq(authSchema.user.id, userId))
				.returning();

			if (updatedUser.length === 0) {
				throw new Error("User not found");
			}

			return updatedUser[0];
		}),

	delete: adminProcedure
		.input(
			z.object({
				id: z.string(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			// Prevent deleting self
			if (input.id === ctx.user.id) {
				throw new Error("Cannot delete your own account");
			}

			// Delete the user (this will cascade delete sessions due to foreign key)
			const deletedUser = await ctx.db
				.delete(authSchema.user)
				.where(eq(authSchema.user.id, input.id))
				.returning();

			if (deletedUser.length === 0) {
				throw new Error("User not found");
			}

			return { success: true };
		}),

	getProfile: protectedProcedure.query(async ({ ctx }) => {
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
			.where(eq(authSchema.user.id, ctx.user.id))
			.limit(1);

		if (user.length === 0) {
			throw new Error("User not found");
		}

		return user[0];
	}),
});
