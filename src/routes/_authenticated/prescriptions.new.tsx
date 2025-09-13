import { createFileRoute } from "@tanstack/react-router";
import { PrescriptionForm } from "@/components/prescription-form";

export const Route = createFileRoute("/_authenticated/prescriptions/new")({
	loader: () => ({
		crumb: "New Prescription",
	}),
	component: () => {
		const navigate = Route.useNavigate();
		const goBack = () => {
			navigate({ to: "/prescriptions" });
		};
		return <PrescriptionForm onSave={goBack} onCancel={goBack} />;
	},
});
