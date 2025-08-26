import { router } from "../trpc.js";
import { authRouter } from "./auth.js";
import { patientsRouter } from "./patients.js";
import { appointmentsRouter } from "./appointments.js";
import { medicalRecordsRouter } from "./medical-records.js";
import { medicationsRouter } from "./medications.js";
import { dashboardRouter } from "./dashboard.js";
import { usersRouter } from "./users.js";

export const appRouter = router({
	auth: authRouter,
	patients: patientsRouter,
	appointments: appointmentsRouter,
	medicalRecords: medicalRecordsRouter,
	medications: medicationsRouter,
	dashboard: dashboardRouter,
	users: usersRouter,
});

export type AppRouter = typeof appRouter;
