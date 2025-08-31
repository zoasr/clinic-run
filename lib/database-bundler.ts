import { readdir } from "node:fs/promises";
import path from "path";

export class DatabaseBundler {
	private dbPath: string;
	private bundledDbPath: string;
	private isProduction: boolean;

	constructor() {
		this.isProduction = process.env.NODE_ENV === "production";
		this.dbPath = process.env["DB_FILE_NAME"] || "./clinic.db";

		// In production, use a user-writable data location
		if (this.isProduction) {
			this.bundledDbPath = this.getUserDataPath();
		} else {
			this.bundledDbPath = this.dbPath;
		}
	}

	/**
	 * Get a user-writable data directory
	 */
	private getUserDataPath(): string {
		// Try different user-writable locations in order of preference

		// 1. Try %LOCALAPPDATA%\ClinicSystem (most common for user data)
		if (process.env["LOCALAPPDATA"]) {
			return path.join(
				process.env["LOCALAPPDATA"],
				"ClinicSystem",
				"clinic.db"
			);
		}

		// 2. Try %APPDATA%\ClinicSystem
		if (process.env["APPDATA"]) {
			return path.join(
				process.env["APPDATA"],
				"ClinicSystem",
				"clinic.db"
			);
		}

		// 3. Try %USERPROFILE%\AppData\Local\ClinicSystem
		if (process.env["USERPROFILE"]) {
			return path.join(
				process.env["USERPROFILE"],
				"AppData",
				"Local",
				"ClinicSystem",
				"clinic.db"
			);
		}

		// 4. Fallback to current directory (might not work in Program Files)
		console.warn(
			"Could not find user data directory, falling back to current directory"
		);
		return path.join(process.cwd(), "clinic.db");
	}

	/**
	 * Initialize database for the bundled application
	 */
	async initializeBundledDatabase(): Promise<void> {
		try {
			console.log("Initializing bundled database...");

			// Ensure data directory exists
			if (this.isProduction) {
				const dataDir = path.dirname(this.bundledDbPath);
				await this.ensureDirectoryExists(dataDir);
			}

			// Check if database already exists
			const dbExists = await this.databaseExists();

			if (!dbExists) {
				console.log("Database not found, creating new database...");
				await this.createBundledDatabase();
			} else {
				console.log(
					"Existing database found, ensuring it's up to date..."
				);
				await this.ensureDatabaseUpToDate();
			}

			// Update environment to use bundled database
			process.env["DB_FILE_NAME"] = this.bundledDbPath;
			console.log(`Using database at: ${this.bundledDbPath}`);
		} catch (error) {
			console.error("Failed to initialize bundled database:", error);
			throw error;
		}
	}

