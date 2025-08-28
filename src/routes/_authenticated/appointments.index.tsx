import { createFileRoute } from "@tanstack/react-router";
import { AppointmentManagement } from "@/components/appointment-management";

function AppointmentsPage() {
	return <AppointmentManagement />;
}

export const Route = createFileRoute("/_authenticated/appointments/")({
	component: AppointmentsPage,
	loader: () => ({
		crumb: "All Appointments",
	}),
	beforeLoad: async ({ context }) => {},
});
