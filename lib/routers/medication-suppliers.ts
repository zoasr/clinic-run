import { desc, eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import * as schema from "../db/schema/schema.js";
import { authorizedProcedure, protectedProcedure, router } from "../trpc.js";

const supplierInputSchema = createInsertSchema(schema.medicationSuppliers);

export const medicationSuppliersRouter = router({
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const suppliers = await ctx.db
			.select()
			.from(schema.medicationSuppliers)
			.orderBy(desc(schema.medicationSuppliers.createdAt));

		return suppliers;
	}),

	getById: protectedProcedure
		.input(
			z.object({
				id: z.number(),
			}),
		)
		.query(async ({ input, ctx }) => {
			const supplier = await ctx.db
				.select()
				.from(schema.medicationSuppliers)
				.where(eq(schema.medicationSuppliers.id, input.id))
				.limit(1);

			if (supplier.length === 0) {
				throw new Error("Supplier not found");
			}

			return supplier[0];
		}),

	create: authorizedProcedure
		.input(supplierInputSchema)
		.mutation(async ({ input, ctx }) => {
			const newSupplier = await ctx.db
				.insert(schema.medicationSuppliers)
				.values({
					...input,
					createdAt: new Date(),
				})
				.returning();

			return newSupplier[0];
		}),

	update: authorizedProcedure
		.input(
			z.object({
				id: z.number(),
				data: supplierInputSchema.partial(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const updatedSupplier = await ctx.db
				.update(schema.medicationSuppliers)
				.set(input.data)
				.where(eq(schema.medicationSuppliers.id, input.id))
				.returning();

			if (updatedSupplier.length === 0) {
				throw new Error("Supplier not found");
			}

			return updatedSupplier[0];
		}),

	delete: authorizedProcedure
		.input(
			z.object({
				id: z.number(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const deletedSupplier = await ctx.db
				.delete(schema.medicationSuppliers)
				.where(eq(schema.medicationSuppliers.id, input.id))
				.returning();

			if (deletedSupplier.length === 0) {
				throw new Error("Supplier not found");
			}

			return { success: true };
		}),
});
