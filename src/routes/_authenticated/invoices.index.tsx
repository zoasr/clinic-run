import { createFileRoute } from "@tanstack/react-router";
import { InvoiceManagement } from "@/components/invoice-management";

export const Route = createFileRoute("/_authenticated/invoices/")({
	component: () => <InvoiceManagement />,
	loader: () => ({
		crumb: "All Invoices",
	}),
});