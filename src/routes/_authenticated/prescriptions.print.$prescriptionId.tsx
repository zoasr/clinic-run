import { createFileRoute } from "@tanstack/react-router";
import ErrorComponent from "@/components/error";
import { PrescriptionPrintTemplate } from "@/components/prescription-print-template";
import { PrintControls } from "@/components/print-controls";
import { PageLoading } from "@/components/ui/loading";
import { trpcClient } from "@/lib/trpc-client";

export const Route = createFileRoute(
	"/_authenticated/prescriptions/print/$prescriptionId",
)({
	component: PrescriptionPrintPage,
	loader: async ({ params }) => {
		const prescription = await trpcClient.prescriptions.getById.query({
			id: parseInt(params.prescriptionId),
		});
		return {
			crumb: `Print Prescription ${prescription?.id}`,
			prescription,
		};
	},
	pendingComponent: () => (
		<PageLoading text="Loading prescription for printing..." />
	),
});

function PrescriptionPrintPage() {
	const { prescriptionId } = Route.useParams();
	const { prescription } = Route.useLoaderData();
	const navigate = Route.useNavigate();

	const handleBack = () => {
		navigate({
			to: `/prescriptions/$prescriptionId`,
			params: { prescriptionId },
		});
	};

	if (!prescription) {
		return <ErrorComponent error={new Error("Prescription not found")} />;
	}

	return (
		<div className="bg-white">
			<PrintControls name="Prescription" onBack={handleBack} />

			<div className="max-w-4xl mx-auto p-8">
				<PrescriptionPrintTemplate prescription={prescription} />
			</div>
		</div>
	);
}
