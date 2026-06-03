import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function getIconBase64(): string {
	try {
		// Try multiple possible icon locations
		const possiblePaths = [
			join(process.cwd(), "clinic.ico"), // Executable directory
			join(__dirname, "../public/clinic.ico"),
			join(__dirname, "../../public/clinic.ico"),
			join(process.cwd(), "public/clinic.ico"),
			join(process.cwd(), "dist/public/clinic.ico"),
		];

		for (const iconPath of possiblePaths) {
			try {
				const iconBuffer = readFileSync(iconPath);
				return iconBuffer.toString("base64");
			} catch {
				// Try next path
			}
		}

		console.error("Icon file not found in any expected location");
		// Return empty string - systray will handle missing icon
		return "";
	} catch (error) {
		console.error("Failed to read icon file:", error);
		return "";
	}
}
