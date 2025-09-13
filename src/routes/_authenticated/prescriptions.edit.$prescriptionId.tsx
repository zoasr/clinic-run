import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import ErrorComponent from "@/components/error";
import { PrescriptionForm } from "@/components/prescription-form";
import { PageLoading } from "@/components/ui/loading";
import { trpc } from "@/lib/trpc-client";

export const Route = createFileRoute(
	"/_authenticated/prescriptions/edit/$prescriptionId",
)({
	component: RouteComponent,
});

function RouteComponent() {
	const { prescriptionId } = Route.useParams();
	const navigate = Route.useNavigate();
	const {
		data: prescription,
		isLoading: loading,
		error,
	} = useQuery(
		trpc.prescriptions.getById.queryOptions({ id: Number(prescriptionId) }),
	);

	if (loading)
		return <PageLoading text="Loading prescription for editing..." />;
	if (error) return <ErrorComponent error={error} />;

	return (
		<PrescriptionForm
			onSave={() => {
				navigate({ to: "/prescriptions" });
			}}
			onCancel={() => {
				navigate({ to: "/prescriptions" });
			}}
			prescription={prescription}
		/>
	);
}
