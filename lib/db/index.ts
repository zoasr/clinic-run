import * as authSchema from "./schema/auth-schema";
import * as schema from "./schema/schema";

// We support two modes:
// 1) Local file DB: use Bun's built-in SQLite to avoid native @libsql/* binaries in compiled exe
// 2) Remote libsql/Turso: use @libsql/client

const dbUrl = process.env["DB_FILE_NAME"] || "file:./clinic.db";

// Remote libsql/Turso -> use @libsql/client
const { createClient } = await import("@libsql/client");
const { drizzle } = await import("drizzle-orm/libsql");
const client = createClient({
	url: dbUrl,
	authToken:
		process.env["TURSO_AUTH_TOKEN"] || process.env["BETTER_AUTH_SECRET"] || "",
});
const db = drizzle(client, { schema: { ...schema, ...authSchema } });

export { db };
