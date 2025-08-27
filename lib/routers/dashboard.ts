import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema/schema.js";

export const dashboardRouter = router({
	getStats: protectedProcedure.query(async ({ ctx }) => {
		const today = new Date().toISOString().split("T")[0];
		const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
		const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

		const [
			totalPatients,
			todayAppointments,
			yesterdayAppointments,
			pendingAppointments,
			allMedications,
		] = await Promise.all([
			// Total active patients
			ctx.db
				.select()
				.from(schema.patients)
				.where(eq(schema.patients.isActive, true)),

			// Today's appointments
			ctx.db
				.select()
				.from(schema.appointments)
				.where(eq(schema.appointments.appointmentDate, today)),

			// Yesterday's appointments for comparison
			ctx.db
				.select()
				.from(schema.appointments)
				.where(eq(schema.appointments.appointmentDate, yesterday)),

			// Pending appointments (scheduled but not completed/cancelled)
			ctx.db
				.select()
				.from(schema.appointments)
				.where(eq(schema.appointments.status, "scheduled")),

			// All active medications for stock analysis
			ctx.db
				.select()
				.from(schema.medications)
				.where(eq(schema.medications.isActive, true)),
		]);

		// Calculate stock levels
		const lowStock = allMedications.filter(
			(med) => med.quantity <= med.minStockLevel && med.quantity > 0
		);
		const outOfStock = allMedications.filter(
			(med) => med.quantity === 0
		);
		const healthyStock = allMedications.filter(
			(med) => med.quantity > med.minStockLevel
		);

		// Calculate appointment trends
		const todayCount = todayAppointments.length;
		const yesterdayCount = yesterdayAppointments.length;
		const appointmentChange = yesterdayCount > 0
			? ((todayCount - yesterdayCount) / yesterdayCount) * 100
			: todayCount > 0 ? 100 : 0;

		// Get upcoming appointments (next 7 days)
		const upcomingAppointments = await ctx.db
			.select()
			.from(schema.appointments)
			.where(eq(schema.appointments.status, "scheduled"));

		const nextWeekAppointments = upcomingAppointments.filter(apt => {
			const aptDate = new Date(apt.appointmentDate);
			const todayDate = new Date(today);
			const diffTime = aptDate.getTime() - todayDate.getTime();
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			return diffDays >= 0 && diffDays <= 7;
		});

		return {
			totalPatients: totalPatients.length,
			todayAppointments: todayCount,
			yesterdayAppointments: yesterdayCount,
			appointmentChange: Math.round(appointmentChange),
			pendingAppointments: pendingAppointments.length,
			upcomingAppointments: nextWeekAppointments.length,
			lowStockMedications: lowStock.length,
			outOfStockMedications: outOfStock.length,
			totalMedications: allMedications.length,
			stockLevels: {
				healthy: healthyStock.length,
				low: lowStock.length,
				out: outOfStock.length,
			},
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
