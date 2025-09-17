import * as authSchema from "./schema/auth-schema";
import * as schema from "./schema/schema";

// We support two modes:
// 1) Local file DB: use Bun's built-in SQLite to avoid native @libsql/* binaries in compiled exe
// 2) Remote libsql/Turso: use @libsql/client

const dbUrl = process.env["DB_FILE_NAME"] || "file:./clinic.db";

// const { createClient } = await import("@libsql/client/web");
// const { drizzle } = await import("drizzle-orm/libsql");
// const client = createClient({
// 	url: dbUrl,
// 	authToken: process.env["AUTH_TOKEN"],
// });
// export const db = drizzle(client, { schema: { ...schema, ...authSchema } });

// Remote libsql/Turso -> use @libsql/client
const { createClient } = await import("@libsql/client/web");
const { drizzle } = await import("drizzle-orm/libsql");
const client = createClient({
	url: dbUrl,
	authToken:
		process.env["BETTER_AUTH_SECRET"] || process.env["AUTH_TOKEN"] || "",
});
const db = drizzle(client, { schema: { ...schema, ...authSchema } });

export { db };
