import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import { homedir } from "node:os";
import { getIconBase64 } from "./icon-utils.js";
// Use require() for systray to avoid ESM interop issues with Bun's compiled exe
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SyTray: new (conf: any) => any = require("systray").default;

export async function setupTray(port: number) {
	const isDev = process.env.NODE_ENV === "development";

	// In compiled mode, extract embedded tray binary to systray cache dir
	// so SyTray's copyDir: true mechanism finds it before trying to copy
	// @ts-expect-error - Bun's define replaces process.env.__TRAY_BIN_* at build time
	const trayBinData = process.env.__TRAY_BIN_DATA__;
	// @ts-expect-error - Bun's define replaces process.env.__TRAY_BIN_* at build time
	const trayBinName = process.env.__TRAY_BIN_NAME__;
	if (trayBinData && trayBinName) {
		try {
			const cacheDir = path.join(homedir(), ".cache", "node-systray", "1.0.5");
			const cachePath = path.join(cacheDir, trayBinName);
			const exists = await Bun.file(cachePath).exists();
			if (!exists) {
				await mkdir(cacheDir, { recursive: true });
				const decoded = Buffer.from(trayBinData, "base64");
				await Bun.write(cachePath, decoded);
			}
		} catch (error) {
			console.log("Failed to extract tray binary:", error);
		}
	}

	// Setup system tray (works in both dev and production now)
	try {
		const iconBase64 = getIconBase64();

		const systray = new SyTray({
			menu: {
				icon: iconBase64,
				title: "Clinic Run",
				tooltip: "Clinic Run - Running",
				items: [
					{
						title: "Open Clinic Run",
						tooltip: "Open Clinic Run in browser",
						checked: false,
						enabled: true,
					},
					{
						title: "Stop Server",
						tooltip: "Stop the Clinic Run server",
						checked: false,
						enabled: true,
					},
					{
						title: "-",
						tooltip: "Separator",
						checked: false,
						enabled: false,
					},
					{
						title: "Exit",
						tooltip: "Exit Clinic Run",
						checked: false,
						enabled: true,
					},
				],
			},
			debug: false,
			copyDir: true,
		});

		systray.onClick((action: any) => {
			if (action.seq_id === 0) {
				// Open Clinic Run in browser
				Bun.spawn(["cmd", "/c", `start http://localhost:${port}`], {
					stdout: "pipe",
					stderr: "pipe",
				});
			} else if (action.seq_id === 1) {
				// Stop server - this will close the tray too
				console.log("Stopping Clinic Run server...");
				systray.kill();
				process.exit(0);
			} else if (action.seq_id === 3) {
				// Exit
				console.log("Exiting Clinic Run...");
				systray.kill();
				process.exit(0);
			}
		});

		console.log(`System tray initialized (${isDev ? "development" : "production"} mode)`);
	} catch (error) {
		console.log("System tray setup failed, continuing without tray:", error);
	}

	// For Bun executable, we'll use a simpler approach
	// Open browser automatically when the app starts
	if (!isDev) {
		try {
			// Use Windows default browser to open the app
			const browserProcess = Bun.spawn(
				["cmd", "/c", `start http://localhost:${port}`],
				{
					stdout: "pipe",
					stderr: "pipe",
				},
			);
			await browserProcess.exited;
			console.log(
				`Clinic System opened in browser at http://localhost:${port}`,
			);
		} catch (_error) {
			console.log(`Please open http://localhost:${port} in your browser`);
		}
	}

	// Setup periodic backup
	setupAutoBackup();

	// Setup graceful shutdown
	setupGracefulShutdown();
}

async function setupAutoBackup() {
	// Create backup every 24 hours
	const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

	setInterval(async () => {
		try {
			await createBackup();
		} catch (error) {
			console.error("Auto backup failed:", error);
		}
	}, BACKUP_INTERVAL);

	// Also create backup on startup
	await createBackup();
}

async function setupGracefulShutdown() {
	// Handle graceful shutdown
	process.on("SIGINT", async () => {
		console.log("Shutting down Clinic System...");
		await createBackup(); // Final backup before shutdown
		process.exit(0);
	});

	process.on("SIGTERM", async () => {
		console.log("Shutting down Clinic System...");
		await createBackup(); // Final backup before shutdown
		process.exit(0);
	});
}

