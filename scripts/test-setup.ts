#!/usr/bin/env bun
import { $ } from "bun";
$.env({ ...process.env });

const colors = {
	reset: "\x1b[0m",
	green: "\x1b[32m",
	blue: "\x1b[34m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
	cyan: "\x1b[36m",
};

function log(message: string, color: string = colors.reset) {
	console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
	log(`[SUCCESS] ${message}`, colors.green);
}

function info(message: string) {
	log(`[INFO] ${message}`, colors.blue);
}

function warn(message: string) {
	log(`[WARN] ${message}`, colors.yellow);
}

function error(message: string) {
	log(`[ERROR] ${message}`, colors.red);
}

info("Setting up test environment for Clinic Run...");

// Check if required dependencies are installed
async function checkDependencies() {
	info("Checking dependencies...");

	try {
		// Check if faker is installed
		await $`bun add @faker-js/faker --dev`.quiet();
		success("Faker.js installed");
	} catch (err) {
		warn("Faker.js already installed or failed to install");
	}

	try {
		// Check if drizzle-kit is available
		await $`bun x drizzle-kit --version`.quiet();
		success("Drizzle Kit available");
	} catch (err) {
		error(
			"Drizzle Kit not found. Please install it globally or ensure it's in your dependencies"
		);
		process.exit(1);
	}
}

// Setup test database
async function setupTestDatabase() {
	info("Setting up test database...");

	try {
		// Remove existing test database if it exists
		await $`rm -f clinic-test.db`.quiet();
		success("Removed existing test database");

		// Generate migrations for test database
		info("Generating test database schema...");
		await $`NODE_ENV=test bun run test:db:generate`;

		// Run migrations for test database
		info("Running test database migrations...");
		await $`NODE_ENV=test bun run test:db:migrate`;

		success("Test database setup completed");
	} catch (err) {
		error(`Failed to setup test database: ${err}`);
		process.exit(1);
	}
}

// Seed performance data
async function seedPerformanceData() {
	info("Seeding performance data...");

	try {
		warn("This may take several minutes depending on your system...");
		const startTime = Date.now();

		await $`NODE_ENV=test bun run test:db:seed`;

		const endTime = Date.now();
		const duration = (endTime - startTime) / 1000;
		success(
			`Performance data seeded in ${duration.toFixed(2)} seconds`
		);
	} catch (err) {
		error(`Failed to seed performance data: ${err}`);
		process.exit(1);
	}
}

// Display database statistics
async function displayStats() {
	info("Test Database Statistics:");

	try {
		// Use sqlite3 to query database stats
		const result =
			await $`sqlite3 clinic-test.db -header -column "SELECT name FROM sqlite_master WHERE type='table';"`.quiet();
		const tables = result.stdout
			.toString()
			.trim()
			.split("\n")
			.filter((line) => line && !line.includes("name"));

		info(`Tables created: ${tables.length}`);
		tables.forEach((table) => console.log(`   - ${table}`));

		// Get record counts for main tables
		const mainTables = [
			"patients",
			"appointments",
			"medical_records",
			"prescriptions",
			"invoices",
			"lab_tests",
		];
		info("Record counts:");

		for (const table of mainTables) {
			try {
				const countResult =
					await $`sqlite3 clinic-test.db "SELECT COUNT(*) FROM ${table};"`.quiet();
				const count = countResult.stdout.toString().trim();
				console.log(
					`   - ${table}: ${parseInt(count).toLocaleString()} records`
				);
			} catch (err) {
				console.log(`   - ${table}: Error getting count`);
			}
		}

		// Get database file size
		const sizeResult =
			await $`ls -lh clinic-test.db | awk '{print $5}'`.quiet();
		const size = sizeResult.stdout.toString().trim();
		info(`Database file size: ${size}`);
	} catch (err) {
		warn("Could not retrieve detailed statistics");
	}
}

// Main setup function
async function main() {
	info("Starting Clinic Run test environment setup...\n");

	try {
		await checkDependencies();
		console.log("");

		await setupTestDatabase();
		console.log("");

		await seedPerformanceData();
		console.log("");

		await displayStats();
		console.log("");

		success("Test environment setup completed successfully!");
		info("Available test commands:");
		console.log(
			"   bun run test:db:reset    - Reset and reseed test database"
		);
		console.log("   bun run test:perf        - Run performance test setup");
		console.log(
			"   bun run test:db:seed     - Reseed performance data only"
		);
		info("Test database location: ./clinic-test.db");
	} catch (err) {
		error(`Test environment setup failed: ${err}`);
		process.exit(1);
	}
}

// Run the setup
main();
