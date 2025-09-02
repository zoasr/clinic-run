import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AuthContextType } from "@/contexts/AuthContext";
import NotFound from "@/components/not-found";

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
	notFoundComponent: () => {
		return <NotFound />;
	},
});
