import { MedicalRecordForm } from "@/components/medical-record-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/medical-records/new")({
	loader: () => ({
		crumb: "New Medical Record",
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = Route.useNavigate();

	return (
		<MedicalRecordForm
			onSave={() => navigate({ to: "/medical-records" })}
			onCancel={() => navigate({ to: "/medical-records" })}
		/>
	);
}
