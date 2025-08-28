import { AppointmentForm } from "@/components/appointment-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/appointments/new")({
	loader: () => ({
		crumb: "New Appointment",
	}),
	component: () => {
		const navigate = Route.useNavigate();
		const goBack = () => {
			navigate({ to: "/appointments" });
		};
		return (
			<AppointmentForm
				appointment={null}
				onSave={goBack}
				onCancel={goBack}
			/>
		);
	},
});
