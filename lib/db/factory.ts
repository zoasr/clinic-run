import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as authSchema from "./schema/auth-schema";
import * as schema from "./schema/schema";

export async function createDbForUrl(url: string, authToken?: string) {
	const client = createClient({
		url,
		authToken: authToken || "",
	});
	return drizzle(client, { schema: { ...schema, ...authSchema } });
}
