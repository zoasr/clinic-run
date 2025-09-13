import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MedicationForm } from "@/components/medication-form";
import { PageLoading } from "@/components/ui/loading";
import { trpc } from "@/lib/trpc-client";

export const Route = createFileRoute(
	"/_authenticated/medications/$medicationId",
)({
	loader: () => ({
		crumb: "Edit Medication",
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const { medicationId } = Route.useParams();
	const navigate = Route.useNavigate();
	const {
		data: medication,
		isLoading,
		error,
	} = useQuery(
		trpc.medications.getById.queryOptions({
			id: Number(medicationId),
		}),
	);

	if (isLoading) {
		return <PageLoading text="Loading medication details..." />;
	}

	if (error) {
		return <div>Error: {error.message}</div>;
	}

	if (!medication) {
		return <div>Medication with id {medicationId} not found</div>;
	}

	return (
		<MedicationForm
			medication={medication}
			onSave={() => {
				navigate({ to: "/medications" });
			}}
			onCancel={() => {
				navigate({ to: "/medications" });
			}}
		/>
	);
}
