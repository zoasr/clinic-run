import { and, desc, eq, gte, inArray, like, lt, lte, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import * as schema from "../db/schema/schema.js";
import { authorizedProcedure, protectedProcedure, router } from "../trpc.js";

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
			}),
		)
		.query(async ({ input, ctx }) => {
			const { search, lowStock, outOfStock, limit, cursor } = input;

			const whereConditions = [];

			if (search) {
				whereConditions.push(like(schema.medications.name, `%${search}%`));
			}

			if (lowStock) {
				whereConditions.push(
					sql`${schema.medications.quantity} <= ${schema.medications.minStockLevel}`,
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
			const data = hasNextPage ? medications.slice(0, limit) : medications;
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
					sql`${schema.medications.quantity} <= ${schema.medications.minStockLevel}`,
				),
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

	getInventory: protectedProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(100).default(50),
				cursor: z.number().optional(),
			}),
		)
		.query(async ({ input, ctx }) => {
			const { limit, cursor } = input;

			const thirtyDaysFromNow = new Date();
			thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

			const whereConditions = [eq(schema.medications.isActive, true)];

			if (cursor) {
				whereConditions.push(lt(schema.medications.id, cursor));
			}

			const medications = await ctx.db
				.select()
				.from(schema.medications)
				.where(and(...whereConditions))
				.limit(limit + 1)
				.orderBy(desc(schema.medications.id));

			const hasNextPage = medications.length > limit;
			const data = hasNextPage ? medications.slice(0, limit) : medications;
			const nextCursor = hasNextPage ? data[data.length - 1]?.id : null;

			const enhancedData = data.map((med) => {
				const isLowStock =
					med.quantity <= med.minStockLevel && med.quantity > 0;
				const isOutOfStock = med.quantity <= 0;
				const isExpiringSoon = med.expiryDate
					? new Date(med.expiryDate) <= thirtyDaysFromNow &&
						new Date(med.expiryDate) >= new Date()
					: false;
				const daysToExpiry = med.expiryDate
					? Math.ceil(
							(new Date(med.expiryDate).getTime() - Date.now()) /
								(1000 * 60 * 60 * 24),
						)
					: null;

				return {
					...med,
					isLowStock,
					isOutOfStock,
					isExpiringSoon,
					daysToExpiry,
					alerts: {
						lowStock: isLowStock,
						outOfStock: isOutOfStock,
						expiringSoon: isExpiringSoon,
					},
				};
			});

			return {
				data: enhancedData,
				nextCursor,
				hasNextPage,
			};
		}),

	getById: protectedProcedure
		.input(
			z.object({
				id: z.number(),
			}),
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

	create: authorizedProcedure
		.input(medicationInputSchema)
		.mutation(async ({ input, ctx }) => {
			const newMedication = await ctx.db
				.insert(schema.medications)
				.values({
					...input,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			return newMedication[0];
		}),

	update: authorizedProcedure
		.input(
			z.object({
				id: z.number(),
				data: medicationInputSchema.partial(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const updatedMedication = await ctx.db
				.update(schema.medications)
				.set({
					...input.data,
					updatedAt: new Date(),
				})
				.where(eq(schema.medications.id, input.id))
				.returning();

			if (updatedMedication.length === 0) {
				throw new Error("Medication not found");
			}

			return updatedMedication[0];
		}),

	delete: authorizedProcedure
		.input(
			z.object({
				id: z.number(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const deletedMedication = await ctx.db
				.update(schema.medications)
				.set({
					isActive: false,
					updatedAt: new Date(),
				})
				.where(eq(schema.medications.id, input.id))
				.returning();

			if (deletedMedication.length === 0) {
				throw new Error("Medication not found");
			}

			return { success: true };
		}),

	adjustStock: authorizedProcedure
		.input(
			z.object({
				id: z.number(),
				quantity: z.number(),
				reason: z.string(),
			}),
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
					updatedAt: new Date(),
				})
				.where(eq(schema.medications.id, input.id))
				.returning();

			await ctx.db.insert(schema.medicationStockLog).values({
				medicationId: input.id,
				changeType: input.quantity > 0 ? "addition" : "reduction",
				quantityChanged: input.quantity,
				reason: input.reason,
				createdAt: new Date(),
			});
			return updatedMedication[0];
		}),

	getStockTrends: protectedProcedure
		.input(
			z.object({
				medicationId: z.number(),
				days: z.number().default(30),
			}),
		)
		.query(async ({ input, ctx }) => {
			const { medicationId, days } = input;

			const startDate = new Date();
			startDate.setDate(startDate.getDate() - days);

			const stockLogs = await ctx.db
				.select()
				.from(schema.medicationStockLog)
				.where(
					and(
						eq(schema.medicationStockLog.medicationId, medicationId),
						gte(schema.medicationStockLog.createdAt, startDate),
					),
				)
				.orderBy(desc(schema.medicationStockLog.createdAt));

			// Calculate daily stock changes
			const dailyChanges: Record<string, number> = {};
			for (const log of stockLogs) {
				const createdAt = log.createdAt;
				const quantityChanged = log.quantityChanged;
				if (
					!createdAt ||
					quantityChanged === undefined ||
					quantityChanged === null
				)
					continue;
				const dateStr = new Date(createdAt).toISOString().split("T")[0];
				if (!dateStr) continue;
				const date = dateStr as string;
				if (!dailyChanges[date]) {
					dailyChanges[date] = 0;
				}
				dailyChanges[date] += quantityChanged;
			}

			return {
				medicationId,
				days,
				totalChanges: stockLogs.length,
				dailyChanges,
				logs: stockLogs,
			};
		}),

	getAlerts: protectedProcedure.query(async ({ ctx }) => {
		// Get alert settings from system settings
		const alertSettings = await ctx.db
			.select()
			.from(schema.systemSettings)
			.where(
				inArray(schema.systemSettings.key, [
					"expiry_alert_days",
					"low_stock_alert_threshold",
				]),
			);

		const expiryAlertDays = parseInt(
			alertSettings.find((s) => s.key === "expiry_alert_days")?.value || "30",
		);
		const lowStockThreshold = parseInt(
			alertSettings.find((s) => s.key === "low_stock_alert_threshold")?.value ||
				"10",
		);

		const expiryDateThreshold = new Date();
		expiryDateThreshold.setDate(
			expiryDateThreshold.getDate() + expiryAlertDays,
		);

		const lowStockMeds = await ctx.db
			.select()
			.from(schema.medications)
			.where(
				and(
					eq(schema.medications.isActive, true),
					sql`${schema.medications.quantity} <= ${lowStockThreshold}`,
					sql`${schema.medications.quantity} > 0`,
				),
			);

		const expiringMeds = await ctx.db
			.select()
			.from(schema.medications)
			.where(
				and(
					eq(schema.medications.isActive, true),
					gte(schema.medications.expiryDate, new Date()),
					lte(schema.medications.expiryDate, expiryDateThreshold),
				),
			);

		const alerts = [
			...lowStockMeds.map((med) => ({
				...med,
				alertType: "lowStock" as const,
				message: `Low stock: ${med.quantity} remaining (threshold: ${lowStockThreshold})`,
			})),
			...expiringMeds.map((med) => {
				const daysToExpiry = Math.ceil(
					(new Date(med.expiryDate as Date).getTime() - Date.now()) /
						(1000 * 60 * 60 * 24),
				);
				return {
					...med,
					alertType: "expiringSoon" as const,
					message: `Expires in ${daysToExpiry} days`,
				};
			}),
		];

		return alerts;
	}),

	getLowStockAlerts: protectedProcedure.query(async ({ ctx }) => {
		// Get low stock threshold from system settings
		const thresholdSetting = await ctx.db
			.select()
			.from(schema.systemSettings)
			.where(eq(schema.systemSettings.key, "low_stock_alert_threshold"))
			.limit(1);

		const lowStockThreshold = parseInt(thresholdSetting[0]?.value || "10");

		const lowStockMeds = await ctx.db
			.select()
			.from(schema.medications)
			.where(
				and(
					eq(schema.medications.isActive, true),
					sql`${schema.medications.quantity} <= ${lowStockThreshold}`,
					sql`${schema.medications.quantity} > 0`,
				),
			);

		return lowStockMeds.map((med) => ({
			...med,
			alertType: "lowStock" as const,
			message: `Low stock: ${med.quantity} remaining (threshold: ${lowStockThreshold})`,
		}));
	}),

	getExpiringSoon: protectedProcedure
		.input(
			z.object({
				days: z.number().min(1).max(365).default(30),
			}),
		)
		.query(async ({ input, ctx }) => {
			const { days } = input;
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + days);

			const expiringMeds = await ctx.db
				.select()
				.from(schema.medications)
				.where(
					and(
						eq(schema.medications.isActive, true),
						gte(schema.medications.expiryDate, new Date()),
						lte(schema.medications.expiryDate, futureDate),
					),
				)
				.orderBy(schema.medications.expiryDate);

			return expiringMeds.map((med) => {
				const daysToExpiry = Math.ceil(
					(new Date(med.expiryDate as Date).getTime() - Date.now()) /
						(1000 * 60 * 60 * 24),
				);
				return {
					...med,
					daysToExpiry,
				};
			});
		}),
});
