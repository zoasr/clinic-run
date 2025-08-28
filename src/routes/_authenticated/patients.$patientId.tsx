import { PatientDetail } from "@/components/patient-detail";
import { trpc } from "@/lib/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

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
		})
	);
	if (isLoading) {
		return <div>Loading...</div>;
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
