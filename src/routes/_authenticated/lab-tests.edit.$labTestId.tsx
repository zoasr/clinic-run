import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LabTestForm } from "@/components/lab-test-form";
import { PageLoading } from "@/components/ui/loading";
import { trpc } from "@/lib/trpc-client";

export const Route = createFileRoute(
	"/_authenticated/lab-tests/edit/$labTestId",
)({
	loader: () => ({
		crumb: "Edit Lab Test",
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const { labTestId } = Route.useParams();
	const navigate = Route.useNavigate();
	const {
		data: labTest,
		isLoading,
		error,
	} = useQuery(
		trpc.labTests.getById.queryOptions({
			id: Number(labTestId),
		}),
	);

	if (isLoading) {
		return <PageLoading text="Loading lab test for editing..." />;
	}

	if (error) {
		return <div>Error: {error.message}</div>;
	}

	if (!labTest) {
		return <div>Lab test with id {labTestId} not found</div>;
	}

	return (
		<>
			<h1>Edit Lab Test</h1>
			<LabTestForm
				labTest={labTest}
				onSave={() => {
					navigate({ to: "/lab-tests" });
				}}
				onCancel={() => {
					navigate({ to: "/lab-tests" });
				}}
			/>
		</>
	);
}
