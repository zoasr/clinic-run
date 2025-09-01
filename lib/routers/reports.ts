import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
import { eq, and, gte, lte } from "drizzle-orm";
import * as schema from "../db/schema/schema.js";

export const reportsRouter = router({
	// Patient reports
	getPatientStats: protectedProcedure
		.input(
			z.object({
				startDate: z.date().optional(),
				endDate: z.date().optional(),
			})
		)
		.query(async ({ input, ctx }) => {
			const { startDate, endDate } = input;

			let whereConditions = [];
			if (startDate && startDate) {
				whereConditions.push(gte(schema.patients.createdAt, startDate));
			}
			if (endDate && endDate) {
				whereConditions.push(lte(schema.patients.createdAt, endDate));
			}

			const patients = await ctx.db
				.select()
				.from(schema.patients)
				.where(
					whereConditions.length > 0
						? and(...whereConditions)
						: undefined
				);

			// Calculate age distribution
			const currentYear = new Date().getFullYear();
			const ageGroups = {
				"0-18": 0,
				"19-35": 0,
				"36-50": 0,
				"51-65": 0,
				"65+": 0,
			};

			const genderStats = {
				male: 0,
				female: 0,
				other: 0,
			};

			patients.forEach((patient) => {
				const birthYear = new Date(patient.dateOfBirth).getFullYear();
				const age = currentYear - birthYear;

				if (age <= 18) ageGroups["0-18"]++;
				else if (age <= 35) ageGroups["19-35"]++;
				else if (age <= 50) ageGroups["36-50"]++;
				else if (age <= 65) ageGroups["51-65"]++;
				else ageGroups["65+"]++;

				const gender = patient.gender.toLowerCase();
				if (gender === "male") genderStats.male++;
				else if (gender === "female") genderStats.female++;
				else genderStats.other++;
			});

			return {
				totalPatients: patients.length,
				activePatients: patients.filter((p) => p.isActive).length,
				ageDistribution: ageGroups,
				genderDistribution: genderStats,
			};
		}),

	// Appointment reports
	getAppointmentStats: protectedProcedure
		.input(
			z.object({
				startDate: z.date().optional(),
				endDate: z.date().optional(),
			})
		)
		.query(async ({ input, ctx }) => {
			const { startDate, endDate } = input;

			let whereConditions = [];
			if (startDate && startDate) {
				whereConditions.push(
					gte(schema.appointments.appointmentDate, startDate)
				);
			}
			if (endDate && endDate) {
				whereConditions.push(
					lte(schema.appointments.appointmentDate, endDate)
				);
			}

			const appointments = await ctx.db
				.select()
				.from(schema.appointments)
				.where(
					whereConditions.length > 0
						? and(...whereConditions)
						: undefined
				);

			const statusStats = {
				scheduled: 0,
				completed: 0,
				cancelled: 0,
				"no-show": 0,
			};

			const typeStats = {
				consultation: 0,
				checkup: 0,
				"follow-up": 0,
				emergency: 0,
			};

			appointments.forEach((apt) => {
				statusStats[apt.status as keyof typeof statusStats]++;
				typeStats[apt.type as keyof typeof typeStats]++;
			});

			return {
				totalAppointments: appointments.length,
				statusDistribution: statusStats,
				typeDistribution: typeStats,
				completionRate:
					appointments.length > 0
						? (statusStats.completed / appointments.length) * 100
						: 0,
			};
		}),

	// Financial reports
	getFinancialStats: protectedProcedure
		.input(
			z.object({
				startDate: z.date().optional(),
				endDate: z.date().optional(),
			})
		)
		.query(async ({ input, ctx }) => {
			const { startDate, endDate } = input;

			let whereConditions = [];
			if (startDate && startDate) {
				whereConditions.push(gte(schema.invoices.createdAt, startDate));
			}
			if (endDate && endDate) {
				whereConditions.push(lte(schema.invoices.createdAt, endDate));
			}

			const invoices = await ctx.db
				.select()
				.from(schema.invoices)
				.where(
					whereConditions.length > 0
						? and(...whereConditions)
						: undefined
				);

			const totalRevenue = invoices.reduce(
				(sum, inv) => sum + inv.totalAmount,
				0
			);
			const totalPaid = invoices.reduce(
				(sum, inv) => sum + inv.paidAmount,
				0
			);
			const outstandingAmount = totalRevenue - totalPaid;

			const statusStats = {
				pending: 0,
				paid: 0,
				overdue: 0,
			};

			invoices.forEach((inv) => {
				statusStats[inv.status as keyof typeof statusStats]++;
			});

			return {
				totalRevenue,
				totalPaid,
				outstandingAmount,
				invoiceCount: invoices.length,
				statusDistribution: statusStats,
				averageInvoiceValue:
					invoices.length > 0 ? totalRevenue / invoices.length : 0,
			};
		}),

	// Inventory reports
	getInventoryStats: protectedProcedure.query(async ({ ctx }) => {
		const medications = await ctx.db
			.select()
			.from(schema.medications)
			.where(eq(schema.medications.isActive, true));

		const lowStock = medications.filter(
			(med) => med.quantity <= med.minStockLevel && med.quantity > 0
		);
		const outOfStock = medications.filter((med) => med.quantity === 0);
		const healthyStock = medications.filter(
			(med) => med.quantity > med.minStockLevel
		);

		const totalValue = medications.reduce(
			(sum, med) => sum + med.quantity * med.unitPrice,
			0
		);

		// Get expiring medications (next 30 days)
		const thirtyDaysFromNow = new Date();
		thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

		const expiringSoon = medications.filter((med) => {
			if (!med.expiryDate) return false;
			const expiryDate = new Date(med.expiryDate);
			return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
		});

		return {
			totalMedications: medications.length,
			lowStockCount: lowStock.length,
			outOfStockCount: outOfStock.length,
			healthyStockCount: healthyStock.length,
			totalInventoryValue: totalValue,
			expiringSoonCount: expiringSoon.length,
			stockLevels: {
				healthy: healthyStock.length,
				low: lowStock.length,
				out: outOfStock.length,
			},
		};
	}),

	// Monthly trends report
	getMonthlyTrends: protectedProcedure
		.input(
			z.object({
				months: z.number().min(1).max(12).default(6),
			})
		)
		.query(async ({ input, ctx }) => {
			const { months } = input;
			const trends = [];

			for (let i = months - 1; i >= 0; i--) {
				const date = new Date();
				date.setMonth(date.getMonth() - i);
				const monthStart = new Date(
					date.getFullYear(),
					date.getMonth(),
					1
				);
				const monthEnd = new Date(
					date.getFullYear(),
					date.getMonth() + 1,
					0
				);

				const monthStartStr = monthStart;
				const monthEndStr = monthEnd;

				// Get appointments for this month
				const appointments = await ctx.db
					.select()
					.from(schema.appointments)
					.where(
						and(
							gte(
								schema.appointments.appointmentDate,
								monthStartStr
							),
							lte(
								schema.appointments.appointmentDate,
								monthEndStr
							)
						)
					);

				// Get invoices for this month
				const invoices = await ctx.db
					.select()
					.from(schema.invoices)
					.where(
						and(
							gte(schema.invoices.createdAt, monthStartStr),
							lte(schema.invoices.createdAt, monthEndStr)
						)
					);

				const revenue = invoices.reduce(
					(sum, inv) => sum + inv.totalAmount,
					0
				);

				trends.push({
					month: monthStart.toLocaleDateString("en-US", {
						month: "short",
						year: "numeric",
					}),
					appointments: appointments.length,
					revenue,
					completedAppointments: appointments.filter(
						(a) => a.status === "completed"
					).length,
				});
			}

			return trends;
		}),
});
