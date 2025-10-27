import { createFileRoute } from "@tanstack/react-router";
import { SupplierForm } from "@/components/supplier-form";
import { trpcClient } from "@/lib/trpc-client";

export const Route = createFileRoute(
	"/_authenticated/medications/suppliers/$supplierId/edit",
)({
	loader: async ({ params }) => {
		const supplier = await trpcClient.medicationSuppliers.getById.query({
			id: parseInt(params.supplierId),
		});
		return {
			crumb: `Edit ${supplier ? supplier.name : "Supplier"}`,
			supplier,
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { supplier } = Route.useLoaderData();

	return (
		<SupplierForm
			supplier={supplier}
			onSave={() => window.history.back()}
			onCancel={() => window.history.back()}
		/>
	);
}
