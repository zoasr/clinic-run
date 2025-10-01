import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TRPCClientErrorLike } from "@trpc/client";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Patient } from "@/hooks/usePatients";
import type { AppRouter } from "@/lib/trpc";
import { trpc } from "@/lib/trpc-client";
import DoctorsDialog from "./search-doctors-dialog";
import SearchMedicationsDialog from "./search-medications-dialog";
import SearchPatientsDialog from "./search-patients-dialog";

type PrescriptionInput =
	AppRouter["prescriptions"]["create"]["_def"]["$types"]["input"];
type Prescription =
	AppRouter["prescriptions"]["getById"]["_def"]["$types"]["output"];

type PrescriptionFormValues = PrescriptionInput;

interface PrescriptionFormProps {
	prescription?: Prescription | null;
	onSave: () => void;
	onCancel: () => void;
}

export function PrescriptionForm({
	prescription,
	onSave,
	onCancel,
}: PrescriptionFormProps) {
	const queryClient = useQueryClient();

	const defaultValues: PrescriptionFormValues = {
		patientId: prescription?.patientId ?? 0,
		doctorId: prescription?.doctorId ?? "",
		medicationId: prescription?.medicationId ?? 0,
		medicalRecordId: prescription?.medicalRecordId ?? undefined,
		dosage: prescription?.dosage ?? "",
		frequency: prescription?.frequency ?? "",
		duration: prescription?.duration ?? "",
		instructions: prescription?.instructions ?? "",
		quantity: prescription?.quantity ?? 1,
	};

	const createMutation = useMutation(
		trpc.prescriptions.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["prescriptions"],
					refetchType: "active",
				});
				onSave();
				toast.success("Prescription created successfully");
			},
			onError: (error: TRPCClientErrorLike<AppRouter>) => {
				toast.error(`Failed to create prescription: ${error.message}`);
			},
		}),
	);

	const updateMutation = useMutation(
		trpc.prescriptions.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["prescriptions"],
					refetchType: "active",
				});
				onSave();
				toast.success("Prescription updated successfully");
			},
			onError: (error: TRPCClientErrorLike<AppRouter>) => {
				toast.error(`Failed to update prescription: ${error.message}`);
			},
		}),
	);

	const { isPending, error } = prescription?.id
		? updateMutation
		: createMutation;

	const form = useForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			const sanitized = {
				patientId: value.patientId,
				doctorId: value.doctorId,
				medicationId: value.medicationId,
				medicalRecordId: value.medicalRecordId || undefined,
				dosage: value.dosage.trim(),
				frequency: value.frequency.trim(),
				duration: value.duration.trim(),
				instructions: value.instructions?.trim() || undefined,
				quantity: value.quantity,
			};

			if (prescription?.id) {
				updateMutation.mutate({ id: prescription.id, data: sanitized });
			} else {
				createMutation.mutate(sanitized);
			}
		},
	});

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="outline" size="sm" onClick={onCancel}>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back
				</Button>
			</div>
			<div>
				<h1 className="text-2xl font-serif font-bold text-foreground">
					{prescription ? "Edit Prescription" : "Add New Prescription"}
				</h1>
				<p className="text-muted-foreground">
					{prescription
						? "Update prescription details"
						: "Create a new prescription for a patient"}
				</p>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="space-y-6"
			>
				{/* Patient, Doctor and Medication Selection */}
				<Card>
					<CardHeader>
						<CardTitle>Patient, Doctor & Medication</CardTitle>
						<CardDescription>
							Select the patient, prescribing doctor, and medication for this
							prescription
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor="patientId">Patient *</Label>
								<form.Field
									name="patientId"
									validators={{
										onChange: ({ value }) =>
											!value || value === 0 ? "Patient is required" : undefined,
									}}
								>
									{(field) => (
										<>
											<SearchPatientsDialog
												patient={prescription?.patient as Patient}
												onSelect={(patient) =>
													field.handleChange(patient?.id || 0)
												}
											/>
										</>
									)}
								</form.Field>
							</div>

							<div className="space-y-2">
								<Label htmlFor="doctorId">Doctor *</Label>
								<form.Field
									name="doctorId"
									validators={{
										onChange: ({ value }) =>
											!value?.trim() ? "Doctor is required" : undefined,
									}}
								>
									{(field) => (
										<>
											<DoctorsDialog
												onSelect={(doctor) => field.handleChange(doctor?.id)}
												doctorId={prescription?.doctor?.id as string}
											/>
										</>
									)}
								</form.Field>
							</div>

							<div className="space-y-2">
								<Label htmlFor="medicationId">Medication *</Label>
								<form.Field
									name="medicationId"
									validators={{
										onChange: ({ value }) =>
											!value || value === 0
												? "Medication is required"
												: undefined,
									}}
								>
									{(field) => (
										<>
											<SearchMedicationsDialog
												medication={
													prescription?.medication
														? prescription.medication
														: null
												}
												onSelect={(medication) =>
													field.handleChange(medication?.id || 0)
												}
											/>
										</>
									)}
								</form.Field>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Prescription Details */}
				<Card>
					<CardHeader>
						<CardTitle>Prescription Details</CardTitle>
						<CardDescription>
							Dosage, frequency, and usage instructions
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor="dosage">Dosage *</Label>
								<form.Field
									name="dosage"
									validators={{
										onChange: ({ value }) =>
											!value?.trim() ? "Dosage is required" : undefined,
									}}
								>
									{(field) => (
										<Input
											id="dosage"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="e.g., 500mg, 2 tablets"
											required
										/>
									)}
								</form.Field>
							</div>

							<div className="space-y-2">
								<Label htmlFor="frequency">Frequency *</Label>
								<form.Field
									name="frequency"
									validators={{
										onChange: ({ value }) =>
											!value?.trim() ? "Frequency is required" : undefined,
									}}
								>
									{(field) => (
										<Input
											id="frequency"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="e.g., Twice daily, Every 8 hours"
											required
										/>
									)}
								</form.Field>
							</div>

							<div className="space-y-2">
								<Label htmlFor="quantity">Quantity *</Label>
								<form.Field
									name="quantity"
									validators={{
										onChange: ({ value }) =>
											!value || value <= 0
												? "Quantity must be greater than 0"
												: undefined,
									}}
								>
									{(field) => (
										<Input
											id="quantity"
											type="number"
											min="1"
											value={field.state.value}
											onChange={(e) =>
												field.handleChange(parseInt(e.target.value) || 1)
											}
											required
										/>
									)}
								</form.Field>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="duration">Duration *</Label>
							<form.Field
								name="duration"
								validators={{
									onChange: ({ value }) =>
										!value?.trim() ? "Duration is required" : undefined,
								}}
							>
								{(field) => (
									<Input
										id="duration"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="e.g., 7 days, 2 weeks, 1 month"
										required
									/>
								)}
							</form.Field>
						</div>

						<div className="space-y-2">
							<Label htmlFor="instructions">Instructions</Label>
							<form.Field name="instructions">
								{(field) => (
									<Textarea
										id="instructions"
										value={field.state.value || ""}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Special instructions for the patient..."
										rows={3}
									/>
								)}
							</form.Field>
						</div>
					</CardContent>
				</Card>

				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error.message}</AlertDescription>
					</Alert>
				)}

				{/* Actions */}
				<div className="flex justify-end gap-4">
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<Button type="submit" disabled={isPending}>
						{isPending ? "Saving..." : "Save Prescription"}
					</Button>
				</div>
			</form>
		</div>
	);
}
