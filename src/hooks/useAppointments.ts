import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";
import type { AppRouter } from "@/lib/trpc";

// Infer types from tRPC
export type AppointmentListParams =
	AppRouter["appointments"]["getAll"]["_def"]["$types"]["input"];
export type Appointment =
	AppRouter["appointments"]["getByPatientId"]["_def"]["$types"]["output"][number];

export function useAppointments(params: AppointmentListParams) {
	return useInfiniteQuery(
		trpc.appointments.getAll.infiniteQueryOptions(
			{
				date: params.date,
				cursor: params.cursor,
				limit: params.limit,
				status: params.status,
			},
			{
				getNextPageParam: (lastPage) =>
					lastPage.nextCursor ?? undefined,
			}
		)
	);
}
export function useAppointmentMonth(date: string) {
	return useQuery(trpc.appointments.getByMonth.queryOptions({ date }));
}
export function useCreateAppointment(options) {
	return useMutation(trpc.appointments.create.mutationOptions(options));
}
export function useUpdateAppointment(options) {
	return useMutation(trpc.appointments.update.mutationOptions(options));
}

export function useDeleteAppointment(options) {
	return useMutation(trpc.appointments.delete.mutationOptions(options));
}

export function usePatientAppointments(patientId: number) {
	return useQuery(
		trpc.appointments.getByPatientId.queryOptions({ patientId })
	);
}
