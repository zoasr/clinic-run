import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { AuthContextType, AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TRPCProviderWrapper } from "./lib/trpc-provider";
import "./index.css";

// Create a new router instance
const router = createRouter({
	routeTree,
});

// Register the router instance for type safety
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
