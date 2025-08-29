import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
import { ArrowLeft, Search, User } from "lucide-react";
import { MedicalRecord, Patient } from "@/lib/schema-types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { TRPCClientErrorLike } from "@trpc/client";
import { AppRouter } from "lib";
import z from "zod";

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
	const { data: doctors, isLoading: doctorsLoading } = useQuery(
		trpc.users.getByRole.queryOptions({ role: "doctor" })
	);

	const { data: patients, isLoading: patientsLoading } = useQuery(
		trpc.patients.getAll.queryOptions({ limit: 100 })
	);
	const [patientSearch, setPatientSearch] = useState("");
	const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
		record?.patientId
			? (patients?.find((p) => p.id === record?.patientId) ?? null)
			: null
	);
	const loading = doctorsLoading || patientsLoading;
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

	const createMutation = useMutation(
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

	const updateMutation = useMutation(
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
			doctorId: record?.doctorId || 0,
			visitDate:
				record?.visitDate || new Date().toLocaleDateString(),
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
			if (!selectedPatient) {
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

				const recordData = {
					patientId: selectedPatient.id!,
					doctorId: `${value.doctorId}`,
					visitDate: value.visitDate,
					chiefComplaint: value.chiefComplaint,
					diagnosis: value.diagnosis,
					treatment: value.treatment,
					prescription: value.prescription,
					notes: value.notes,
					vitalSigns: Object.keys(vitalSignsObj).some(
						(key) =>
							vitalSignsObj[key as keyof typeof vitalSignsObj]
					)
						? JSON.stringify(vitalSignsObj)
						: "",
				};

				if (record?.id) {
					updateMutation.mutate({
						data: recordData,
						id: record.id,
					});
				} else {
					createMutation.mutate(recordData);
				}
				onSave();
			} catch (err: any) {
				setError(err.message || "Failed to save medical record");
			}
		},
	});

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

			<form onSubmit={form.handleSubmit} className="space-y-6">
				{/* Patient Selection */}
				<Card>
					<CardHeader>
						<CardTitle>Patient Information</CardTitle>
						<CardDescription>
							Select the patient for this medical record
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{selectedPatient ? (
							<div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-secondary text-foreground rounded-full flex items-center justify-center">
										<User className="h-5 w-5 " />
									</div>
									<div>
										<h3 className="font-semibold">
											{selectedPatient.firstName}{" "}
											{selectedPatient.lastName}
										</h3>
										<p className="text-sm text-muted-foreground">
											ID: {selectedPatient.id}
										</p>
										{selectedPatient.phone && (
											<p className="text-sm text-muted-foreground">
												{selectedPatient.phone}
											</p>
										)}
									</div>
								</div>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setSelectedPatient(null)}
								>
									Change Patient
								</Button>
							</div>
						) : (
							<div className="space-y-4">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
									<Input
										placeholder="Search patients by name or ID..."
										value={patientSearch}
										onChange={(e) =>
											setPatientSearch(e.target.value)
										}
										className="pl-10"
									/>
								</div>

								{!!patients && patients.length > 0 && (
									<div className="max-h-60 overflow-y-auto space-y-2">
										{patients.map((patient) => (
											<div
												key={patient.id}
												className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
												onClick={() =>
													setSelectedPatient(patient)
												}
											>
												<div className="flex items-center gap-3">
													<div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
														<User className="h-4 w-4 text-secondary" />
													</div>
													<div>
														<p className="font-medium">
															{patient.firstName}{" "}
															{patient.lastName}
														</p>
														<p className="text-sm text-muted-foreground">
															ID:{" "}
															{patient.patientId}
														</p>
													</div>
												</div>
												<Button
													type="button"
													variant="outline"
													size="sm"
												>
													Select
												</Button>
											</div>
										))}
									</div>
								)}
							</div>
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
													date
														? date.toLocaleDateString()
														: ""
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
									onChange: z
										.string()
										.min(1, "Doctor is required"),
								}}
								children={(field) => (
									<div className="space-y-2">
										<Label htmlFor="doctorId">
											Attending Doctor *
										</Label>
										<Select
											value={field.state.value.toString()}
											onValueChange={(value) =>
												field.handleChange(value)
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select doctor" />
											</SelectTrigger>
											<SelectContent>
												{!!doctors &&
													doctors.map((doctor) => (
														<SelectItem
															key={doctor.id}
															value={doctor.id}
														>
															Dr.{" "}
															{doctor.firstName}{" "}
															{doctor.lastName}
														</SelectItem>
													))}
											</SelectContent>
										</Select>
										{field.state.meta.errors.length > 0 && (
											<p className="text-sm text-red-600 mt-1">
												{field.state.meta.errors.map(
													(error) => error?.message
												)}
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
					<Button
						type="submit"
						disabled={loading || !selectedPatient}
					>
						{loading
							? "Saving..."
							: record
								? "Update Record"
								: "Create Record"}
					</Button>
				</div>
			</form>
		</div>
	);
}
