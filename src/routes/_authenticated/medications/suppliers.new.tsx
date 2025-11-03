import { createFileRoute } from "@tanstack/react-router";
import { SupplierForm } from "@/components/supplier-form";

export const Route = createFileRoute(
	"/_authenticated/medications/suppliers/new",
)({
	loader: () => ({
		crumb: "Add Supplier",
	}),
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<SupplierForm
			onSave={() => window.history.back()}
			onCancel={() => window.history.back()}
		/>
	);
}
