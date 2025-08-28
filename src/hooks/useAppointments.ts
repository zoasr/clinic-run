import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/api";
import type { AppRouter } from "@/lib/trpc-client";

// Infer types from tRPC
export type AppointmentListParams =
	AppRouter["appointments"]["getAll"]["_def"]["$types"]["input"];
export type Appointment =
	AppRouter["appointments"]["getByPatientId"]["_def"]["$types"]["output"];

export function useAppointments(params: AppointmentListParams) {
	return useQuery(
		trpc.appointments.getAll.queryOptions({
			date: params.date,
			page: params.page,
			limit: params.limit,
			status: params.status,
		})
	);
}
export function useCreateAppointment(options) {
	return useMutation(trpc.appointments.create.mutationOptions(options));
}
export function useUpdateAppointment(options) {
	return useMutation(trpc.appointments.update.mutationOptions(options));
}

export function usePatientAppointments(patientId: number) {
	return useQuery(
		trpc.appointments.getByPatientId.queryOptions({ patientId })
	);
}
