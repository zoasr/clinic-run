import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageLoading } from "@/components/ui/loading";
import { LoginForm } from "@/components/login-form";
import { trpcClient } from "@/lib/trpc-client";

export const Route = createFileRoute("/login")({
	validateSearch: (search) => ({
		redirect: (search.redirect as string) || "/",
	}),
	beforeLoad: ({ context, search }) => {
		// Redirect if already authenticated
		if (context.auth.isAuthenticated) {
			throw redirect({ to: search.redirect });
		}
	},
	pendingComponent: () => {
		return <PageLoading text="Checking authentication..." />;
	},
	loader: async () => {
		const { exists, user } = await trpcClient.users.checkDemoUser.query();
		return exists
			? { exists, user, crumb: "Login" }
			: { exists: false, user: null, crumb: "Login" };
	},
	component: LoginForm,
});
