/*
  Prune Turso databases created for live demo (names like demo-xxxx).
  Uses Bun runtime fetch. Configure via env:
  - TURSO_ORG
  - TURSO_AUTH_TOKEN
  - DEMO_SESSION_TTL_MINUTES (default 30)
*/

type Database = { Name: string; DbId?: string; Hostname?: string };

const org = process.env["TURSO_ORG"] || "";
const token = process.env["TURSO_AUTH_TOKEN"] || "";
const ttlMinutes = Number(process.env["DEMO_SESSION_TTL_MINUTES"] || "30");

if (!org || !token) {
	console.error("Missing TURSO_ORG or TURSO_AUTH_TOKEN");
	process.exit(1);
}

function getCreationTime(dbName: string): number | null {
	// demo-{random}-{timestamp in base36}
	const parts = dbName.split('-');
	if (parts.length !== 3 || parts[0] !== 'demo') return null;
	const timestampStr = parts[2];
	try {
		return parseInt(timestampStr || "0", 36);
	} catch {
		return null;
	}
}

function isExpired(dbName: string, now: number): boolean {
	const created = getCreationTime(dbName);
	if (!created) return true; // if can't parse, err on cleanup
	const ageMs = now - created;
	return ageMs > ttlMinutes * 60 * 1000;
}

async function listDatabases(): Promise<Database[]> {
	const res = await fetch(
		`https://api.turso.tech/v1/organizations/${org}/databases`,
		{
			headers: { Authorization: `Bearer ${token}` },
		}
	);
	if (!res.ok) throw new Error(`List databases failed: ${res.status}`);
	const data = (await res.json()) as { databases: Database[] };
	return data.databases || [];
}

async function deleteDatabase(name: string): Promise<void> {
	const res = await fetch(
		`https://api.turso.tech/v1/organizations/${org}/databases/${name}`,
		{
			method: "DELETE",
			headers: { Authorization: `Bearer ${token}` },
		}
	);
	if (!res.ok) throw new Error(`Delete ${name} failed: ${res.status}`);
}

async function main() {
	const now = Date.now();
	const databases = await listDatabases();
	const candidates = databases.filter((d) => d.Name.startsWith("demo-"));
	let removed = 0;
	for (const d of candidates) {
		if (isExpired(d.Name, now)) {
			try {
				await deleteDatabase(d.Name);
				removed++;
				console.log(`Deleted database ${d.Name}`);
			} catch (err) {
				console.warn(`Failed deleting ${d.Name}:`, err);
			}
		}
	}
	console.log(`Cleanup complete. Removed ${removed} databases.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
