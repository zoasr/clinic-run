import { useQuery, useMutation } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";
import type { AppRouter } from "@/lib/trpc-client";

// Infer types from tRPC
type Prescription =
	AppRouter["prescriptions"]["getById"]["_def"]["$types"]["output"];
type PrescriptionInput =
	AppRouter["prescriptions"]["create"]["_def"]["$types"]["input"];

interface PrescriptionListParams {
	search?: string;
	patientId?: number;
	isDispensed?: boolean;
	page?: number;
	limit?: number;
}

export function usePrescriptions(params?: PrescriptionListParams) {
	return useQuery(trpc.prescriptions.getAll.queryOptions(params || {}));
}

export function usePrescription(prescriptionId: number) {
	return useQuery(
		trpc.prescriptions.getById.queryOptions(
			{ id: prescriptionId },
			{ enabled: !!prescriptionId }
		)
	);
}

export function usePatientPrescriptions(
	patientId: number,
	params?: Omit<PrescriptionListParams, "patientId">
) {
	return useQuery(
		trpc.prescriptions.getByPatientId.queryOptions(
			{ patientId, ...params },
			{ enabled: !!patientId }
		)
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

// Export the Prescription type for use in other components
export type { Prescription, PrescriptionInput };
