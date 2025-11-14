import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { StockAdjustmentForm } from "@/components/stock-adjustment-form";
import { trpc } from "@/lib/trpc-client";

export const Route = createFileRoute(
	"/_authenticated/medications/stock/$medicationId",
)({
	component: RouteComponent,
});

function RouteComponent() {
	const { medicationId } = Route.useParams();
	const navigate = Route.useNavigate();
	const { data: medication } = useQuery(
		trpc.medications.getById.queryOptions({
			id: Number(medicationId),
		}),
	);
	if (!medication)
		return (
			<section className="flex items-center justify-center h-screen">
				<h1 className="text-2xl font-bold">Medication not found</h1>
			</section>
		);
	return (
		<StockAdjustmentForm
			medication={medication}
			onSave={() => navigate({ to: "/medications" })}
			onCancel={() => navigate({ to: "/medications" })}
		/>
	);
}
