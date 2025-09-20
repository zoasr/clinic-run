import { createFileRoute } from "@tanstack/react-router";
import ErrorComponent from "@/components/error";
import { InvoicePrintTemplate } from "@/components/invoice-print-template";
import { PrintControls } from "@/components/print-controls";
import { PageLoading } from "@/components/ui/loading";
import { useInvoice } from "@/hooks/useInvoices";
import { trpcClient } from "@/lib/trpc-client";

export const Route = createFileRoute(
	"/_authenticated/invoices/print/$invoiceId",
)({
	component: InvoicePrintPage,
	loader: async ({ params }) => {
		const invoice = await trpcClient.invoices.getById.query({
			id: parseInt(params.invoiceId),
		});
		return {
			crumb: `Print Invoice ${invoice?.invoiceNumber}`,
			invoice,
		};
	},
	pendingComponent: () => (
		<PageLoading text="Loading invoice for printing..." />
	),
});

function InvoicePrintPage() {
	const { invoiceId } = Route.useParams();
	const { invoice } = Route.useLoaderData();
	const navigate = Route.useNavigate();

	const handleBack = () => {
		navigate({ to: `/invoices/$invoiceId`, params: { invoiceId } });
	};

	if (!invoice) {
		return <ErrorComponent error={new Error("Invoice not found")} />;
	}

	return (
		<div className="bg-white">
			<PrintControls onBack={handleBack} />

			<div className="max-w-4xl mx-auto p-8">
				<InvoicePrintTemplate invoice={invoice} />
			</div>
		</div>
	);
}
