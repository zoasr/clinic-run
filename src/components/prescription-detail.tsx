import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TRPCClientErrorLike } from "@trpc/client";
import {
	ArrowLeft,
	Calendar,
	CheckCircle,
	Clock,
	Edit,
	Pill,
	User,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { Prescription } from "@/hooks/usePrescriptions";
import type { AppRouter } from "@/lib/trpc";
import { queryKeys, trpc } from "@/lib/trpc-client";
import NotFound from "./not-found";

interface PrescriptionDetailProps {
	prescription: Prescription;
	onBack: () => void;
	onEdit: (prescription: Prescription) => void;
}

export function PrescriptionDetail({
	prescription,
	onBack,
	onEdit,
}: PrescriptionDetailProps) {
	const queryClient = useQueryClient();

	const dispenseMutation = useMutation(
		trpc.prescriptions.dispense.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: queryKeys.prescriptions.getById(),
					refetchType: "active",
				});
				toast.success("Prescription marked as dispensed");
			},
			onError: (error: TRPCClientErrorLike<AppRouter>) => {
				toast.error(`Failed to mark as dispensed: ${error.message}`);
			},
		}),
	);

	const indespenseMutation = useMutation(
		trpc.prescriptions.inDispense.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: queryKeys.prescriptions.getById(),
					refetchType: "active",
				});
				toast.success("Prescription marked as pending");
			},
			onError: (error: TRPCClientErrorLike<AppRouter>) => {
				toast.error(`Failed to mark as pending: ${error.message}`);
			},
		}),
	);

	if (!prescription) {
		return <NotFound />;
	}

	const handleDispense = () => {
		if (prescription.id) {
			dispenseMutation.mutate({ id: prescription.id });
		}
	};

	const getStatusColor = (isDispensed: boolean) => {
		return isDispensed ? "default" : "secondary";
	};

	const getStatusIcon = (isDispensed: boolean) => {
		return isDispensed ? CheckCircle : Clock;
	};

	const StatusIcon = getStatusIcon(prescription.isDispensed);

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="outline" size="sm" onClick={onBack}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back
					</Button>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						onClick={() => onEdit(prescription)}
						className="flex items-center gap-2"
					>
						<Edit className="h-4 w-4" />
						Edit
					</Button>

					{!prescription.isDispensed ? (
						<Button
							onClick={handleDispense}
							disabled={dispenseMutation.isPending}
							className="flex items-center gap-2"
						>
							<CheckCircle className="h-4 w-4" />
							{dispenseMutation.isPending
								? "Dispensing..."
								: "Mark as Dispensed"}
						</Button>
					) : (
						<Button
							onClick={() =>
								indespenseMutation.mutate({
									id: prescription.id,
								})
							}
							disabled={indespenseMutation.isPending}
						>
							<CheckCircle className="h-4 w-4" />
							Mark as Pending
						</Button>
					)}
				</div>
			</div>
			<div>
				<h1 className="text-2xl font-display font-bold text-foreground">
					Prescription Details
				</h1>
				<p className="text-muted-foreground">
					Prescription for {prescription.patient?.firstName}{" "}
					{prescription.patient?.lastName}
				</p>
			</div>

			{/* Status Banner */}
			<Card>
				<CardContent>
					<div className="flex items-center gap-3">
						<StatusIcon className="h-6 w-6 text-muted-foreground" />
						<div>
							<h3 className="font-semibold text-foreground">
								Status: {prescription.isDispensed ? "Dispensed" : "Pending"}
							</h3>
							<p className="text-sm text-muted-foreground">
								{prescription.isDispensed
									? "This prescription has been dispensed to the patient"
									: "This prescription is pending and ready for dispensing"}
							</p>
						</div>
						<Badge
							variant={getStatusColor(prescription.isDispensed)}
							className="ml-auto"
						>
							{prescription.isDispensed ? "Dispensed" : "Pending"}
						</Badge>
					</div>
				</CardContent>
			</Card>

			{/* Prescription Information */}
			<div className="grid gap-6 md:grid-cols-2">
				{/* Patient Information */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<User className="h-5 w-5" />
							Patient Information
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<p className="text-sm text-muted-foreground">Name</p>
							<p className="font-medium">
								{prescription.patient?.firstName}{" "}
								{prescription.patient?.lastName}
							</p>
							<p className="text-sm text-muted-foreground">
								ID: {prescription.patient?.patientId}
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Doctor Information */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<User className="h-5 w-5" />
							Prescribing Doctor
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<p className="text-sm text-muted-foreground">Name</p>
							<p className="font-medium">
								Dr. {prescription.doctor?.firstName}{" "}
								{prescription.doctor?.lastName}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Medication Details */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Pill className="h-5 w-5" />
						Medication Details
					</CardTitle>
					<CardDescription>
						Prescribed medication and dosage information
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-3">
							<div>
								<p className="text-sm text-muted-foreground">Medication</p>
								<p className="font-medium">
									{prescription.medication?.name || "Unknown"}
								</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Dosage</p>
								<p className="font-medium">{prescription.dosage}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Form</p>
								<p className="font-medium">
									{prescription.medication?.form || "N/A"}
								</p>
							</div>
						</div>

						<div className="space-y-3">
							<div>
								<p className="text-sm text-muted-foreground">Frequency</p>
								<p className="font-medium">{prescription.frequency}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Duration</p>
								<p className="font-medium">{prescription.duration}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Quantity</p>
								<p className="font-medium">{prescription.quantity} units</p>
							</div>
						</div>
					</div>

					{prescription.instructions && (
						<div className="pt-4 border-t">
							<p className="text-sm text-muted-foreground mb-2">Instructions</p>
							<div className="p-3 bg-muted/50 rounded-md">
								<p className="text-sm">{prescription.instructions}</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Prescription Metadata */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Calendar className="h-5 w-5" />
						Prescription Timeline
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<p className="text-sm text-muted-foreground">Created</p>
							<p className="font-medium">
								{new Date(prescription.createdAt).toLocaleDateString()} at{" "}
								{new Date(prescription.createdAt).toLocaleTimeString()}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Last Updated</p>
							<p className="font-medium">
								{new Date(prescription.updatedAt).toLocaleDateString()} at{" "}
								{new Date(prescription.updatedAt).toLocaleTimeString()}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{dispenseMutation.error && (
				<Alert variant="destructive">
					<AlertDescription>{dispenseMutation.error.message}</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
