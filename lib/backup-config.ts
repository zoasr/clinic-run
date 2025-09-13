import { readdir } from "node:fs/promises";
import path from "node:path";

export interface BackupConfig {
	enabled: boolean;
	intervalHours: number;
	maxBackups: number;
	backupDir: string;
	autoBackupOnShutdown: boolean;
	compressBackups: boolean;
}

export const defaultBackupConfig: BackupConfig = {
	enabled: true,
	intervalHours: 24, // Backup every 24 hours
	maxBackups: 10, // Keep last 10 backups
	backupDir: "backups",
	autoBackupOnShutdown: true,
	compressBackups: false, // SQLite files are already compressed
};

export class BackupManager {
	private config: BackupConfig;
	private backupTimer?: ReturnType<typeof setInterval> | undefined;

	constructor(config: Partial<BackupConfig> = {}) {
		this.config = { ...defaultBackupConfig, ...config };
		// Set backup directory to user-writable location if not specified
		if (!this.config.backupDir || this.config.backupDir === "backups") {
			this.config.backupDir = this.getUserBackupPath();
		}
	}

	/**
	 * Get a user-writable backup directory
	 */
	private getUserBackupPath(): string {
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

	/**
	 * Start automatic backup scheduling
	 */
	startAutoBackup(): void {
		if (!this.config.enabled) {
			console.log("Automatic backups are disabled");
			return;
		}

		console.log(
			`Starting automatic backups every ${this.config.intervalHours} hours`,
		);

		// Clear any existing timer
		if (this.backupTimer) {
			clearInterval(this.backupTimer);
		}

		// Schedule backups
		const intervalMs = this.config.intervalHours * 60 * 60 * 1000;
		this.backupTimer = setInterval(async () => {
			try {
				await this.createBackup();
			} catch (error) {
				console.error("Scheduled backup failed:", error);
			}
		}, intervalMs);

		// Create initial backup
		this.createBackup().catch((error) => {
			console.error("Initial backup failed:", error);
		});
	}

	/**
	 * Stop automatic backup scheduling
	 */
	stopAutoBackup(): void {
		if (this.backupTimer) {
			clearInterval(this.backupTimer);
			this.backupTimer = undefined;
			console.log("Automatic backups stopped");
		}
	}

	/**
	 * Create a backup manually
	 */
	async createBackup(): Promise<string | undefined> {
		const { createBackup } = await import("./system-tray.js");
		return await createBackup();
	}

	/**
	 * Get backup statistics
	 */
	async getBackupStats(): Promise<{
		totalBackups: number;
		totalSize: number;
		oldestBackup: Date | null;
		newestBackup: Date | null;
	}> {
		try {
			const path = await import("node:path");

			const backupDir = path.join(process.cwd(), this.config.backupDir);

			// Ensure backup directory exists using Bun.spawn
			try {
				const mkdirProcess = Bun.spawn(["mkdir", "-p", backupDir], {
					stdout: "pipe",
					stderr: "pipe",
				});
				await mkdirProcess.exited;
			} catch (_error) {
				// Directory might already exist
			}

			const files = await readdir(backupDir);
			const backupFiles: Array<{
				name: string;
				size: number;
				modified: Date;
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

						// Get file stats using stat command
						const statProcess = Bun.spawn(["stat", "-c", "%s %Y", filePath], {
							stdout: "pipe",
							stderr: "pipe",
						});

						const statOutput = await new Response(statProcess.stdout).text();
						const statExitCode = await statProcess.exited;

						if (statExitCode === 0) {
							const [sizeStr, mtimeStr] = statOutput.trim().split(" ");
							const size = parseInt(sizeStr ? sizeStr : "0");
							const modified = new Date(
								parseInt(mtimeStr ? mtimeStr : "0") * 1000,
							);

							backupFiles.push({
								name: fileName,
								size,
								modified,
							});
						}
					}
				}
			}

			if (backupFiles.length === 0) {
				return {
					totalBackups: 0,
					totalSize: 0,
					oldestBackup: null,
					newestBackup: null,
				};
			}

			const fileStats = backupFiles;

			const totalSize = fileStats.reduce((sum, file) => sum + file.size, 0);
			const sortedByDate = fileStats.sort(
				(a, b) => b.modified.getTime() - a.modified.getTime(),
			);

			return {
				totalBackups: backupFiles.length,
				totalSize,
				oldestBackup: sortedByDate[sortedByDate.length - 1]?.modified || null,
				newestBackup: sortedByDate[0]?.modified || null,
			};
		} catch (error) {
			console.error("Failed to get backup stats:", error);
			return {
				totalBackups: 0,
				totalSize: 0,
				oldestBackup: null,
				newestBackup: null,
			};
		}
	}

	/**
	 * List all backup files
	 */
	async listBackups(): Promise<
		Array<{
			name: string;
			path: string;
			size: number;
			created: Date;
		}>
	> {
		try {
			const path = await import("node:path");

			const backupDir = path.join(process.cwd(), this.config.backupDir);

			const files = await readdir(backupDir);

			const backups: Array<{
				name: string;
				path: string;
				size: number;
				created: Date;
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

						// Get file stats using stat command
						const statProcess = Bun.spawn(["stat", "-c", "%s %Y", filePath], {
							stdout: "pipe",
							stderr: "pipe",
						});

						const statOutput = await new Response(statProcess.stdout).text();
						const statExitCode = await statProcess.exited;

						if (statExitCode === 0) {
							const [sizeStr, mtimeStr] = statOutput.trim().split(" ");
							const size = parseInt(sizeStr || "0");
							const created = new Date(parseInt(mtimeStr || "0") * 1000);

							backups.push({
								name: fileName,
								path: filePath,
								size,
								created,
							});
						}
					}
				}
			}

			// Sort by creation date (newest first)
			return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
		} catch (error) {
			console.error("Failed to list backups:", error);
			return [];
		}
	}

	/**
	 * Restore from a backup file
	 */
	async restoreFromBackup(backupPath: string): Promise<void> {
		try {
			const path = await import("node:path");

			// Validate backup file exists using Bun
			const backupFile = Bun.file(backupPath);
			const backupExists = await backupFile.exists();
			if (!backupExists) {
				throw new Error(`Backup file not found: ${backupPath}`);
			}

			// Get current database path
			const dbPath = process.env["DB_FILE_NAME"] || "./clinic.db";

			// Create backup of current database before restore
			const currentBackupName = `clinic-pre-restore-${new Date().toISOString().replace(/[:.]/g, "-")}.db`;
			const currentBackupPath = path.join(
				process.cwd(),
				this.config.backupDir,
				currentBackupName,
			);

			try {
				// Check if current database exists
				const currentDbFile = Bun.file(dbPath);
				const currentDbExists = await currentDbFile.exists();

				if (currentDbExists) {
					// Copy current database to backup location using Bun
					const destFile = Bun.file(currentBackupPath);
					await Bun.write(destFile, currentDbFile);
					console.log(`Current database backed up to: ${currentBackupPath}`);
				}
			} catch (_error) {
				console.log("Could not backup current database (might not exist)");
			}

			// Restore from backup using Bun
			const destDbFile = Bun.file(dbPath);
			await Bun.write(destDbFile, backupFile);
			console.log(`Database restored from: ${backupPath}`);
		} catch (error) {
			console.error("Failed to restore from backup:", error);
			throw new Error(`Restore failed: ${error}`);
		}
	}

	/**
	 * Update backup configuration
	 */
	updateConfig(newConfig: Partial<BackupConfig>): void {
		this.config = { ...this.config, ...newConfig };

		// Restart auto backup if it's enabled
		if (this.config.enabled) {
			this.startAutoBackup();
		} else {
			this.stopAutoBackup();
		}
	}

	/**
	 * Get current configuration
	 */
	getConfig(): BackupConfig {
		return { ...this.config };
	}
}

// Export singleton instance
export const backupManager = new BackupManager();
