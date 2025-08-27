import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
import { eq, and, asc, desc } from "drizzle-orm";
import * as schema from "../db/schema/schema.js";
import * as authSchema from "../db/schema/auth-schema.js";

const appointmentInputSchema = z.object({
	patientId: z
		.number({ message: "Patient is required" })
		.int("Patient must be an integer")
		.positive("Patient must be a valid id"),
	doctorId: z
		.string({ message: "Doctor is required" })
		.trim()
		.min(1, "Doctor is required"),
	appointmentDate: z
		.string({ message: "Date is required" })
		.trim()
		.regex(/^\d{4}-\d{2}-\d{2}$/u, "Date must be YYYY-MM-DD"),
	appointmentTime: z
		.string({ message: "Time is required" })
		.trim()
		.regex(/^\d{2}:\d{2}$/u, "Time must be HH:MM"),
	duration: z
		.number({ message: "Duration is required" })
		.int("Duration must be an integer")
		.min(1, "Duration must be at least 1 minute")
		.max(480, "Duration must be 8 hours or less"),
	type: z
		.string({ message: "Type is required" })
		.trim()
		.min(1, "Type is required"),
	status: z
		.string({ message: "Status is required" })
		.trim()
		.min(1, "Status is required"),
	notes: z.string().trim().max(2000).optional(),
});

export const appointmentsRouter = router({
	getAll: protectedProcedure
		.input(
			z.object({
				date: z.string().optional(),
				status: z.string().optional(),
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(10),
			})
		)
		.query(async ({ input, ctx }) => {
			const { date, status, page, limit } = input;
			const offset = (page - 1) * limit;

			const whereConditions = [];

			if (date) {
				whereConditions.push(
					eq(schema.appointments.appointmentDate, date)
				);
			}
			if (status) {
				whereConditions.push(eq(schema.appointments.status, status));
			}

			const appointments = await ctx.db
				.select({
					id: schema.appointments.id,
					appointmentDate: schema.appointments.appointmentDate,
					appointmentTime: schema.appointments.appointmentTime,
					duration: schema.appointments.duration,
					type: schema.appointments.type,
					status: schema.appointments.status,
					notes: schema.appointments.notes,
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
				.from(schema.appointments)
				.leftJoin(
					schema.patients,
					eq(schema.appointments.patientId, schema.patients.id)
				)
				.leftJoin(
					authSchema.user,
					eq(schema.appointments.doctorId, authSchema.user.id)
				)
				.where(
					whereConditions.length > 0
						? and(...whereConditions)
						: undefined
				)
				.limit(limit)
				.offset(offset)
				.orderBy(
					asc(schema.appointments.appointmentDate),
					asc(schema.appointments.appointmentTime)
				);

			return appointments;
		}),
	getById: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ input, ctx }) => {
			const { id } = input;
			const appointment = await ctx.db
				.select()
				.from(schema.appointments)
				.where(eq(schema.appointments.id, id))
				.limit(1);
			return appointment[0];
		}),

	getByPatientId: protectedProcedure
		.input(
			z.object({
				patientId: z.number(),
				date: z.string().optional(),
				status: z.string().optional(),
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(10),
			})
		)
		.query(async ({ input, ctx }) => {
			const { patientId, date, status, page, limit } = input;
			const offset = (page - 1) * limit;

			const whereConditions = [
				eq(schema.appointments.patientId, patientId),
			];

			if (date) {
				whereConditions.push(
					eq(schema.appointments.appointmentDate, date)
				);
			}
			if (status) {
				whereConditions.push(eq(schema.appointments.status, status));
			}

			const appointments = await ctx.db
				.select({
					id: schema.appointments.id,
					appointmentDate: schema.appointments.appointmentDate,
					appointmentTime: schema.appointments.appointmentTime,
					duration: schema.appointments.duration,
					type: schema.appointments.type,
					status: schema.appointments.status,
					notes: schema.appointments.notes,
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
				.from(schema.appointments)
				.leftJoin(
					schema.patients,
					eq(schema.appointments.patientId, schema.patients.id)
				)
				.leftJoin(
					authSchema.user,
					eq(schema.appointments.doctorId, authSchema.user.id)
				)
				.where(and(...whereConditions))
				.limit(limit)
				.offset(offset)
				.orderBy(
					asc(schema.appointments.appointmentDate),
					asc(schema.appointments.appointmentTime)
				);

			return appointments;
		}),

	create: protectedProcedure
		.input(appointmentInputSchema)
		.mutation(async ({ input, ctx }) => {
			const newAppointment = await ctx.db
				.insert(schema.appointments)
				.values(input)
				.returning();

			return newAppointment[0];
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				data: appointmentInputSchema.partial(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const updatedAppointment = await ctx.db
				.update(schema.appointments)
				.set({
					...input.data,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(schema.appointments.id, input.id))
				.returning();

			if (updatedAppointment.length === 0) {
				throw new Error("Appointment not found");
			}

			return updatedAppointment[0];
		}),

	delete: protectedProcedure
		.input(
			z.object({
				id: z.number(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const deletedAppointment = await ctx.db
				.delete(schema.appointments)
				.where(eq(schema.appointments.id, input.id))
				.returning();

			if (deletedAppointment.length === 0) {
				throw new Error("Appointment not found");
			}

			return { success: true };
		}),
});
