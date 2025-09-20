import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AppRouter } from "./trpc";
import { trpcClient } from "./trpc-client";

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

export const formatCurrency = (amount: number) => {
	return new Intl.NumberFormat("en-us", {
		style: "currency",
		currencyDisplay: "narrowSymbol",
		currency: getSetting("currency") || "usd",
	}).format(amount);
};

type SystemSetting =
	AppRouter["systemSettings"]["getPublic"]["_def"]["$types"]["output"][number];
let settings: SystemSetting[] | null = null;
let settingsPromise: Promise<SystemSetting[]> | null = null;

export const getSettings = async () => {
	if (settings) return settings;
	if (!settingsPromise) {
		settingsPromise = trpcClient.systemSettings.getPublic.query();
	}
	settings = await settingsPromise;
	return settings;
};

const getSetting = (key: string) => {
	if (!settings) {
		console.warn(`Settings not loaded yet for key: ${key}`);
		return undefined;
	}
	return settings.find((setting) => setting.key === key)?.value;
};

const getSettingAsBoolean = async (key: string) => {
	const value = getSetting(key);
	return value === "true";
};
const getSettingAsNumber = async (key: string) => {
	const value = getSetting(key);
	if (value === undefined) return undefined;
	const num = parseInt(value, 10);
	return Number.isNaN(num) ? undefined : num;
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
		themeMode: (getSetting("theme_mode") || "light") as
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

export const getCurrency = async () => {
	return getSetting("currency")?.toLocaleLowerCase() || "usd";
};
