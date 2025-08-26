import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema/schema.js";

export const dashboardRouter = router({
	getStats: protectedProcedure.query(async ({ ctx }) => {
		const today = new Date().toISOString().split("T")[0];

		const [
			totalPatients,
			todayAppointments,
			pendingAppointments,
			lowStockMedications,
		] = await Promise.all([
			ctx.db
				.select()
				.from(schema.patients)
				.where(eq(schema.patients.isActive, true)),
			ctx.db
				.select()
				.from(schema.appointments)
				.where(eq(schema.appointments.appointmentDate, today)),
			ctx.db
				.select()
				.from(schema.appointments)
				.where(eq(schema.appointments.status, "scheduled")),
			ctx.db
				.select()
				.from(schema.medications)
				.where(eq(schema.medications.isActive, true)),
		]);

		// Filter low stock medications
		const lowStock = lowStockMedications.filter(
			(med) => med.quantity <= med.minStockLevel
		);

		return {
			totalPatients: totalPatients.length,
			todayAppointments: todayAppointments.length,
			pendingAppointments: pendingAppointments.length,
			lowStockMedications: lowStock.length,
		};
	}),

	getRecentActivity: protectedProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(50).default(10),
			})
		)
		.query(async ({ input, ctx }) => {
			const { limit } = input;

			// Get recent appointments
			const recentAppointments = await ctx.db
				.select({
					id: schema.appointments.id,
					appointmentDate: schema.appointments.appointmentDate,
					appointmentTime: schema.appointments.appointmentTime,
					status: schema.appointments.status,
					patient: {
						firstName: schema.patients.firstName,
						lastName: schema.patients.lastName,
					},
				})
				.from(schema.appointments)
				.leftJoin(
					schema.patients,
					eq(schema.appointments.patientId, schema.patients.id)
				)
				.orderBy(schema.appointments.appointmentDate)
				.limit(limit);

			// Get recent medical records
			const recentMedicalRecords = await ctx.db
				.select({
					id: schema.medicalRecords.id,
					visitDate: schema.medicalRecords.visitDate,
					chiefComplaint: schema.medicalRecords.chiefComplaint,
					patient: {
						firstName: schema.patients.firstName,
						lastName: schema.patients.lastName,
					},
				})
				.from(schema.medicalRecords)
				.leftJoin(
					schema.patients,
					eq(schema.medicalRecords.patientId, schema.patients.id)
				)
				.orderBy(schema.medicalRecords.visitDate)
				.limit(limit);

			return {
				recentAppointments,
				recentMedicalRecords,
			};
		}),

	getUpcomingAppointments: protectedProcedure
		.input(
			z.object({
				days: z.number().min(1).max(30).default(7),
			})
		)
		.query(async ({ input, ctx }) => {
			const { days } = input;
			const startDate = new Date().toISOString().split("T")[0];
			const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
				.toISOString()
				.split("T")[0];

			const upcomingAppointments = await ctx.db
				.select({
					id: schema.appointments.id,
					appointmentDate: schema.appointments.appointmentDate,
					appointmentTime: schema.appointments.appointmentTime,
					type: schema.appointments.type,
					status: schema.appointments.status,
					patient: {
						firstName: schema.patients.firstName,
						lastName: schema.patients.lastName,
						patientId: schema.patients.patientId,
					},
				})
				.from(schema.appointments)
				.leftJoin(
					schema.patients,
					eq(schema.appointments.patientId, schema.patients.id)
				)
				.where(
					eq(schema.appointments.appointmentDate, startDate) ||
						eq(schema.appointments.appointmentDate, endDate)
				)
				.orderBy(schema.appointments.appointmentDate)
				.limit(20);

			return upcomingAppointments;
		}),
});
