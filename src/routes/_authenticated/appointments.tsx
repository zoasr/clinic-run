import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/appointments")({
	loader: () => ({
		crumb: "Appointments",
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
