import type React from "react";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Field } from "@tanstack/react-form";
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
import { queryKeys, trpc } from "@/lib/trpc-client";
import { ArrowLeft, Search, User } from "lucide-react";
import { Appointment } from "@/lib/schema-types";

interface AppointmentFormProps {
	appointment?: Appointment | null;
	onSave: () => void;
	onCancel: () => void;
}

export function AppointmentForm({
	appointment,
	onSave,
	onCancel,
}: AppointmentFormProps) {
	const [patientSearch, setPatientSearch] = useState("");
	const [selectedPatient, setSelectedPatient] = useState<any>(null);

	const form = useForm({
		defaultValues: {
			patientId: appointment?.patientId || 0,
			doctorId: appointment?.doctorId || "",
			appointmentDate: appointment?.appointmentDate || "",
			appointmentTime: appointment?.appointmentTime || "",
			duration: appointment?.duration || 30,
			type: appointment?.type || "consultation",
			status: appointment?.status || "scheduled",
			notes: appointment?.notes || "",
		} as Omit<Appointment, "createdAt" | "updatedAt">,
		onSubmit: async ({ value }) => {
			if (!selectedPatient) {
				return;
			}

			const appointmentData = {
				...value,
				patientId: selectedPatient.id,
				doctorId: value.doctorId,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			if (appointment?.id) {
				updateAppointmentMutation.mutate({
					id: appointment.id,
					data: appointmentData,
				});
			} else {
				saveAppointment(appointmentData);
			}
		},
	});

	const queryClinet = useQueryClient();
	const appointementsKey = trpc.appointments.getAll.queryKey();

	const { data: doctors = [] } = useQuery(
		trpc.users.getByRole.queryOptions({ role: "doctor" })
	);

	const filteredDoctors = doctors;

	const { data: patientsData = [], isLoading: patientsLoading } = useQuery(
		trpc.patients.getAll.queryOptions({
			search: patientSearch || undefined,
			page: 1,
			limit: 100,
		})
	);

	const {
		mutate: saveAppointment,
		error: mutationError,
		isPending: isSaving,
	} = useMutation(
		trpc.appointments.create.mutationOptions({
			onSuccess: () => {
				queryClinet.invalidateQueries({
					queryKey: [appointementsKey, queryKeys.dashboard.stats()],
				});
				onSave();
			},
			onError: (error) => {
				console.error("Failed to save appointment:", error);
			},
		})
	);

	const updateAppointmentMutation = useMutation(
		trpc.appointments.update.mutationOptions({
			onSuccess: () => {
				queryClinet.invalidateQueries({
					queryKey: [appointementsKey, queryKeys.dashboard.stats()],
				});
				onSave();
			},
			onError: (error) => {
				console.error("Failed to update appointment:", error);
			},
		})
	);

	useEffect(() => {
		if (appointment) {
			form.reset({
				patientId: appointment.patientId,
				doctorId: appointment.doctorId,
				appointmentDate: appointment.appointmentDate,
				appointmentTime: appointment.appointmentTime,
				duration: appointment.duration,
				type: appointment.type,
				status: appointment.status,
				notes: appointment.notes,
			});
			// Find and set the selected patient
			const patient = patientsData.find(
				(p: any) => p.id === appointment.patientId
			);
			if (patient) {
				setSelectedPatient(patient);
			}
		}
	}, [appointment, patientsData, form]);

	// Debounce patient search
	useEffect(() => {
		const debounceTimer = setTimeout(() => {
			// The query will automatically refetch when patientSearch changes
		}, 300);

		return () => clearTimeout(debounceTimer);
	}, [patientSearch]);

	const handlePatientSelect = (patient: any) => {
		setSelectedPatient(patient);
		setPatientSearch("");
	};

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center gap-4 mb-6">
				<Button
					variant="ghost"
					size="sm"
					onClick={onCancel}
					className="flex items-center gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					Back
				</Button>
				<div>
					<h1 className="text-2xl font-serif font-bold text-foreground">
						{appointment
							? "Edit Appointment"
							: "Schedule Appointment"}
					</h1>
					<p className="text-muted-foreground">
						{appointment
							? "Update appointment details"
							: "Create a new appointment"}
					</p>
				</div>
			</div>

			<form onSubmit={form.handleSubmit} className="space-y-6">
				{/* Patient Selection */}
				<Card>
					<CardHeader>
						<CardTitle>Patient Information</CardTitle>
						<CardDescription>
							Search and select a patient for this appointment
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
							<Input
								placeholder="Search patients by name..."
								value={patientSearch}
								onChange={(e) =>
									setPatientSearch(e.target.value)
								}
								className="pl-10"
							/>
						</div>

						{selectedPatient && (
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
												{selectedPatient.firstName}{" "}
												{selectedPatient.lastName}
											</h3>
											<p className="text-sm text-muted-foreground">
												ID: {selectedPatient.patientId}
											</p>
										</div>
									</div>
								</div>
							</>
						)}

						{patientsLoading ? (
							<div className="text-center py-4">
								<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
							</div>
						) : (
							<div>
								{patientsData.length > 0 && (
									<div className="max-h-60 overflow-y-auto space-y-2 p-2 border rounded-lg">
										<h2 className="text-lg font-semibold text-foreground">
											Select Patient
										</h2>
										{patientsData
											.filter(
												(p) =>
													p.id !== selectedPatient?.id
											)
											.map((patient: any) => (
												<div
													key={patient.id}
													className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
													onClick={() =>
														handlePatientSelect(
															patient
														)
													}
												>
													<div className="flex items-center gap-3">
														<div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
															<User className="h-4 w-4 text-secondary" />
														</div>
														<div>
															<h4 className="font-medium text-foreground">
																{
																	patient.firstName
																}{" "}
																{
																	patient.lastName
																}
															</h4>
															<p className="text-sm text-muted-foreground">
																ID:{" "}
																{
																	patient.patientId
																}
															</p>
														</div>
													</div>
												</div>
											))}
									</div>
								)}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Appointment Details */}
				<Card>
					<CardHeader>
						<CardTitle>Appointment Details</CardTitle>
						<CardDescription>
							Set the appointment time, duration, and type
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<form.Field
								name="appointmentDate"
								validators={{
									onChange: ({ value }) =>
										!value ? "Date is required" : undefined,
								}}
								children={(field) => (
									<div>
										<Label htmlFor="appointmentDate">
											Date *
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
														? date.toISOString()
														: ""
												);
											}}
											disabled={(date) => {
												// Disable past dates for new appointments
												const today = new Date();
												today.setHours(0, 0, 0, 0);
												return date < today;
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
								name="appointmentTime"
								validators={{
									onChange: ({ value }) =>
										!value ? "Time is required" : undefined,
								}}
								children={(field) => (
									<div>
										<Label htmlFor="appointmentTime">
											Time *
										</Label>
										<Input
											id="appointmentTime"
											type="time"
											value={field.state.value}
											onChange={(e) =>
												field.handleChange(
													e.target.value
												)
											}
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
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<form.Field
								name="duration"
								validators={{
									onChange: ({ value }) =>
										!value
											? "Duration is required"
											: undefined,
								}}
								children={(field) => (
									<div>
										<Label htmlFor="duration">
											Duration (minutes) *
										</Label>
										<Select
											value={field.state.value?.toString()}
											onValueChange={(value) =>
												field.handleChange(
													parseInt(value)
												)
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="15">
													15 minutes
												</SelectItem>
												<SelectItem value="30">
													30 minutes
												</SelectItem>
												<SelectItem value="45">
													45 minutes
												</SelectItem>
												<SelectItem value="60">
													1 hour
												</SelectItem>
												<SelectItem value="90">
													1.5 hours
												</SelectItem>
												<SelectItem value="120">
													2 hours
												</SelectItem>
											</SelectContent>
										</Select>
										{field.state.meta.errors.length > 0 && (
											<p className="text-sm text-red-600 mt-1">
												{field.state.meta.errors[0]}
											</p>
										)}
									</div>
								)}
							/>

							<form.Field
								name="type"
								validators={{
									onChange: ({ value }) =>
										!value ? "Type is required" : undefined,
								}}
								children={(field) => (
									<div>
										<Label htmlFor="type">Type *</Label>
										<Select
											value={field.state.value}
											onValueChange={(value) =>
												field.handleChange(value)
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="consultation">
													Consultation
												</SelectItem>
												<SelectItem value="checkup">
													Checkup
												</SelectItem>
												<SelectItem value="follow-up">
													Follow-up
												</SelectItem>
												<SelectItem value="emergency">
													Emergency
												</SelectItem>
											</SelectContent>
										</Select>
										{field.state.meta.errors.length > 0 && (
											<p className="text-sm text-red-600 mt-1">
												{field.state.meta.errors[0]}
											</p>
										)}
									</div>
								)}
							/>
						</div>

						<form.Field
							name="doctorId"
							validators={{
								onChange: ({ value }) =>
									!value ? "Doctor is required" : undefined,
							}}
							children={(field) => (
								<div>
									<Label htmlFor="doctorId">Doctor *</Label>
									<Select
										value={field.state.value}
										onValueChange={(value) =>
											field.handleChange(value)
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select a doctor" />
										</SelectTrigger>
										<SelectContent>
											{filteredDoctors.map(
												(doctor: any) => (
													<SelectItem
														key={doctor.id}
														value={doctor.id}
													>
														Dr. {doctor.firstName}{" "}
														{doctor.lastName}
													</SelectItem>
												)
											)}
										</SelectContent>
									</Select>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-red-600 mt-1">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						/>

						<form.Field
							name="notes"
							children={(field) => (
								<div>
									<Label htmlFor="notes">Notes</Label>
									<Textarea
										id="notes"
										placeholder="Additional notes about the appointment..."
										value={field.state.value || ""}
										onChange={(e) =>
											field.handleChange(e.target.value)
										}
										rows={3}
									/>
								</div>
							)}
						/>
					</CardContent>
				</Card>

				{/* Actions */}
				<div className="flex justify-end gap-4">
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={isSaving || !selectedPatient}
					>
						{isSaving
							? "Saving..."
							: appointment
								? "Update"
								: "Schedule"}
					</Button>
				</div>

				{mutationError && (
					<Alert variant="destructive">
						<AlertDescription>
							{mutationError.message}
						</AlertDescription>
					</Alert>
				)}
			</form>
		</div>
	);
}
