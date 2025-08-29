import { createFileRoute } from "@tanstack/react-router";
import { InvoiceDetail } from "@/components/invoice-detail";
import { useInvoice } from "@/hooks/useInvoices";
import { PageLoading } from "@/components/ui/loading";

export const Route = createFileRoute("/_authenticated/invoices/$invoiceId")({
	component: RouteComponent,
	loader: ({ params }) => ({
		crumb: `Invoice ${params.invoiceId}`,
	}),
});

function RouteComponent() {
	const { invoiceId } = Route.useParams();
	const { data: invoice, isLoading } = useInvoice(parseInt(invoiceId));
	const navigate = Route.useNavigate();

	if (isLoading) {
		return <PageLoading text="Loading invoice details..." />;
	}

	if (!invoice) {
		return <div>Invoice not found</div>;
	}

	return (
		<InvoiceDetail
			invoice={invoice}
			onBack={() => navigate({ to: "/invoices" })}
			onEdit={(invoice) => {}}
		/>
	);
}
