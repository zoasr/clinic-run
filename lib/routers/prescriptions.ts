import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "../db/schema/schema.js";
import * as authSchema from "../db/schema/auth-schema.js";
import { createInsertSchema } from "drizzle-zod";

const prescriptionInputSchema = createInsertSchema(schema.prescriptions);

export const prescriptionsRouter = router({
	getAll: protectedProcedure
		.input(
			z.object({
				patientId: z.number().optional(),
				isDispensed: z.boolean().optional(),
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(10),
			})
		)
		.query(async ({ input, ctx }) => {
			const { patientId, isDispensed, page, limit } = input;
			const offset = (page - 1) * limit;

			const whereConditions = [];

			if (patientId) {
				whereConditions.push(
					eq(schema.prescriptions.patientId, patientId)
				);
			}
			if (isDispensed !== undefined) {
				whereConditions.push(
					eq(schema.prescriptions.isDispensed, isDispensed)
				);
			}

			const prescriptions = await ctx.db
				.select({
					id: schema.prescriptions.id,
					patientId: schema.prescriptions.patientId,
					doctorId: schema.prescriptions.doctorId,
					medicationId: schema.prescriptions.medicationId,
					medicalRecordId: schema.prescriptions.medicalRecordId,
					dosage: schema.prescriptions.dosage,
					frequency: schema.prescriptions.frequency,
					duration: schema.prescriptions.duration,
					instructions: schema.prescriptions.instructions,
					quantity: schema.prescriptions.quantity,
					isDispensed: schema.prescriptions.isDispensed,
					createdAt: schema.prescriptions.createdAt,
					updatedAt: schema.prescriptions.updatedAt,
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
					medication: {
						id: schema.medications.id,
						name: schema.medications.name,
						dosage: schema.medications.dosage,
						form: schema.medications.form,
					},
				})
				.from(schema.prescriptions)
				.leftJoin(
					schema.patients,
					eq(schema.prescriptions.patientId, schema.patients.id)
				)
				.leftJoin(
					authSchema.user,
					eq(schema.prescriptions.doctorId, authSchema.user.id)
				)
				.leftJoin(
					schema.medications,
					eq(schema.prescriptions.medicationId, schema.medications.id)
				)
				.where(
					whereConditions.length > 0
						? and(...whereConditions)
						: undefined
				)
				.limit(limit)
				.offset(offset)
				.orderBy(desc(schema.prescriptions.createdAt));

			return prescriptions;
		}),

	getById: protectedProcedure
		.input(
			z.object({
				id: z.number(),
			})
		)
		.query(async ({ input, ctx }) => {
			const prescription = await ctx.db
				.select({
					id: schema.prescriptions.id,
					patientId: schema.prescriptions.patientId,
					doctorId: schema.prescriptions.doctorId,
					medicationId: schema.prescriptions.medicationId,
					medicalRecordId: schema.prescriptions.medicalRecordId,
					dosage: schema.prescriptions.dosage,
					frequency: schema.prescriptions.frequency,
					duration: schema.prescriptions.duration,
					instructions: schema.prescriptions.instructions,
					quantity: schema.prescriptions.quantity,
					isDispensed: schema.prescriptions.isDispensed,
					createdAt: schema.prescriptions.createdAt,
					updatedAt: schema.prescriptions.updatedAt,
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
					medication: {
						id: schema.medications.id,
						name: schema.medications.name,
						dosage: schema.medications.dosage,
						form: schema.medications.form,
					},
				})
				.from(schema.prescriptions)
				.leftJoin(
					schema.patients,
					eq(schema.prescriptions.patientId, schema.patients.id)
				)
				.leftJoin(
					authSchema.user,
					eq(schema.prescriptions.doctorId, authSchema.user.id)
				)
				.leftJoin(
					schema.medications,
					eq(schema.prescriptions.medicationId, schema.medications.id)
				)
				.where(eq(schema.prescriptions.id, input.id))
				.limit(1);

			if (prescription.length === 0) {
				throw new Error("Prescription not found");
			}

			return prescription[0];
		}),

	getByPatientId: protectedProcedure
		.input(
			z.object({
				patientId: z.number(),
				isDispensed: z.boolean().optional(),
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(10),
			})
		)
		.query(async ({ input, ctx }) => {
			const { patientId, isDispensed, page, limit } = input;
			const offset = (page - 1) * limit;

			const whereConditions = [
				eq(schema.prescriptions.patientId, patientId),
			];

			if (isDispensed !== undefined) {
				whereConditions.push(
					eq(schema.prescriptions.isDispensed, isDispensed)
				);
			}

			const prescriptions = await ctx.db
				.select({
					id: schema.prescriptions.id,
					patientId: schema.prescriptions.patientId,
					doctorId: schema.prescriptions.doctorId,
					medicationId: schema.prescriptions.medicationId,
					medicalRecordId: schema.prescriptions.medicalRecordId,
					dosage: schema.prescriptions.dosage,
					frequency: schema.prescriptions.frequency,
					duration: schema.prescriptions.duration,
					instructions: schema.prescriptions.instructions,
					quantity: schema.prescriptions.quantity,
					isDispensed: schema.prescriptions.isDispensed,
					createdAt: schema.prescriptions.createdAt,
					updatedAt: schema.prescriptions.updatedAt,
					doctor: {
						id: authSchema.user.id,
						firstName: authSchema.user.firstName,
						lastName: authSchema.user.lastName,
					},
					medication: {
						id: schema.medications.id,
						name: schema.medications.name,
						dosage: schema.medications.dosage,
						form: schema.medications.form,
					},
				})
				.from(schema.prescriptions)
				.leftJoin(
					authSchema.user,
					eq(schema.prescriptions.doctorId, authSchema.user.id)
				)
				.leftJoin(
					schema.medications,
					eq(schema.prescriptions.medicationId, schema.medications.id)
				)
				.where(and(...whereConditions))
				.limit(limit)
				.offset(offset)
				.orderBy(desc(schema.prescriptions.createdAt));

			return prescriptions;
		}),

	create: protectedProcedure
		.input(prescriptionInputSchema)
		.mutation(async ({ input, ctx }) => {
			const newPrescription = await ctx.db
				.insert(schema.prescriptions)
				.values(input)
				.returning();

			return newPrescription[0];
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				data: prescriptionInputSchema.partial(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const updatedPrescription = await ctx.db
				.update(schema.prescriptions)
				.set({
					...input.data,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(schema.prescriptions.id, input.id))
				.returning();

			if (updatedPrescription.length === 0) {
				throw new Error("Prescription not found");
			}

			return updatedPrescription[0];
		}),

	delete: protectedProcedure
		.input(
			z.object({
				id: z.number(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const deletedPrescription = await ctx.db
				.delete(schema.prescriptions)
				.where(eq(schema.prescriptions.id, input.id))
				.returning();

			if (deletedPrescription.length === 0) {
				throw new Error("Prescription not found");
			}

			return { success: true };
		}),

	dispense: protectedProcedure
		.input(
			z.object({
				id: z.number(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const dispensedPrescription = await ctx.db
				.update(schema.prescriptions)
				.set({
					isDispensed: true,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(schema.prescriptions.id, input.id))
				.returning();

			if (dispensedPrescription.length === 0) {
				throw new Error("Prescription not found");
			}

			return dispensedPrescription[0];
		}),
});