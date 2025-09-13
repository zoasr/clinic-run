import { createFileRoute } from "@tanstack/react-router";
import ErrorComponent from "@/components/error";
import { InvoiceDetail } from "@/components/invoice-detail";
import { PageLoading } from "@/components/ui/loading";
import { useInvoice } from "@/hooks/useInvoices";

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
		return <ErrorComponent error={new Error("Invoice not found")} />;
	}

	return (
		<InvoiceDetail
			invoice={invoice}
			onBack={() => navigate({ to: "/invoices" })}
			onEdit={(invoice) => {
				navigate({
					to: `/invoices/edit/$invoiceId`,
					params: { invoiceId: invoice?.id?.toString() || "" },
				});
			}}
		/>
	);
}
