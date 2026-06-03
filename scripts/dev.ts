/*
  Bun dev orchestrator: runs Vite frontend and Bun backend together.
  - Spawns `bun run --cwd=./lib run dev`
  - Spawns `vite` on port 3030
  - Spawns `bun run --watch server.ts` on port 3031
  - Pipes output with prefixes
  - Handles graceful shutdown on SIGINT/SIGTERM
*/

const processes: { name: string; proc: Bun.Subprocess }[] = [];

const colors = {
	reset: "\x1b[0m",
	cyan: "\x1b[36m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	red: "\x1b[31m",
};

const processColors: Record<string, string> = {
	trpc: colors.cyan,
	vite: colors.green,
	server: colors.yellow,
	orchestrator: colors.blue,
};

function colorLog(name: string, message: string) {
	const color = processColors[name] || colors.reset;
	console.log(`${color}[${name}]${colors.reset} ${message}`);
}

function prefixStream(stream: ReadableStream<Uint8Array> | null, name: string) {
	if (!stream) return;
	(async () => {
		const reader = stream.getReader();
		const decoder = new TextDecoder();
		try {
			while (true) {
				const { value, done } = await reader.read();
				if (done) break;
				const text = decoder.decode(value, { stream: true });
				for (const line of text.split(/\r?\n/)) {
					if (line.length === 0) continue;
					colorLog(name, line);
				}
			}
		} catch (_) {
			// ignore
		} finally {
			reader.releaseLock();
		}
	})();
}

async function start(name: string, cmd: string[], cwd?: string) {
	const proc = Bun.spawn(cmd, {
		cwd,
		stdout: "pipe",
		stderr: "pipe",
		env: {
			...process.env,
			NODE_ENV: process.env.NODE_ENV || "development",
			PORT:
				name === "server"
					? process.env.BACKEND_PORT || "3031"
					: process.env.PORT,
			FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3030",
		},
	});
	processes.push({ name, proc });
	prefixStream(proc.stdout, name);
	prefixStream(proc.stderr, name);

	proc.exited.then((code) => {
		colorLog(name, `exited with code ${code}`);
		// If one dies, stop all
		shutdown();
	});
}

async function shutdown() {
	for (const { proc, name } of processes) {
		try {
			proc.kill();
			colorLog("orchestrator", `sent kill to ${name}`);
		} catch (_) {}
	}
	// Give some time for processes to exit
	setTimeout(() => process.exit(0), 200);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

colorLog("orchestrator", "starting Vite and server...");

await Promise.all([
	start("trpc", ["bun", "--cwd=./lib", "run", "dev"], process.cwd()),
	start("vite", ["bun", "vite"], process.cwd()),
	start("server", ["bun", "run", "--watch", "lib/server.ts"], process.cwd()),
]);

// Keep process alive
await new Promise(() => {});
