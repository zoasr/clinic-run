import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
	usePrescriptions,
	useDeletePrescription,
	type Prescription,
} from "@/hooks/usePrescriptions";
import { Search, Plus, Pill, CheckCircle, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import LoadMore from "./load-more";
import ErrorComponent from "./error";
import { Loading, LoadingCards } from "./ui/loading";
import { trpc } from "@/lib/trpc-client";
import { useInfiniteQuery } from "@tanstack/react-query";

export function PrescriptionManagement() {
	const [searchTerm, setSearchTerm] = useState("");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [prescriptionToDelete, setPrescriptionToDelete] =
		useState<Prescription | null>(null);

	const {
		data,
		error,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery(
		trpc.prescriptions.getAll.infiniteQueryOptions(
			{
				search: searchTerm || undefined,

				limit: 20,
			},
			{
				getNextPageParam: (lastPage) =>
					lastPage.nextCursor ?? undefined,
			}
		)
	);

	const prescriptions = data?.pages?.flatMap((page) => page.data) || [];

	const deleteMutation = useDeletePrescription();

	const handleDeletePrescription = (prescription: Prescription) => {
		setPrescriptionToDelete(prescription);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (prescriptionToDelete) {
			deleteMutation.mutate(
				{ id: prescriptionToDelete.id },
				{
					onSuccess: () => {
						toast.success("Prescription deleted successfully");
						setDeleteDialogOpen(false);
						setPrescriptionToDelete(null);
					},
					onError: (error) => {
						toast.error(
							error.message || "Failed to delete prescription"
						);
					},
				}
			);
		}
	};

	const getStatusIcon = (isDispensed: boolean) => {
		return isDispensed ? CheckCircle : Clock;
	};

	if (error) return <ErrorComponent error={error} />;

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-display font-bold text-foreground">
						Prescription Management
					</h1>
					<p className="text-muted-foreground">
						Manage patient prescriptions and medication orders
					</p>
				</div>
				<Link to="/prescriptions/new">
					<Button className="flex items-center gap-2">
						<Plus className="h-4 w-4" />
						Add New Prescription
					</Button>
				</Link>
			</div>

			{/* Search */}
			<Card>
				<CardContent className="pt-6">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
						<Input
							placeholder="Search prescriptions by medication or patient..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Prescription List */}
			{isLoading ? (
				<LoadingCards />
			) : prescriptions.length === 0 ? (
				<Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
							<Pill className="h-8 w-8 text-primary" />
						</div>
						<h3 className="text-xl font-semibold text-foreground mb-2">
							No prescriptions found
						</h3>
						<p className="text-muted-foreground text-center mb-6 max-w-md">
							{searchTerm
								? "No prescriptions match your search criteria. Try adjusting your search terms."
								: "Get started by adding your first prescription to the system."}
						</p>
						<Link to="/prescriptions/new">
							<Button size="lg" className="shadow-sm">
								<Plus className="h-4 w-4 mr-2" />
								Add First Prescription
							</Button>
						</Link>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{prescriptions?.map((prescription: Prescription) => {
						if (!prescription) return null;
						const StatusIcon = getStatusIcon(
							prescription.isDispensed
						);
						const isPending = !prescription.isDispensed;
						const isDispensed = prescription.isDispensed;

						return (
							<Card
								key={prescription.id}
								className={`group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer border-border/50 hover:border-primary/20 ${
									isPending
										? "bg-orange-50/30 dark:bg-orange-950/10"
										: "bg-green-50/30 dark:bg-green-950/10"
								}`}
							>
								<CardContent className="p-6">
									{/* Header */}
									<div className="flex items-start justify-between mb-4">
										<Link
											to="/prescriptions/$prescriptionId"
											params={{
												prescriptionId:
													prescription.id.toString(),
											}}
											className="flex items-center gap-3 flex-1"
										>
											<div className="relative">
												<div
													className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
														isPending
															? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
															: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 group-hover:bg-primary/30"
													}`}
												>
													<Pill className="h-6 w-6" />
												</div>
												{isPending && (
													<div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
														<span className="text-xs text-white font-bold">
															!
														</span>
													</div>
												)}
											</div>
											<div className="flex-1 min-w-0">
												<h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
													{prescription.medication
														?.name ||
														"Unknown Medication"}
												</h3>
												<p className="text-sm text-muted-foreground truncate">
													{
														prescription.patient
															?.firstName
													}{" "}
													{
														prescription.patient
															?.lastName
													}
												</p>
											</div>
										</Link>
										<div className="flex flex-col gap-1">
											<Badge
												className={`${
													isPending
														? "bg-orange-100 text-orange-800 border-orange-200"
														: "bg-green-100 text-green-800 border-green-200"
												} border-0 text-xs`}
											>
												{isDispensed
													? "Dispensed"
													: "Pending"}
											</Badge>
										</div>
									</div>

									{/* Key Information Grid */}
									<div className="grid grid-cols-2 gap-4 mb-4">
										{/* Dosage & Form */}
										<div className="space-y-1">
											<p className="text-xs text-muted-foreground">
												Dosage
											</p>
											<p className="text-sm font-medium">
												{prescription.dosage}{" "}
												{prescription.medication
													?.form || ""}
											</p>
										</div>

										{/* Frequency */}
										<div className="space-y-1">
											<p className="text-xs text-muted-foreground">
												Frequency
											</p>
											<p className="text-sm font-medium">
												{prescription.frequency}
											</p>
										</div>

										{/* Quantity */}
										<div className="space-y-1">
											<p className="text-xs text-muted-foreground">
												Quantity
											</p>
											<p className="text-sm font-medium">
												{prescription.quantity} units
											</p>
										</div>

										{/* Doctor */}
										<div className="space-y-1">
											<p className="text-xs text-muted-foreground">
												Prescribing Doctor
											</p>
											<p className="text-sm font-medium truncate">
												Dr.{" "}
												{prescription.doctor?.firstName}{" "}
												{prescription.doctor?.lastName}
											</p>
										</div>
									</div>

									{/* Instructions */}
									{prescription.instructions && (
										<div className="mb-4 p-3 bg-muted/50 rounded-md">
											<p className="text-xs text-muted-foreground mb-1">
												Instructions
											</p>
											<p className="text-sm">
												{prescription.instructions}
											</p>
										</div>
									)}

									{/* Metadata */}
									<div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
										<span>
											Prescribed{" "}
											{new Date(
												prescription.createdAt
											).toLocaleDateString()}
										</span>
										{isDispensed && (
											<span className="text-green-600">
												Dispensed{" "}
												{new Date(
													prescription.updatedAt
												).toLocaleDateString()}
											</span>
										)}
									</div>

									{/* Actions */}
									<div className="flex items-center gap-2 pt-4 mt-4 border-t border-border/50">
										<Link
											to="/prescriptions/$prescriptionId"
											params={{
												prescriptionId:
													prescription.id.toString(),
											}}
										>
											<Button
												variant="ghost"
												size="sm"
												className="flex-1 opacity-20 group-hover:opacity-100 transition-all"
											>
												View Details
											</Button>
										</Link>
										<Link
											to="/prescriptions/edit/$prescriptionId"
											params={{
												prescriptionId:
													prescription.id.toString(),
											}}
										>
											<Button
												variant="outline"
												size="sm"
												className="opacity-20 group-hover:opacity-100 transition-all"
											>
												Edit
											</Button>
										</Link>
										<Button
											variant="outline"
											size="sm"
											className="opacity-20 group-hover:opacity-100 transition-all text-red-600 hover:text-red-700 hover:bg-red-50"
											onClick={(e) => {
												e.stopPropagation();
												handleDeletePrescription(
													prescription
												);
											}}
											disabled={deleteMutation.isPending}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
			<LoadMore
				results={prescriptions}
				hasNextPage={hasNextPage}
				fetchNextPage={fetchNextPage}
				isFetchingNextPage={isFetchingNextPage}
			/>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Prescription</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this prescription?
							This action cannot be undone.
							{prescriptionToDelete && (
								<div className="mt-2 p-3 bg-muted rounded-md">
									<p className="font-medium">
										{prescriptionToDelete.medication
											?.name || "Unknown Medication"}
									</p>
									<p className="text-sm text-muted-foreground">
										for{" "}
										{
											prescriptionToDelete.patient
												?.firstName
										}{" "}
										{prescriptionToDelete.patient?.lastName}
									</p>
								</div>
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							disabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending
								? "Deleting..."
								: "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
