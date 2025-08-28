import type { Config } from "drizzle-kit";

if (process.env.DB_FILE_NAME) {
	process.env.DB_FILE_NAME = process.env.DB_FILE_NAME.replace("file:", "");
}
export default {
	schema: "./lib/db/schema/*",
	out: "./lib/db/migrations",
	dialect: "sqlite",
	dbCredentials: {
		url: process.env.DB_FILE_NAME || "./clinic.db",
	},
} satisfies Config;
