import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import type { AppRouter } from "@/lib/trpc";
import { trpc } from "@/lib/trpc-client";

type Prescription =
	AppRouter["prescriptions"]["getById"]["_def"]["$types"]["output"];
type PrescriptionInput =
	AppRouter["prescriptions"]["create"]["_def"]["$types"]["input"];

interface PrescriptionListParams {
	search?: string;
	patientId?: number;
	isDispensed?: boolean;
	cursor?: number;
	limit?: number;
}

export function usePrescriptions(params?: PrescriptionListParams) {
	return useInfiniteQuery(
		trpc.prescriptions.getAll.infiniteQueryOptions(
			{
				search: params?.search,
				patientId: params?.patientId,
				isDispensed: params?.isDispensed,
				cursor: params?.cursor,
				limit: params?.limit,
			},
			{
				getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
			},
		),
	);
}

export function usePrescription(prescriptionId: number) {
	return useQuery(
		trpc.prescriptions.getById.queryOptions(
			{ id: prescriptionId },
			{ enabled: !!prescriptionId },
		),
	);
}

export function usePatientPrescriptions(
	patientId: number,
	params?: Omit<PrescriptionListParams, "patientId">,
) {
	return useQuery(
		trpc.prescriptions.getByPatientId.queryOptions(
			{ patientId, ...params },
			{ enabled: !!patientId },
		),
	);
}

export function useCreatePrescription() {
	return useMutation(trpc.prescriptions.create.mutationOptions());
}

export function useUpdatePrescription() {
	return useMutation(trpc.prescriptions.update.mutationOptions());
}

export function useDeletePrescription() {
	return useMutation(trpc.prescriptions.delete.mutationOptions());
}

export function useDispensePrescription() {
	return useMutation(trpc.prescriptions.dispense.mutationOptions());
}

export type { Prescription, PrescriptionInput };
