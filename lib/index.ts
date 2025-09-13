import { appointmentsRouter } from "./routers/appointments.js";
import { authRouter } from "./routers/auth.js";
import { dashboardRouter } from "./routers/dashboard.js";
import { invoicesRouter } from "./routers/invoices.js";
import { labTestsRouter } from "./routers/lab-tests.js";
import { medicalRecordsRouter } from "./routers/medical-records.js";
import { medicationsRouter } from "./routers/medications.js";
import { patientsRouter } from "./routers/patients.js";
import { prescriptionsRouter } from "./routers/prescriptions.js";
import { reportsRouter } from "./routers/reports.js";
import { systemSettingsRouter } from "./routers/system-settings.js";
import { usersRouter } from "./routers/users.js";
import { router } from "./trpc.js";

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
	reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
