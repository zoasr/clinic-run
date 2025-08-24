import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { db } from "./lib/db/index.js";
import * as schema from "./lib/db/schema/schema.js";
import * as authSchema from "./lib/db/schema/auth-schema.js";
import { eq, like, and, desc, asc } from "drizzle-orm";
import { auth } from "./lib/auth.js";

const getSession = auth.api.getSession;

const app = new Hono();
const PORT = process.env.PORT || 3001;

// Enhanced CORS configuration
app.use(
	"*",
	cors({
		origin:
			process.env.NODE_ENV === "production"
				? process.env.APP_URL || "*"
				: "*",
		credentials: true,
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	})
);

// CSRF Protection Middleware
app.use("*", async (c, next) => {
	if (c.req.method === "GET") {
		return next();
	}
	const originHeader = c.req.header("Origin");
	const hostHeader = c.req.header("Host");

	if (!originHeader || !hostHeader) {
		return c.json({ error: "Invalid request" }, 403);
	}
	return next();
});

// Auth routes
app.on(["POST", "GET"], "/api/auth/**", (c) => {
	return auth.handler(c.req.raw);
});

// Serve static files
app.use("/static/*", serveStatic({ root: "./dist" }));
app.use(
	"/*",
	serveStatic({
		root: "./dist",
		rewriteRequestPath: (path) => (path === "/" ? "/index.html" : path),
	})
);

// Initialize database on startup
async function startServer() {
	try {
		// await seedDatabase();
		console.log("Database ready");
	} catch (error) {
		console.error("Failed to initialize database:", error);
		process.exit(1);
	}
}

// Enhanced authentication middleware with better error handling and session validation
const authenticateToken = async (c: any, next: any) => {
	try {
		const session = await getSession(c.req.raw);

		if (!session) {
			return c.json(
				{
					error: "Unauthorized",
					message: "No valid session found",
				},
				401
			);
		}

		// Check if session is still valid
		const sessionRecord = await db
			.select()
			.from(authSchema.session)
			.where(eq(authSchema.session.id, session.session.id))
			.get();

		if (!sessionRecord || sessionRecord.expiresAt < new Date()) {
			return c.json(
				{
					error: "Session expired",
					message: "Please login again",
				},
				401
			);
		}

		// Set user and session in context
		c.set("user", session.user);
		c.set("session", session);

		// Update session expiration on activity
		await db
			.update(authSchema.session)
			.set({
				expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // Extend session
			})
			.where(eq(authSchema.session.id, session.session.id))
			.run();

		await next();
	} catch (error) {
		console.error("Authentication error:", error);
		return c.json(
			{
				error: "Authentication failed",
				message: "An error occurred during authentication",
			},
			500
		);
	}
};

// Auth routes

// User routes
app.get("/api/users", authenticateToken, async (c) => {
	try {
		const users = await db
			.select({
				id: authSchema.user.id,
				username: authSchema.user.username,
				email: authSchema.user.email,
				name: authSchema.user.name,
				firstName: authSchema.user.firstName,
				lastName: authSchema.user.lastName,
				role: authSchema.user.role,
				isActive: authSchema.user.isActive,
				createdAt: authSchema.user.createdAt,
			})
			.from(authSchema.user)
			.where(eq(authSchema.user.isActive, true));

		return c.json(users);
	} catch (error) {
		return c.json({ error: "Failed to fetch users" }, 500);
	}
});

// Rate limiting middleware for auth routes
const rateLimit = (requestsPerMinute = 60) => {
	const requests = new Map();

	return async (c: any, next: any) => {
		const ip =
			c.req.header("cf-connecting-ip") ||
			c.req.header("x-forwarded-for") ||
			"unknown";
		const now = Date.now();
		const windowMs = 60 * 1000; // 1 minute

		if (!requests.has(ip)) {
			requests.set(ip, []);
		}

		const userRequests = requests.get(ip);
		const windowStart = now - windowMs;

		// Remove old requests
		while (userRequests.length > 0 && userRequests[0] < windowStart) {
			userRequests.shift();
		}

		// Check rate limit
		if (userRequests.length >= requestsPerMinute) {
			return c.json(
				{
					error: "Too many requests",
					message: `Limit of ${requestsPerMinute} requests per minute exceeded`,
				},
				429
			);
		}

		userRequests.push(now);
		await next();
	};
};

// Apply rate limiting to auth routes
app.use("/api/auth/*", rateLimit(10)); // 10 requests per minute for auth routes

import { z } from "zod";

const userSchema = z.object({
	username: z.string(),
	email: z.string().email(),
	password: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	role: z.string().optional(),
});

app.post("/api/users", authenticateToken, async (c) => {
	try {
		const value = userSchema.safeParse(await c.req.json());

		if (!value.success) {
			return c.json({ error: "Invalid request" }, 400);
		}

		const newUser = await auth.api.signUpEmail({
			body: {
				name: value.data.firstName + " " + value.data.lastName,
				email: value.data.email,
				password: value.data.password,
				username: value.data.username,
				firstName: value.data.firstName,
				lastName: value.data.lastName,
				role: value.data.role,
			},
		});

		return c.json(newUser.user, 201);
	} catch (error) {
		return c.json({ error: "Failed to create user" }, 500);
	}
});

