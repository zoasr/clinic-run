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
import { PrescriptionForm } from "@/components/prescription-form";
import { PrescriptionDetail } from "@/components/prescription-detail";
import {
	usePrescriptions,
	useDeletePrescription,
	type Prescription,
} from "@/hooks/usePrescriptions";
import {
	Search,
	Plus,
	Pill,
	User,
	Calendar,
	CheckCircle,
	Clock,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";

export function PrescriptionManagement() {
	const [searchTerm, setSearchTerm] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [selectedPrescription, setSelectedPrescription] =
		useState<Prescription | null>(null);
	const [editingPrescription, setEditingPrescription] =
		useState<Prescription | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [prescriptionToDelete, setPrescriptionToDelete] =
		useState<Prescription | null>(null);

	const { data: prescriptions = [], isLoading } = usePrescriptions({
		search: searchTerm || undefined,
	});

	const deleteMutation = useDeletePrescription();

	const handlePrescriptionSaved = () => {
		setShowForm(false);
		setEditingPrescription(null);
	};

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

	const getStatusColor = (isDispensed: boolean) => {
		return isDispensed ? "default" : "secondary";
	};

	const getStatusIcon = (isDispensed: boolean) => {
		return isDispensed ? CheckCircle : Clock;
	};

	if (selectedPrescription) {
		return (
			<PrescriptionDetail
				prescription={selectedPrescription}
				onBack={() => setSelectedPrescription(null)}
				onEdit={(prescription) => {
					setEditingPrescription(prescription);
					setSelectedPrescription(null);
					setShowForm(true);
				}}
			/>
		);
	}

	if (showForm) {
		return (
			<PrescriptionForm
				prescription={editingPrescription}
				onSave={handlePrescriptionSaved}
				onCancel={() => {
					setShowForm(false);
					setEditingPrescription(null);
				}}
			/>
		);
	}

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
				<Button
					onClick={() => setShowForm(true)}
					className="flex items-center gap-2"
				>
					<Plus className="h-4 w-4" />
					Add New Prescription
				</Button>
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
			<div className="grid gap-4">
				{!isLoading && prescriptions.length === 0 ? (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-8">
							<Pill className="h-12 w-12 text-muted-foreground mb-4" />
							<h3 className="text-lg font-medium text-foreground mb-2">
								No prescriptions found
							</h3>
							<p className="text-muted-foreground text-center mb-4">
								{searchTerm
									? "No prescriptions match your search criteria."
									: "Get started by adding your first prescription."}
							</p>
							<Button onClick={() => setShowForm(true)}>
								<Plus className="h-4 w-4 mr-2" />
								Add Prescription
							</Button>
						</CardContent>
					</Card>
				) : (
					prescriptions?.map((prescription: Prescription) => {
						const StatusIcon = getStatusIcon(
							prescription.isDispensed
						);
						return (
							<Card
								key={prescription.id}
								className="hover:shadow-md transition-shadow cursor-pointer"
							>
								<CardContent className="p-6">
									<div className="flex items-start justify-between">
										<div
											className="flex-1"
											onClick={() =>
												setSelectedPrescription(
													prescription
												)
											}
										>
											<div className="flex items-center gap-3 mb-2">
												<div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
													<Pill className="h-5 w-5 text-secondary" />
												</div>
												<div>
													<h3 className="font-semibold text-foreground">
														{prescription.medication
															?.name ||
															"Unknown Medication"}
													</h3>
													<p className="text-sm text-muted-foreground">
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
											</div>

											<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
												<div className="flex items-center gap-2 text-sm">
													<Pill className="h-4 w-4 text-muted-foreground" />
													<span>
														Dosage:{" "}
														{prescription.dosage}
													</span>
												</div>

												<div className="flex items-center gap-2 text-sm">
													<Calendar className="h-4 w-4 text-muted-foreground" />
													<span>
														{prescription.frequency}
													</span>
												</div>

												<div className="flex items-center gap-2 text-sm">
													<User className="h-4 w-4 text-muted-foreground" />
													<span>
														Dr.{" "}
														{
															prescription.doctor
																?.firstName
														}{" "}
														{
															prescription.doctor
																?.lastName
														}
													</span>
												</div>

												<div className="flex items-center gap-2">
													<StatusIcon className="h-4 w-4 text-muted-foreground" />
													<Badge
														variant={getStatusColor(
															prescription.isDispensed
														)}
													>
														{prescription.isDispensed
															? "Dispensed"
															: "Pending"}
													</Badge>
												</div>
											</div>

											{prescription.instructions && (
												<div className="mt-3 p-3 bg-muted/50 rounded-md">
													<p className="text-sm text-muted-foreground">
														<strong>
															Instructions:
														</strong>{" "}
														{
															prescription.instructions
														}
													</p>
												</div>
											)}
										</div>

										<div className="flex items-center gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													setEditingPrescription(
														prescription
													);
													setShowForm(true);
												}}
											>
												Edit
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													handleDeletePrescription(
														prescription
													);
												}}
												className="text-destructive hover:text-destructive"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						);
					})
				)}
			</div>

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

