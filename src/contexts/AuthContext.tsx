import { authClient, User, type Session } from "@/lib/auth";
import { redirect, useRouter } from "@tanstack/react-router";
import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { PageLoading } from "@/components/ui/loading";
import { useQueryClient } from "@tanstack/react-query";

export interface AuthContextType {
	isAuthenticated: boolean;
	user: User | null;
	session: Session | null;
	login: (username: string, password: string) => Promise<boolean>;
	logout: () => void;
	refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const queryClient = useQueryClient();
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	// Refresh authentication state
	const refreshAuth = async () => {
		try {
			console.log("🔄 Refreshing authentication state...");
			const response = await authClient.getSession();

			if (response?.data?.user && response?.data?.session) {
				console.log(
					"✅ Auth refreshed - User:",
					response.data.user.name,
					"Role:",
					response.data.user.role
				);
				setUser(response.data.user);
				setSession(response.data);
				setIsAuthenticated(true);
			} else {
				console.log("❌ No valid session found");
				setUser(null);
				setSession(null);
				setIsAuthenticated(false);
			}
		} catch (error) {
			console.error("💥 Failed to refresh auth:", error);
			setUser(null);
			setSession(null);
			setIsAuthenticated(false);
		}
	};

	// Restore auth state on app load
	useEffect(() => {
		const initAuth = async () => {
			try {
				const response = await authClient.getSession();

				if (response?.data?.user && response?.data?.session) {
					setUser(response.data.user);
					setSession(response.data);
					setIsAuthenticated(true);
				} else {
					setUser(null);
					setSession(null);
					setIsAuthenticated(false);
				}
			} catch (error) {
				console.error("Failed to initialize auth:", error);
				setUser(null);
				setSession(null);
				setIsAuthenticated(false);
			} finally {
				setIsLoading(false);
			}
		};

		initAuth();
	}, []);

	// Listen for storage changes (login/logout in other tabs)
	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === "auth-token") {
				if (e.newValue) {
					// Token was added, refresh auth
					refreshAuth();
				} else {
					// Token was removed, clear auth
					setUser(null);
					setSession(null);
					setIsAuthenticated(false);
					queryClient.clear();
				}
			}
		};

		window.addEventListener("storage", handleStorageChange);
		return () => window.removeEventListener("storage", handleStorageChange);
	}, [refreshAuth]);

	// Show loading state while checking auth
	if (isLoading) {
		return <PageLoading text="Authenticating..." />;
	}

	const login = async (username: string, password: string) => {
		try {
			console.log("🔐 Starting login process for:", username);

			// Clear any existing auth state first
			setUser(null);
			setSession(null);
			setIsAuthenticated(false);

			// Perform login
			const response = await authClient.signIn.email({
				email: username,
				password,
			});

			if (response.error) {
				console.error("❌ Login error:", response.error);
				return false;
			}

			console.log("✅ Login successful, getting session...");

			// Get fresh session data
			const sessionResponse = await authClient.getSession();

			if (response.data?.user && sessionResponse.data?.user) {
				const userData = response.data.user;
				const sessionData = sessionResponse.data;

				console.log(
					"👤 User authenticated:",
					userData.name,
					"Role:",
					sessionData.user.role
				);

				// Update state
				setUser(sessionData.user);
				setSession(sessionData);
				setIsAuthenticated(true);

				// Store token for persistence
				if (response.data.token) {
					localStorage.setItem("auth-token", response.data.token);
				}

				// Clear all cached queries to ensure fresh data
				queryClient.clear();
				console.log("🧹 Cleared query cache");

				return true;
			}

			console.error("❌ Login failed - no user data in response");
			return false;
		} catch (error) {
			console.error("💥 Login failed with exception:", error);
			return false;
		}
	};

	const logout = async () => {
		try {
			console.log("🚪 Starting logout process");

			// Clear local state first
			setUser(null);
			setSession(null);
			setIsAuthenticated(false);
			console.log("🧹 Cleared local auth state");

			// Clear all cached queries to ensure fresh state
			queryClient.clear();
			console.log("🗑️ Cleared query cache");

			// Remove stored token
			localStorage.removeItem("auth-token");
			console.log("🗝️ Removed auth token from storage");

			// Sign out from auth service
			await authClient.signOut();
			console.log("👋 Signed out from auth service");

			// Navigate to login page
			throw redirect({
				to: "/login",
				search: { redirect: window.location.pathname },
			});
		} catch (error) {
			console.error("💥 Logout error:", error);
			// Even if logout fails, clear local state
			setUser(null);
			setSession(null);
			setIsAuthenticated(false);
			localStorage.removeItem("auth-token");
			queryClient.clear();
			throw redirect({
				to: "/login",
				search: { redirect: window.location.pathname },
			});
		}
	};

	return (
		<AuthContext.Provider
			value={{
				isAuthenticated,
				user,
				session,
				login,
				logout,
				refreshAuth,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
