import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/patients")({
	loader: () => ({
		crumb: "Patients",
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
