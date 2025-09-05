import { z } from "zod";
import { router, protectedProcedure, authorizedProcedure } from "../trpc.js";
import { eq, and, desc, like, or, lt } from "drizzle-orm";
import * as schema from "../db/schema/schema.js";
import { createInsertSchema } from "drizzle-zod";

const invoiceInputSchema = createInsertSchema(schema.invoices).omit({
	invoiceNumber: true,
});

export const invoicesRouter = router({
	getAll: protectedProcedure
		.input(
			z.object({
				search: z.string().optional(),
				status: z.string().optional(),
				patientId: z.number().optional(),
				limit: z.number().min(1).max(100).default(20),
				cursor: z.number().optional(),
			})
		)
		.query(async ({ input, ctx }) => {
			const { search, status, patientId, limit, cursor } = input;
			const whereConditions = [];

			if (cursor) {
				whereConditions.push(lt(schema.invoices.id, cursor));
			}
			if (search) {
				whereConditions.push(
					or(
						like(schema.invoices.invoiceNumber, `%${search}%`),
						like(schema.patients.firstName, `%${search}%`),
						like(schema.patients.lastName, `%${search}%`)
					)
				);
			}
			if (status) {
				whereConditions.push(eq(schema.invoices.status, status));
			}
			if (patientId) {
				whereConditions.push(eq(schema.invoices.patientId, patientId));
			}

			const invoices = await ctx.db
				.select({
					id: schema.invoices.id,
					invoiceNumber: schema.invoices.invoiceNumber,
					patientId: schema.invoices.patientId,
					appointmentId: schema.invoices.appointmentId,
					totalAmount: schema.invoices.totalAmount,
					paidAmount: schema.invoices.paidAmount,
					status: schema.invoices.status,
					dueDate: schema.invoices.dueDate,
					items: schema.invoices.items,
					createdAt: schema.invoices.createdAt,
					updatedAt: schema.invoices.updatedAt,
					patient: {
						id: schema.patients.id,
						firstName: schema.patients.firstName,
						lastName: schema.patients.lastName,
						patientId: schema.patients.patientId,
					},
				})
				.from(schema.invoices)
				.leftJoin(
					schema.patients,
					eq(schema.invoices.patientId, schema.patients.id)
				)
				.where(
					whereConditions.length > 0
						? and(...whereConditions)
						: undefined
				)
				.limit(limit + 1)
				.orderBy(desc(schema.invoices.id));

			const hasNextPage = invoices.length > limit;
			const data = hasNextPage ? invoices.slice(0, limit) : invoices;
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
			const invoice = await ctx.db
				.select({
					id: schema.invoices.id,
					invoiceNumber: schema.invoices.invoiceNumber,
					patientId: schema.invoices.patientId,
					appointmentId: schema.invoices.appointmentId,
					totalAmount: schema.invoices.totalAmount,
					paidAmount: schema.invoices.paidAmount,
					status: schema.invoices.status,
					dueDate: schema.invoices.dueDate,
					items: schema.invoices.items,
					createdAt: schema.invoices.createdAt,
					updatedAt: schema.invoices.updatedAt,
					patient: {
						id: schema.patients.id,
						firstName: schema.patients.firstName,
						lastName: schema.patients.lastName,
						patientId: schema.patients.patientId,
					},
				})
				.from(schema.invoices)
				.leftJoin(
					schema.patients,
					eq(schema.invoices.patientId, schema.patients.id)
				)
				.where(eq(schema.invoices.id, input.id))
				.limit(1);

			if (invoice.length === 0) {
				throw new Error("Invoice not found");
			}

			return invoice[0];
		}),

	getByPatientId: protectedProcedure
		.input(
			z.object({
				patientId: z.number(),
				status: z.string().optional(),
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(10),
			})
		)
		.query(async ({ input, ctx }) => {
			const { patientId, status, page, limit } = input;
			const offset = (page - 1) * limit;

			const whereConditions = [eq(schema.invoices.patientId, patientId)];

			if (status) {
				whereConditions.push(eq(schema.invoices.status, status));
			}

			const invoices = await ctx.db
				.select({
					id: schema.invoices.id,
					invoiceNumber: schema.invoices.invoiceNumber,
					patientId: schema.invoices.patientId,
					appointmentId: schema.invoices.appointmentId,
					totalAmount: schema.invoices.totalAmount,
					paidAmount: schema.invoices.paidAmount,
					status: schema.invoices.status,
					dueDate: schema.invoices.dueDate,
					items: schema.invoices.items,
					createdAt: schema.invoices.createdAt,
					updatedAt: schema.invoices.updatedAt,
				})
				.from(schema.invoices)
				.where(and(...whereConditions))
				.limit(limit)
				.offset(offset)
				.orderBy(desc(schema.invoices.createdAt));

			return invoices;
		}),

	create: authorizedProcedure
		.input(invoiceInputSchema)
		.mutation(async ({ input, ctx }) => {
			// Generate invoice number
			const lastInvoice = await ctx.db
				.select()
				.from(schema.invoices)
				.orderBy(desc(schema.invoices.id))
				.limit(1);

			const invoiceNumber = `INV${String((lastInvoice[0]?.id || 0) + 1).padStart(4, "0")}`;

			const newInvoice = await ctx.db
				.insert(schema.invoices)
				.values({
					...input,
					invoiceNumber,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			return newInvoice[0];
		}),

	update: authorizedProcedure
		.input(
			z.object({
				id: z.number(),
				data: invoiceInputSchema.partial(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const updatedInvoice = await ctx.db
				.update(schema.invoices)
				.set({
					...input.data,
					updatedAt: new Date(),
				})
				.where(eq(schema.invoices.id, input.id))
				.returning();

			if (updatedInvoice.length === 0) {
				throw new Error("Invoice not found");
			}

			return updatedInvoice[0];
		}),

	delete: authorizedProcedure
		.input(
			z.object({
				id: z.number(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const deletedInvoice = await ctx.db
				.delete(schema.invoices)
				.where(eq(schema.invoices.id, input.id))
				.returning();

			if (deletedInvoice.length === 0) {
				throw new Error("Invoice not found");
			}

			return { success: true };
		}),

	markAsPaid: authorizedProcedure
		.input(
			z.object({
				id: z.number(),
				paidAmount: z.number().optional(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const invoiceData = await ctx.db
				.select()
				.from(schema.invoices)
				.where(eq(schema.invoices.id, input.id))
				.limit(1);

			const invoice = invoiceData[0];

			if (!invoice) {
				throw new Error("Invoice not found");
			}

			const paidAmount = input.paidAmount || invoice.totalAmount;

			const updatedInvoice = await ctx.db
				.update(schema.invoices)
				.set({
					paidAmount,
					status:
						paidAmount >= invoice.totalAmount ? "paid" : "pending",
					updatedAt: new Date(),
				})
				.where(eq(schema.invoices.id, input.id))
				.returning();

			return updatedInvoice[0];
		}),
});
