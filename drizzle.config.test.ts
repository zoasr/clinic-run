import type { Config } from "drizzle-kit";

export default {
	schema: "./lib/db/schema/*",
	out: "./lib/db/migrations",
	dialect: "sqlite",
	dbCredentials: {
		url: "./clinic-test.db",
	},
} satisfies Config;