import { router } from "../trpc.js";
import { authRouter } from "./auth.js";
import { patientsRouter } from "./patients.js";
import { appointmentsRouter } from "./appointments.js";
import { medicalRecordsRouter } from "./medical-records.js";
import { medicationsRouter } from "./medications.js";
import { prescriptionsRouter } from "./prescriptions.js";
import { invoicesRouter } from "./invoices.js";
import { labTestsRouter } from "./lab-tests.js";
import { dashboardRouter } from "./dashboard.js";
import { usersRouter } from "./users.js";
import { systemSettingsRouter } from "./system-settings.js";

export const appRouter = router({
	auth: authRouter,
	patients: patientsRouter,
	appointments: appointmentsRouter,
	medicalRecords: medicalRecordsRouter,
	medications: medicationsRouter,
	prescriptions: prescriptionsRouter,
	invoices: invoicesRouter,
	labTests: labTestsRouter,
	dashboard: dashboardRouter,
	users: usersRouter,
	systemSettings: systemSettingsRouter,
});

export type AppRouter = typeof appRouter;
