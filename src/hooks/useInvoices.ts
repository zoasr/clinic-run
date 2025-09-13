import { useMutation, useQuery } from "@tanstack/react-query";
import type { AppRouter } from "@/lib/trpc";
import { trpc } from "@/lib/trpc-client";

// Infer types from tRPC
type Invoice = AppRouter["invoices"]["getById"]["_def"]["$types"]["output"];
type InvoiceInput = AppRouter["invoices"]["create"]["_def"]["$types"]["input"];

interface InvoiceListParams {
	search?: string;
	status?: string;
	patientId?: number;
	page?: number;
	limit?: number;
}

export function useInvoices(params?: InvoiceListParams) {
	return useQuery(trpc.invoices.getAll.queryOptions(params || {}));
}

export function useInvoice(invoiceId: number) {
	return useQuery(
		trpc.invoices.getById.queryOptions(
			{ id: invoiceId },
			{ enabled: !!invoiceId, retry: false },
		),
	);
}

export function usePatientInvoices(
	patientId: number,
	params?: Omit<InvoiceListParams, "patientId">,
) {
	return useQuery(
		trpc.invoices.getByPatientId.queryOptions(
			{ patientId, ...params },
			{ enabled: !!patientId },
		),
	);
}

export function useCreateInvoice() {
	return useMutation(trpc.invoices.create.mutationOptions());
}

export function useUpdateInvoice() {
	return useMutation(trpc.invoices.update.mutationOptions());
}

export function useDeleteInvoice(options) {
	return useMutation(trpc.invoices.delete.mutationOptions(options));
}

export function useMarkInvoiceAsPaid() {
	return useMutation(trpc.invoices.markAsPaid.mutationOptions());
}

export type { Invoice, InvoiceInput };