// 	if (selectedPrescription) {
// 		return (
// 			<PrescriptionDetail
// 				prescription={selectedPrescription}
// 				onBack={() => setSelectedPrescription(null)}
// 				onEdit={(prescription) => {
// 					setEditingPrescription(prescription);
// 					setSelectedPrescription(null);
// 					setShowForm(true);
// 				}}
// 			/>
// 		);
// 	}

// 	if (showForm) {
// 		return (
// 			<PrescriptionForm
// 				prescription={editingPrescription}
// 				onSave={handlePrescriptionSaved}
// 				onCancel={() => {
// 					setShowForm(false);
// 					setEditingPrescription(null);
// 				}}
// 			/>
// 		);
// 	}

// 	return (
// 		<div className="space-y-6 p-6">
// 			{/* Header */}
// 			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
// 				<div>
// 					<h1 className="text-2xl font-display font-bold text-foreground">
// 						Prescription Management
// 					</h1>
// 					<p className="text-muted-foreground">
// 						Manage patient prescriptions and medication orders
// 					</p>
// 				</div>
// 				<Button
// 					onClick={() => setShowForm(true)}
// 					className="flex items-center gap-2"
// 				>
// 					<Plus className="h-4 w-4" />
// 					Add New Prescription
// 				</Button>
// 			</div>

// 			{/* Search */}
// 			<Card>
// 				<CardContent className="pt-6">
// 					<div className="relative">
// 						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
// 						<Input
// 							placeholder="Search prescriptions by medication or patient..."
// 							value={searchTerm}
// 							onChange={(e) => setSearchTerm(e.target.value)}
// 							className="pl-10"
// 						/>
// 					</div>
// 				</CardContent>
// 			</Card>

// 			{/* Prescription List */}
// 			<div className="grid gap-4">
// 				{!isLoading && prescriptions.length === 0 ? (
// 					<Card>
// 						<CardContent className="flex flex-col items-center justify-center py-8">
// 							<Pill className="h-12 w-12 text-muted-foreground mb-4" />
// 							<h3 className="text-lg font-medium text-foreground mb-2">
// 								No prescriptions found
// 							</h3>
// 							<p className="text-muted-foreground text-center mb-4">
// 								{searchTerm
// 									? "No prescriptions match your search criteria."
// 									: "Get started by adding your first prescription."}
// 							</p>
// 							<Button onClick={() => setShowForm(true)}>
// 								<Plus className="h-4 w-4 mr-2" />
// 								Add Prescription
// 							</Button>
// 						</CardContent>
// 					</Card>
// 				) : (
// 					prescriptions?.map((prescription: Prescription) => {
// 						const StatusIcon = getStatusIcon(prescription.isDispensed);
// 						return (
// 							<Card
// 								key={prescription.id}
// 								className="hover:shadow-md transition-shadow cursor-pointer"
// 							>
// 								<CardContent className="p-6">
// 									<div className="flex items-start justify-between">
// 										<div
// 											className="flex-1"
// 											onClick={() =>
// 												setSelectedPrescription(prescription)
// 											}
// 										>
// 											<div className="flex items-center gap-3 mb-2">
// 												<div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
// 													<Pill className="h-5 w-5 text-secondary" />
// 												</div>
// 												<div>
// 													<h3 className="font-semibold text-foreground">
// 														{prescription.medication?.name || "Unknown Medication"}
// 													</h3>
// 													<p className="text-sm text-muted-foreground">
// 														{prescription.patient?.firstName} {prescription.patient?.lastName}
// 													</p>
// 												</div>
// 											</div>

// 											<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
// 												<div className="flex items-center gap-2 text-sm">
// 													<Pill className="h-4 w-4 text-muted-foreground" />
// 													<span>Dosage: {prescription.dosage}</span>
// 												</div>

// 												<div className="flex items-center gap-2 text-sm">
// 													<Calendar className="h-4 w-4 text-muted-foreground" />
// 													<span>{prescription.frequency}</span>
// 												</div>

// 												<div className="flex items-center gap-2 text-sm">
// 													<User className="h-4 w-4 text-muted-foreground" />
// 													<span>Dr. {prescription.doctor?.firstName} {prescription.doctor?.lastName}</span>
// 												</div>

