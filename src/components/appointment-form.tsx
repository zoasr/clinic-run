import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDeleteAppointment } from "@/hooks/useAppointments";
import type { Appointment } from "@/lib/schema-types";
import { queryKeys, trpc } from "@/lib/trpc-client";
import DoctorsDialog from "./search-doctors-dialog";
import SearchPatientsDialog from "./search-patients-dialog";
import { Loading } from "./ui/loading";

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
	const { data: patient, isLoading: patientLoading } = useQuery(
		trpc.patients.getById.queryOptions(
			{ id: appointment?.patientId || 0 },
			{
				enabled: !!appointment?.patientId,
			},
		),
	);

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
			const baseData = {
				...value,
				doctorId: value.doctorId,
				updatedAt: new Date(),
			};

			if (appointment?.id) {
				// For updates, don't include createdAt
				const { ...updateData } = baseData;
				updateAppointment({
					id: appointment.id,
					data: updateData,
				});
			} else {
				// For creates, include createdAt
				saveAppointment({
					...baseData,
					createdAt: new Date(),
				});
			}
		},
	});

	const queryClinet = useQueryClient();
	const appointementsKey = trpc.appointments.getAll.queryKey();

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
		}),
	);

	const { mutate: updateAppointment, isPending: isUpdating } = useMutation(
		trpc.appointments.update.mutationOptions({
			onSuccess: () => {
				queryClinet.invalidateQueries({
					queryKey: [appointementsKey, queryKeys.dashboard.stats()],
				});
				onSave();
			},
			onError: (error) => {
				console.error("Failed to update appointment:", error);
				toast.error(`Failed to update appointment: ${error.message}`);
			},
		}),
	);

	const { mutate: deleteAppointment, isPending: isDeleting } =
		useDeleteAppointment({
			onSuccess: () => {
				toast.success("Appointment deleted successfully");
				onSave();
			},
			onError: (error: Error) => {
				console.error("Failed to delete appointment:", error);
				toast.error(`Failed to delete appointment: ${error.message}`);
			},
		});

	const handleDeleteAppointment = () => {
		if (appointment?.id) {
			deleteAppointment({ id: appointment.id });
		}
	};

	if (patientLoading) {
		return <Loading />;
	}
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
			</div>
			<div>
				<h1 className="text-2xl font-serif font-bold text-foreground">
					{appointment ? "Edit Appointment" : "Schedule Appointment"}
				</h1>
				<p className="text-muted-foreground">
					{appointment
						? "Update appointment details"
						: "Create a new appointment"}
				</p>
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
							Search and select a patient for this appointment
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<form.Field
							name="patientId"
							validators={{
								onChange: ({ value }) =>
									!value || value <= 0 ? "Patient is required" : undefined,
							}}
							children={(field) => (
								<>
									<SearchPatientsDialog
										patient={patient}
										onSelect={(patient) => {
											field.handleChange(patient?.id || 0);
										}}
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
															{patient.firstName} {patient.lastName}
														</h3>
														<p className="text-sm text-muted-foreground">
															ID: {patient.patientId}
														</p>
													</div>
												</div>
											</div>
										</>
									)}
								</>
							)}
						/>
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
										<Label htmlFor="appointmentDate">Date *</Label>
										<DatePicker
											selected={
												field.state.value
													? new Date(field.state.value)
													: undefined
											}
											onSelect={(date) => {
												field.handleChange(date ? date : new Date());
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
										<Label htmlFor="appointmentTime">Time *</Label>
										<Input
											id="appointmentTime"
											type="time"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
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
										!value ? "Duration is required" : undefined,
								}}
								children={(field) => (
									<div>
										<Label htmlFor="duration">Duration (minutes) *</Label>
										<Select
											value={field.state.value?.toString()}
											onValueChange={(value) =>
												field.handleChange(parseInt(value))
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="15">15 minutes</SelectItem>
												<SelectItem value="30">30 minutes</SelectItem>
												<SelectItem value="45">45 minutes</SelectItem>
												<SelectItem value="60">1 hour</SelectItem>
												<SelectItem value="90">1.5 hours</SelectItem>
												<SelectItem value="120">2 hours</SelectItem>
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
											onValueChange={(value) => field.handleChange(value)}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="consultation">
													Consultation
												</SelectItem>
												<SelectItem value="checkup">Checkup</SelectItem>
												<SelectItem value="follow-up">Follow-up</SelectItem>
												<SelectItem value="emergency">Emergency</SelectItem>
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
									<DoctorsDialog
										onSelect={(doctor) => field.handleChange(doctor.id)}
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

						<form.Field
							name="notes"
							children={(field) => (
								<div>
									<Label htmlFor="notes">Notes</Label>
									<Textarea
										id="notes"
										placeholder="Additional notes about the appointment..."
										value={field.state.value || ""}
										onChange={(e) => field.handleChange(e.target.value)}
										rows={3}
									/>
								</div>
							)}
						/>
					</CardContent>
				</Card>

				{/* Actions */}
				<div className="flex justify-between gap-4">
					<div>
						{appointment && (
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										type="button"
										variant="destructive"
										disabled={isDeleting}
									>
										<Trash2 className="h-4 w-4 mr-2" />
										{isDeleting ? "Deleting..." : "Delete Appointment"}
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Delete Appointment</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to delete this appointment? This
											action cannot be undone.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleDeleteAppointment}
											asChild
										>
											<Button variant="destructive">Delete</Button>
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)}
					</div>
					<div className="flex gap-4">
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancel
						</Button>
						<form.Subscribe
							children={(field) => (
								<Button
									type="submit"
									disabled={isUpdating || isSaving || !field.canSubmit}
								>
									{isSaving || isUpdating
										? "Saving..."
										: appointment
											? "Update"
											: "Schedule"}
								</Button>
							)}
						/>
					</div>
				</div>

				{mutationError && (
					<Alert variant="destructive">
						<AlertDescription>{mutationError.message}</AlertDescription>
					</Alert>
				)}
			</form>
		</div>
	);
}
