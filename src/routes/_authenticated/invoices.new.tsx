import { createFileRoute } from "@tanstack/react-router";
import { InvoiceForm } from "@/components/invoice-form";

export const Route = createFileRoute("/_authenticated/invoices/new")({
	component: RouteComponent,
	loader: () => ({
		crumb: "New Invoice",
	}),
});

function RouteComponent() {
	return (
		<InvoiceForm
			onSave={() => window.history.back()}
			onCancel={() => window.history.back()}
		/>
	);
}