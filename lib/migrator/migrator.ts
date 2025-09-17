import { sql } from "drizzle-orm";
import { migrations } from "../db/migrations/migrations.generated.js";

export interface KitConfig {
	out: string;
	schema: string;
}

export interface MigrationConfig {
	migrationsTable?: string;
	migrationsSchema?: string;
}

export interface MigrationMeta {
	sql: string[];
	folderMillis: number;
	hash: string;
	bps: boolean;
}

/**
 * Runs all pending migrations on the database.
 *
 * If a migration has been run before (based on the hash of the migration),
 * it will be skipped. Otherwise, it will be run in the order it was defined.
 *
 * If there are no migrations to run, this function will do nothing.
 *
 * this migrator is stolen directly from the drizzle-orm codebase: https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/libsql/migrator.ts, i <3 open-source
 *
 * @param db The database instance to run migrations on.
 * @param config The configuration object for the migrator.
 * @returns A promise that resolves when all migrations have been run.
 */
export async function migrate(db: any, config: MigrationConfig) {
	const migrationsTable = config.migrationsTable ?? "__drizzle_migrations";

	const migrationTableCreate = sql`
		CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
			id SERIAL PRIMARY KEY,
			hash text NOT NULL,
			created_at numeric
		)
	`;
	await db.session.run(migrationTableCreate);

	const dbMigrations = await db.values(
		sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
	);

	const lastDbMigration = dbMigrations[0] ?? undefined;

	const statementToBatch = [];

	for (const migration of migrations) {
		if (
			!lastDbMigration ||
			Number(lastDbMigration[2])! < migration.folderMillis
		) {
			for (const stmt of migration.sql) {
				statementToBatch.push(db.run(sql.raw(stmt)));
			}

			statementToBatch.push(
				db.run(
					sql`INSERT INTO ${sql.identifier(
						migrationsTable
					)} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
				)
			);
		}
	}

	await db.session.migrate(statementToBatch);
}
