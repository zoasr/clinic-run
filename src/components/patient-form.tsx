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
import { ButtonLoading } from "@/components/ui/loading";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AppRouter } from "@/lib/trpc";
import { queryKeys, trpc } from "@/lib/trpc-client";
import { DatePicker } from "./date-picker";

// Basic email regex to validate on the client before submit (backend will still validate via Zod)
const EMAIL_RE =
	/^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/;

type PatientInput = AppRouter["patients"]["create"]["_def"]["$types"]["input"];
type Patient = AppRouter["patients"]["getById"]["_def"]["$types"]["output"];

type PatientFormValues = PatientInput;

interface PatientFormProps {
	patient?: (Patient & { id?: number }) | (PatientFormValues & { id?: number });
	onSave: () => void;
	onCancel: () => void;
}

export function PatientForm({ patient, onSave, onCancel }: PatientFormProps) {
	const queryClient = useQueryClient();

	const defaultValues: PatientFormValues = {
		firstName: (patient as any)?.firstName ?? "",
		lastName: (patient as any)?.lastName ?? "",
		dateOfBirth: (patient as any)?.dateOfBirth
			? new Date((patient as any).dateOfBirth)
			: new Date(),
		gender: (patient as any)?.gender ?? "",
		phone: (patient as any)?.phone ?? "",
		email: (patient as any)?.email ?? "",
		address: (patient as any)?.address ?? "",
		emergencyContact: (patient as any)?.emergencyContact ?? "",
		emergencyPhone: (patient as any)?.emergencyPhone ?? "",
		medicalHistory: (patient as any)?.medicalHistory ?? "",
		allergies: (patient as any)?.allergies ?? "",
		bloodType: (patient as any)?.bloodType ?? "",
	};

	const createMutation = useMutation(
		trpc.patients.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: queryKeys.patients.all(),
					refetchType: "active",
				});
				onSave();
				toast.success("Patient created successfully");
			},
			onError: (error: TRPCClientErrorLike<AppRouter>) => {
				toast.error(error.message || "Failed to create patient");
			},
		}),
	);

	const updateMutation = useMutation(
		trpc.patients.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: queryKeys.patients.all(),
					refetchType: "active",
				});
				onSave();
				toast.success("Patient updated successfully");
			},
			onError: (error: TRPCClientErrorLike<AppRouter>) => {
				toast.error(error.message || "Failed to update patient");
			},
		}),
	);

	const { isPending, error } = patient?.id ? updateMutation : createMutation;

	const form = useForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			// Sanitize optional fields: convert empty strings to undefined
			const sanitized = {
				firstName: value.firstName.trim(),
				lastName: value.lastName.trim(),
				dateOfBirth: value.dateOfBirth,
				gender: value.gender,
				phone: value.phone?.trim() || undefined,
				email: value.email?.trim() || undefined,
				address: value.address?.trim() || undefined,
				emergencyContact: value.emergencyContact?.trim() || undefined,
				emergencyPhone: value.emergencyPhone?.trim() || undefined,
				medicalHistory: value.medicalHistory?.trim() || undefined,
				allergies: value.allergies?.trim() || undefined,
				bloodType: value.bloodType?.trim() || undefined,
			};

			if (patient?.id) {
				updateMutation.mutate({ id: patient.id, data: sanitized });
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
					{patient ? "Edit Patient" : "Add New Patient"}
				</h1>
				<p className="text-muted-foreground">
					{patient
						? "Update patient information"
						: "Enter patient details to create a new record"}
				</p>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="space-y-6"
			>
				{/* Personal Information */}
				<Card>
					<CardHeader>
						<CardTitle>Personal Information</CardTitle>
						<CardDescription>
							Basic patient details and contact information
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="firstName">First Name *</Label>
								{
									<form.Field
										name="firstName"
										validators={{
											onChange: ({ value }) =>
												!value ? "First name is required" : undefined,
										}}
									>
										{(field) => (
											<Input
												id="firstName"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												required
											/>
										)}
									</form.Field>
								}
							</div>
							<div className="space-y-2">
								<Label htmlFor="lastName">Last Name *</Label>
								{
									<form.Field
										name="lastName"
										validators={{
											onChange: ({ value }) =>
												!value ? "Last name is required" : undefined,
										}}
									>
										{(field) => (
											<Input
												id="lastName"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												required
											/>
										)}
									</form.Field>
								}
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="dateOfBirth">Date of Birth *</Label>
								{
									<form.Field
										name="dateOfBirth"
										validators={{
											onChange: ({ value }) =>
												!value ? "Date of birth is required" : undefined,
										}}
									>
										{(field) => (
											<DatePicker
												mode="single"
												captionLayout="dropdown"
												selected={
													field.state.value
														? new Date(field.state.value)
														: undefined
												}
												disabled={(date) => {
													const today = new Date();
													today.setHours(0, 0, 0, 0);
													return date > today;
												}}
												onSelect={(value) => {
													field.handleChange(value);
												}}
												required
											/>
										)}
									</form.Field>
								}
							</div>
							<div className="space-y-2">
								<Label htmlFor="gender">Gender *</Label>
								{
									<form.Field
										name="gender"
										validators={{
											onChange: ({ value }) =>
												!value ? "Gender is required" : undefined,
										}}
									>
										{(field) => (
											<Select
												value={field.state.value}
												onValueChange={(value) => field.handleChange(value)}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select gender" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="male">Male</SelectItem>
													<SelectItem value="female">Female</SelectItem>
													<SelectItem value="other">Other</SelectItem>
												</SelectContent>
											</Select>
										)}
									</form.Field>
								}
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="phone">Phone Number</Label>
								{
									<form.Field name="phone">
										{(field) => (
											<Input
												id="phone"
												type="tel"
												value={field.state.value ?? ""}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
										)}
									</form.Field>
								}
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email Address</Label>
								{
									<form.Field
										name="email"
										validators={{
											onChange: ({ value }) => {
												const v = (value ?? "").trim();
												if (v === "") return undefined;
												return EMAIL_RE.test(v)
													? undefined
													: "Invalid email address";
											},
										}}
									>
										{(field) => (
											<>
												<Input
													id="email"
													type="email"
													value={field.state.value ?? ""}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={field.state.meta.errors?.length > 0}
												/>
												{field.state.meta.errors?.[0] && (
													<p className="text-sm text-destructive">
														{field.state.meta.errors[0]}
													</p>
												)}
											</>
										)}
									</form.Field>
								}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="address">Address</Label>
							{
								<form.Field name="address">
									{(field) => (
										<Textarea
											id="address"
											value={field.state.value ?? ""}
											onChange={(e) => field.handleChange(e.target.value)}
											rows={2}
										/>
									)}
								</form.Field>
							}
						</div>
					</CardContent>
				</Card>

				{/* Emergency Contact */}
				<Card>
					<CardHeader>
						<CardTitle>Emergency Contact</CardTitle>
						<CardDescription>Emergency contact information</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="emergencyContact">Emergency Contact Name</Label>
								{
									<form.Field name="emergencyContact">
										{(field) => (
											<Input
												id="emergencyContact"
												value={field.state.value ?? ""}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
										)}
									</form.Field>
								}
							</div>
							<div className="space-y-2">
								<Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
								{
									<form.Field name="emergencyPhone">
										{(field) => (
											<Input
												id="emergencyPhone"
												type="tel"
												value={field.state.value ?? ""}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
										)}
									</form.Field>
								}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Medical Information */}
				<Card>
					<CardHeader>
						<CardTitle>Medical Information</CardTitle>
						<CardDescription>
							Medical history and health details
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="bloodType">Blood Type</Label>
							{
								<form.Field name="bloodType">
									{(field) => (
										<Select
											value={field.state.value ?? ""}
											onValueChange={(value) => field.handleChange(value)}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select blood type" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="A+">A+</SelectItem>
												<SelectItem value="A-">A-</SelectItem>
												<SelectItem value="B+">B+</SelectItem>
												<SelectItem value="B-">B-</SelectItem>
												<SelectItem value="AB+">AB+</SelectItem>
												<SelectItem value="AB-">AB-</SelectItem>
												<SelectItem value="O+">O+</SelectItem>
												<SelectItem value="O-">O-</SelectItem>
											</SelectContent>
										</Select>
									)}
								</form.Field>
							}
						</div>

						<div className="space-y-2">
							<Label htmlFor="allergies">Allergies</Label>
							{
								<form.Field name="allergies">
									{(field) => (
										<Textarea
											id="allergies"
											value={field.state.value ?? ""}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="List any known allergies..."
											rows={3}
										/>
									)}
								</form.Field>
							}
						</div>

						<div className="space-y-2">
							<Label htmlFor="medicalHistory">Medical History</Label>
							{
								<form.Field name="medicalHistory">
									{(field) => (
										<Textarea
											id="medicalHistory"
											value={field.state.value ?? ""}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Previous medical conditions, surgeries, etc..."
											rows={4}
										/>
									)}
								</form.Field>
							}
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
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isPending}>
						{isPending && <ButtonLoading />}
						{isPending ? "Saving..." : "Save Patient"}
					</Button>
				</div>
			</form>
		</div>
	);
}
