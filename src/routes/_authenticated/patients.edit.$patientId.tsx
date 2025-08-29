import { PatientForm } from "@/components/patient-form";
import { trpc } from "@/lib/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PageLoading } from "@/components/ui/loading";

export const Route = createFileRoute(
	"/_authenticated/patients/edit/$patientId"
)({
	component: RouteComponent,
});

function RouteComponent() {
	const { patientId } = Route.useParams();
	const navigate = Route.useNavigate();
	const {
		data: patient,
		isLoading: loading,
		error,
	} = useQuery(trpc.patients.getById.queryOptions({ id: Number(patientId) }));
	if (loading) return <PageLoading text="Loading patient for editing..." />;
	if (error) return <div>Error: {error.message}</div>;
	return (
		<PatientForm
			onSave={() => {
				navigate({ to: "/patients" });
			}}
			onCancel={() => {
				navigate({ to: "/patients" });
			}}
			patient={patient}
		/>
	);
}
