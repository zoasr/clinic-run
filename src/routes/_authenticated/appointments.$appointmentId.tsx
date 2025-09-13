import { createFileRoute } from "@tanstack/react-router";
import { AppointmentForm } from "@/components/appointment-form";
import ErrorComponent from "@/components/error";
import { PageLoading } from "@/components/ui/loading";
import { trpcClient } from "@/lib/trpc-client";

export const Route = createFileRoute(
	"/_authenticated/appointments/$appointmentId",
)({
	loader: async ({ params }) => {
		const appointment = await trpcClient.appointments.getById.query({
			id: Number(params.appointmentId),
		});
		return {
			crumb: "Edit Appointment",
			appointment,
		};
	},
	pendingComponent: () => <PageLoading text="Loading appointment details..." />,
	errorComponent: ({ error }) => <ErrorComponent error={error} />,
	component: RouteComponent,
});

function RouteComponent() {
	const { appointment } = Route.useLoaderData();
	const navigate = Route.useNavigate();

	return (
		<AppointmentForm
			appointment={appointment}
			onSave={() => {
				navigate({ to: "/appointments" });
			}}
			onCancel={() => {
				navigate({ to: "/appointments" });
			}}
		/>
	);
}