function getUserBackupPath(): string {
	// Try different user-writable locations in order of preference

	// 1. Try %LOCALAPPDATA%\ClinicSystem\Backups (most common for user data)
	if (process.env["LOCALAPPDATA"]) {
		return path.join(process.env["LOCALAPPDATA"], "ClinicSystem", "Backups");
	}

	// 2. Try %APPDATA%\ClinicSystem\Backups
	if (process.env["APPDATA"]) {
		return path.join(process.env["APPDATA"], "ClinicSystem", "Backups");
	}

	// 3. Try %USERPROFILE%\AppData\Local\ClinicSystem\Backups
	if (process.env["USERPROFILE"]) {
		return path.join(
			process.env["USERPROFILE"],
			"AppData",
			"Local",
			"ClinicSystem",
			"Backups",
		);
	}

	// 4. Fallback to current directory (might not work in Program Files)
	console.warn(
		"Could not find user data directory, falling back to current directory",
	);
	return path.join(process.cwd(), "backups");
}

export async function createBackup() {
	try {
		const dbPath = process.env["DB_FILE_NAME"] || "clinic.db";
		const backupDir = getUserBackupPath();

		// Ensure backup directory exists
		await ensureDirectoryExists(backupDir);

		// Create backup filename with timestamp
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const backupPath = path.join(backupDir, `clinic-backup-${timestamp}.db`);

		// Check if database file exists
		try {
			const file = Bun.file(dbPath);
			const exists = await file.exists();
			if (!exists) {
				console.log("Database file not found, skipping backup");
				return;
			}
		} catch (_error) {
			console.log("Database file not found, skipping backup");
			return;
		}

		// Copy database file using Bun
		const sourceFile = Bun.file(dbPath);
		const destFile = Bun.file(backupPath);
		await Bun.write(destFile, sourceFile);

		// Clean up old backups (keep last 10)
		await cleanupOldBackups(backupDir);

		console.log(`Database backup created: ${backupPath}`);
		return backupPath;
	} catch (error) {
		console.error("Failed to create backup:", error);
		throw error;
	}
}

async function ensureDirectoryExists(dirPath: string): Promise<void> {
	try {
		// Use Bun.spawn to create directory if it doesn't exist
		const mkdirProcess = Bun.spawn(["mkdir", "-p", dirPath], {
			stdout: "pipe",
			stderr: "pipe",
		});

		const output = await mkdirProcess.exited;
		if (output !== 0) {
			throw new Error("Failed to create directory");
		}
	} catch (_error) {
		// Directory might already exist, ignore error
		console.log(`Directory creation attempted: ${dirPath}`);
	}
}

async function cleanupOldBackups(backupDir: string) {
	try {
		const files = await readdir(backupDir);

		// Parse ls output to get files
		const backupFiles: Array<{
			name: string;
			path: string;
			timestamp: number;
		}> = [];

		for (const file of files) {
			const parts = file.split(/\s+/);
			if (parts.length >= 9) {
				const fileName = parts.slice(8).join(" ");
				if (fileName.startsWith("clinic-backup-") && fileName.endsWith(".db")) {
					const filePath = path.join(backupDir, fileName);
					try {
						const file = Bun.file(filePath);
						const exists = await file.exists();
						if (exists) {
							// Get file modification time using stat command
							const statProcess = Bun.spawn(["stat", "-c", "%Y", filePath], {
								stdout: "pipe",
								stderr: "pipe",
							});
							const timestampStr = await new Response(
								statProcess.stdout,
							).text();
							const timestamp = parseInt(timestampStr.trim()) * 1000; // Convert to milliseconds

							backupFiles.push({
								name: fileName,
								path: filePath,
								timestamp: timestamp || Date.now(),
							});
						}
					} catch (error) {
						console.log(`Could not process file ${fileName}:`, error);
					}
				}
			}
		}

		// Sort by timestamp (newest first)
		backupFiles.sort((a, b) => b.timestamp - a.timestamp);

		// Keep only the last 10 backups
		const filesToDelete = backupFiles.slice(10);

		for (const file of filesToDelete) {
			try {
				const rmProcess = Bun.spawn(["rm", file.path], {
					stdout: "pipe",
					stderr: "pipe",
				});
				await rmProcess.exited;
				console.log(`Deleted old backup: ${file.name}`);
			} catch (error) {
				console.log(`Failed to delete ${file.name}:`, error);
			}
		}
	} catch (error) {
		console.error("Failed to cleanup old backups:", error);
	}
}

// Export for use in server.ts
