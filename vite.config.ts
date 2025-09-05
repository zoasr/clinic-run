import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
	plugins: [
		tanstackRouter({
			autoCodeSplitting: true,
		}),
		react({
			babel: {
				plugins: ["babel-plugin-react-compiler"],
			},
		}),
		tailwindcss(),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@/components": path.resolve(__dirname, "./src/components"),
			"@/lib": path.resolve(__dirname, "./src/lib"),
			"@/hooks": path.resolve(__dirname, "./src/hooks"),
		},
	},
	server: {
		port: +(process.env.PORT || 3030),
		proxy: {
			"/api": {
				target: `http://localhost:${process.env.BACKEND_PORT || 3031}`,
				changeOrigin: true,
			},
		},
	},
	esbuild: {
		drop:
			process.env.NODE_ENV === "development" ||
			process.env.NODE_ENV === "test"
				? []
				: ["console", "debugger"],
	},
	build: {
		outDir: "dist",
		sourcemap: false,
	},
});
