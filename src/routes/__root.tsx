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
				<Button
					onClick={async () => {
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
							console.log("Demo initialized successfully with token");
							window.location.reload();
						}
					}}
				>
					Initialize
				</Button>
			</ErrorComponent>
		);
	},
	notFoundComponent: () => {
		return <NotFound />;
	},
});
