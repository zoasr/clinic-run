import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../db/schema/schema.js";
import { adminProcedure, publicProcedure, router } from "../trpc.js";

const settingInputSchema = z.object({
	key: z.string().min(1, "Key is required"),
	value: z.string({ error: "Value is required" }),
	description: z.string().optional(),
	category: z.string().min(1, "Category is required"),
	isPublic: z.boolean().optional(),
});

export const systemSettingsRouter = router({
	getAll: adminProcedure.query(async ({ ctx }) => {
		const settings = await ctx.db
			.select()
			.from(schema.systemSettings)
			.orderBy(schema.systemSettings.category, schema.systemSettings.key);

		return settings;
	}),

	getByCategory: adminProcedure
		.input(
			z.object({
				category: z.string(),
			}),
		)
		.query(async ({ input, ctx }) => {
			const settings = await ctx.db
				.select()
				.from(schema.systemSettings)
				.where(eq(schema.systemSettings.category, input.category))
				.orderBy(schema.systemSettings.key);

			return settings;
		}),

	getPublic: publicProcedure.query(async ({ ctx }) => {
		const settings = await ctx.db
			.select({
				key: schema.systemSettings.key,
				value: schema.systemSettings.value,
				description: schema.systemSettings.description,
				category: schema.systemSettings.category,
			})
			.from(schema.systemSettings)
			.where(eq(schema.systemSettings.isPublic, true));

		return settings;
	}),

	create: adminProcedure
		.input(settingInputSchema)
		.mutation(async ({ input, ctx }) => {
			const newSetting = await ctx.db
				.insert(schema.systemSettings)
				.values({
					key: input.key,
					value: input.value,
					description: input.description || "",
					category: input.category,
					isPublic: input.isPublic || false,
					updatedBy: ctx.user.id,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			return newSetting[0];
		}),

	update: adminProcedure
		.input(
			z.object({
				key: z.string(),
				data: settingInputSchema.partial().omit({ key: true }),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const updatedSetting = await ctx.db
				.update(schema.systemSettings)
				.set({
					...input.data,
					updatedBy: ctx.user.id,
					updatedAt: new Date(),
				})
				.where(eq(schema.systemSettings.key, input.key))
				.returning();

			if (updatedSetting.length === 0) {
				await ctx.db.insert(schema.systemSettings).values([
					{
						key: input.key,
						value: input.data.value || "",
						description: input.data.description || "",
						category: input.data.category,
						isPublic: input.data.isPublic || false,
						updatedBy: ctx.user.id,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				]);
				throw new Error(
					`Setting with key "${input.key}" not found, Setting is getting created with the value provided`,
				);
			}

			return updatedSetting[0];
		}),

	updateAll: adminProcedure
		.input(z.array(settingInputSchema))
		.mutation(async ({ input, ctx }) => {
			const allUpdatedSettings = [];
			for (const setting of input) {
				const updatedSetting = await ctx.db
					.update(schema.systemSettings)
					.set({
						...setting,
						updatedBy: ctx.user.id,
						updatedAt: new Date(),
					})
					.where(eq(schema.systemSettings.key, setting.key))
					.returning();
				if (updatedSetting.length === 0) {
					throw new Error(`Setting with key "${setting.key}" not found`);
				}
				allUpdatedSettings.push(updatedSetting[0]);
			}

			return allUpdatedSettings;
		}),

	delete: adminProcedure
		.input(
			z.object({
				key: z.string(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const deletedSetting = await ctx.db
				.delete(schema.systemSettings)
				.where(eq(schema.systemSettings.key, input.key))
				.returning();

			if (deletedSetting.length === 0) {
				throw new Error(`Setting with key "${input.key}" not found`);
			}

			return { success: true };
		}),

	// Initialize default settings
	initializeDefaults: adminProcedure.mutation(async ({ ctx }) => {
		const defaultSettings = [
			{
				key: "clinic_name",
				value: "Clinic Run",
				description: "Name of the clinic",
				category: "clinic",
				isPublic: true,
			},
			{
				key: "clinic_address",
				value: "",
				description: "Clinic address",
				category: "clinic",
				isPublic: true,
			},
			{
				key: "currency",
				value: "USD",
				description: "Default currency for invoices and medicine prices",
				category: "clinic",
				isPublic: true,
			},
			{
				key: "clinic_phone",
				value: "",
				description: "Clinic phone number",
				category: "clinic",
				isPublic: true,
			},
			{
				key: "clinic_email",
				value: "",
				description: "Clinic email address",
				category: "clinic",
				isPublic: true,
			},
			{
				key: "working_hours",
				value: "9:00 AM - 5:00 PM",
				description: "Clinic working hours",
				category: "clinic",
				isPublic: true,
			},
			{
				key: "session_timeout",
				value: "30",
				description: "Session timeout in minutes",
				category: "security",
				isPublic: false,
			},
			{
				key: "password_min_length",
				value: "8",
				description: "Minimum password length",
				category: "security",
				isPublic: false,
			},
			{
				key: "theme_mode",
				value: "light",
				description: "Application theme mode (light, dark, system)",
				category: "appearance",
				isPublic: true,
			},
			{
				key: "sidebar_collapsed",
				value: "false",
				description: "Keep sidebar collapsed by default",
				category: "appearance",
				isPublic: true,
			},
			{
				key: "compact_mode",
				value: "false",
				description: "Use compact layout for better space utilization",
				category: "appearance",
				isPublic: true,
			},
		];

		const results = [];

		for (const setting of defaultSettings) {
			// Check if setting already exists
			const existing = await ctx.db
				.select()
				.from(schema.systemSettings)
				.where(eq(schema.systemSettings.key, setting.key))
				.limit(1);

			if (existing.length === 0) {
				const newSetting = await ctx.db
					.insert(schema.systemSettings)
					.values({
						...setting,
						updatedBy: ctx.user.id,
						createdAt: new Date(),
						updatedAt: new Date(),
					})
					.returning();
				results.push(newSetting[0]);
			}
		}

		return results;
	}),
});
