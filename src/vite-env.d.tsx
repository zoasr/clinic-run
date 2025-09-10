/// <reference types="vite/client" />

declare namespace Intl {
	type Key =
		| "calendar"
		| "collation"
		| "currency"
		| "numberingSystem"
		| "timeZone"
		| "unit";
	function supportedValuesOf(input: Key): string[];
}

interface ImportMetaEnv {
	readonly VITE_API_URL: string;
	// Add more env variables as needed
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
