import { createFileRoute } from "@tanstack/react-router";
import { MedicationForm } from "@/components/medication-form";

export const Route = createFileRoute("/_authenticated/medications/new")({
	loader: () => ({
		crumb: "New Medication",
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	return (
		<MedicationForm
			onSave={() => {
				navigate({ to: "/medications" });
			}}
			onCancel={() => {
				navigate({ to: "/medications" });
			}}
		/>
	);
}
