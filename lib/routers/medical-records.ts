import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "../db/schema/schema.js";
import * as authSchema from "../db/schema/auth-schema.js";
import { createInsertSchema } from "drizzle-zod";

const medicalRecordInputSchema = createInsertSchema(schema.medicalRecords);

export const medicalRecordsRouter = router({
	getAll: protectedProcedure
		.input(
			z.object({
				patientId: z.number().optional(),
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(10),
			})
		)
		.query(async ({ input, ctx }) => {
			const { patientId, page, limit } = input;
			const offset = (page - 1) * limit;

			const whereConditions = [];

			if (patientId) {
				whereConditions.push(
					eq(schema.medicalRecords.patientId, patientId)
				);
			}

			const records = await ctx.db
				.select({
					id: schema.medicalRecords.id,
					visitDate: schema.medicalRecords.visitDate,
					chiefComplaint: schema.medicalRecords.chiefComplaint,
					diagnosis: schema.medicalRecords.diagnosis,
					treatment: schema.medicalRecords.treatment,
					prescription: schema.medicalRecords.prescription,
					notes: schema.medicalRecords.notes,
					vitalSigns: schema.medicalRecords.vitalSigns,
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
				.from(schema.medicalRecords)
				.leftJoin(
					schema.patients,
					eq(schema.medicalRecords.patientId, schema.patients.id)
				)
				.leftJoin(
					authSchema.user,
					eq(schema.medicalRecords.doctorId, authSchema.user.id)
				)
				.where(
					whereConditions.length > 0
						? and(...whereConditions)
						: undefined
				)
				.limit(limit)
				.offset(offset)
				.orderBy(desc(schema.medicalRecords.visitDate));

			return records;
		}),

	getById: protectedProcedure
		.input(
			z.object({
				id: z.number(),
			})
		)
		.query(async ({ input, ctx }) => {
			const record = await ctx.db
				.select({
					id: schema.medicalRecords.id,
					patientId: schema.medicalRecords.patientId,
					doctorId: schema.medicalRecords.doctorId,
					appointmentId: schema.medicalRecords.appointmentId,
					visitDate: schema.medicalRecords.visitDate,
					chiefComplaint: schema.medicalRecords.chiefComplaint,
					diagnosis: schema.medicalRecords.diagnosis,
					treatment: schema.medicalRecords.treatment,
					prescription: schema.medicalRecords.prescription,
					notes: schema.medicalRecords.notes,
					vitalSigns: schema.medicalRecords.vitalSigns,
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
				.from(schema.medicalRecords)
				.leftJoin(
					schema.patients,
					eq(schema.medicalRecords.patientId, schema.patients.id)
				)
				.leftJoin(
					authSchema.user,
					eq(schema.medicalRecords.doctorId, authSchema.user.id)
				)
				.where(eq(schema.medicalRecords.id, input.id))
				.limit(1);

			if (record.length === 0) {
				throw new Error("Medical record not found");
			}

			return record[0];
		}),

	create: protectedProcedure
		.input(medicalRecordInputSchema)
		.mutation(async ({ input, ctx }) => {
			const newRecord = await ctx.db
				.insert(schema.medicalRecords)
				.values(input)
				.returning();

			return newRecord[0];
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				data: medicalRecordInputSchema.partial(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const updatedRecord = await ctx.db
				.update(schema.medicalRecords)
				.set({
					...input.data,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(schema.medicalRecords.id, input.id))
				.returning();

			if (updatedRecord.length === 0) {
				throw new Error("Medical record not found");
			}

			return updatedRecord[0];
		}),

	delete: protectedProcedure
		.input(
			z.object({
				id: z.number(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const deletedRecord = await ctx.db
				.delete(schema.medicalRecords)
				.where(eq(schema.medicalRecords.id, input.id))
				.returning();

			if (deletedRecord.length === 0) {
				throw new Error("Medical record not found");
			}

			return { success: true };
		}),
});
