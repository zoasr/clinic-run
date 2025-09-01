/** @jsx jsx */
/** @jsxImportSource hono/jsx */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { auth } from "./auth.js";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./index.js";
import { createContext } from "./trpc.js";

const app = new Hono();
const PORT = Number(process.env["BACKEND_PORT"]) || 3031;

console.log(process.env["DB_FILE_NAME"], process.env["BETTER_AUTH_SECRET"]);

// Enhanced CORS configuration
app.use(
	"*",
	cors({
		origin: process.env["FRONTEND_URL"] || "http://localhost:3030",
		credentials: true,
		allowHeaders: ["Content-Type", "Authorization", "Cookie"],
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		exposeHeaders: ["Set-Cookie"],
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

// tRPC API handler
app.all("/api/trpc/*", async (c) => {
	return fetchRequestHandler({
		endpoint: "/api/trpc",
		req: c.req.raw,
		router: appRouter,
		createContext: () =>
			createContext({
				req: c.req.raw,
				resHeaders: new Headers(),
				info: {} as any,
			}),
		onError:
			process.env.NODE_ENV === "development"
				? ({ path, error }) => {
						console.error(
							`❌ tRPC failed on ${path ?? "<no-path>"}: ${error}`
						);
					}
				: () => {},
	});
});

// Serve static files
app.use("/static/*", serveStatic({ root: "./dist" }));
app.use(
	"/*",
	serveStatic({
		root: process.env.NODE_ENV === "production" ? "." : "./dist",
		rewriteRequestPath: (path) => (path === "/" ? "/index.html" : path),
	})
);

// Initialize database on startup
async function startServer() {
	try {
		// await seedDatabase();
		console.log("Database ready");
	} catch (error) {
		console.error("❌ Failed to initialize database:", error);
		process.exit(1);
	}
}

// Health check route
app.get("/api/health", (c) => {
	return c.json({ status: "OK", timestamp: new Date().toISOString() });
});

// System tray and GUI functionality for desktop app
async function setupSystemTray() {
	try {
		// Only setup system tray in production (desktop app)
		if (process.env.NODE_ENV === "production") {
			console.log("Setting up system tray...");

			// Import system tray functionality (will be available in desktop build)
			const { setupTray } = await import("./system-tray.js");
			await setupTray(PORT);
		}
	} catch (error) {
		console.log("System tray not available, running in server mode");
	}
}

// Auto-open browser in development
async function openBrowser() {
	if (process.env.NODE_ENV !== "production") {
		try {
			// Use Bun.spawn instead of child_process.exec
			if (
				process.env.NODE_ENV !== "development" &&
				process.env.NODE_ENV !== "test"
			) {
				const browserProcess = Bun.spawn(
					["cmd", "/c", `start http://localhost:${PORT}`],
					{
						stdout: "pipe",
						stderr: "pipe",
					}
				);
				await browserProcess.exited;
				console.log(
					`Clinic System opened in browser at http://localhost:${PORT}`
				);
			}
		} catch (error) {
			console.log(`Server running at http://localhost:${PORT}`);
		}
	}
}

// Start server
startServer().then(async () => {
	console.log(`Clinic server running on http://localhost:${PORT}`);

	// Setup system tray for desktop app
	await setupSystemTray();

	// Auto-open browser in development
	await openBrowser();
});

export default {
	port: PORT,
	fetch: app.fetch,
};
