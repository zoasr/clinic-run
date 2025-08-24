"use client";

import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "../components/Sidebar";

export const Route = createRootRoute({
	component: () => {
		const { user } = useAuth();

		if (!user) {
			return <Outlet />;
		}

		return (
			<div className="flex h-screen bg-gray-50">
				<Sidebar />
				<main className="flex-1 overflow-auto">
					<Outlet />
				</main>
				<TanStackRouterDevtools />
			</div>
		);
	},
});
