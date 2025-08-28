import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";
import type { AppRouter } from "@/lib/trpc-client";

// Infer types from tRPC
type LabTest = AppRouter["labTests"]["getById"]["_def"]["$types"]["output"];
type LabTestInput = AppRouter["labTests"]["create"]["_def"]["$types"]["input"];

interface LabTestListParams {
	search?: string;
	status?: string;
	patientId?: number;
	testType?: string;
	page?: number;
	limit?: number;
}

export function useLabTests(params?: LabTestListParams) {
	return useQuery(trpc.labTests.getAll.queryOptions(params || {}));
}

export function useLabTest(labTestId: number) {
	return useQuery(
		trpc.labTests.getById.queryOptions(
			{ id: labTestId },
			{ enabled: !!labTestId }
		)
	);
}

export function usePatientLabTests(
	patientId: number,
	params?: Omit<LabTestListParams, "patientId">
) {
	return useQuery(
		trpc.labTests.getByPatientId.queryOptions(
			{ patientId, ...params },
			{ enabled: !!patientId }
		)
	);
}

export function useCreateLabTest() {
	return useMutation(trpc.labTests.create.mutationOptions());
}

export function useUpdateLabTest() {
	return useMutation(trpc.labTests.update.mutationOptions());
}

export function useDeleteLabTest() {
	return useMutation(trpc.labTests.delete.mutationOptions());
}

export function useUpdateLabTestStatus() {
	return useMutation(trpc.labTests.updateStatus.mutationOptions());
}

export type { LabTest, LabTestInput };
