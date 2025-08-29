import { $ } from "bun";

// Ensure production mode across child processes in a Windows-friendly way
process.env.NODE_ENV = "production";

console.log(`Building tRPC...`);
await $`bun --cwd=./lib run build`;

console.log(`Building client...`);
await $`bun vite build`;

console.log(`Running database migrations & seeds...`);
await $`bun run db:migrate`;
await $`bun run db:seed`;

console.log(`Building server executable...`);
await Bun.build({
	entrypoints: ["./server.ts"],
	external: ["better-sqlite3"],
	outdir: "./dist",
	// @ts-ignore
	compile: {
		target: "bun-windows-x64",
		outfile: "clinic-system.exe",
		windows: {
			title: "Clinic System",
			publisher: "zoasr",
			version: "0.0.1",
			description: "Clinic System built with Bun",
			copyright: " 2025 zoasr",
			hideConsole: false, // Set to true for GUI applications
			icon: "./public/clinic.ico", // Path to icon file
		},
	},
});

console.log(`Build complete!`);
