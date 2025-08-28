import { createFileRoute } from "@tanstack/react-router";
import { PrescriptionForm } from "@/components/prescription-form";

export const Route = createFileRoute("/_authenticated/prescriptions/new")({
	component: RouteComponent,
	loader: () => ({
		crumb: "New Prescription",
	}),
});

function RouteComponent() {
	return (
		<PrescriptionForm
			onSave={() => window.history.back()}
			onCancel={() => window.history.back()}
		/>
	);
}