import { MedicalRecordForm } from "@/components/medical-record-form";
import { trpc } from "@/lib/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PageLoading } from "@/components/ui/loading";

export const Route = createFileRoute(
	"/_authenticated/medical-records/edit/$medicalRecordId"
)({
	loader: ({ params }) => {
		return {
			crumb: "Edit Medical Record",
			params,
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { params } = Route.useLoaderData();
	const navigate = Route.useNavigate();

	const {
		data: record,
		isLoading,
		error,
	} = useQuery(
		trpc.medicalRecords.getById.queryOptions({
			id: Number(params.medicalRecordId),
		})
	);

	if (isLoading) {
		return <PageLoading text="Loading medical record for editing..." />;
	}
	if (error) {
		return <div>Error: {error.message}</div>;
	}
	if (!record) {
		return (
			<div>Medical record with id {params.medicalRecordId} not found</div>
		);
	}

	return (
		<MedicalRecordForm
			record={record}
			onSave={() => navigate({ to: "/medical-records" })}
			onCancel={() => navigate({ to: "/medical-records" })}
		/>
	);
}
