import { createFileRoute } from "@tanstack/react-router";
import { SupplierManagement } from "@/components/supplier-list";

export const Route = createFileRoute("/_authenticated/medications/suppliers/")({
	loader: () => ({
		crumb: "Suppliers",
	}),
	component: SupplierManagement,
});
