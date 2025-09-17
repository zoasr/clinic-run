/* This file is only intended to bundle the drizzle migrations into a single javascript oject to avoid using the `'node:fs'` on the cloudflare worker runtime as it is not supported */
// thismigrations reader is stolen directly from the drizzle-orm codebase: https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/libsql/migrator.ts, i <3 open-source
import { writeFileSync } from "fs";
import crypto from "node:crypto";
import fs from "node:fs";
import { join } from "path";

export interface KitConfig {
	out: string;
	schema: string;
}

export interface MigrationConfig {
	migrationsFolder: string;
	migrationsTable?: string;
	migrationsSchema?: string;
}

export interface MigrationMeta {
	sql: string[];
	folderMillis: number;
	hash: string;
	bps: boolean;
}

const migrationsDir = join(__dirname, "../lib/db/migrations");

/**
 *thismigrations reader is stolen directly from the drizzle-orm codebase: https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/migrator.ts#L22
 * @param {MigrationConfig} config - The configuration for the migration reader
 * @returns {MigrationMeta[]} - An array of migration queries
 */
export function readMigrationFiles(config: MigrationConfig): MigrationMeta[] {
	const migrationFolderTo = config.migrationsFolder;

	const migrationQueries: MigrationMeta[] = [];

	const journalPath = `${migrationFolderTo}/meta/_journal.json`;
	if (!fs.existsSync(journalPath)) {
		throw new Error(`Can't find meta/_journal.json file`);
	}

	const journalAsString = fs
		.readFileSync(`${migrationFolderTo}/meta/_journal.json`)
		.toString();

	const journal = JSON.parse(journalAsString) as {
		entries: {
			idx: number;
			when: number;
			tag: string;
			breakpoints: boolean;
		}[];
	};

	for (const journalEntry of journal.entries) {
		const migrationPath = `${migrationFolderTo}/${journalEntry.tag}.sql`;

		try {
			const query = fs
				.readFileSync(`${migrationFolderTo}/${journalEntry.tag}.sql`)
				.toString();

			const result = query.split("--> statement-breakpoint").map((it) => {
				return it;
			});

			migrationQueries.push({
				sql: result,
				bps: journalEntry.breakpoints,
				folderMillis: journalEntry.when,
				hash: crypto.createHash("sha256").update(query).digest("hex"),
			});
		} catch {
			throw new Error(
				`No file ${migrationPath} found in ${migrationFolderTo} folder`
			);
		}
	}

	console.log(JSON.stringify(migrationQueries, null, 2));

	return migrationQueries;
}

const output = `
// This file is auto-generated. Do not edit by hand.
export const migrations = ${JSON.stringify(readMigrationFiles({ migrationsFolder: migrationsDir }), null, 2)};
`;

writeFileSync(
	join(__dirname, "../lib/db/migrations/migrations.generated.ts"),
	output
);
console.log("✅ migrations.generated.ts created");
