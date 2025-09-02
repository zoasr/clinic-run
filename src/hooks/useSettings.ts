import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";
import { useEffect } from "react";
import z from "zod";

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
});

/**
 * Custom hook to access system settings throughout the application
 * @param options - Query options for the settings fetch
 * @returns Object containing settings array and helper functions
 */
function useSettings(options?: {
	includePrivate?: boolean;
}): UseSettingsReturn {
	const queryClient = useQueryClient();
	const includePrivate = options?.includePrivate ?? false;

	const queryOptions = includePrivate
		? trpc.systemSettings.getAll.queryOptions()
		: trpc.systemSettings.getPublic.queryOptions();

	// Fetch either public or all settings based on includePrivate flag
	const {
		data: settings,
		isLoading,
		error,
		refetch,
		// @ts-ignore
	} = useQuery(queryOptions);

	// Helper function to get a setting value by key
	const getSetting = (key: string): string | undefined => {
		return settings?.find((s) => s.key === key)?.value;
	};

	// Helper function to get a setting value as a number
	const getSettingAsNumber = (key: string): number | undefined => {
		const value = getSetting(key);
		if (value === undefined) return undefined;
		const num = parseInt(value, 10);
		return isNaN(num) ? undefined : num;
	};

	// Helper function to get a setting value as a boolean
	const getSettingAsBoolean = (key: string): boolean => {
		const value = getSetting(key);
		return value === "true";
	};

	// Subscribe to settings changes for real-time updates
	useEffect(() => {
		// Invalidate queries when settings are updated
		const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
			if (
				event?.query?.queryKey?.[0] === "systemSettings" &&
				event.type === "updated"
			) {
				refetch();
			}
		});

		return () => {
			unsubscribe();
		};
	}, [queryClient, refetch]);

	return {
		// @ts-ignore
		settings,
		getSetting,
		getSettingAsNumber,
		getSettingAsBoolean,
		isLoading,
		error,
		refetch,
	};
}

// Specific hooks for common settings
export function useSessionTimeout(): number {
	const { getSettingAsNumber } = useSettings({ includePrivate: true });
	return getSettingAsNumber("session_timeout") || 30; // Default to 30 minutes
}

export function useClinicInfo() {
	const { getSetting } = useSettings();
	return {
		name: getSetting("clinic_name") || "Clinic Management System",
		address: getSetting("clinic_address") || "",
		phone: getSetting("clinic_phone") || "",
		email: getSetting("clinic_email") || "",
		workingHours: getSetting("working_hours") || "9:00 AM - 5:00 PM",
	};
}

export function useAppearanceSettings() {
	const { getSetting, getSettingAsBoolean } = useSettings();
	return {
		themeMode: (getSetting("theme_mode") || "light") as
			| "light"
			| "dark"
			| "system",
		sidebarCollapsed: getSettingAsBoolean("sidebar_collapsed"),
		compactMode: getSettingAsBoolean("compact_mode"),
	};
}

export function useSecuritySettings() {
	const { getSettingAsNumber, getSettingAsBoolean } = useSettings({
		includePrivate: true,
	});
	return {
		sessionTimeout: getSettingAsNumber("session_timeout") || 30,
		passwordMinLength: getSettingAsNumber("password_min_length") || 8,
	};
}

export function useNotificationSettings() {
	const { getSettingAsBoolean } = useSettings({ includePrivate: true });
	return {
		emailNotifications: getSettingAsBoolean("email_notifications"),
		appointmentReminders: getSettingAsBoolean("appointment_reminders"),
	};
}

export function useDemoCredentials() {
	const { getSetting } = useSettings();
	const demoEmail = getSetting("demo_email") || "admin@clinic.local";
	const demoPassword = getSetting("demo_password") || "admin123";

	// Check if demo credentials are still default
	const hasDefaultCredentials =
		demoEmail === "admin@clinic.local" && demoPassword === "admin123";

	return {
		demoEmail,
		demoPassword,
		hasDefaultCredentials,
	};
}