// 												<div className="flex items-center gap-2">
// 													<StatusIcon className="h-4 w-4 text-muted-foreground" />
// 													<Badge variant={getStatusColor(prescription.isDispensed)}>
// 														{prescription.isDispensed ? "Dispensed" : "Pending"}
// 													</Badge>
// 												</div>
// 											</div>

// 											{prescription.instructions && (
// 												<div className="mt-3 p-3 bg-muted/50 rounded-md">
// 													<p className="text-sm text-muted-foreground">
// 														<strong>Instructions:</strong> {prescription.instructions}
// 													</p>
// 												</div>
// 											)}
// 										</div>

// 										<div className="flex items-center gap-2">
// 											<Button
// 												variant="outline"
// 												size="sm"
// 												onClick={(e) => {
// 													e.stopPropagation();
// 													setEditingPrescription(prescription);
// 													setShowForm(true);
// 												}}
// 											>
// 												Edit
// 											</Button>
// 											<Button
// 												variant="outline"
// 												size="sm"
// 												onClick={(e) => {
// 													e.stopPropagation();
// 													handleDeletePrescription(prescription);
// 												}}
// 												className="text-destructive hover:text-destructive"
// 											>
// 												<Trash2 className="h-4 w-4" />
// 											</Button>
// 										</div>
// 									</div>
// 								</CardContent>
// 							</Card>
// 						);
// 					})
// 				)}
// 			</div>

// 			{/* Delete Confirmation Dialog */}
// 			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
// 				<AlertDialogContent>
// 					<AlertDialogHeader>
// 						<AlertDialogTitle>Delete Prescription</AlertDialogTitle>
// 						<AlertDialogDescription>
// 							Are you sure you want to delete this prescription? This action cannot be undone.
// 							{prescriptionToDelete && (
// 								<div className="mt-2 p-3 bg-muted rounded-md">
// 									<p className="font-medium">
// 										{prescriptionToDelete.medication?.name || "Unknown Medication"}
// 									</p>
// 									<p className="text-sm text-muted-foreground">
// 										for {prescriptionToDelete.patient?.firstName} {prescriptionToDelete.patient?.lastName}
// 									</p>
// 								</div>
// 							)}
// 						</AlertDialogDescription>
// 					</AlertDialogHeader>
// 					<AlertDialogFooter>
// 						<AlertDialogCancel>Cancel</AlertDialogCancel>
// 						<AlertDialogAction
// 							onClick={confirmDelete}
// 							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
// 							disabled={deleteMutation.isPending}
// 						>
// 							{deleteMutation.isPending ? "Deleting..." : "Delete"}
// 						</AlertDialogAction>
// 					</AlertDialogFooter>
// 				</AlertDialogContent>
// 			</AlertDialog>
// 		</div>
// 	);
// }

// 	const handleDeletePrescription = (prescription: Prescription) => {
// 		setPrescriptionToDelete(prescription);
// 		setDeleteDialogOpen(true);
// 	};

// 	const confirmDelete = () => {
// 		if (prescriptionToDelete) {
// 			deleteMutation.mutate(
// 				{ id: prescriptionToDelete.id },
// 				{
// 					onSuccess: () => {
// 						toast.success("Prescription deleted successfully");
// 						setDeleteDialogOpen(false);
// 						setPrescriptionToDelete(null);
// 					},
// 					onError: (error) => {
// 						toast.error(error.message || "Failed to delete prescription");
// 					},
// 				}
// 			);
// 		}
// 	};

// 	const getStatusColor = (isDispensed: boolean) => {
// 		return isDispensed ? "default" : "secondary";
// 	};

// 	const getStatusIcon = (isDispensed: boolean) => {
// 		return isDispensed ? CheckCircle : Clock;
// 	};

// 	const getStatusIcon = (isDispensed: boolean) => {
// 		return isDispensed ? CheckCircle : Clock;
// 	};

// 	if (selectedPrescription) {
// 		return (
// 			<PrescriptionDetail
// 				prescription={selectedPrescription}
// 				onBack={() => setSelectedPrescription(null)}
// 				onEdit={(prescription) => {
// 					setEditingPrescription(prescription);
// 					setSelectedPrescription(null);
// 					setShowForm(true);
// 				}}
// 			/>
// 		);
// 	}

// 	if (showForm) {
// 		return (
// 			<PrescriptionForm
// 				prescription={editingPrescription}
// 				onSave={handlePrescriptionSaved}
// 				onCancel={() => {
// 					setShowForm(false);
// 					setEditingPrescription(null);
// 				}}
// 			/>
// 		);
// 	}

