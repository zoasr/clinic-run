import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
import { eq, like, and, asc } from "drizzle-orm";
import * as schema from "../db/schema/schema.js";
import { createInsertSchema } from "drizzle-zod";

const medicationInputSchema = createInsertSchema(schema.medications);

export const medicationsRouter = router({
	getAll: protectedProcedure
		.input(
			z.object({
				search: z.string().optional(),
				lowStock: z.boolean().optional(),
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(10),
			})
		)
		.query(async ({ input, ctx }) => {
			const { search, lowStock, page, limit } = input;
			const offset = (page - 1) * limit;

			const whereConditions = [eq(schema.medications.isActive, true)];

			if (search) {
				whereConditions.push(
					like(schema.medications.name, `%${search}%`)
				);
			}

			const medications = await ctx.db
				.select()
				.from(schema.medications)
				.where(and(...whereConditions))
				.limit(limit)
				.offset(offset)
				.orderBy(asc(schema.medications.name));

			// Filter low stock medications if requested
			if (lowStock) {
				return medications.filter(
					(med) => med.quantity <= med.minStockLevel
				);
			}

			return medications;
		}),

	getById: protectedProcedure
		.input(
			z.object({
				id: z.number(),
			})
		)
		.query(async ({ input, ctx }) => {
			const medication = await ctx.db
				.select()
				.from(schema.medications)
				.where(eq(schema.medications.id, input.id))
				.limit(1);

			if (medication.length === 0) {
				throw new Error("Medication not found");
			}

			return medication[0];
		}),

	create: protectedProcedure
		.input(medicationInputSchema)
		.mutation(async ({ input, ctx }) => {
			const newMedication = await ctx.db
				.insert(schema.medications)
				.values(input)
				.returning();

			return newMedication[0];
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				data: medicationInputSchema.partial(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const updatedMedication = await ctx.db
				.update(schema.medications)
				.set({
					...input.data,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(schema.medications.id, input.id))
				.returning();

			if (updatedMedication.length === 0) {
				throw new Error("Medication not found");
			}

			return updatedMedication[0];
		}),

	delete: protectedProcedure
		.input(
			z.object({
				id: z.number(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const deletedMedication = await ctx.db
				.update(schema.medications)
				.set({
					isActive: false,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(schema.medications.id, input.id))
				.returning();

			if (deletedMedication.length === 0) {
				throw new Error("Medication not found");
			}

			return { success: true };
		}),

	adjustStock: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				quantity: z.number(),
				reason: z.string(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const medicationData = await ctx.db
				.select()
				.from(schema.medications)
				.where(eq(schema.medications.id, input.id))
				.limit(1);

			const medication = medicationData[0];

			if (!medication) {
				throw new Error("Medication not found");
			}

			const newQuantity = medication.quantity + input.quantity;

			if (newQuantity < 0) {
				throw new Error("Insufficient stock");
			}

			const updatedMedication = await ctx.db
				.update(schema.medications)
				.set({
					quantity: newQuantity,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(schema.medications.id, input.id))
				.returning();

			return updatedMedication[0];
		}),
});
