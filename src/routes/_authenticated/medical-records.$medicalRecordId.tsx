import { MedicalRecordDetail } from "@/components/medical-record-detail";
import { MedicalRecordForm } from "@/components/medical-record-form";
import { trpc } from "@/lib/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageLoading } from "@/components/ui/loading";

export const Route = createFileRoute(
	"/_authenticated/medical-records/$medicalRecordId"
)({
	loader: ({ params }) => {
		return {
			crumb: "Medical Record Details",
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
		return <PageLoading text="Loading medical record..." />;
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
		<MedicalRecordDetail
			record={record}
			onEdit={(record) =>
				navigate({
					to: "/medical-records/edit/$medicalRecordId",
					params: { medicalRecordId: record?.id.toString() },
				})
			}
			onBack={() => navigate({ to: "/medical-records" })}
		/>
	);
}
