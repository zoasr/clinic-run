import { createFileRoute, Link } from "@tanstack/react-router";
import { PrescriptionManagement } from "@/components/prescription-management";

export const Route = createFileRoute("/_authenticated/prescriptions/")({
	component: () => <PrescriptionManagement />,
	loader: () => ({
		crumb: "All Prescriptions",
	}),
});