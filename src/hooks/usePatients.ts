import { useQuery, useMutation } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";
import type { AppRouter } from "@/lib/trpc";

// Pagination types
export interface PaginationMeta {
	page: number;
	limit: number;
	totalCount: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
}

export interface PaginatedPatientsResponse {
	data: Patient[];
	pagination: PaginationMeta;
}

// Infer types from tRPC
type Patient = AppRouter["patients"]["getById"]["_def"]["$types"]["output"];
type PatientInput = AppRouter["patients"]["create"]["_def"]["$types"]["input"];

interface PatientListParams {
	search?: string;
	cursor?: number;
	limit?: number;
}

export function usePatients(params?: PatientListParams, options?: any) {
	return useQuery(trpc.patients.getAll.queryOptions(params || {}, options));
}

// Note: For infinite queries, use useInfiniteQuery directly in components
// This hook is kept for backward compatibility with regular queries

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

export function useDeletePatient(options?: any) {
	return useMutation(trpc.patients.delete.mutationOptions(options));
}

// Export the Patient type for use in other components
export type { Patient, PatientInput };
