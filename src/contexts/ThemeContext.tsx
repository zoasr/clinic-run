import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { useQuery } from "@tanstack/react-query";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
	theme: ThemeMode;
	primaryColor: string;
	sidebarCollapsed: boolean;
	compactMode: boolean;
	setTheme: (theme: ThemeMode) => void;
	setSidebarCollapsed: (collapsed: boolean) => void;
	setCompactMode: (compact: boolean) => void;
	isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}

interface ThemeProviderProps {
	children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
	const [theme, setThemeState] = useState<ThemeMode>("light");
	const [primaryColor, setPrimaryColorState] = useState("#3b82f6");
	const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);
	const [compactMode, setCompactModeState] = useState(false);

	// Fetch theme settings from system settings
	const { data: settings } = useQuery(
		trpc.systemSettings.getPublic.queryOptions()
	);

	// Update theme state when settings change
	useEffect(() => {
		if (settings) {
			const themeSetting = settings.find((s) => s.key === "theme_mode");
			const primaryColorSetting = settings.find(
				(s) => s.key === "primary_color"
			);
			const sidebarCollapsedSetting = settings.find(
				(s) => s.key === "sidebar_collapsed"
			);
			const compactModeSetting = settings.find(
				(s) => s.key === "compact_mode"
			);

			if (themeSetting) {
				setThemeState(themeSetting.value as ThemeMode);
			}
			if (primaryColorSetting) {
				setPrimaryColorState(primaryColorSetting.value);
			}
			if (sidebarCollapsedSetting) {
				setSidebarCollapsedState(
					sidebarCollapsedSetting.value === "true"
				);
			}
			if (compactModeSetting) {
				setCompactModeState(compactModeSetting.value === "true");
			}
		}
	}, [settings]);

	// Determine if dark mode should be active
	const getSystemTheme = (): boolean => {
		if (typeof window !== "undefined") {
			return window.matchMedia("(prefers-color-scheme: dark)").matches;
		}
		return false;
	};

	const isDark = theme === "dark" || (theme === "system" && getSystemTheme());

	// Apply theme to document
	useEffect(() => {
		const root = document.documentElement;

		if (isDark) {
			root.classList.add("dark");
		} else {
			root.classList.remove("dark");
		}
	}, [isDark]);

	// Listen for system theme changes when theme is set to "system"
	useEffect(() => {
		if (theme !== "system") return;

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = () => {
			const root = document.documentElement;
			if (mediaQuery.matches) {
				root.classList.add("dark");
			} else {
				root.classList.remove("dark");
			}
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, [theme]);

	const setTheme = (newTheme: ThemeMode) => {
		setThemeState(newTheme);
	};

	const setSidebarCollapsed = (collapsed: boolean) => {
		setSidebarCollapsedState(collapsed);
	};

	const setCompactMode = (compact: boolean) => {
		setCompactModeState(compact);
	};

	const value: ThemeContextType = {
		theme,
		primaryColor,
		sidebarCollapsed,
		compactMode,
		setTheme,
		setSidebarCollapsed,
		setCompactMode,
		isDark,
	};

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}
