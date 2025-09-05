import { z } from "zod";
import { router, adminProcedure, publicProcedure } from "../trpc.js";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema/schema.js";

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
			})
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
			})
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
				throw new Error("Setting not found");
			}

			return updatedSetting[0];
		}),

	delete: adminProcedure
		.input(
			z.object({
				key: z.string(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const deletedSetting = await ctx.db
				.delete(schema.systemSettings)
				.where(eq(schema.systemSettings.key, input.key))
				.returning();

			if (deletedSetting.length === 0) {
				throw new Error("Setting not found");
			}

			return { success: true };
		}),

	// Initialize default settings
	initializeDefaults: adminProcedure.mutation(async ({ ctx }) => {
		const defaultSettings = [
			{
				key: "clinic_name",
				value: "Clinic Management System",
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
			{
				key: "demo_email",
				value: "admin@clinic.local",
				description: "Demo user email for login page",
				category: "demo",
				isPublic: true,
			},
			{
				key: "demo_password",
				value: "admin123",
				description: "Demo user password for login page",
				category: "demo",
				isPublic: false,
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
