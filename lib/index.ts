import { router } from "./trpc.js";
import { authRouter } from "./routers/auth.js";
import { patientsRouter } from "./routers/patients.js";
import { appointmentsRouter } from "./routers/appointments.js";
import { medicalRecordsRouter } from "./routers/medical-records.js";
import { medicationsRouter } from "./routers/medications.js";
import { prescriptionsRouter } from "./routers/prescriptions.js";
import { invoicesRouter } from "./routers/invoices.js";
import { labTestsRouter } from "./routers/lab-tests.js";
import { dashboardRouter } from "./routers/dashboard.js";
import { usersRouter } from "./routers/users.js";
import { systemSettingsRouter } from "./routers/system-settings.js";
import { reportsRouter } from "./routers/reports.js";

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
