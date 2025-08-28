import { createFileRoute } from "@tanstack/react-router";
import { PrescriptionDetail } from "@/components/prescription-detail";
import { usePrescription } from "@/hooks/usePrescriptions";

export const Route = createFileRoute("/_authenticated/prescriptions/$prescriptionId")({
	component: RouteComponent,
	loader: ({ params }) => ({
		crumb: `Prescription ${params.prescriptionId}`,
	}),
});

function RouteComponent() {
	const { prescriptionId } = Route.useParams();
	const { data: prescription, isLoading } = usePrescription(parseInt(prescriptionId));

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (!prescription) {
		return <div>Prescription not found</div>;
	}

	return (
		<PrescriptionDetail
			prescription={prescription}
			onBack={() => window.history.back()}
			onEdit={(prescription) => {
				// Navigate to edit mode - you might want to implement this differently
				window.history.back();
			}}
		/>
	);
}