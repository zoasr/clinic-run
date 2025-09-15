import { platform } from "node:os";
import { $, type BuildConfig } from "bun";

$.env({ ...process.env });
// Ensure production mode across child processes
process.env.NODE_ENV = "production";

const supportedPlatforms = ["win32", "darwin", "linux"];

const currentPlatform = platform();
if (!supportedPlatforms.includes(currentPlatform)) {
	throw new Error(`Unsupported platform: ${currentPlatform}`);
}
const isWindows = currentPlatform === "win32";
const isLinux = currentPlatform === "linux";
const isMacOS = currentPlatform === "darwin";

console.log(`Building tRPC...`);
await $`bun --cwd=./lib run build`;

console.log(`Building client...`);
await $`bun vite build`;

console.log(`Running database migrations & seeds...`);
await $`bun run db:migrate`;
await $`bun run db:seed`;

console.log(`Building server executable for ${currentPlatform}...`);

let target: Bun.Build.Target = "bun-windows-x64";
if (isWindows) {
	target = "bun-windows-x64";
} else if (isLinux) {
	target = "bun-linux-x64";
} else if (isMacOS) {
	target = "bun-darwin-x64";
}
const buildConfig: BuildConfig = {
	entrypoints: ["./lib/server.ts"],
	outdir: "./dist",
	compile: {
		target,
		outfile: isWindows ? "clinic-run.exe" : "clinic-run",
	},
};

if (isWindows) {
	// @ts-expect-error
	buildConfig.compile.windows = {
		title: "Clinic Run",
		publisher: "zoasr",
		version: "0.1.0",
		description: "Clinic Run",
		copyright: " 2025 zoasr",
		hideConsole: false,
		icon: "./public/clinic.ico",
	};
}
await Bun.build(buildConfig);

// Make executable on Unix-like systems
if (!isWindows) {
	await $`chmod +x ./dist/clinic-run`;
}

await $`cp .env.build ./dist/.env`;

console.log(`\n✅ Build completed successfully!`);
console.log(
	`📁 Executable: ./dist/${isWindows ? "clinic-run.exe" : "clinic-run"}`
);
console.log(`📊 Platform: ${currentPlatform}`);

if (isWindows) {
	console.log(
		`📊 Data Location: User AppData directory (no admin rights required)`
	);
} else {
	console.log(`📊 Data Location: ~/.local/share/clinic-run (user directory)`);
}

console.log(`💾 Backups: Automatic daily backups in user directory`);
console.log(`🚀 Ready to run - no installation required!`);
