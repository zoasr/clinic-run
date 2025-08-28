import { LabTestForm } from "@/components/lab-test-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/lab-tests/new")({
	loader: () => ({
		crumb: "New Lab Test",
	}),
	component: () => {
		const navigate = Route.useNavigate();
		const goBack = () => {
			navigate({ to: "/lab-tests" });
		};
		return <LabTestForm onSave={goBack} onCancel={goBack} />;
	},
});