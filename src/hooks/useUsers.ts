import { useQuery, useMutation } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";
import type { AppRouter } from "@/lib/trpc-client";

// Infer types from tRPC
type User = AppRouter["users"]["getById"]["_def"]["$types"]["output"];
type UserInput = AppRouter["users"]["create"]["_def"]["$types"]["input"];

interface UserListParams {
	search?: string;
	role?: string;
	page?: number;
	limit?: number;
}

export function useUsers(params?: UserListParams) {
	return useQuery(trpc.users.getAll.queryOptions(params || {}));
}

export function useUser(userId: string) {
	return useQuery(
		trpc.users.getById.queryOptions({ id: userId }, { enabled: !!userId })
	);
}

export function useUsersByRole(role: string) {
	return useQuery(
		trpc.users.getByRole.queryOptions({ role }, { enabled: !!role })
	);
}

export function useDoctors() {
	return useQuery(
		trpc.users.getByRole.queryOptions({ role: "doctor" }, { enabled: true })
	);
}

export function useCreateUser() {
	return useMutation(trpc.users.create.mutationOptions());
}

export function useUpdateUser() {
	return useMutation(trpc.users.update.mutationOptions());
}

export function useDeleteUser() {
	return useMutation(trpc.users.deactivate.mutationOptions());
}

export function useChangePassword() {
	return useMutation(trpc.users.changePassword.mutationOptions());
}

// Export the User type for use in other components
export type { User, UserInput };
