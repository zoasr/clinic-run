import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import * as schema from "../db/schema/schema.js";
import { router, protectedProcedure } from "../trpc.js";
import { and, desc, eq, like, lt, or } from "drizzle-orm";

const patientInputSchema = createInsertSchema(schema.patients).omit({
	patientId: true,
});

export const patientsRouter = router({
	getAll: protectedProcedure
		.input(
			z.object({
				search: z.string().optional(),
				limit: z.number().min(1).max(100).default(20),
				cursor: z.number().optional(), // For infinite queries
			})
		)
		.query(async ({ input, ctx }) => {
			const { search, limit, cursor } = input;

			const whereConditions = [];

			if (search) {
				let [firstName, lastName] = search.split(" ");
				whereConditions.push(
					or(
						like(
							schema.patients.firstName,
							`%${firstName ? firstName : ""}%`
						),
						like(
							schema.patients.lastName,
							`%${lastName ? lastName : ""}%`
						),
						like(schema.patients.patientId, `%${search}%`)
					)
				);
			}

			// Add cursor condition for infinite queries
			if (cursor) {
				whereConditions.push(lt(schema.patients.id, cursor));
			}

			const patients = await ctx.db
				.select()
				.from(schema.patients)
				.where(and(...whereConditions))
				.limit(limit + 1) // Fetch one extra to check if there are more
				.orderBy(desc(schema.patients.id));

			const hasNextPage = patients.length > limit;
			const data = hasNextPage ? patients.slice(0, limit) : patients;
			const nextCursor = hasNextPage ? data[data.length - 1]?.id : null;

			return {
				data,
				nextCursor,
				hasNextPage,
			};
		}),

	getById: protectedProcedure
		.input(
			z.object({
				id: z.number(),
			})
		)
		.query(async ({ input, ctx }) => {
			const patient = await ctx.db
				.select()
				.from(schema.patients)
				.where(eq(schema.patients.id, input.id))
				.limit(1);

			if (patient.length === 0) {
				throw new Error("Patient not found");
			}

			return patient[0];
		}),

	create: protectedProcedure
		.input(patientInputSchema)
		.mutation(async ({ input, ctx }) => {
			// Generate patient ID
			const lastPatient = await ctx.db
				.select()
				.from(schema.patients)
				.orderBy(desc(schema.patients.id))
				.limit(1);

			const patientId = `P${String((lastPatient[0]?.id || 0) + 1).padStart(4, "0")}`;

			const newPatient = await ctx.db
				.insert(schema.patients)
				.values({
					...input,
					patientId,
				})
				.returning();

			return newPatient[0];
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				data: patientInputSchema.partial(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const updatedPatient = await ctx.db
				.update(schema.patients)
				.set({
					...input.data,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(schema.patients.id, input.id))
				.returning();

			if (updatedPatient.length === 0) {
				throw new Error("Patient not found");
			}

			return updatedPatient[0];
		}),

	delete: protectedProcedure
		.input(
			z.object({
				id: z.number(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const deletedPatient = await ctx.db
				.update(schema.patients)
				.set({
					isActive: false,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(schema.patients.id, input.id))
				.returning();

			if (deletedPatient.length === 0) {
				throw new Error("Patient not found");
			}

			return { success: true };
		}),
});
