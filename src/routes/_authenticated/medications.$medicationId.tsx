import { createFileRoute } from "@tanstack/react-router";
import { MedicationForm } from "@/components/medication-form";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";

export const Route = createFileRoute(
	"/_authenticated/medications/$medicationId"
)({
	loader: () => ({
		crumb: "Edit Medication",
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const { medicationId } = Route.useParams();
	const navigate = Route.useNavigate();
	const { data: medication } = useQuery(
		trpc.medications.getById.queryOptions({
			id: Number(medicationId),
		})
	);
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
