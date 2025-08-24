"use client";

import { authClient } from "@/lib/auth";
import type React from "react";
import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from "react";

type User = Awaited<ReturnType<typeof authClient.signIn.email>>;

interface AuthContextType {
	user: User | null;
	token: string | null;
	login: (username: string, password: string) => Promise<boolean>;
	logout: () => void;
	isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const storedToken = localStorage.getItem("clinic_token");
		const storedUser = localStorage.getItem("clinic_user");

		if (storedToken && storedUser) {
			setToken(storedToken);
			setUser(JSON.parse(storedUser));
		}
		setIsLoading(false);
	}, []);

	const login = async (
		username: string,
		password: string
	): Promise<boolean> => {
		try {
			const { data } = await authClient.signIn.email({
				email: username,
				password,
			});

			if (data && data.user) {
				// Transform the user object to match our expected User type
				const userData = {
					...data.user,
					// Provide default values for required fields if they don't exist
					username: data.user.email || data.user.email.split("@")[0],
					firstName: data.user.name?.split(" ")[0] || "",
					lastName:
						data.user.name?.split(" ").slice(1).join(" ") || "",
					role: "user",
					isActive: true,
				};

				setUser(userData);
				setToken(data.token);
				localStorage.setItem("clinic_token", data.token);
				localStorage.setItem("clinic_user", JSON.stringify(userData));
				return true;
			}
			return false;
		} catch (error) {
			console.error("Login error:", error);
			return false;
		}
	};

	const logout = () => {
		setUser(null);
		setToken(null);
		localStorage.removeItem("clinic_token");
		localStorage.removeItem("clinic_user");
	};

	const value = {
		user,
		token,
		login,
		logout,
		isLoading,
	};

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
};
