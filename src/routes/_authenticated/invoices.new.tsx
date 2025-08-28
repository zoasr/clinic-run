import { createFileRoute } from "@tanstack/react-router";
import { InvoiceForm } from "@/components/invoice-form";

export const Route = createFileRoute("/_authenticated/invoices/new")({
	component: RouteComponent,
	loader: () => ({
		crumb: "New Invoice",
	}),
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	return (
		<InvoiceForm
			onSave={() => navigate({ to: "/invoices" })}
			onCancel={() => navigate({ to: "/invoices" })}
		/>
	);
}
