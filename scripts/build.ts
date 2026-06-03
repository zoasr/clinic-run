import { platform } from "node:os";
import { $, type BuildConfig } from "bun";
import { existsSync } from "node:fs";

$.env({ ...process.env });
// Ensure production mode across child processes
process.env.NODE_ENV = "production";

const colors = {
	reset: "\x1b[0m",
	green: "\x1b[32m",
	blue: "\x1b[34m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
	cyan: "\x1b[36m",
};

function log(message: string, color: string = colors.reset) {
	console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
	log(`[SUCCESS] ${message}`, colors.green);
}

function info(message: string) {
	log(`[INFO] ${message}`, colors.blue);
}

function warn(message: string) {
	log(`[WARN] ${message}`, colors.yellow);
}

function error(message: string) {
	log(`[ERROR] ${message}`, colors.red);
}

const supportedPlatforms = ["win32", "darwin", "linux"];

const currentPlatform = platform();
if (!supportedPlatforms.includes(currentPlatform)) {
	throw new Error(`Unsupported platform: ${currentPlatform}`);
}
const isWindows = currentPlatform === "win32";
const isLinux = currentPlatform === "linux";
const isMacOS = currentPlatform === "darwin";

info("Building tRPC...");
await $`bun --cwd=./lib run build`;

info("Building client...");
await $`bun vite build`;

info("Running database migrations & seeds...");
await $`bun run db:migrate`;
await $`bun run db:seed`;

info(`Building server executable for ${currentPlatform}...`);

let target: Bun.Build.Target = "bun-windows-x64";
if (isWindows) {
	target = "bun-windows-x64";
} else if (isLinux) {
	target = "bun-linux-x64";
} else if (isMacOS) {
	target = "bun-darwin-x64";
}
// Embed systray native binary into the executable via define
const trayBinName = isWindows
	? "tray_windows_release.exe"
	: isLinux
		? "tray_linux_release"
		: "tray_darwin_release";
const trayBinPath = `./node_modules/systray/traybin/${trayBinName}`;
const define: Record<string, string> = {};
if (existsSync(trayBinPath)) {
	const trayBuffer = await Bun.file(trayBinPath).arrayBuffer();
	const trayBinBase64 = Buffer.from(trayBuffer).toString("base64");
	define["process.env.__TRAY_BIN_DATA__"] = JSON.stringify(trayBinBase64);
	define["process.env.__TRAY_BIN_NAME__"] = JSON.stringify(trayBinName);
	success(`Tray binary embedded: ${trayBinName} (${trayBuffer.byteLength} bytes)`);
} else {
	warn(`Tray binary not found at ${trayBinPath}, systray will be unavailable in compiled build`);
}

const buildConfig: BuildConfig = {
	entrypoints: ["./lib/server.ts"],
	outdir: "./dist",
	compile: {
		target,
		outfile: isWindows ? "clinic-run.exe" : "clinic-run",
	},
	define,
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

success("Build completed successfully!");
info(`Executable: ./dist/${isWindows ? "clinic-run.exe" : "clinic-run"}`);
info(`Platform: ${currentPlatform}`);

if (isWindows) {
	info("Data Location: User AppData directory (no admin rights required)");
} else {
	info("Data Location: ~/.local/share/clinic-run (user directory)");
}

info("Backups: Automatic daily backups in user directory");
success("Ready to run - no installation required!");
