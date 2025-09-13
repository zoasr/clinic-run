import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/invoices")({
	loader: () => ({
		crumb: "Invoices",
	}),
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="space-y-6 p-6">
			<Outlet />
		</div>
	);
}
