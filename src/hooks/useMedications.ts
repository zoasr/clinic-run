import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppRouter } from "@/lib/trpc";
import { trpc } from "@/lib/trpc-client";

// Infer types from tRPC
type Medication =
	AppRouter["medications"]["getAll"]["_def"]["$types"]["output"]["data"][number];
type MedicationInput =
	AppRouter["medications"]["create"]["_def"]["$types"]["input"];
type MedicationListParams =
	AppRouter["medications"]["getAll"]["_def"]["$types"]["input"];

export function useMedications(params?: MedicationListParams, opts?: any) {
	return useQuery(trpc.medications.getAll.queryOptions(params || {}, opts));
}

export function useMedication(medicationId: number) {
	return useQuery(
		trpc.medications.getById.queryOptions(
			{ id: medicationId },
			{ enabled: !!medicationId },
		),
	);
}

export function useCreateMedication() {
	return useMutation(trpc.medications.create.mutationOptions());
}

export function useUpdateMedication() {
	return useMutation(trpc.medications.update.mutationOptions());
}

export function useDeleteMedication(options) {
	return useMutation(trpc.medications.delete.mutationOptions(options));
}

// Export the Medication type for use in other components
export type { Medication, MedicationInput, MedicationListParams };