// 	return (
// 		<div className="space-y-6 p-6">
// 			{/* Header */}
// 			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
// 				<div>
// 					<h1 className="text-2xl font-display font-bold text-foreground">
// 						Prescription Management
// 					</h1>
// 					<p className="text-muted-foreground">
// 						Manage patient prescriptions and medication orders
// 					</p>
// 				</div>
// 				<Button
// 					onClick={() => setShowForm(true)}
// 					className="flex items-center gap-2"
// 				>
// 					<Plus className="h-4 w-4" />
// 					Add New Prescription
// 				</Button>
// 			</div>

// 			{/* Search */}
// 			<Card>
// 				<CardContent className="pt-6">
// 					<div className="relative">
// 						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
// 						<Input
// 							placeholder="Search prescriptions by medication or patient..."
// 							value={searchTerm}
// 							onChange={(e) => setSearchTerm(e.target.value)}
// 							className="pl-10"
// 						/>
// 					</div>
// 				</CardContent>
// 			</Card>

// 			{/* Prescription List */}
// 			<div className="grid gap-4">
// 				{!isLoading && prescriptions.length === 0 ? (
// 					<Card>
// 						<CardContent className="flex flex-col items-center justify-center py-8">
// 							<Pill className="h-12 w-12 text-muted-foreground mb-4" />
// 							<h3 className="text-lg font-medium text-foreground mb-2">
// 								No prescriptions found
// 							</h3>
// 							<p className="text-muted-foreground text-center mb-4">
// 								{searchTerm
// 									? "No prescriptions match your search criteria."
// 									: "Get started by adding your first prescription."}
// 							</p>
// 							<Button onClick={() => setShowForm(true)}>
// 								<Plus className="h-4 w-4 mr-2" />
// 								Add Prescription
// 							</Button>
// 						</CardContent>
// 					</Card>
// 				) : (
// 					prescriptions?.map((prescription: Prescription) => {
// 						const StatusIcon = getStatusIcon(prescription.isDispensed);
// 						return (
// 							<Card
// 								key={prescription.id}
// 								className="hover:shadow-md transition-shadow cursor-pointer"
// 							>
// 								<CardContent className="p-6">
// 									<div className="flex items-start justify-between">
// 										<div
// 											className="flex-1"
// 											onClick={() =>
// 												setSelectedPrescription(prescription)
// 											}
// 										>
// 											<div className="flex items-center gap-3 mb-2">
// 												<div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
// 													<Pill className="h-5 w-5 text-secondary" />
// 												</div>
// 												<div>
// 													<h3 className="font-semibold text-foreground">
// 														{prescription.medication?.name || "Unknown Medication"}
// 													</h3>
// 													<p className="text-sm text-muted-foreground">
// 														{prescription.patient?.firstName} {prescription.patient?.lastName}
// 													</p>
// 												</div>
// 											</div>

// 											<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
// 												<div className="flex items-center gap-2 text-sm">
// 													<Pill className="h-4 w-4 text-muted-foreground" />
// 													<span>Dosage: {prescription.dosage}</span>
// 												</div>

// 												<div className="flex items-center gap-2 text-sm">
// 													<Calendar className="h-4 w-4 text-muted-foreground" />
// 													<span>{prescription.frequency}</span>
// 												</div>

// 												<div className="flex items-center gap-2 text-sm">
// 													<User className="h-4 w-4 text-muted-foreground" />
// 													<span>Dr. {prescription.doctor?.firstName} {prescription.doctor?.lastName}</span>
// 												</div>

// 												<div className="flex items-center gap-2">
// 													<StatusIcon className="h-4 w-4 text-muted-foreground" />
// 													<Badge variant={getStatusColor(prescription.isDispensed)}>
// 														{prescription.isDispensed ? "Dispensed" : "Pending"}
// 													</Badge>
// 												</div>
// 											</div>

// 											{prescription.instructions && (
// 												<div className="mt-3 p-3 bg-muted/50 rounded-md">
// 													<p className="text-sm text-muted-foreground">
// 														<strong>Instructions:</strong> {prescription.instructions}
// 													</p>
// 												</div>
// 											)}
// 										</div>

// 										<Button
// 											variant="outline"
// 											size="sm"
// 											onClick={(e) => {
// 												e.stopPropagation();
// 												setEditingPrescription(prescription);
// 												setShowForm(true);
// 											}}
// 										>
// 											Edit
// 										</Button>
// 									</div>
// 								</CardContent>
// 							</Card>
// 						);
// 					})
// 				)}
// 			</div>
// 		</div>
// 	);
// }
