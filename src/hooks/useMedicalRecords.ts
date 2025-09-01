import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";
import type { AppRouter } from "@/lib/trpc";

export type MedicalRecordInput =
	AppRouter["medicalRecords"]["create"]["_def"]["$types"]["input"];
export type MedicalRecordUpdateInput =
	AppRouter["medicalRecords"]["update"]["_def"]["$types"]["input"];
export type MedicalRecordParams =
	AppRouter["medicalRecords"]["getAll"]["_def"]["$types"]["input"];
export type MedicalRecord =
	AppRouter["medicalRecords"]["getById"]["_def"]["$types"]["output"];

export function useMedicalRecords(params: MedicalRecordParams) {
	return useQuery(trpc.medicalRecords.getAll.queryOptions(params));
}

export function useCreateMedicalRecord() {
	return useMutation(trpc.medicalRecords.create.mutationOptions());
}

export function useUpdateMedicalRecord() {
	return useMutation(trpc.medicalRecords.update.mutationOptions());
}

export function useDeleteMedicalRecord(options) {
	return useMutation(trpc.medicalRecords.delete.mutationOptions(options));
}

export type MedicalRecordInfiniteParams =
	AppRouter["medicalRecords"]["getInfinite"]["_def"]["$types"]["input"];

export function useMedicalRecordsInfinite(params: MedicalRecordInfiniteParams) {
	return useInfiniteQuery(
		trpc.medicalRecords.getInfinite.infiniteQueryOptions(
			{
				...params,
				cursor: params.cursor,
			},
			{
				getNextPageParam: (lastPage) => lastPage.nextCursor,
			}
		)
	);
}
