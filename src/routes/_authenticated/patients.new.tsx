import { createFileRoute } from "@tanstack/react-router";
import { PatientForm } from "@/components/patient-form";

export const Route = createFileRoute("/_authenticated/patients/new")({
	loader: () => ({
		crumb: "New Patient",
	}),
	component: () => {
		const navigate = Route.useNavigate();
		const goBack = () => {
			navigate({ to: "/patients" });
		};
		return <PatientForm onSave={goBack} onCancel={goBack} />;
	},
});
