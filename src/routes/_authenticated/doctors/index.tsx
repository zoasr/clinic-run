import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";
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
import { useAuth } from "@/contexts/AuthContext";
import ErrorComponent from "@/components/error";
import { TableLoading } from "@/components/ui/loading";

export const Route = createFileRoute("/_authenticated/doctors/")({
	loader: () => ({
		crumb: "Doctors",
	}),
	component: DoctorsComponent,
});

function DoctorsComponent() {
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [doctorToDelete, setDoctorToDelete] = useState<any>(null);
	const queryClient = useQueryClient();
	const { user } = useAuth();

	const {
		data: doctors,
		isLoading,
		error,
	} = useQuery(trpc.users.getDoctors.queryOptions());

	const deleteDoctorMutation = useMutation(
		trpc.users.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.users.getDoctors.queryKey(),
				});
				toast.success("Doctor deleted successfully");
				setDeleteDialogOpen(false);
				setDoctorToDelete(null);
			},
			onError: (error: any) => {
				toast.error(error.message || "Failed to delete doctor");
			},
		})
	);
	const isAdmin = user?.role === "admin";

	const handleDeleteClick = (doctor: any) => {
		setDoctorToDelete(doctor);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = () => {
		if (doctorToDelete) {
			deleteDoctorMutation.mutate({ id: doctorToDelete.id });
		}
	};

	if (isLoading) return <TableLoading rows={8} />;
	if (error) return <ErrorComponent error={error} />;

	return (
		<div className="p-4 text-foreground">
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-2xl font-bold text-foreground">Doctors</h1>
				{isAdmin && (
					<Button>
						<UserPlus className="w-4 h-4 mr-2" />
						Add Doctor
					</Button>
				)}
			</div>
			<div className="overflow-x-auto">
				<Table className="border rounded-lg">
					<TableHeader className="bg-accent">
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Username</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Created</TableHead>
							{isAdmin && (
								<TableHead className="text-right">
									Actions
								</TableHead>
							)}
						</TableRow>
					</TableHeader>
					<TableBody>
						{doctors?.map((doctor) => (
							<TableRow key={doctor.id}>
								<TableCell className="font-medium">
									{doctor.firstName} {doctor.lastName}
								</TableCell>
								<TableCell>{doctor.email}</TableCell>
								<TableCell>{doctor.username}</TableCell>
								<TableCell>
									<Badge
										variant={
											doctor.isActive
												? "default"
												: "destructive"
										}
									>
										{doctor.isActive
											? "Active"
											: "Inactive"}
									</Badge>
								</TableCell>
								<TableCell>
									{new Date(
										doctor.createdAt
									).toLocaleDateString()}
								</TableCell>
								{isAdmin && (
									<TableCell className="text-right">
										<div className="flex justify-end gap-2">
											<Button
												variant="outline"
												size="sm"
												asChild
											>
												<Link
													to={`/users/$userId/edit`}
													params={{
														userId: doctor.id,
													}}
												>
													<Pencil className="w-4 h-4" />
												</Link>
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													handleDeleteClick(doctor)
												}
												className="text-red-600 hover:text-red-700 hover:bg-red-50"
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										</div>
									</TableCell>
								)}
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
						<AlertDialogTitle>Delete Doctor</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete{" "}
							<strong>
								{doctorToDelete?.firstName}{" "}
								{doctorToDelete?.lastName}
							</strong>
							? This action cannot be undone and will permanently
							remove the doctor from the system.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-red-600 hover:bg-red-700"
						>
							Delete Doctor
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
