import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import * as authSchema from "../db/schema/auth-schema.js";
import * as schema from "../db/schema/schema.js";
import { authorizedProcedure, protectedProcedure, router } from "../trpc.js";

const prescriptionInputSchema = createInsertSchema(schema.prescriptions);

export const prescriptionsRouter = router({
	getAll: protectedProcedure
		.input(
			z.object({
				search: z.string().optional(),
				patientId: z.number().optional(),
				isDispensed: z.boolean().optional(),
				cursor: z.number().min(1).optional(),
				limit: z.number().min(1).max(100).default(10),
			}),
		)
		.query(async ({ input, ctx }) => {
			const { search, patientId, isDispensed, cursor, limit } = input;

			const whereConditions = [];

			if (search) {
				whereConditions.push(
					or(
						eq(schema.patients.firstName, search),
						eq(schema.patients.lastName, search),
						eq(schema.patients.patientId, search),
					),
				);
			}

			if (patientId) {
				whereConditions.push(eq(schema.prescriptions.patientId, patientId));
			}
			if (isDispensed) {
				whereConditions.push(eq(schema.prescriptions.isDispensed, isDispensed));
			}
			if (cursor) {
				whereConditions.push(lt(schema.prescriptions.id, cursor));
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
					eq(schema.prescriptions.patientId, schema.patients.id),
				)
				.leftJoin(
					authSchema.user,
					eq(schema.prescriptions.doctorId, authSchema.user.id),
				)
				.leftJoin(
					schema.medications,
					eq(schema.prescriptions.medicationId, schema.medications.id),
				)
				.where(and(...whereConditions))
				.limit(limit + 1)
				// .offset(offset)
				.orderBy(desc(schema.prescriptions.id));

			const hasNextPage = prescriptions.length > limit;
			const data = hasNextPage ? prescriptions.slice(0, limit) : prescriptions;
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
			}),
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
					eq(schema.prescriptions.patientId, schema.patients.id),
				)
				.leftJoin(
					authSchema.user,
					eq(schema.prescriptions.doctorId, authSchema.user.id),
				)
				.leftJoin(
					schema.medications,
					eq(schema.prescriptions.medicationId, schema.medications.id),
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
			}),
		)
		.query(async ({ input, ctx }) => {
			const { patientId, isDispensed, page, limit } = input;
			const offset = (page - 1) * limit;

			const whereConditions = [eq(schema.prescriptions.patientId, patientId)];

			if (isDispensed !== undefined) {
				whereConditions.push(eq(schema.prescriptions.isDispensed, isDispensed));
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
					eq(schema.prescriptions.doctorId, authSchema.user.id),
				)
				.leftJoin(
					schema.medications,
					eq(schema.prescriptions.medicationId, schema.medications.id),
				)
				.where(and(...whereConditions))
				.limit(limit)
				.offset(offset)
				.orderBy(desc(schema.prescriptions.createdAt));

			return prescriptions;
		}),

	create: authorizedProcedure
		.input(prescriptionInputSchema)
		.mutation(async ({ input, ctx }) => {
			const newPrescription = await ctx.db
				.insert(schema.prescriptions)
				.values({
					...input,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			return newPrescription[0];
		}),

	update: authorizedProcedure
		.input(
			z.object({
				id: z.number(),
				data: prescriptionInputSchema.partial(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const updatedPrescription = await ctx.db
				.update(schema.prescriptions)
				.set({
					...input.data,
					updatedAt: new Date(),
				})
				.where(eq(schema.prescriptions.id, input.id))
				.returning();

			if (updatedPrescription.length === 0) {
				throw new Error("Prescription not found");
			}

			return updatedPrescription[0];
		}),

	delete: authorizedProcedure
		.input(
			z.object({
				id: z.number(),
			}),
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

	dispense: authorizedProcedure
		.input(
			z.object({
				id: z.number(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const prescriptionData = await ctx.db
				.select()
				.from(schema.prescriptions)
				.where(eq(schema.prescriptions.id, input.id))
				.limit(1);

			if (prescriptionData.length === 0) {
				throw new Error("Prescription not found");
			}

			const prescription = prescriptionData[0];

			if (!prescription) throw new Error("Prescription not found");

			if (prescription.isDispensed) {
				throw new Error("Prescription already dispensed");
			}

			const medicationData = await ctx.db
				.select()
				.from(schema.medications)
				.where(eq(schema.medications.id, prescription.medicationId))
				.limit(1);

			if (medicationData.length === 0) {
				throw new Error("Medication not found");
			}

			const medication = medicationData[0];

			if (!medication) throw new Error("Medication not found");

			if (medication.quantity < prescription.quantity) {
				throw new Error("Insufficient stock for dispensing");
			}

			const dispensedPrescription = await ctx.db
				.update(schema.prescriptions)
				.set({
					isDispensed: true,
					updatedAt: new Date(),
				})
				.where(eq(schema.prescriptions.id, input.id))
				.returning();

			const newQuantity = medication.quantity - prescription.quantity;
			await ctx.db
				.update(schema.medications)
				.set({
					quantity: newQuantity,
					updatedAt: new Date(),
				})
				.where(eq(schema.medications.id, prescription.medicationId));

			await ctx.db.insert(schema.medicationStockLog).values({
				medicationId: prescription.medicationId,
				changeType: "reduction",
				quantityChanged: -prescription.quantity,
				reason: `Prescription #${prescription.id} dispensed`,
				createdAt: new Date(),
			});

			return dispensedPrescription[0];
		}),
	inDispense: authorizedProcedure
		.input(
			z.object({
				id: z.number(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const prescriptionData = await ctx.db
				.select()
				.from(schema.prescriptions)
				.where(eq(schema.prescriptions.id, input.id))
				.limit(1);

			if (prescriptionData.length === 0) {
				throw new Error("Prescription not found");
			}

			const prescription = prescriptionData[0];

			if (!prescription) throw new Error("Prescription not found");

			if (!prescription.isDispensed) {
				throw new Error("Prescription not dispensed");
			}

			const dispensedPrescription = await ctx.db
				.update(schema.prescriptions)
				.set({
					isDispensed: false,
					updatedAt: new Date(),
				})
				.where(eq(schema.prescriptions.id, input.id))
				.returning();

			await ctx.db
				.update(schema.medications)
				.set({
					quantity: sql`${schema.medications.quantity} + ${prescription.quantity}`,
					updatedAt: new Date(),
				})
				.where(eq(schema.medications.id, prescription.medicationId));

			await ctx.db.insert(schema.medicationStockLog).values({
				medicationId: prescription.medicationId,
				changeType: "addition",
				quantityChanged: prescription.quantity,
				reason: `Prescription #${prescription.id} undispensed`,
				createdAt: new Date(),
			});

			return dispensedPrescription[0];
		}),
});
