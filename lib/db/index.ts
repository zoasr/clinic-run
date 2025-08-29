import "dotenv/config";
import * as schema from "./schema/schema";
import * as authSchema from "./schema/auth-schema";

// We support two modes:
// 1) Local file DB: use Bun's built-in SQLite to avoid native @libsql/* binaries in compiled exe
// 2) Remote libsql/Turso: use @libsql/client

const dbUrl = process.env["DB_FILE_NAME"] || "file:./clinic.db";

const filePath = dbUrl.replace(/^file:/, "");
const { Database } = await import("bun:sqlite");
const { drizzle } = await import("drizzle-orm/bun-sqlite");
const sqlite = new Database(filePath);
export const db = drizzle(sqlite, { schema: { ...schema, ...authSchema } });

// let db;
// if (dbUrl.startsWith("file:")) {
// 	// Local SQLite file -> use bun:sqlite
// 	// Use drizzle-orm/bun-sqlite adapter
// 	// Strip the file: prefix for bun:sqlite
// } else {
// 	// Remote libsql/Turso -> use @libsql/client
// 	const { createClient } = await import("@libsql/client");
// 	const { drizzle } = await import("drizzle-orm/libsql");
// 	const client = createClient({
// 		url: dbUrl,
// 		authToken: process.env.BETTER_AUTH_SECRET,
// 	});
// 	db = drizzle(client, { schema: { ...schema, ...authSchema } });
// }

// export { db };
