import { authClient, User, type Session } from "@/lib/auth";
import { redirect } from "@tanstack/react-router";
import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";

export interface AuthContextType {
	isAuthenticated: boolean;
	user: User | null;
	session: Session | null;
	login: (username: string, password: string) => Promise<boolean>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	// Restore auth state on app load
	useEffect(() => {
		const token = localStorage.getItem("auth-token");
		if (token) {
			// Validate token with your API
			const initAuth = async () => {
				try {
					const response = await authClient.getSession();
					console.log(response);

					// Better-Auth wraps the session in a data property
					if (response?.data?.user) {
						setUser(response.data.user);
						setIsAuthenticated(true);
					} else {
						setUser(null);
					}
				} catch (error) {
					console.error("Failed to get session:", error);
					setUser(null);
				} finally {
					setIsLoading(false);
				}
			};
			initAuth();
		} else {
			setIsLoading(false);
		}
	}, []);

	// Show loading state while checking auth
	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				Loading...
			</div>
		);
	}

	const login = async (username: string, password: string) => {
		// Replace with your authentication logic
		const response = await authClient.signIn.email({
			email: username,
			password,
		});
		const session = await authClient.getSession();

		if (response.error) {
			console.error("Login error:", response.error);
			return false;
		}
		if (response.data.user && session.data?.user) {
			//  @ts-ignore
			setUser(response.data.user);
			//  @ts-ignore
			setSession(session.data.user);
			setIsAuthenticated(true);
			// Store token for persistence
			localStorage.setItem("auth-token", response.data.token);
			redirect({ to: "/" });
		}
		return true;
	};

	const logout = async () => {
		setUser(null);
		setIsAuthenticated(false);
		localStorage.removeItem("auth-token");
		await authClient.signOut();
	};

	return (
		<AuthContext.Provider
			value={{ isAuthenticated, user, session, login, logout }}
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