// Patient routes
app.get("/api/patients", authenticateToken, async (c) => {
	try {
		const search = c.req.query("search");
		const page = Number.parseInt(c.req.query("page") || "1");
		const limit = Number.parseInt(c.req.query("limit") || "10");
		const offset = (page - 1) * limit;

		const patients = await db
			.select()
			.from(schema.patients)
			.where(
				and(
					eq(schema.patients.isActive, true),
					search
						? like(schema.patients.firstName, `%${search}%`)
						: undefined
				)
			)
			.limit(limit)
			.offset(offset)
			.orderBy(desc(schema.patients.createdAt));

		return c.json(patients);
	} catch (error) {
		return c.json({ error: "Failed to fetch patients" }, 500);
	}
});

app.get("/api/patients/:id", authenticateToken, async (c) => {
	try {
		const id = c.req.param("id");
		const patient = await db
			.select()
			.from(schema.patients)
			.where(eq(schema.patients.id, Number.parseInt(id)))
			.limit(1);

		if (patient.length === 0) {
			return c.json({ error: "Patient not found" }, 404);
		}

		return c.json(patient[0]);
	} catch (error) {
		return c.json({ error: "Failed to fetch patient" }, 500);
	}
});

app.post("/api/patients", authenticateToken, async (c) => {
	try {
		const patientData = await c.req.json();

		// Generate patient ID
		const lastPatient = await db
			.select()
			.from(schema.patients)
			.orderBy(desc(schema.patients.id))
			.limit(1);
		const patientId = `P${String((lastPatient[0]?.id || 0) + 1).padStart(
			4,
			"0"
		)}`;

		const newPatient = await db
			.insert(schema.patients)
			.values({
				...patientData,
				patientId,
			})
			.returning();

		return c.json(newPatient[0], 201);
	} catch (error) {
		return c.json({ error: "Failed to create patient" }, 500);
	}
});

app.put("/api/patients/:id", authenticateToken, async (c) => {
	try {
		const id = c.req.param("id");
		const data = await c.req.json();

		const updatedPatient = await db
			.update(schema.patients)
			.set({ ...data, updatedAt: new Date().toISOString() })
			.where(eq(schema.patients.id, Number.parseInt(id)))
			.returning();

		if (updatedPatient.length === 0) {
			return c.json({ error: "Patient not found" }, 404);
		}

		return c.json(updatedPatient[0]);
	} catch (error) {
		return c.json({ error: "Failed to update patient" }, 500);
	}
});

// Appointment routes
app.get("/api/appointments", authenticateToken, async (c) => {
	try {
		const date = c.req.query("date");
		const status = c.req.query("status");
		const page = Number.parseInt(c.req.query("page") || "1");
		const limit = Number.parseInt(c.req.query("limit") || "10");
		const offset = (page - 1) * limit;

		const whereConditions = [];

		if (date) {
			whereConditions.push(eq(schema.appointments.appointmentDate, date));
		}
		if (status) {
			whereConditions.push(eq(schema.appointments.status, status));
		}

		const appointments = await db
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
				whereConditions.length > 0 ? and(...whereConditions) : undefined
			)
			.limit(limit)
			.offset(offset)
			.orderBy(
				asc(schema.appointments.appointmentDate),
				asc(schema.appointments.appointmentTime)
			);

		return c.json(appointments);
	} catch (error) {
		return c.json({ error: "Failed to fetch appointments" }, 500);
	}
});

app.post("/api/appointments", authenticateToken, async (c) => {
	try {
		const data = await c.req.json();
		const newAppointment = await db
			.insert(schema.appointments)
			.values(data)
			.returning();
		return c.json(newAppointment[0], 201);
	} catch (error) {
		return c.json({ error: "Failed to create appointment" }, 500);
	}
});

app.put("/api/appointments/:id", authenticateToken, async (c) => {
	try {
		const id = c.req.param("id");
		const data = await c.req.json();

		const updatedAppointment = await db
			.update(schema.appointments)
			.set({ ...data, updatedAt: new Date().toISOString() })
			.where(eq(schema.appointments.id, Number.parseInt(id)))
			.returning();

		if (updatedAppointment.length === 0) {
			return c.json({ error: "Appointment not found" }, 404);
		}

		return c.json(updatedAppointment[0]);
	} catch (error) {
		return c.json({ error: "Failed to update appointment" }, 500);
	}
});

