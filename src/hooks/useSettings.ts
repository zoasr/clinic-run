import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import z from "zod";
import { trpc } from "@/lib/trpc-client";

interface SystemSetting {
	key: string;
	value: string;
	description: string | null;
	category: string;
	isPublic: boolean;
}

interface UseSettingsReturn {
	settings: SystemSetting[] | undefined;
	getSetting: (key: string) => string | undefined;
	getSettingAsNumber: (key: string) => number | undefined;
	getSettingAsBoolean: (key: string) => boolean;
	isLoading: boolean;
	error: any;
	refetch: () => void;
}

export const systemSettingsSchema = z.object({
	clinic_name: z.string().min(1, "Clinic name is required"),
	clinic_address: z.string().optional(),
	clinic_phone: z.string().optional(),
	clinic_email: z.string().optional(),
	currency: z
		.string()
		.refine(
			(arg) => Intl.supportedValuesOf("currency").includes(arg),
			"Invalid currency code",
		),
	working_hours: z.string().optional(),
	session_timeout: z
		.number()
		.min(1, "Session timeout must be at least 1 minute"),
	password_min_length: z
		.number()
		.min(6, "Password must be at least 6 characters"),
	theme_mode: z.enum(["light", "dark", "system"]),
	sidebar_collapsed: z.boolean(),
	compact_mode: z.boolean(),
	// Inventory alert settings
	low_stock_alert_threshold: z
		.number()
		.min(0, "Threshold must be non-negative"),
	expiry_alert_days: z.number().min(1, "Must be at least 1 day"),
	email_notifications: z.boolean(),
	sms_notifications: z.boolean(),
});

/**
 * Custom hook to access system settings throughout the application
 * @param options - Query options for the settings fetch
 * @returns Object containing settings array and helper functions
 */
function useSettings(options?: {
	includePrivate?: boolean;
}): UseSettingsReturn {
	const _queryClient = useQueryClient();
	const includePrivate = options?.includePrivate ?? false;

	const queryOptions = includePrivate
		? trpc.systemSettings.getAll.queryOptions()
		: trpc.systemSettings.getPublic.queryOptions();

	const {
		data: settings,
		isLoading,
		error,
		refetch,
		// @ts-expect-error
	} = useQuery(queryOptions);

	const getSetting = useCallback(
		(key: string): string | undefined => {
			return settings?.find((s) => s.key === key)?.value;
		},
		[settings],
	);

	const getSettingAsNumber = useCallback(
		(key: string): number | undefined => {
			const value = getSetting(key);
			if (value === undefined) return undefined;
			const num = parseInt(value, 10);
			return Number.isNaN(num) ? undefined : num;
		},
		[getSetting],
	);

	const getSettingAsBoolean = useCallback(
		(key: string): boolean => {
			const value = getSetting(key);
			return value === "true";
		},
		[getSetting],
	);

	return {
		// @ts-expect-error
		settings,
		getSetting,
		getSettingAsNumber,
		getSettingAsBoolean,
		isLoading,
		error,
		refetch,
	};
}

export function useSessionTimeout(): number {
	const { settings } = useSettings({ includePrivate: true });
	const sessionTimeout = useMemo(() => {
		const getSetting = (key: string): string | undefined => {
			return settings?.find((s) => s.key === key)?.value;
		};

		const getSettingAsNumber = (key: string): number | undefined => {
			const value = getSetting(key);
			if (value === undefined) return undefined;
			const num = parseInt(value, 10);
			return Number.isNaN(num) ? undefined : num;
		};

		return getSettingAsNumber("session_timeout") || 30;
	}, [settings]);
	return sessionTimeout;
}

export function useClinicInfo() {
	const { settings } = useSettings();
	const info = useMemo(() => {
		const getSetting = (key: string): string | undefined => {
			return settings?.find((s) => s.key === key)?.value;
		};

		return {
			name: getSetting("clinic_name") || "Clinic Management System",
			address: getSetting("clinic_address") || "",
			phone: getSetting("clinic_phone") || "",
			email: getSetting("clinic_email") || "",
			workingHours: getSetting("working_hours") || "9:00 AM - 5:00 PM",
		};
	}, [settings]);
	return info;
}

export function useAppearanceSettings() {
	const { settings } = useSettings();
	const obj = useMemo(() => {
		const getSetting = (key: string): string | undefined => {
			return settings?.find((s) => s.key === key)?.value;
		};

		const getSettingAsBoolean = (key: string): boolean => {
			const value = getSetting(key);
			return value === "true";
		};

		return {
			themeMode: (getSetting("theme_mode") || "light") as
				| "light"
				| "dark"
				| "system",
			sidebarCollapsed: getSettingAsBoolean("sidebar_collapsed"),
			compactMode: getSettingAsBoolean("compact_mode"),
		};
	}, [settings]);
	return obj;
}

export function useSecuritySettings() {
	const { settings } = useSettings({ includePrivate: true });
	const securitySettings = useMemo(() => {
		const getSetting = (key: string): string | undefined => {
			return settings?.find((s) => s.key === key)?.value;
		};

		const getSettingAsNumber = (key: string): number | undefined => {
			const value = getSetting(key);
			if (value === undefined) return undefined;
			const num = parseInt(value, 10);
			return Number.isNaN(num) ? undefined : num;
		};

		return {
			sessionTimeout: getSettingAsNumber("session_timeout") || 30,
			passwordMinLength: getSettingAsNumber("password_min_length") || 8,
		};
	}, [settings]);
	return securitySettings;
}

export function useNotificationSettings() {
	const { settings } = useSettings({ includePrivate: true });
	const notificationSettings = useMemo(() => {
		const getSetting = (key: string): string | undefined => {
			return settings?.find((s) => s.key === key)?.value;
		};

		const getSettingAsBoolean = (key: string): boolean => {
			const value = getSetting(key);
			return value === "true";
		};

		const getSettingAsNumber = (key: string): number | undefined => {
			const value = getSetting(key);
			if (value === undefined) return undefined;
			const num = parseInt(value, 10);
			return Number.isNaN(num) ? undefined : num;
		};

		return {
			emailNotifications: getSettingAsBoolean("email_notifications"),
			appointmentReminders: getSettingAsBoolean("appointment_reminders"),
			smsNotifications: getSettingAsBoolean("sms_notifications"),
			lowStockAlertThreshold:
				getSettingAsNumber("low_stock_alert_threshold") || 10,
			expiryAlertDays: getSettingAsNumber("expiry_alert_days") || 30,
		};
	}, [settings]);
	return notificationSettings;
}

export function useDemoCredentials() {
	const { settings } = useSettings();
	const demoCredentials = useMemo(() => {
		const getSetting = (key: string): string | undefined => {
			return settings?.find((s) => s.key === key)?.value;
		};

		const demoEmail = getSetting("demo_email") || "admin@clinic.local";
		const demoPassword = getSetting("demo_password") || "admin123";

		const hasDefaultCredentials =
			demoEmail === "admin@clinic.local" && demoPassword === "admin123";

		return {
			demoEmail,
			demoPassword,
			hasDefaultCredentials,
		};
	}, [settings]);
	return demoCredentials;
}
