import { createFileRoute } from "@tanstack/react-router";
import { PrescriptionDetail } from "@/components/prescription-detail";
import { usePrescription } from "@/hooks/usePrescriptions";

export const Route = createFileRoute(
	"/_authenticated/prescriptions/$prescriptionId"
)({
	component: RouteComponent,
	loader: ({ params }) => ({
		crumb: `Prescription ${params.prescriptionId}`,
	}),
});

function RouteComponent() {
	const { prescriptionId } = Route.useParams();
	const { data: prescription, isLoading } = usePrescription(
		parseInt(prescriptionId)
	);
	const navigate = Route.useNavigate();

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (!prescription) {
		return <div>Prescription not found</div>;
	}

	return (
		<PrescriptionDetail
			prescription={prescription}
			onBack={() => navigate({ to: "/prescriptions" })}
			onEdit={(prescription) => {
				navigate({ to: "/prescriptions" });
			}}
		/>
	);
}
