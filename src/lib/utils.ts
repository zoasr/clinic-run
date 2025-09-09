import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { trpcClient } from "./trpc-client";
import { type AppRouter } from "./trpc";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const formatAge = (date: Date) => {
	const now = new Date();
	const ageInYears = now.getFullYear() - date.getFullYear();
	const month =
		now.getFullYear() === date.getFullYear()
			? now.getMonth() - date.getMonth()
			: 11;
	const days =
		now.getFullYear() === date.getFullYear() &&
		now.getMonth() === date.getMonth()
			? now.getDate() - date.getDate()
			: 30 - date.getDate() + now.getDate();

	if (ageInYears === 0 && month === 0 && days === 0) return "Newborn";
	if (ageInYears === 0 && month === 0) return `${days} days old`;
	if (ageInYears === 0) return `${month} months old`;
	return `${ageInYears} years old`;
};

type SystemSetting =
	AppRouter["systemSettings"]["getPublic"]["_def"]["$types"]["output"][number];
let settings: SystemSetting[] | null = null;

const setSettings = async () => {
	settings = await trpcClient.systemSettings.getPublic.query();
};
setSettings();

const getSetting = async (key: string) => {
	// const settings = await trpcClient.systemSettings.getPublic.query();
	return settings?.find((s) => s.key === key)?.value;
};

const getSettingAsBoolean = async (key: string) => {
	const value = await getSetting(key);
	return value === "true";
};
const getSettingAsNumber = async (key: string) => {
	const value = await getSetting(key);
	if (value === undefined) return undefined;
	const num = parseInt(value, 10);
	return isNaN(num) ? undefined : num;
};

export const getClinicInfo = async () => {
	return {
		name: getSetting("clinic_name") || "Clinic Management System",
		address: getSetting("clinic_address") || "",
		phone: getSetting("clinic_phone") || "",
		email: getSetting("clinic_email") || "",
		workingHours: getSetting("working_hours") || "9:00 AM - 5:00 PM",
	};
};

export const getAppearanceSettings = async () => {
	return {
		themeMode: ((await getSetting("theme_mode")) || "light") as
			| "light"
			| "dark"
			| "system",
		sidebarCollapsed: await getSettingAsBoolean("sidebar_collapsed"),
		compactMode: await getSettingAsBoolean("compact_mode"),
	};
};

export const getSessionTimeout = async () => {
	const sessionTimeout = await getSettingAsNumber("session_timeout");
	return sessionTimeout || 30; // Default to 30 minutes
};
