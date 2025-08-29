import { LabTestDetail } from "@/components/lab-test-detail";
import { trpc } from "@/lib/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PageLoading } from "@/components/ui/loading";

export const Route = createFileRoute("/_authenticated/lab-tests/$labTestId")({
	loader: ({ params }) => {
		return {
			crumb: "Lab Test Details",
			params,
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { params } = Route.useLoaderData();
	const navigate = Route.useNavigate();
	const {
		data: labTest,
		isLoading,
		error,
	} = useQuery(
		trpc.labTests.getById.queryOptions({
			id: Number(params.labTestId),
		})
	);

	if (isLoading) {
		return <PageLoading text="Loading lab test details..." />;
	}

	if (error) {
		return <div>Error: {error.message}</div>;
	}

	if (!labTest) {
		return <div>Lab test with id {params.labTestId} not found</div>;
	}

	return (
		<LabTestDetail
			labTest={labTest}
			onBack={() => navigate({ to: "/lab-tests" })}
		/>
	);
}
