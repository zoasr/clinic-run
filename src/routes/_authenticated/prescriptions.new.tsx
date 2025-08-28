import { createFileRoute } from "@tanstack/react-router";
import { PrescriptionForm } from "@/components/prescription-form";

export const Route = createFileRoute("/_authenticated/prescriptions/new")({
	component: RouteComponent,
	loader: () => ({
		crumb: "New Prescription",
	}),
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	return (
		<PrescriptionForm
			onSave={() => navigate({ to: "/prescriptions" })}
			onCancel={() => navigate({ to: "/prescriptions" })}
		/>
	);
}
