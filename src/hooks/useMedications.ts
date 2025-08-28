import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";
import type { AppRouter } from "@/lib/trpc-client";

// Infer types from tRPC
type Medication =
	AppRouter["medications"]["getAll"]["_def"]["$types"]["output"];
type MedicationInput =
	AppRouter["medications"]["create"]["_def"]["$types"]["input"];
type MedicationListParams =
	AppRouter["medications"]["getAll"]["_def"]["$types"]["input"];

export function useMedications(params?: MedicationListParams) {
	return useQuery(trpc.medications.getAll.queryOptions(params || {}));
}

export function useMedication(medicationId: number) {
	return useQuery(
		trpc.medications.getById.queryOptions(
			{ id: medicationId },
			{ enabled: !!medicationId }
		)
	);
}

export function useCreateMedication() {
	return useMutation(trpc.medications.create.mutationOptions());
}

export function useUpdateMedication() {
	return useMutation(trpc.medications.update.mutationOptions());
}

export function useDeleteMedication() {
	return useMutation(trpc.medications.delete.mutationOptions());
}

// Export the Medication type for use in other components
export type { Medication, MedicationInput, MedicationListParams };
