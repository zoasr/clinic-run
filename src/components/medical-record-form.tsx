import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DatePicker } from "@/components/date-picker";
import { trpc } from "@/lib/trpc-client";
import { ArrowLeft, User } from "lucide-react";
import { MedicalRecord, Patient } from "@/lib/schema-types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { TRPCClientErrorLike } from "@trpc/client";
import { AppRouter } from "@/lib/trpc";
import { usePatient } from "@/hooks/usePatients";
import SearchPatientsDialog from "./search-patients-dialog";
import DoctorsDialog from "./search-doctors-dialog";
import { PageLoading } from "./ui/loading";

interface MedicalRecordFormProps {
	record?: MedicalRecord | null;
	onSave: () => void;
	onCancel: () => void;
}

export function MedicalRecordForm({
	record,
	onSave,
	onCancel,
}: MedicalRecordFormProps) {
	const { data: patient, isLoading } = usePatient(record?.patientId || 0);
	const [error, setError] = useState("");

	const parseVitalSigns = (vitalSigns?: string) => {
		if (!vitalSigns) return null;
		try {
			return JSON.parse(vitalSigns);
		} catch {
			return null;
		}
	};

	const vitalSigns =
		record?.vitalSigns && parseVitalSigns(record?.vitalSigns);

	const { mutate: create, isPending: createPending } = useMutation(
		trpc.medicalRecords.create.mutationOptions({
			onSuccess: () => {
				onSave();
				toast.success("Medical record created successfully");
			},
			onError: (error: TRPCClientErrorLike<AppRouter>) => {
				toast.error(error.message);
			},
		})
	);

	const { mutate: update, isPending: updatePending } = useMutation(
		trpc.medicalRecords.update.mutationOptions({
			onSuccess: () => {
				onSave();
				toast.success("Medical record updated successfully");
			},
			onError: (error: TRPCClientErrorLike<AppRouter>) => {
				toast.error(error.message);
			},
		})
	);

	const form = useForm({
		defaultValues: {
			patientId: record?.patientId || 0,
			doctorId: record?.doctorId || "",
			visitDate: record?.visitDate || new Date(),
			chiefComplaint: record?.chiefComplaint || "",
			diagnosis: record?.diagnosis || "",
			treatment: record?.treatment || "",
			prescription: record?.prescription || "",
			notes: record?.notes || "",
			vitalSigns: record?.vitalSigns || "",
			bloodPressure: vitalSigns?.bloodPressure || "",
			temperature: vitalSigns?.temperature || "",
			pulse: vitalSigns?.pulse || "",
			respiratoryRate: vitalSigns?.respiratoryRate || "",
			weight: vitalSigns?.weight || "",
			height: vitalSigns?.height || "",
			oxygenSaturation: vitalSigns?.oxygenSaturation || "",
		},
		onSubmit: async ({ value }) => {
			if (!value.patientId || value.patientId <= 0) {
				setError("Please select a patient");
				return;
			}

			try {
				const vitalSignsObj = {
					bloodPressure: value.bloodPressure,
					temperature: value.temperature,
					pulse: value.pulse,
					respiratoryRate: value.respiratoryRate,
					weight: value.weight,
					height: value.height,
					oxygenSaturation: value.oxygenSaturation,
				};

				// Check if any vital signs have values
				const hasVitalSigns = Object.values(vitalSignsObj).some(
					(val) => val && val.trim() !== ""
				);

				const recordData = {
					patientId: value.patientId,
					doctorId: value.doctorId,
					visitDate: value.visitDate,
					chiefComplaint: value.chiefComplaint?.trim() || "",
					diagnosis: value.diagnosis?.trim() || "",
					treatment: value.treatment?.trim() || "",
					prescription: value.prescription?.trim() || "",
					notes: value.notes?.trim() || "",
					vitalSigns: hasVitalSigns
						? JSON.stringify(vitalSignsObj)
						: "",
				};

				if (record?.id) {
					update({
						data: recordData,
						id: record.id,
					});
				} else {
					create(recordData);
				}
				onSave();
			} catch (err: any) {
				setError(err.message || "Failed to save medical record");
			}
		},
	});

	if (isLoading) {
		return <PageLoading text="Loading medical record for editing..." />;
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="outline" size="sm" onClick={onCancel}>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back
				</Button>
				<div>
					<h1 className="text-2xl font-serif font-bold text-foreground">
						{record
							? "Edit Medical Record"
							: "Add New Medical Record"}
					</h1>
					<p className="text-muted-foreground">
						{record
							? "Update medical record details"
							: "Create a new patient medical record"}
					</p>
				</div>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="space-y-6"
			>
				{/* Patient Selection */}
				<Card>
					<CardHeader>
						<CardTitle>Patient Information</CardTitle>
						<CardDescription>
							Select the patient for this medical record
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<form.Field
							name="patientId"
							validators={{
								onChange: (value) =>
									!value ? "Patient is required" : undefined,
							}}
							children={(field) => (
								<>
									<Label>Patient *</Label>
									<SearchPatientsDialog
										patient={patient}
										onSelect={(selectedPatient) => {
											field.handleChange(
												selectedPatient?.id || 0
											);
										}}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-red-600 mt-1">
											{field.state.meta.errors[0]}
										</p>
									)}
								</>
							)}
						/>

						{!!patient && (
							<>
								<h2 className="text-lg font-semibold text-foreground">
									Selected Patient
								</h2>
								<div className="p-3 bg-muted/50 rounded-lg">
									<div className="flex items-center gap-3">
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
											{patient.phone && (
												<p className="text-sm text-muted-foreground">
													{patient.phone}
												</p>
											)}
										</div>
									</div>
								</div>
							</>
						)}
					</CardContent>
				</Card>

				{/* Visit Information */}
				<Card>
					<CardHeader>
						<CardTitle>Visit Information</CardTitle>
						<CardDescription>
							Basic visit details and attending physician
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<form.Field
								name="visitDate"
								validators={{
									onChange: ({ value }) =>
										!value
											? "Visit date is required"
											: undefined,
								}}
								children={(field) => (
									<div className="space-y-2">
										<Label htmlFor="visitDate">
											Visit Date *
										</Label>
										<DatePicker
											selected={
												field.state.value
													? new Date(
															field.state.value
														)
													: undefined
											}
											onSelect={(date) => {
												field.handleChange(
													date ? date : new Date()
												);
											}}
											mode="single"
											captionLayout="dropdown"
											required
										/>
										{field.state.meta.errors.length > 0 && (
											<p className="text-sm text-red-600 mt-1">
												{field.state.meta.errors[0]}
											</p>
										)}
									</div>
								)}
							/>
							<form.Field
								name="doctorId"
								validators={{
									onChange: ({ value }) =>
										!value
											? "Doctor is required"
											: undefined,
								}}
								children={(field) => (
									<div>
										<Label htmlFor="doctorId">
											Attending Doctor *
										</Label>
										<DoctorsDialog
											onSelect={(doctor) =>
												field.handleChange(doctor.id)
											}
											doctorId={field.state.value}
										/>

										{field.state.meta.errors.length > 0 && (
											<p className="text-sm text-red-600 mt-1">
												{field.state.meta.errors[0]}
											</p>
										)}
									</div>
								)}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Vital Signs */}
				<Card>
					<CardHeader>
						<CardTitle>Vital Signs</CardTitle>
						<CardDescription>
							Record patient vital signs and measurements
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							<form.Field
								name="bloodPressure"
								children={(field) => (
									<div className="space-y-2">
										<Label htmlFor="bloodPressure">
											Blood Pressure
										</Label>
										<Input
											id="bloodPressure"
											placeholder="120/80"
											value={field.state.value || ""}
											onChange={(e) =>
												field.handleChange(
													e.target.value
												)
											}
										/>
									</div>
								)}
							/>
							<form.Field
								name="temperature"
								children={(field) => (
									<div className="space-y-2">
										<Label htmlFor="temperature">
											Temperature (°C)
										</Label>
										<Input
											id="temperature"
											type="number"
											step="0.1"
											placeholder="37.0"
											value={field.state.value || ""}
											onChange={(e) =>
												field.handleChange(
													e.target.value
												)
											}
										/>
									</div>
								)}
							/>
							<form.Field
								name="pulse"
								children={(field) => (
									<div className="space-y-2">
										<Label htmlFor="pulse">
											Pulse (bpm)
										</Label>
										<Input
											id="pulse"
											type="number"
											placeholder="72"
											value={field.state.value || ""}
											onChange={(e) =>
												field.handleChange(
													e.target.value
												)
											}
										/>
									</div>
								)}
							/>
							<form.Field
								name="respiratoryRate"
								children={(field) => (
									<div className="space-y-2">
										<Label htmlFor="respiratoryRate">
											Respiratory Rate
										</Label>
										<Input
											id="respiratoryRate"
											type="number"
											placeholder="16"
											value={field.state.value || ""}
											onChange={(e) =>
												field.handleChange(
													e.target.value
												)
											}
										/>
									</div>
								)}
							/>
							<form.Field
								name="weight"
								children={(field) => (
									<div className="space-y-2">
										<Label htmlFor="weight">
											Weight (kg)
										</Label>
										<Input
											id="weight"
											type="number"
											step="0.1"
											placeholder="68"
											value={field.state.value || ""}
											onChange={(e) =>
												field.handleChange(
													e.target.value
												)
											}
										/>
									</div>
								)}
							/>
							<form.Field
								name="height"
								children={(field) => (
									<div className="space-y-2">
										<Label htmlFor="height">
											Height (cm)
										</Label>
										<Input
											id="height"
											type="number"
											step="0.1"
											placeholder="173"
											value={field.state.value || ""}
											onChange={(e) =>
												field.handleChange(
													e.target.value
												)
											}
										/>
									</div>
								)}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Medical Information */}
				<Card>
					<CardHeader>
						<CardTitle>Medical Information</CardTitle>
						<CardDescription>
							Clinical findings, diagnosis, and treatment details
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<form.Field
							name="chiefComplaint"
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor="chiefComplaint">
										Chief Complaint
									</Label>
									<Textarea
										id="chiefComplaint"
										value={field.state.value}
										onChange={(e) =>
											field.handleChange(e.target.value)
										}
										placeholder="Patient's primary concern or reason for visit..."
										rows={2}
									/>
								</div>
							)}
						/>

						<form.Field
							name="diagnosis"
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor="diagnosis">Diagnosis</Label>
									<Input
										id="diagnosis"
										value={field.state.value}
										onChange={(e) =>
											field.handleChange(e.target.value)
										}
										placeholder="Primary diagnosis..."
									/>
								</div>
							)}
						/>

						<form.Field
							name="treatment"
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor="treatment">
										Treatment Plan
									</Label>
									<Textarea
										id="treatment"
										value={field.state.value}
										onChange={(e) =>
											field.handleChange(e.target.value)
										}
										placeholder="Treatment plan and procedures performed..."
										rows={3}
									/>
								</div>
							)}
						/>

						<form.Field
							name="prescription"
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor="prescription">
										Prescription
									</Label>
									<Textarea
										id="prescription"
										value={field.state.value}
										onChange={(e) =>
											field.handleChange(e.target.value)
										}
										placeholder="Medications prescribed..."
										rows={3}
									/>
								</div>
							)}
						/>

						<form.Field
							name="notes"
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor="notes">
										Additional Notes
									</Label>
									<Textarea
										id="notes"
										value={field.state.value}
										onChange={(e) =>
											field.handleChange(e.target.value)
										}
										placeholder="Additional observations, follow-up instructions, etc..."
										rows={4}
									/>
								</div>
							)}
						/>
					</CardContent>
				</Card>

				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{/* Actions */}
				<div className="flex justify-end gap-4">
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<form.Subscribe
						children={({ canSubmit }) => (
							<Button
								type="submit"
								disabled={
									createPending || updatePending || !canSubmit
								}
							>
								{createPending || updatePending
									? "Saving..."
									: record
										? "Update Record"
										: "Create Record"}
							</Button>
						)}
					/>
					{/* <Button
						type="submit"
						disabled={createPending || updatePending}
					>
						{createPending || updatePending
							? "Saving..."
							: record
								? "Update Record"
								: "Create Record"}
					</Button> */}
				</div>
			</form>
		</div>
	);
}
