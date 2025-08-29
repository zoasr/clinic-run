import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import * as schema from "../db/schema/schema.js";
import { router, protectedProcedure } from "../trpc.js";
import { and, desc, eq, like } from "drizzle-orm";

const patientInputSchema = createInsertSchema(schema.patients).omit({
	patientId: true,
});

export const patientsRouter = router({
	getAll: protectedProcedure
		.input(
			z.object({
				search: z.string().optional(),
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(10),
			})
		)
		.query(async ({ input, ctx }) => {
			const { search, page, limit } = input;
			const offset = (page - 1) * limit;

			const whereConditions = [eq(schema.patients.isActive, true)];

			if (search) {
				whereConditions.push(
					like(schema.patients.firstName, `%${search}%`)
				);
			}

			const patients = await ctx.db
				.select()
				.from(schema.patients)
				.where(and(...whereConditions))
				.limit(limit)
				.offset(offset)
				.orderBy(desc(schema.patients.createdAt));

			return patients;
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
