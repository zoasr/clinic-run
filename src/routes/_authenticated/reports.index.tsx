import { createFileRoute } from "@tanstack/react-router";
import { ReportsDashboard } from "@/components/reports-dashboard";

function ReportsPage() {
	return <ReportsDashboard />;
}

export const Route = createFileRoute("/_authenticated/reports/")({
	component: ReportsPage,
	loader: () => ({
		crumb: "All Reports",
	}),
	beforeLoad: async ({ context }) => {},
});