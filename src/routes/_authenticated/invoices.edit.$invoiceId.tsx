import { createFileRoute } from "@tanstack/react-router";
import { InvoiceForm } from "@/components/invoice-form";
import { trpcClient } from "@/lib/trpc-client";

export const Route = createFileRoute(
	"/_authenticated/invoices/edit/$invoiceId"
)({
	component: RouteComponent,
	loader: async ({ params }) => {
		const { invoiceId } = params;
		const invoice = await trpcClient.invoices.getById.query({
			id: parseInt(invoiceId),
		});
		return {
			invoiceId,
			invoice,
			crumb: "New Invoice",
		};
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { invoice } = Route.useLoaderData();
	return (
		<InvoiceForm
			onSave={() => navigate({ to: "/invoices" })}
			onCancel={() => navigate({ to: "/invoices" })}
			invoice={invoice}
		/>
	);
}
