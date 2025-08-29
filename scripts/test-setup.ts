#!/usr/bin/env bun
import { $ } from "bun";
$.env({ ...process.env });

console.log("🧪 Setting up test environment for Clinic Run...");

// Check if required dependencies are installed
async function checkDependencies() {
	console.log("📦 Checking dependencies...");

	try {
		// Check if faker is installed
		await $`bun add @faker-js/faker --dev`.quiet();
		console.log("✅ Faker.js installed");
	} catch (error) {
		console.log("ℹ️  Faker.js already installed or failed to install");
	}

	try {
		// Check if drizzle-kit is available
		await $`bun x drizzle-kit --version`.quiet();
		console.log("✅ Drizzle Kit available");
	} catch (error) {
		console.log(
			"❌ Drizzle Kit not found. Please install it globally or ensure it's in your dependencies"
		);
		process.exit(1);
	}
}

// Setup test database
async function setupTestDatabase() {
	console.log("🗄️  Setting up test database...");

	try {
		// Remove existing test database if it exists
		await $`rm -f clinic-test.db`.quiet();
		console.log("🗑️  Removed existing test database");

		// Generate migrations for test database
		console.log("🔄 Generating test database schema...");
		await $`NODE_ENV=test bun run test:db:generate`;

		// Run migrations for test database
		console.log("📋 Running test database migrations...");
		await $`NODE_ENV=test bun run test:db:migrate`;

		console.log("✅ Test database setup completed");
	} catch (error) {
		console.error("❌ Failed to setup test database:", error);
		process.exit(1);
	}
}

// Seed performance data
async function seedPerformanceData() {
	console.log("🌱 Seeding performance data...");

	try {
		console.log(
			"⏳ This may take several minutes depending on your system..."
		);
		const startTime = Date.now();

		await $`NODE_ENV=test bun run test:db:seed`;

		const endTime = Date.now();
		const duration = (endTime - startTime) / 1000;
		console.log(
			`✅ Performance data seeded in ${duration.toFixed(2)} seconds`
		);
	} catch (error) {
		console.error("❌ Failed to seed performance data:", error);
		process.exit(1);
	}
}

// Display database statistics
async function displayStats() {
	console.log("📊 Test Database Statistics:");

	try {
		// Use sqlite3 to query database stats
		const result =
			await $`sqlite3 clinic-test.db -header -column "SELECT name FROM sqlite_master WHERE type='table';"`.quiet();
		const tables = result.stdout
			.toString()
			.trim()
			.split("\n")
			.filter((line) => line && !line.includes("name"));

		console.log(`📋 Tables created: ${tables.length}`);
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
		console.log("\n📈 Record counts:");

		for (const table of mainTables) {
			try {
				const countResult =
					await $`sqlite3 clinic-test.db "SELECT COUNT(*) FROM ${table};"`.quiet();
				const count = countResult.stdout.toString().trim();
				console.log(
					`   - ${table}: ${parseInt(count).toLocaleString()} records`
				);
			} catch (error) {
				console.log(`   - ${table}: Error getting count`);
			}
		}

		// Get database file size
		const sizeResult =
			await $`ls -lh clinic-test.db | awk '{print $5}'`.quiet();
		const size = sizeResult.stdout.toString().trim();
		console.log(`\n💾 Database file size: ${size}`);
	} catch (error) {
		console.log("ℹ️  Could not retrieve detailed statistics");
	}
}

// Main setup function
async function main() {
	console.log("🚀 Starting Clinic Run test environment setup...\n");

	try {
		await checkDependencies();
		console.log("");

		await setupTestDatabase();
		console.log("");

		await seedPerformanceData();
		console.log("");

		await displayStats();
		console.log("");

		console.log("🎉 Test environment setup completed successfully!");
		console.log("\n📝 Available test commands:");
		console.log(
			"   bun run test:db:reset    - Reset and reseed test database"
		);
		console.log("   bun run test:perf        - Run performance test setup");
		console.log(
			"   bun run test:db:seed     - Reseed performance data only"
		);
		console.log("\n🔍 Test database location: ./clinic-test.db");
	} catch (error) {
		console.error("❌ Test environment setup failed:", error);
		process.exit(1);
	}
}

// Run the setup
main();
