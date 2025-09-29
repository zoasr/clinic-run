import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "sonner";
import ErrorComponent from "@/components/error";
import NotFound from "@/components/not-found";
import { Button } from "@/components/ui/button";
import type { AuthContextType } from "@/contexts/AuthContext";

interface MyRouterContext {
	auth: AuthContextType;
}
export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: () => {
		return (
			<>
				<Toaster richColors position="bottom-right" />
				<TanStackRouterDevtools position="bottom-right" />
				<Outlet />
			</>
		);
	},
	errorComponent: ({ error }) => {
		return (
			<ErrorComponent error={error}>
				<Button>Hello</Button>
			</ErrorComponent>
		);
	},
	notFoundComponent: () => {
		return <NotFound />;
	},
});