	/**
	 * Check if database file exists
	 */
	private async databaseExists(): Promise<boolean> {
		try {
			const file = Bun.file(this.bundledDbPath);
			await file.exists();
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Ensure directory exists using Bun APIs
	 */
	private async ensureDirectoryExists(dirPath: string): Promise<void> {
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
		} catch (error) {
			// Directory might already exist, ignore error
			console.log(`Directory creation attempted: ${dirPath}`);
		}
	}

	/**
	 * Create a new bundled database with initial data
	 */
	private async createBundledDatabase(): Promise<void> {
		try {
			// Run database migrations
			console.log("Running database migrations...");
			await this.runMigrations();

			// Seed the database
			console.log("Seeding database...");
			await this.seedDatabase();

			console.log("Bundled database created successfully");
		} catch (error) {
			console.error("Failed to create bundled database:", error);
			throw error;
		}
	}

	/**
	 * Ensure existing database is up to date with latest migrations
	 */
	private async ensureDatabaseUpToDate(): Promise<void> {
		try {
			// Run migrations to ensure schema is up to date
			await this.runMigrations();
			console.log("Database schema is up to date");
		} catch (error) {
			console.error("Failed to update database:", error);
			throw error;
		}
	}

	/**
	 * Run database migrations
	 */
	private async runMigrations(): Promise<void> {
		try {
			const migrateCommand = this.isProduction
				? `"${process.execPath}" run db:migrate`
				: "bun run db:migrate";

			const cwd = this.getAppDirectory();

			// Use Bun.spawn instead of exec
			const subProcess = Bun.spawn(migrateCommand.split(" "), {
				cwd,
				stdout: "pipe",
				stderr: "pipe",
			});

			const [stdout, stderr] = await Promise.all([
				new Response(subProcess.stdout).text(),
				new Response(subProcess.stderr).text(),
			]);

			const exitCode = await subProcess.exited;
			if (exitCode !== 0) {
				console.error("Migration failed:", stderr);
				throw new Error(`Migration failed with exit code ${exitCode}`);
			}

			console.log("Migrations completed:", stdout);
		} catch (error) {
			console.error("Migration failed:", error);
			throw error;
		}
	}

	/**
	 * Seed the database with initial data
	 */
	private async seedDatabase(): Promise<void> {
		try {
			const seedCommand = this.isProduction
				? `"${process.execPath}" run db:seed`
				: "bun run db:seed";

			const cwd = this.getAppDirectory();

			// Use Bun.spawn instead of exec
			const subProcess = Bun.spawn(seedCommand.split(" "), {
				cwd,
				stdout: "pipe",
				stderr: "pipe",
			});

			const [stdout, stderr] = await Promise.all([
				new Response(subProcess.stdout).text(),
				new Response(subProcess.stderr).text(),
			]);

			const exitCode = await subProcess.exited;
			if (exitCode !== 0) {
				console.error("Seeding failed:", stderr);
				throw new Error(`Seeding failed with exit code ${exitCode}`);
			}

			console.log("Seeding completed:", stdout);
		} catch (error) {
			console.error("Seeding failed:", error);
			throw error;
		}
	}

	/**
	 * Get the application directory (where package.json is located)
	 */
	private getAppDirectory(): string {
		if (this.isProduction) {
			// In production, the executable is in the same directory as the bundled files
			return path.dirname(process.execPath || process.cwd());
		} else {
			return process.cwd();
		}
	}

	/**
	 * Create a backup of the current database
	 */
	async createBackup(): Promise<string> {
		try {
			const backupDir = path.join(this.getAppDirectory(), "backups");
			await this.ensureDirectoryExists(backupDir);

			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const backupPath = path.join(
				backupDir,
				`clinic-backup-${timestamp}.db`
			);

			// Use Bun to copy file
			const sourceFile = Bun.file(this.bundledDbPath);
			const destFile = Bun.file(backupPath);
			await Bun.write(destFile, sourceFile);

			// Clean up old backups (keep last 10)
			await this.cleanupOldBackups(backupDir);

			console.log(`Database backup created: ${backupPath}`);
			return backupPath;
		} catch (error) {
			console.error("Failed to create backup:", error);
			throw error;
		}
	}

	/**
	 * Clean up old backup files
	 */
	private async cleanupOldBackups(backupDir: string): Promise<void> {
		try {
			const files = await readdir(backupDir);
			const backupFiles: Array<{
				name: string;
				path: string;
				timestamp: number;
			}> = [];

			for (const file of files) {
				const parts = file.split(/\s+/);
				if (parts.length >= 9) {
					const fileName = parts.slice(8).join(" ");
					if (
						fileName.startsWith("clinic-backup-") &&
						fileName.endsWith(".db")
					) {
						const filePath = path.join(backupDir, fileName);
						try {
							const file = Bun.file(filePath);
							const exists = await file.exists();
							if (exists) {
								// Get file modification time using stat command
								const statProcess = Bun.spawn(
									["stat", "-c", "%Y", filePath],
									{
										stdout: "pipe",
										stderr: "pipe",
									}
								);
								const timestampStr = await new Response(
									statProcess.stdout
								).text();
								const timestamp =
									parseInt(timestampStr.trim()) * 1000; // Convert to milliseconds

								backupFiles.push({
									name: fileName,
									path: filePath,
									timestamp: timestamp || Date.now(),
								});
							}
						} catch (error) {
							console.log(
								`Could not process file ${fileName}:`,
								error
							);
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

	/**
	 * Get database statistics
	 */
	async getDatabaseStats(): Promise<{
		size: number;
		lastModified: Date;
		exists: boolean;
	}> {
		try {
			const file = Bun.file(this.bundledDbPath);
			const exists = await file.exists();

			if (!exists) {
				return {
					size: 0,
					lastModified: new Date(0),
					exists: false,
				};
			}

			// Get file stats using stat command
			const statProcess = Bun.spawn(
				["stat", "-c", "%s %Y", this.bundledDbPath],
				{
					stdout: "pipe",
					stderr: "pipe",
				}
			);

			const statOutput = await new Response(statProcess.stdout).text();
			const exitCode = await statProcess.exited;

			if (exitCode !== 0) {
				throw new Error("Failed to get file stats");
			}

			const [sizeStr, mtimeStr] = statOutput.trim().split(" ");
			const size = parseInt(sizeStr!);
			const lastModified = new Date(parseInt(mtimeStr!) * 1000);

			return {
				size,
				lastModified,
				exists: true,
			};
		} catch {
			return {
				size: 0,
				lastModified: new Date(0),
				exists: false,
			};
		}
	}
}

// Export singleton instance
export const databaseBundler = new DatabaseBundler();
