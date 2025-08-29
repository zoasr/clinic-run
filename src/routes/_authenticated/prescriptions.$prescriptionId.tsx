import { PrescriptionDetail } from "@/components/prescription-detail";
import { trpc } from "@/lib/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PageLoading } from "@/components/ui/loading";

export const Route = createFileRoute("/_authenticated/prescriptions/$prescriptionId")({
	loader: ({ params }) => {
		return {
			crumb: "Prescription Details",
			params,
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { params } = Route.useLoaderData();
	const navigate = Route.useNavigate();
	const {
		data: prescription,
		isLoading,
		error,
	} = useQuery(
		trpc.prescriptions.getById.queryOptions({
			id: Number(params.prescriptionId),
		})
	);

	if (isLoading) {
		return <PageLoading text="Loading prescription details..." />;
	}

	if (error) {
		return <div>Error: {error.message}</div>;
	}

	if (!prescription) {
		return <div>Prescription with id {params.prescriptionId} not found</div>;
	}

	return (
		<PrescriptionDetail
			prescription={prescription}
			onEdit={() => {
				navigate({
					to: "/prescriptions/edit/$prescriptionId",
					params: { prescriptionId: params.prescriptionId }
				});
			}}
			onBack={() => {
				navigate({ to: "/prescriptions" });
			}}
		/>
	);
}
