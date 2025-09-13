import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";
import type { AppRouter } from "./trpc";

const baseURL = import.meta.env.VITE_SERVER_URL || "http://localhost:3031";

export const queryClient = new QueryClient();

export const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${baseURL}/api/trpc`,
			fetch: (url, options) => {
				return fetch(url, {
					...options,
					credentials: "include",
				});
			},
			transformer: superjson,
		}),
	],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});

// Query keys for invalidation
export const queryKeys = {
	auth: {
		getSession: () => trpc.auth.getSession.queryKey(),
	},
	patients: {
		all: () => trpc.patients.getAll.queryKey(),
		getById: (id: number) => trpc.patients.getById.queryKey({ id }),
	},
	appointments: {
		all: () => trpc.appointments.getAll.queryKey(),
		getById: (id: number) => trpc.appointments.getById.queryKey({ id }),
		getByPatientId: (patientId: number) =>
			trpc.appointments.getByPatientId.queryKey({ patientId }),
	},
	medicalRecords: {
		all: () => trpc.medicalRecords.getAll.queryKey(),
	},
	medications: {
		all: () => trpc.medications.getAll.queryKey(),
		getById: (id: number) => trpc.medications.getById.queryKey({ id }),
	},
	prescriptions: {
		all: () => trpc.prescriptions.getAll.queryKey(),
		getById: () => trpc.prescriptions.getById.queryKey(),
	},
	invoices: {
		all: () => trpc.invoices.getAll.queryKey(),
		getById: (id: number) => trpc.invoices.getById.queryKey({ id }),
	},
	labTests: {
		all: () => trpc.labTests.getAll.queryKey(),
		getById: (id: number) => trpc.labTests.getById.queryKey({ id }),
	},
	dashboard: {
		stats: () => trpc.dashboard.getStats.queryKey(),
	},
	users: {
		all: () => trpc.users.getAll.queryKey(),
		getById: (id: number) => trpc.users.getById.queryKey({ id: `${id}` }),
	},
} as const;