// Medical records routes
app.get("/api/medical-records", authenticateToken, async (c) => {
	try {
		const patientId = c.req.query("patientId");
		const page = Number.parseInt(c.req.query("page") || "1");
		const limit = Number.parseInt(c.req.query("limit") || "10");
		const offset = (page - 1) * limit;

		const whereConditions = [];

		if (patientId) {
			whereConditions.push(
				eq(schema.medicalRecords.patientId, Number.parseInt(patientId))
			);
		}

		const records = await db
			.select({
				id: schema.medicalRecords.id,
				visitDate: schema.medicalRecords.visitDate,
				chiefComplaint: schema.medicalRecords.chiefComplaint,
				diagnosis: schema.medicalRecords.diagnosis,
				treatment: schema.medicalRecords.treatment,
				prescription: schema.medicalRecords.prescription,
				notes: schema.medicalRecords.notes,
				vitalSigns: schema.medicalRecords.vitalSigns,
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
			.from(schema.medicalRecords)
			.leftJoin(
				schema.patients,
				eq(schema.medicalRecords.patientId, schema.patients.id)
			)
			.leftJoin(
				authSchema.user,
				eq(schema.medicalRecords.doctorId, authSchema.user.id)
			)
			.where(
				whereConditions.length > 0 ? and(...whereConditions) : undefined
			)
			.limit(limit)
			.offset(offset)
			.orderBy(desc(schema.medicalRecords.visitDate));

		return c.json(records);
	} catch (error) {
		return c.json({ error: "Failed to fetch medical records" }, 500);
	}
});

app.post("/api/medical-records", authenticateToken, async (c) => {
	try {
		const data = await c.req.json();
		const newRecord = await db
			.insert(schema.medicalRecords)
			.values(data)
			.returning();
		return c.json(newRecord[0], 201);
	} catch (error) {
		return c.json({ error: "Failed to create medical record" }, 500);
	}
});

// Medication routes
app.get("/api/medications", authenticateToken, async (c) => {
	try {
		const search = c.req.query("search");
		const lowStock = c.req.query("lowStock");
		const page = Number.parseInt(c.req.query("page") || "1");
		const limit = Number.parseInt(c.req.query("limit") || "10");
		const offset = (page - 1) * limit;

		const whereConditions = [eq(schema.medications.isActive, true)];

		if (search) {
			whereConditions.push(like(schema.medications.name, `%${search}%`));
		}

		const medications = await db
			.select()
			.from(schema.medications)
			.where(and(...whereConditions))
			.limit(limit)
			.offset(offset)
			.orderBy(asc(schema.medications.name));

		return c.json(medications);
	} catch (error) {
		return c.json({ error: "Failed to fetch medications" }, 500);
	}
});

app.post("/api/medications", authenticateToken, async (c) => {
	try {
		const data = await c.req.json();
		const newMedication = await db
			.insert(schema.medications)
			.values(data)
			.returning();
		return c.json(newMedication[0], 201);
	} catch (error) {
		return c.json({ error: "Failed to create medication" }, 500);
	}
});

app.put("/api/medications/:id", authenticateToken, async (c) => {
	try {
		const id = c.req.param("id");
		const data = await c.req.json();

		const updatedMedication = await db
			.update(schema.medications)
			.set({ ...data, updatedAt: new Date().toISOString() })
			.where(eq(schema.medications.id, Number.parseInt(id)))
			.returning();

		if (updatedMedication.length === 0) {
			return c.json({ error: "Medication not found" }, 404);
		}

		return c.json(updatedMedication[0]);
	} catch (error) {
		return c.json({ error: "Failed to update medication" }, 500);
	}
});

// Dashboard stats route
app.get("/api/dashboard/stats", authenticateToken, async (c) => {
	try {
		const today = new Date().toISOString().split("T")[0];

		const [
			totalPatients,
			todayAppointments,
			pendingAppointments,
			lowStockMedications,
		] = await Promise.all([
			db
				.select()
				.from(schema.patients)
				.where(eq(schema.patients.isActive, true)),
			db
				.select()
				.from(schema.appointments)
				.where(eq(schema.appointments.appointmentDate, today)),
			db
				.select()
				.from(schema.appointments)
				.where(eq(schema.appointments.status, "scheduled")),
			db
				.select()
				.from(schema.medications)
				.where(eq(schema.medications.isActive, true)),
		]);

		// Filter low stock medications in memory
		const lowStock = lowStockMedications.filter(
			(med) => med.quantity <= med.minStockLevel
		);

		return c.json({
			totalPatients: totalPatients.length,
			todayAppointments: todayAppointments.length,
			pendingAppointments: pendingAppointments.length,
			lowStockMedications: lowStock.length,
		});
	} catch (error) {
		return c.json({ error: "Failed to fetch dashboard stats" }, 500);
	}
});

// Health check route
app.get("/api/health", (c) => {
	return c.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Fallback for SPA routing
app.get("*", (c) => {
	if (c.req.path.startsWith("/api")) {
		return c.json({ error: "API endpoint not found" }, 404);
	}
	return c.html(
		`<!DOCTYPE html><html><head><title>Clinic System</title></head><body><div id="root"></div></body></html>`
	);
});

// Start server
startServer().then(() => {
	console.log(`🏥 Clinic System running on http://localhost:${PORT}`);
	console.log(`📊 Dashboard: http://localhost:${PORT}`);
	console.log(`🔧 API Health: http://localhost:${PORT}/api/health`);
	console.log(`💾 Database: SQLite (local)`);
	console.log(`🔒 Authentication: Better Auth`);
});

export default {
	port: PORT,
	fetch: app.fetch,
};
