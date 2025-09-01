import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
import { eq, like, and, desc, lt, sql, lte } from "drizzle-orm";
import * as schema from "../db/schema/schema.js";
import { createInsertSchema } from "drizzle-zod";

const medicationInputSchema = createInsertSchema(schema.medications);

export const medicationsRouter = router({
	getAll: protectedProcedure
		.input(
			z.object({
				search: z.string().optional(),
				lowStock: z.boolean().optional(),
				outOfStock: z.boolean().optional(),
				limit: z.number().min(1).max(100).default(20),
				cursor: z.number().optional(), // For infinite queries
			})
		)
		.query(async ({ input, ctx }) => {
			const { search, lowStock, outOfStock, limit, cursor } = input;

			const whereConditions = [];

			if (search) {
				whereConditions.push(
					like(schema.medications.name, `%${search}%`)
				);
			}

			if (lowStock) {
				whereConditions.push(
					sql`${schema.medications.quantity} <= ${schema.medications.minStockLevel}`
				);
				whereConditions.push(sql`${schema.medications.quantity} > 0`);
			}

			if (outOfStock) {
				whereConditions.push(eq(schema.medications.quantity, 0));
			}

			// Add cursor condition for infinite queries
			if (cursor) {
				if (!lowStock && !outOfStock)
					whereConditions.push(lt(schema.medications.id, cursor));
			}

			const medications = await ctx.db
				.select()
				.from(schema.medications)
				.where(and(...whereConditions))
				.limit(limit + 1) // Fetch one extra to check if there are more
				.orderBy(desc(schema.medications.id));

			const hasNextPage = medications.length > limit;
			const data = hasNextPage
				? medications.slice(0, limit)
				: medications;
			const nextCursor = hasNextPage ? data[data.length - 1]?.id : null;

			return {
				data,
				nextCursor,
				hasNextPage,
			};
		}),

	getAllLowStock: protectedProcedure.query(async ({ ctx }) => {
		const medications = await ctx.db
			.select()
			.from(schema.medications)
			.where(
				and(
					eq(schema.medications.isActive, true),
					sql`${schema.medications.quantity} <= ${schema.medications.minStockLevel}`
				)
			)
			.orderBy(desc(schema.medications.id));

		return medications;
	}),

	getAllOutOfStock: protectedProcedure.query(async ({ ctx }) => {
		const medications = await ctx.db
			.select()
			.from(schema.medications)
			.where(lte(schema.medications.quantity, 0))
			.orderBy(desc(schema.medications.id));

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
