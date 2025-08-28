import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PatientForm } from "@/components/patient-form";
import { PatientDetail } from "@/components/patient-detail";
import { usePatients, type Patient } from "@/hooks/usePatients";
import { Search, Plus, User, Phone, Mail, Trash2 } from "lucide-react";
import { useDeletePatient } from "@/hooks/usePatients";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function PatientManagement() {
	const [searchTerm, setSearchTerm] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
		null
	);
	const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

	const { data: patients = [], isLoading } = usePatients({
		search: searchTerm || undefined,
	});

	// Mutation for deleting patients
	const { mutate: deletePatient, isPending: isDeleting } = useDeletePatient({
		onSuccess: () => {
			toast.success("Patient deleted successfully");
		},
		onError: (error: Error) => {
			console.error("Failed to delete patient:", error);
			toast.error("Failed to delete patient");
		},
	});

	const handleDeletePatient = (patientId: number) => {
		deletePatient({ id: patientId });
	};

	const handlePatientSaved = () => {
		setShowForm(false);
		setEditingPatient(null);
	};

	const calculateAge = (dateOfBirth: string) => {
		const today = new Date();
		const birthDate = new Date(dateOfBirth);
		let age = today.getFullYear() - birthDate.getFullYear();
		const monthDiff = today.getMonth() - birthDate.getMonth();

		if (
			monthDiff < 0 ||
			(monthDiff === 0 && today.getDate() < birthDate.getDate())
		) {
			age--;
		}

		return age;
	};

	if (selectedPatient) {
		return (
			<PatientDetail
				patient={selectedPatient}
				onBack={() => setSelectedPatient(null)}
				onEdit={(patient) => {
					setEditingPatient(patient);
					setSelectedPatient(null);
					setShowForm(true);
				}}
			/>
		);
	}

	if (showForm) {
		return (
			<PatientForm
				patient={editingPatient}
				onSave={handlePatientSaved}
				onCancel={() => {
					setShowForm(false);
					setEditingPatient(null);
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
						Patient Management
					</h1>
					<p className="text-muted-foreground">
						Manage patient records and information
					</p>
				</div>
				<Button
					onClick={() => setShowForm(true)}
					className="flex items-center gap-2"
				>
					<Plus className="h-4 w-4" />
					Add New Patient
				</Button>
			</div>

			{/* Search */}
			<Card>
				<CardContent className="pt-6">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
						<Input
							placeholder="Search patients by name..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Patient List */}
			<div className="grid gap-4">
				{!isLoading && patients.length === 0 ? (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-8">
							<User className="h-12 w-12 text-muted-foreground mb-4" />
							<h3 className="text-lg font-medium text-foreground mb-2">
								No patients found
							</h3>
							<p className="text-muted-foreground text-center mb-4">
								{searchTerm
									? "No patients match your search criteria."
									: "Get started by adding your first patient."}
							</p>
							<Button onClick={() => setShowForm(true)}>
								<Plus className="h-4 w-4 mr-2" />
								Add Patient
							</Button>
						</CardContent>
					</Card>
				) : (
					patients?.map((patient: Patient) => (
						<Card
							key={patient.id}
							className="hover:shadow-md transition-shadow cursor-pointer"
						>
							<CardContent className="p-6">
								<div className="flex items-start justify-between">
									<div
										className="flex-1"
										onClick={() =>
											setSelectedPatient(patient)
										}
									>
										<div className="flex items-center gap-3 mb-2">
											<div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
												<User className="h-5 w-5 text-secondary" />
											</div>
											<div>
												<h3 className="font-semibold text-foreground">
													{patient.firstName}{" "}
													{patient.lastName}
												</h3>
												<p className="text-sm text-muted-foreground">
													ID: {patient.patientId}
												</p>
											</div>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
											<div className="flex items-center gap-2 text-sm">
												<User className="h-4 w-4 text-muted-foreground" />
												<span>
													Age:{" "}
													{calculateAge(
														patient.dateOfBirth
													)}
												</span>
												<Badge
													variant="outline"
													className="ml-2"
												>
													{patient.gender}
												</Badge>
											</div>

											{patient.phone && (
												<div className="flex items-center gap-2 text-sm">
													<Phone className="h-4 w-4 text-muted-foreground" />
													<span>{patient.phone}</span>
												</div>
											)}

											{patient.email && (
												<div className="flex items-center gap-2 text-sm">
													<Mail className="h-4 w-4 text-muted-foreground" />
													<span>{patient.email}</span>
												</div>
											)}
										</div>

										{patient.bloodType && (
											<div className="mt-3">
												<Badge variant="secondary">
													Blood Type:{" "}
													{patient.bloodType}
												</Badge>
											</div>
										)}
									</div>

									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												setEditingPatient(patient);
												setShowForm(true);
											}}
										>
											Edit
										</Button>
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button
													variant="outline"
													size="sm"
													className="text-red-600 hover:text-red-700 hover:bg-red-50"
													disabled={isDeleting}
													onClick={(e) => e.stopPropagation()}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>
														Delete Patient
													</AlertDialogTitle>
													<AlertDialogDescription>
														Are you sure you want to delete this patient? This action cannot be undone.
														<div className="mt-2 p-3 bg-muted rounded-md">
															<p className="font-medium">
																{patient.firstName} {patient.lastName}
															</p>
															<p className="text-sm text-muted-foreground">
																ID: {patient.patientId}
															</p>
														</div>
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>
														Cancel
													</AlertDialogCancel>
													<AlertDialogAction
														onClick={() =>
															handleDeletePatient(
																patient.id
															)
														}
														className="bg-red-600 hover:bg-red-700"
													>
														Delete
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</div>
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>
		</div>
	);
}
