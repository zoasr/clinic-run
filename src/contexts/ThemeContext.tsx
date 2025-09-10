import React, { createContext, useContext, useEffect, useState } from "react";
import { useAppearanceSettings } from "@/hooks/useSettings";
import { toast } from "sonner";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
	theme: ThemeMode;
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
	const appearanceSettings = useAppearanceSettings();
	const [theme, setThemeState] = useState<ThemeMode>(
		appearanceSettings.themeMode
	);
	const [sidebarCollapsed, setSidebarCollapsedState] = useState(
		appearanceSettings.sidebarCollapsed
	);
	const [compactMode, setCompactModeState] = useState(
		appearanceSettings.compactMode
	);

	// Update theme state when settings change
	useEffect(() => {
		setThemeState(appearanceSettings.themeMode);
		setSidebarCollapsedState(appearanceSettings.sidebarCollapsed);
		setCompactModeState(appearanceSettings.compactMode);
	}, [
		appearanceSettings.themeMode,
		appearanceSettings.sidebarCollapsed,
		appearanceSettings.compactMode,
	]);

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
		const themeNames = {
			light: "Light",
			dark: "Dark",
			system: "System",
		};
		toast.success(`Theme changed to ${themeNames[newTheme]}`);
	};

	const setSidebarCollapsed = (collapsed: boolean) => {
		setSidebarCollapsedState(collapsed);
		toast.success(collapsed ? "Sidebar collapsed" : "Sidebar expanded");
	};

	const setCompactMode = (compact: boolean) => {
		setCompactModeState(compact);
		toast.success(
			compact ? "Compact mode enabled" : "Compact mode disabled"
		);
	};

	const value: ThemeContextType = {
		theme,
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
