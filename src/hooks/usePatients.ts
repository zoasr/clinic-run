import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";
import type { AppRouter } from "@/lib/trpc-client";

// Infer types from tRPC
type Patient = AppRouter["patients"]["getById"]["_def"]["$types"]["output"];
type PatientInput = AppRouter["patients"]["create"]["_def"]["$types"]["input"];

interface PatientListParams {
	search?: string;
	page?: number;
	limit?: number;
}

export function usePatients(params?: PatientListParams) {
	return useQuery(trpc.patients.getAll.queryOptions(params || {}));
}

export function usePatient(patientId: number) {
	return useQuery(
		trpc.patients.getById.queryOptions(
			{ id: patientId },
			{ enabled: !!patientId }
		)
	);
}

export function useCreatePatient() {
	return useMutation(trpc.patients.create.mutationOptions());
}

export function useUpdatePatient() {
	return useMutation(trpc.patients.update.mutationOptions());
}

export function useDeletePatient(options) {
	return useMutation(trpc.patients.delete.mutationOptions(options));
}

// Export the Patient type for use in other components
export type { Patient, PatientInput };
