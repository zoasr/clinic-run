import { AppointmentForm } from "@/components/appointment-form";
import { trpc } from "@/lib/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PageLoading } from "@/components/ui/loading";

export const Route = createFileRoute(
	"/_authenticated/appointments/$appointmentId"
)({
	loader: ({ params }) => {
		return {
			crumb: "Edit Appointment",
			params,
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { params } = Route.useLoaderData();
	const navigate = Route.useNavigate();
	const {
		data: appointment,
		isLoading,
		error,
	} = useQuery(
		trpc.appointments.getById.queryOptions({
			id: Number(params.appointmentId),
		})
	);
	if (isLoading) {
		return <PageLoading text="Loading appointment details..." />;
	}
	if (error) {
		return <div>Error: {error.message}</div>;
	}
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
