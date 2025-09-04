import { z } from "zod";
import { router, protectedProcedure, authorizedProcedure } from "../trpc.js";
import { eq, and, asc, lt, between, or, like } from "drizzle-orm";
import * as schema from "../db/schema/schema.js";
import * as authSchema from "../db/schema/auth-schema.js";
import { createInsertSchema } from "drizzle-zod";

const appointmentInputSchema = createInsertSchema(schema.appointments);

export const appointmentsRouter = router({
	getAll: protectedProcedure
		.input(
			z.object({
				date: z.date().optional(),
				status: z.string().optional(),
				search: z.string().optional(),
				limit: z.number().min(1).max(100).default(10),
				cursor: z.number().min(1).optional(),
			})
		)
		.query(async ({ input, ctx }) => {
			const { date, status, cursor, limit, search } = input;
			const whereConditions = [];
			if (cursor) {
				whereConditions.push(lt(schema.appointments.id, cursor));
			}

			if (search) {
				whereConditions.push(
					or(
						like(schema.patients.firstName, `%${search}%`),
						like(schema.patients.lastName, `%${search}%`),
						like(authSchema.user.name, `%${search}%`)
					)
				);
			}

			if (date) {
				const startOfDay = new Date(date?.setHours(0, 0, 0, 0));
				const endOfDay = new Date(date?.setHours(23, 59, 59, 999));
				whereConditions.push(
					between(
						schema.appointments.appointmentDate,
						startOfDay,
						endOfDay
					)
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
				.limit(limit + 1)
				.orderBy(
					asc(schema.appointments.appointmentDate),
					asc(schema.appointments.appointmentTime)
				);
			const hasNextPage = appointments.length > limit;
			const data = hasNextPage
				? appointments.slice(0, limit)
				: appointments;
			const nextCursor = hasNextPage ? data[data.length - 1]?.id : null;

			return {
				data,
				nextCursor,
				hasNextPage,
			};
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

	getByMonth: protectedProcedure
		.input(
			z.object({
				date: z
					.date()
					.describe(
						"A date object representing any day in the month desired"
					),
			})
		)
		.query(async ({ input, ctx }) => {
			const { date } = input;
			const year = date.getFullYear();
			const month = date.getMonth();

			// Create date range for the month
			const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
			const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

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
					between(
						schema.appointments.appointmentDate,
						startOfMonth,
						endOfMonth
					)
				)
				.orderBy(
					asc(schema.appointments.appointmentDate),
					asc(schema.appointments.appointmentTime)
				);
			return appointments;
		}),

	getByPatientId: protectedProcedure
		.input(
			z.object({
				patientId: z.number(),
				date: z.date().optional(),
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
				const startOfDay = new Date(date?.setHours(0, 0, 0, 0));
				const endOfDay = new Date(date?.setHours(23, 59, 59, 999));
				whereConditions.push(
					between(
						schema.appointments.appointmentDate,
						startOfDay,
						endOfDay
					)
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

	create: authorizedProcedure
		.input(appointmentInputSchema)
		.mutation(async ({ input, ctx }) => {
			const newAppointment = await ctx.db
				.insert(schema.appointments)
				.values(input)
				.returning();

			return newAppointment[0];
		}),

	update: authorizedProcedure
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
					updatedAt: new Date(),
				})
				.where(eq(schema.appointments.id, input.id))
				.returning();

			if (updatedAppointment.length === 0) {
				throw new Error("Appointment not found");
			}

			return updatedAppointment[0];
		}),

	delete: authorizedProcedure
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
