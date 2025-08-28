import { createFileRoute } from "@tanstack/react-router";
import { LabTestForm } from "@/components/lab-test-form";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";

export const Route = createFileRoute(
	"/_authenticated/lab-tests/edit/$labTestId"
)({
	loader: () => ({
		crumb: "Edit Lab Test",
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const { labTestId } = Route.useParams();
	const navigate = Route.useNavigate();
	const { data: labTest } = useQuery(
		trpc.labTests.getById.queryOptions({
			id: Number(labTestId),
		})
	)
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
	)
}
