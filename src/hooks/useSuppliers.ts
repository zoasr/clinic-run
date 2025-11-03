import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";

export function useDeleteSupplier(options?: {
	onSuccess?: () => void;
	onError?: (error: Error) => void;
}) {
	const queryClient = useQueryClient();

	return useMutation({
		...trpc.medicationSuppliers.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["medicationSuppliers"],
					refetchType: "active",
				});
				options?.onSuccess?.();
			},
			onError: (error) => {
				options?.onError?.(error);
			},
		}),
	});
}
