import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "./date-picker";
import { usePatients } from "@/hooks/usePatients";
import { useDoctors } from "@/hooks/useUsers";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc-client";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@/lib/trpc-client";

// Infer types from tRPC
type LabTestInput = AppRouter["labTests"]["create"]["_def"]["$types"]["input"];
type LabTest = AppRouter["labTests"]["getById"]["_def"]["$types"]["output"];

type LabTestFormValues = LabTestInput;

interface LabTestFormProps {
	labTest?: LabTest | null;
	onSave: () => void;
	onCancel: () => void;
}

export function LabTestForm({ labTest, onSave, onCancel }: LabTestFormProps) {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	// Fetch patients and doctors for dropdowns
	const { data: patients = [] } = usePatients();
	const { data: doctors = [] } = useDoctors();

	const defaultValues: LabTestFormValues = {
		patientId: labTest?.patientId ?? 0,
		doctorId: labTest?.doctorId ?? (user?.id || ""),
		testName: labTest?.testName ?? "",
		testType: labTest?.testType ?? "",
		status: labTest?.status ?? "ordered",
		orderDate: labTest?.orderDate ?? new Date().toLocaleDateString(),
		completedDate: labTest?.completedDate ?? "",
		results: labTest?.results ?? "",
		normalRange: labTest?.normalRange ?? "",
		notes: labTest?.notes ?? "",
	};

	const createMutation = useMutation(
		trpc.labTests.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["labTests"],
					refetchType: "active",
				});
				onSave();
				toast.success("Lab test ordered successfully");
			},
			onError: (error: TRPCClientErrorLike<AppRouter>) => {
				toast.error(error.message || "Failed to order lab test");
			},
		})
	);

	const updateMutation = useMutation(
		trpc.labTests.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["labTests"],
					refetchType: "active",
				});
				onSave();
				toast.success("Lab test updated successfully");
			},
			onError: (error: TRPCClientErrorLike<AppRouter>) => {
				toast.error(error.message || "Failed to update lab test");
			},
		})
	);

	const { isPending, error } = labTest?.id ? updateMutation : createMutation;

	const form = useForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			const sanitized = {
				patientId: value.patientId,
				doctorId: value.doctorId,
				testName: value.testName.trim(),
				testType: value.testType,
				status: value.status,
				orderDate: value.orderDate,
				completedDate: value.completedDate || undefined,
				results: value.results?.trim() || undefined,
				normalRange: value.normalRange?.trim() || undefined,
				notes: value.notes?.trim() || undefined,
			};

			if (labTest?.id) {
				updateMutation.mutate({ id: labTest.id, data: sanitized });
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
				<div>
					<h1 className="text-2xl font-serif font-bold text-foreground">
						{labTest ? "Update Lab Test" : "Order New Lab Test"}
					</h1>
					<p className="text-muted-foreground">
						{labTest
							? "Update lab test details and results"
							: "Order a new laboratory test for a patient"}
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
				{/* Patient and Doctor Selection */}
				<Card>
					<CardHeader>
						<CardTitle>Patient & Doctor Information</CardTitle>
						<CardDescription>
							Select the patient and ordering doctor for this lab
							test
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="patientId">Patient *</Label>
								<form.Field
									name="patientId"
									validators={{
										onChange: ({ value }) =>
											!value || value === 0
												? "Patient is required"
												: undefined,
									}}
								>
									{(field: any) => (
										<Select
											value={field.state.value?.toString()}
											onValueChange={(value) =>
												field.handleChange(
													parseInt(value)
												)
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select patient" />
											</SelectTrigger>
											<SelectContent>
												{patients.map((patient) => (
													<SelectItem
														key={patient.id}
														value={patient.id.toString()}
													>
														{patient.firstName}{" "}
														{patient.lastName} (ID:{" "}
														{patient.patientId})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								</form.Field>
							</div>

							<div className="space-y-2">
								<Label htmlFor="doctorId">
									Ordering Doctor *
								</Label>
								<form.Field
									name="doctorId"
									validators={{
										onChange: ({ value }) =>
											!value?.trim()
												? "Doctor is required"
												: undefined,
									}}
								>
									{(field: any) => (
										<Select
											value={field.state.value}
											onValueChange={(value) =>
												field.handleChange(value)
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select doctor" />
											</SelectTrigger>
											<SelectContent>
												{doctors.map((doctor) => (
													<SelectItem
														key={doctor.id}
														value={doctor.id}
													>
														Dr. {doctor.firstName}{" "}
														{doctor.lastName}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								</form.Field>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Test Information */}
				<Card>
					<CardHeader>
						<CardTitle>Test Information</CardTitle>
						<CardDescription>
							Details about the laboratory test
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="testName">Test Name *</Label>
								<form.Field
									name="testName"
									validators={{
										onChange: ({ value }) =>
											!value?.trim()
												? "Test name is required"
												: undefined,
									}}
								>
									{(field: any) => (
										<Input
											id="testName"
											value={field.state.value}
											onChange={(e) =>
												field.handleChange(
													e.target.value
												)
											}
											placeholder="e.g., Complete Blood Count, Lipid Panel"
											required
										/>
									)}
								</form.Field>
							</div>

							<div className="space-y-2">
								<Label htmlFor="testType">Test Type *</Label>
								<form.Field
									name="testType"
									validators={{
										onChange: ({ value }) =>
											!value
												? "Test type is required"
												: undefined,
									}}
								>
									{(field: any) => (
										<Select
											value={field.state.value}
											onValueChange={(value) =>
												field.handleChange(value)
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select test type" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="blood">
													Blood Test
												</SelectItem>
												<SelectItem value="urine">
													Urine Test
												</SelectItem>
												<SelectItem value="stool">
													Stool Test
												</SelectItem>
												<SelectItem value="imaging">
													Imaging
												</SelectItem>
												<SelectItem value="biopsy">
													Biopsy
												</SelectItem>
												<SelectItem value="microbiology">
													Microbiology
												</SelectItem>
												<SelectItem value="other">
													Other
												</SelectItem>
											</SelectContent>
										</Select>
									)}
								</form.Field>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="orderDate">Order Date *</Label>
								<form.Field
									name="orderDate"
									validators={{
										onChange: ({ value }) =>
											!value
												? "Order date is required"
												: undefined,
									}}
								>
									{(field: any) => (
										<DatePicker
											mode="single"
											captionLayout="dropdown"
											selected={
												field.state.value
													? new Date(
															field.state.value
														)
													: undefined
											}
											onSelect={(
												value: Date | undefined
											) => {
												field.handleChange(
													value ? value : ""
												);
											}}
											required
										/>
									)}
								</form.Field>
							</div>

							<div className="space-y-2">
								<Label htmlFor="status">Status *</Label>
								<form.Field
									name="status"
									validators={{
										onChange: ({ value }) =>
											!value
												? "Status is required"
												: undefined,
									}}
								>
									{(field: any) => (
										<Select
											value={field.state.value}
											onValueChange={(value) =>
												field.handleChange(value)
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select status" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="ordered">
													Ordered
												</SelectItem>
												<SelectItem value="in-progress">
													In Progress
												</SelectItem>
												<SelectItem value="completed">
													Completed
												</SelectItem>
											</SelectContent>
										</Select>
									)}
								</form.Field>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Results Section */}
				<Card>
					<CardHeader>
						<CardTitle>Test Results</CardTitle>
						<CardDescription>
							Results and findings (available when test is
							completed)
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="completedDate">
									Completed Date
								</Label>
								<form.Field name="completedDate">
									{(field: any) => (
										<DatePicker
											mode="single"
											captionLayout="dropdown"
											selected={
												field.state.value
													? new Date(
															field.state.value
														)
													: undefined
											}
											onSelect={(
												value: Date | undefined
											) => {
												field.handleChange(
													value ? value : ""
												);
											}}
										/>
									)}
								</form.Field>
							</div>

							<div className="space-y-2">
								<Label htmlFor="normalRange">
									Normal Range
								</Label>
								<form.Field name="normalRange">
									{(field: any) => (
										<Input
											id="normalRange"
											value={field.state.value || ""}
											onChange={(e) =>
												field.handleChange(
													e.target.value
												)
											}
											placeholder="e.g., 70-99 mg/dL, Negative"
										/>
									)}
								</form.Field>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="results">Results</Label>
							<form.Field name="results">
								{(field: any) => (
									<Textarea
										id="results"
										value={field.state.value || ""}
										onChange={(e) =>
											field.handleChange(e.target.value)
										}
										placeholder="Enter test results and findings..."
										rows={4}
									/>
								)}
							</form.Field>
						</div>

						<div className="space-y-2">
							<Label htmlFor="notes">Notes</Label>
							<form.Field name="notes">
								{(field: any) => (
									<Textarea
										id="notes"
										value={field.state.value || ""}
										onChange={(e) =>
											field.handleChange(e.target.value)
										}
										placeholder="Additional notes or observations..."
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
						{isPending ? "Saving..." : "Save Lab Test"}
					</Button>
				</div>
			</form>
		</div>
	);
}
