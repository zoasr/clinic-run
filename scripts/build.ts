import { $ } from "bun";
$.env({ ...process.env });
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
			version: "0.1.0",
			description: "Clinic Management System - Desktop Application",
			copyright: " 2025 zoasr",
			hideConsole: true, // GUI application - no console window
			icon: "./public/clinic.ico", // Path to icon file
		},
	},
});
//  copy .env.production file to dist
await $`cp .env.build ./dist/.env`;

console.log(`\n✅ Build completed successfully!`);
console.log(`📁 Executable: ./dist/clinic-system.exe`);
console.log(
	`📊 Data Location: User AppData directory (no admin rights required)`
);
console.log(`💾 Backups: Automatic daily backups in user directory`);
console.log(`🚀 Ready to run - no installation required!`);
