import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PatientDetail } from "@/components/patient-detail";
import { PageLoading } from "@/components/ui/loading";
import { trpc } from "@/lib/trpc-client";

export const Route = createFileRoute("/_authenticated/patients/$patientId")({
	loader: ({ params }) => {
		return {
			crumb: "Patient Details",
			params,
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { params } = Route.useLoaderData();
	const navigate = Route.useNavigate();
	const {
		data: patient,
		isLoading,
		error,
	} = useQuery(
		trpc.patients.getById.queryOptions({
			id: Number(params.patientId),
		}),
	);
	if (isLoading) {
		return <PageLoading text="Loading patient details..." />;
	}
	if (error) {
		return <div>Error: {error.message}</div>;
	}
	if (!patient) {
		return <div>Patient with id {params.patientId} not found</div>;
	}
	return (
		<PatientDetail
			patient={patient}
			onEdit={() => {
				navigate({ to: "/patients" });
			}}
			onBack={() => {
				navigate({ to: "/patients" });
			}}
		/>
	);
}
