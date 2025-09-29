import { useQueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageLoading } from "@/components/ui/loading";
import { authClient, type Session, type User } from "@/lib/auth";

export interface AuthContextType {
	isAuthenticated: boolean;
	user: User | null;
	session: Session | null;
	isDemo: boolean;
	demoStartTime: number | null;
	demoTimeRemaining: number;
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
	const [isDemo, setIsDemo] = useState(false);
	const [demoStartTime, setDemoStartTime] = useState<number | null>(null);
	const [demoTimeRemaining, setDemoTimeRemaining] = useState(0);

	// Refresh authentication state
	const refreshAuth = async () => {
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
			console.error("Failed to refresh auth:", error);
			setUser(null);
			setSession(null);
			setIsAuthenticated(false);
		}
	};

	// Restore auth state on app load
	useEffect(() => {
		const initAuth = async () => {
			try {
				// Check if we have a demo token, if not, try to initialize demo
				let demoToken = sessionStorage.getItem("demoToken");
				let demoInitialized = false;

				if (!demoToken) {
					console.log("No demo token found, attempting to initialize demo...");
					try {
						const baseURL =
							import.meta.env.VITE_SERVER_URL || "http://127.0.0.1:3031";
						const initResponse = await fetch(`${baseURL}/demo/init`, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
						});

						if (initResponse.ok) {
							const { token } = await initResponse.json();
							sessionStorage.setItem("demoToken", token);
							sessionStorage.setItem("demoStartTime", Date.now().toString());
							demoToken = token;
							demoInitialized = true;
							setIsDemo(true);
							setDemoStartTime(Date.now());
							console.log("Demo initialized successfully with token");
						} else {
							console.warn(
								"Demo initialization failed, proceeding without demo data",
							);
							// Don't throw error, just continue without demo
						}
					} catch (error) {
						console.warn(
							"Demo initialization error, proceeding without demo data:",
							error,
						);
						// Don't throw error, just continue without demo
					}
				} else {
					demoInitialized = true;
					const storedStartTime = sessionStorage.getItem("demoStartTime");
					if (storedStartTime) {
						const startTime = parseInt(storedStartTime);
						setIsDemo(true);
						setDemoStartTime(startTime);
					}
				}

				// Only try to get session if we have a demo token or demo was just initialized
				if (demoToken || demoInitialized) {
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
					} catch (sessionError) {
						console.warn(
							"Failed to get session, proceeding with unauthenticated state:",
							sessionError,
						);
						setUser(null);
						setSession(null);
						setIsAuthenticated(false);
					}
				} else {
					// No demo available, set unauthenticated state
					console.log("No demo available, starting in unauthenticated state");
					setUser(null);
					setSession(null);
					setIsAuthenticated(false);
				}
			} catch (error) {
				console.error("Failed to initialize auth:", error);
				// Ensure we always have a valid unauthenticated state
				setUser(null);
				setSession(null);
				setIsAuthenticated(false);
			} finally {
				setIsLoading(false);
			}
		};

		initAuth();
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: logout function changes on each rerender
	useEffect(() => {
		if (!isDemo || !demoStartTime) return;

		const DEMO_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

		const updateTimer = () => {
			const elapsed = Date.now() - demoStartTime;
			const remaining = Math.max(0, DEMO_DURATION - elapsed);
			setDemoTimeRemaining(remaining);

			if (remaining <= 0) {
				console.log("Demo time expired, logging out...");
				logout();
			}
		};

		// Update immediately
		updateTimer();

		// Update every second
		const interval = setInterval(updateTimer, 1000);

		return () => clearInterval(interval);
	}, [isDemo, demoStartTime]);

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
				email: username.trim(),
				password: password.trim(),
			});

			if (response.error) {
				console.error("Login error:", response.error);
				return false;
			}

			// Get fresh session data
			const sessionResponse = await authClient.getSession();

			if (response.data?.user && sessionResponse.data?.user) {
				const sessionData = sessionResponse.data;

				// Update state
				setUser(sessionData.user);
				setSession(sessionData);
				setIsAuthenticated(true);

				// Clear all cached queries to ensure fresh data
				queryClient.clear();
				refreshAuth();

				toast.success(
					`Login successful! Welcome back. ${sessionData.user.name}`,
				);
				return true;
			}

			console.error("Login failed - no user data in response");
			toast.error("Login failed. Please check your credentials.");
			return false;
		} catch (error) {
			if (error instanceof Error) {
				console.error("💥 Login failed with exception:", error.message);
				toast.error("Login failed. Please try again.");
			}
			return false;
		}
	};

	const logout = async () => {
		try {
			// Signal logout to other tabs
			localStorage.setItem("auth-logout", "true");
			setTimeout(() => {
				localStorage.removeItem("auth-logout");
			}, 100);

			// Clear demo token and start time
			sessionStorage.removeItem("demoToken");
			sessionStorage.removeItem("demoStartTime");
			setIsDemo(false);
			setDemoStartTime(null);
			setDemoTimeRemaining(0);

			// Clear local state first
			setUser(null);
			setSession(null);
			setIsAuthenticated(false);

			// Clear all cached queries to ensure fresh state
			queryClient.clear();

			// Sign out from auth service
			await authClient.signOut();
			refreshAuth();

			toast.success("Logged out successfully.");

			// Navigate to login page
			throw redirect({
				to: "/login",
				search: { redirect: window.location.pathname },
			});
		} catch (error) {
			if (error instanceof Error) {
				console.error("Logout error:", error.message);
				toast.error("Logout completed with some issues.");
			}
			// Even if logout fails, clear local state
			sessionStorage.removeItem("demoToken");
			setUser(null);
			setSession(null);
			setIsAuthenticated(false);
			queryClient.clear();
			try {
				throw redirect({
					to: "/login",
					search: { redirect: window.location.pathname },
				});
			} catch (error) {
				if (error instanceof Error) {
					console.error("Logout error:", error.message);
					toast.error("Logout completed with some issues.");
				}
			}
		}
	};

	return (
		<AuthContext.Provider
			value={{
				isAuthenticated,
				user,
				session,
				isDemo,
				demoStartTime,
				demoTimeRemaining,
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
