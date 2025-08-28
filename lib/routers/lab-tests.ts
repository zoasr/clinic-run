import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
import { eq, and, desc, like, or } from "drizzle-orm";
import * as schema from "../db/schema/schema.js";
import * as authSchema from "../db/schema/auth-schema.js";
import { createInsertSchema } from "drizzle-zod";

const labTestInputSchema = createInsertSchema(schema.labTests);

export const labTestsRouter = router({
	getAll: protectedProcedure
		.input(
			z.object({
				search: z.string().optional(),
				status: z.string().optional(),
				patientId: z.number().optional(),
				testType: z.string().optional(),
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(10),
			})
		)
		.query(async ({ input, ctx }) => {
			const { search, status, patientId, testType, page, limit } = input;
			const offset = (page - 1) * limit;

			const whereConditions = [];

			if (search) {
				whereConditions.push(
					or(
						like(schema.labTests.testName, `%${search}%`),
						like(schema.patients.firstName, `%${search}%`),
						like(schema.patients.lastName, `%${search}%`),
						like(authSchema.user.name, `%${search}%`)
					)
				);
			}
			if (status) {
				whereConditions.push(eq(schema.labTests.status, status));
			}
			if (patientId) {
				whereConditions.push(eq(schema.labTests.patientId, patientId));
			}
			if (testType) {
				whereConditions.push(eq(schema.labTests.testType, testType));
			}

			const labTests = await ctx.db
				.select({
					id: schema.labTests.id,
					patientId: schema.labTests.patientId,
					doctorId: schema.labTests.doctorId,
					testName: schema.labTests.testName,
					testType: schema.labTests.testType,
					status: schema.labTests.status,
					orderDate: schema.labTests.orderDate,
					completedDate: schema.labTests.completedDate,
					results: schema.labTests.results,
					normalRange: schema.labTests.normalRange,
					notes: schema.labTests.notes,
					createdAt: schema.labTests.createdAt,
					updatedAt: schema.labTests.updatedAt,
					patient: {
						id: schema.patients.id,
						firstName: schema.patients.firstName,
						lastName: schema.patients.lastName,
						patientId: schema.patients.patientId,
					},
					doctor: {
						id: authSchema.user.id,
						firstName: authSchema.user.firstName,
						lastName: authSchema.user.lastName,
					},
				})
				.from(schema.labTests)
				.leftJoin(
					schema.patients,
					eq(schema.labTests.patientId, schema.patients.id)
				)
				.leftJoin(
					authSchema.user,
					eq(schema.labTests.doctorId, authSchema.user.id)
				)
				.where(
					whereConditions.length > 0
						? and(...whereConditions)
						: undefined
				)
				.limit(limit)
				.offset(offset)
				.orderBy(desc(schema.labTests.orderDate));

			return labTests;
		}),

	getById: protectedProcedure
		.input(
			z.object({
				id: z.number(),
			})
		)
		.query(async ({ input, ctx }) => {
			const labTest = await ctx.db
				.select({
					id: schema.labTests.id,
					patientId: schema.labTests.patientId,
					doctorId: schema.labTests.doctorId,
					testName: schema.labTests.testName,
					testType: schema.labTests.testType,
					status: schema.labTests.status,
					orderDate: schema.labTests.orderDate,
					completedDate: schema.labTests.completedDate,
					results: schema.labTests.results,
					normalRange: schema.labTests.normalRange,
					notes: schema.labTests.notes,
					createdAt: schema.labTests.createdAt,
					updatedAt: schema.labTests.updatedAt,
					patient: {
						id: schema.patients.id,
						firstName: schema.patients.firstName,
						lastName: schema.patients.lastName,
						patientId: schema.patients.patientId,
					},
					doctor: {
						id: authSchema.user.id,
						firstName: authSchema.user.firstName,
						lastName: authSchema.user.lastName,
					},
				})
				.from(schema.labTests)
				.leftJoin(
					schema.patients,
					eq(schema.labTests.patientId, schema.patients.id)
				)
				.leftJoin(
					authSchema.user,
					eq(schema.labTests.doctorId, authSchema.user.id)
				)
				.where(eq(schema.labTests.id, input.id))
				.limit(1);

			if (labTest.length === 0) {
				throw new Error("Lab test not found");
			}

			return labTest[0];
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

			const whereConditions = [eq(schema.labTests.patientId, patientId)];

			if (status) {
				whereConditions.push(eq(schema.labTests.status, status));
			}

			const labTests = await ctx.db
				.select({
					id: schema.labTests.id,
					patientId: schema.labTests.patientId,
					doctorId: schema.labTests.doctorId,
					testName: schema.labTests.testName,
					testType: schema.labTests.testType,
					status: schema.labTests.status,
					orderDate: schema.labTests.orderDate,
					completedDate: schema.labTests.completedDate,
					results: schema.labTests.results,
					normalRange: schema.labTests.normalRange,
					notes: schema.labTests.notes,
					createdAt: schema.labTests.createdAt,
					updatedAt: schema.labTests.updatedAt,
					doctor: {
						id: authSchema.user.id,
						firstName: authSchema.user.firstName,
						lastName: authSchema.user.lastName,
					},
				})
				.from(schema.labTests)
				.leftJoin(
					authSchema.user,
					eq(schema.labTests.doctorId, authSchema.user.id)
				)
				.where(and(...whereConditions))
				.limit(limit)
				.offset(offset)
				.orderBy(desc(schema.labTests.orderDate));

			return labTests;
		}),

	create: protectedProcedure
		.input(labTestInputSchema)
		.mutation(async ({ input, ctx }) => {
			const newLabTest = await ctx.db
				.insert(schema.labTests)
				.values(input)
				.returning();

			return newLabTest[0];
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				data: labTestInputSchema.partial(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const updatedLabTest = await ctx.db
				.update(schema.labTests)
				.set({
					...input.data,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(schema.labTests.id, input.id))
				.returning();

			if (updatedLabTest.length === 0) {
				throw new Error("Lab test not found");
			}

			return updatedLabTest[0];
		}),

	delete: protectedProcedure
		.input(
			z.object({
				id: z.number(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const deletedLabTest = await ctx.db
				.delete(schema.labTests)
				.where(eq(schema.labTests.id, input.id))
				.returning();

			if (deletedLabTest.length === 0) {
				throw new Error("Lab test not found");
			}

			return { success: true };
		}),

	updateStatus: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				status: z.enum(["ordered", "in-progress", "completed"]),
				results: z.string().optional(),
				completedDate: z.string().optional(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const updateData: any = {
				status: input.status,
				updatedAt: new Date().toISOString(),
			};

			if (input.results) {
				updateData.results = input.results;
			}

			if (input.status === "completed" && input.completedDate) {
				updateData.completedDate = input.completedDate;
			} else if (input.status === "completed") {
				updateData.completedDate = new Date()
					.toISOString()
					.split("T")[0];
			}

			const updatedLabTest = await ctx.db
				.update(schema.labTests)
				.set(updateData)
				.where(eq(schema.labTests.id, input.id))
				.returning();

			if (updatedLabTest.length === 0) {
				throw new Error("Lab test not found");
			}

			return updatedLabTest[0];
		}),
});
