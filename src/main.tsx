import { createRouter, RouterProvider } from "@tanstack/react-router";
import React from "react";
import ReactDOM from "react-dom/client";
import {
	type AuthContextType,
	AuthProvider,
	useAuth,
} from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TRPCProviderWrapper } from "./lib/trpc-provider";
import { routeTree } from "./routeTree.gen";
import "./index.css";

const router = createRouter({
	routeTree,
	context: { auth: {} as AuthContextType },
	defaultStaleTime: 1000 * 60,
	defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const RouterWithAuth = () => {
	const auth = useAuth();
	return <RouterProvider router={router} context={{ auth }} />;
};

const MainApp = () => {
	return (
		<React.StrictMode>
			<TRPCProviderWrapper>
				<ThemeProvider>
					<AuthProvider>
						<RouterWithAuth />
					</AuthProvider>
				</ThemeProvider>
			</TRPCProviderWrapper>
		</React.StrictMode>
	);
};

ReactDOM.createRoot(document.getElementById("root")!).render(<MainApp />);
