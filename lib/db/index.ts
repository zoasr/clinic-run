import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema/schema";
import * as authSchema from "./schema/auth-schema";
// import { eq } from "drizzle-orm";
import { createClient } from "@libsql/client";
// import { auth } from "../auth";

const client = createClient({
	url: process.env.DATABASE_URL || "file:./clinic.db",
	authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema: { ...schema, ...authSchema } });
