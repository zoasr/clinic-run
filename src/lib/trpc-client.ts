import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import superjson from "superjson";
import type { AppRouter } from "./trpc";

const baseURL = import.meta.env.VITE_SERVER_URL || "http://localhost:3031";

export const queryClient = new QueryClient();

export const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${baseURL}/api/trpc`,
			fetch: (url, options) => {
				const demoToken = sessionStorage.getItem("demoToken");

				// Check if this is an auth-related request (these work without demo token)
				const isAuthRequest = url.toString().includes("auth");

				// Prevent non-auth requests if no demo token is available
				if (!demoToken && !isAuthRequest) {
					console.warn(
						"No demo token available - skipping non-auth tRPC request",
					);
					toast.error("Demo not initialized - no demo token available");
					return Promise.reject(
						new Error("Demo not initialized - no demo token available"),
					);
				}

				const headers = new Headers(options?.headers);

				if (demoToken) {
					headers.set("X-Demo-Token", `Bearer ${demoToken}`);
				}

				return fetch(url, {
					...options,
					headers,
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
