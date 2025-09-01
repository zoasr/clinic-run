import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";
import { AppRouter } from "@/lib/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import { useState } from "react";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import ErrorComponent from "@/components/error";
import { TableLoading } from "@/components/ui/loading";

type RouterOutput = inferRouterOutputs<AppRouter>;
type User = RouterOutput["users"]["getAll"][number];

export const Route = createFileRoute("/_authenticated/users/")({
	loader: () => ({
		crumb: "Users",
	}),
	component: UsersComponent,
});

function UsersComponent() {
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [userToDelete, setUserToDelete] = useState<User | null>(null);
	const queryClient = useQueryClient();

	const {
		data: users,
		isLoading,
		error,
	} = useQuery(trpc.users.getAll.queryOptions());

	const deleteUserMutation = useMutation(
		trpc.users.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.users.getAll.queryKey(),
				});
				toast.success("User deleted successfully");
				setDeleteDialogOpen(false);
				setUserToDelete(null);
			},
			onError: (error: any) => {
				toast.error(error.message || "Failed to delete user");
			},
		})
	);

	const handleDeleteClick = (user: User) => {
		setUserToDelete(user);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = () => {
		if (userToDelete) {
			deleteUserMutation.mutate({ id: userToDelete.id });
		}
	};

	if (isLoading) return <TableLoading rows={8} />;
	if (error) return <ErrorComponent error={error} />;

	return (
		<div className="p-4 text-foreground">
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-2xl font-bold text-foreground">
					User Management
				</h1>
				<Link to="/users/add">
					<Button>
						Add User
						<UserPlus className="w-4 h-4 mr-2" />
					</Button>
				</Link>
			</div>
			<div className="overflow-x-auto">
				<Table className="border rounded-lg">
					<TableHeader className="bg-accent">
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Username</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Created</TableHead>
							<TableHead className="text-right">
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{users?.map((user: User) => (
							<TableRow key={user.id}>
								<TableCell className="font-medium">
									{user.firstName} {user.lastName}
								</TableCell>
								<TableCell>{user.email}</TableCell>
								<TableCell>{user.username}</TableCell>
								<TableCell>
									<Badge variant="secondary">
										{user.role}
									</Badge>
								</TableCell>
								<TableCell>
									<Badge
										variant={
											user.isActive
												? "default"
												: "destructive"
										}
									>
										{user.isActive ? "Active" : "Inactive"}
									</Badge>
								</TableCell>
								<TableCell>
									{new Date(
										user.createdAt
									).toLocaleDateString()}
								</TableCell>
								<TableCell className="text-right">
									<div className="flex justify-end gap-2">
										<Button
											variant="outline"
											size="sm"
											asChild
										>
											<Link
												to={`/users/$userId/edit`}
												params={{ userId: user.id }}
											>
												<Pencil className="w-4 h-4" />
											</Link>
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												handleDeleteClick(user)
											}
											className="text-red-600 hover:text-red-700 hover:bg-red-50"
										>
											<Trash2 className="w-4 h-4" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete User</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete{" "}
							<strong>
								{userToDelete?.firstName}{" "}
								{userToDelete?.lastName}
							</strong>
							? This action cannot be undone and will permanently
							remove the user from the system.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-red-600 hover:bg-red-700"
						>
							Delete User
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
