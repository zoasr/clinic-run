import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppRouter } from "@/lib/trpc";
import { TRPCClientErrorLike } from "@trpc/client";
import { Medication } from "@/lib/schema-types";

interface MedicationFormProps {
	medication?: Medication | null;
	onSave: () => void;
	onCancel: () => void;
}

export function MedicationForm({
	medication,
	onSave,
	onCancel,
}: MedicationFormProps) {
	const queryClient = useQueryClient();

	const defaultValues: Medication = {
		name: (medication as any)?.name ?? "",
		genericName: (medication as any)?.genericName ?? "",
		dosage: (medication as any)?.dosage ?? "",
		form: (medication as any)?.form ?? "tablet",
		manufacturer: (medication as any)?.manufacturer ?? "",
		batchNumber: (medication as any)?.batchNumber ?? "",
		expiryDate: (medication as any)?.expiryDate ?? "",
		quantity: (medication as any)?.quantity ?? 0,
		minStockLevel: (medication as any)?.minStockLevel ?? 10,
		unitPrice: (medication as any)?.unitPrice ?? 0,
		isActive: (medication as any)?.isActive ?? true,
	} as Medication;

	const createMutation = useMutation(
		trpc.medications.create.mutationOptions({
			onSuccess: () => {
				// Invalidate the patients query to refetch the list
				queryClient.invalidateQueries({
					queryKey: queryKeys.medications.all(),
					refetchType: "active",
				});
				onSave();
				toast.success("Medication created successfully");
			},
			onError: (error: TRPCClientErrorLike<AppRouter>) => {
				toast.error(error.message || "Failed to create medication");
			},
		})
	);

	const updateMutation = useMutation(
		trpc.medications.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: queryKeys.medications.all(),
					refetchType: "active",
				});
				onSave();
				toast.success("Medication updated successfully");
			},
			onError: (error: TRPCClientErrorLike<AppRouter>) => {
				toast.error(error.message || "Failed to update medication");
			},
		})
	);

	const { isPending, error } = (medication as any)?.id
		? updateMutation
		: createMutation;

	const form = useForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			const sanitized = {
				name: value.name.trim(),
				genericName: value.genericName?.trim() || undefined,
				dosage: value.dosage?.trim() || undefined,
				form: value.form?.trim() || undefined,
				manufacturer: value.manufacturer?.trim() || undefined,
				batchNumber: value.batchNumber?.trim() || undefined,
				expiryDate: value.expiryDate || new Date(),
				quantity: Number(value.quantity) || 0,
				minStockLevel: Number(value.minStockLevel) || 0,
				unitPrice: Number(value.unitPrice) || 0,
				isActive: value.isActive ?? true,
			} as Medication;

			if ((medication as any)?.id) {
				updateMutation.mutate({
					data: sanitized,
					id: (medication as any).id,
				});
			} else {
				createMutation.mutate(sanitized);
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
						{medication ? "Edit Medication" : "Add New Medication"}
					</h1>
					<p className="text-muted-foreground">
						{medication
							? "Update medication information"
							: "Add a new medication to inventory"}
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
				{/* Basic Information */}
				<Card>
					<CardHeader>
						<CardTitle>Basic Information</CardTitle>
						<CardDescription>
							Medication details and identification
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="name">Medication Name *</Label>
								{
									// Required name field
									<form.Field
										name="name"
										validators={{
											onChange: ({ value }) =>
												!value?.trim()
													? "Name is required"
													: undefined,
										}}
									>
										{(field: any) => (
											<Input
												id="name"
												value={field.state.value}
												onChange={(e) =>
													field.handleChange(
														e.target.value
													)
												}
												required
												placeholder="e.g., Paracetamol"
											/>
										)}
									</form.Field>
								}
							</div>
							<div className="space-y-2">
								<Label htmlFor="genericName">
									Generic Name
								</Label>
								{
									<form.Field name="genericName">
										{(field: any) => (
											<Input
												id="genericName"
												value={field.state.value ?? ""}
												onChange={(e) =>
													field.handleChange(
														e.target.value
													)
												}
												placeholder="e.g., Acetaminophen"
											/>
										)}
									</form.Field>
								}
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="dosage">Dosage</Label>
								{
									<form.Field name="dosage">
										{(field: any) => (
											<Input
												id="dosage"
												value={field.state.value ?? ""}
												onChange={(e) =>
													field.handleChange(
														e.target.value
													)
												}
												placeholder="e.g., 500mg"
											/>
										)}
									</form.Field>
								}
							</div>
							<div className="space-y-2">
								<Label htmlFor="form">Form</Label>
								{
									<form.Field name="form">
										{(field: any) => (
											<Select
												value={
													field.state.value ??
													"tablet"
												}
												onValueChange={(value) =>
													field.handleChange(value)
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="tablet">
														Tablet
													</SelectItem>
													<SelectItem value="capsule">
														Capsule
													</SelectItem>
													<SelectItem value="syrup">
														Syrup
													</SelectItem>
													<SelectItem value="injection">
														Injection
													</SelectItem>
													<SelectItem value="cream">
														Cream
													</SelectItem>
													<SelectItem value="ointment">
														Ointment
													</SelectItem>
													<SelectItem value="drops">
														Drops
													</SelectItem>
													<SelectItem value="inhaler">
														Inhaler
													</SelectItem>
												</SelectContent>
											</Select>
										)}
									</form.Field>
								}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="manufacturer">Manufacturer</Label>
							{
								<form.Field name="manufacturer">
									{(field: any) => (
										<Input
											id="manufacturer"
											value={field.state.value ?? ""}
											onChange={(e) =>
												field.handleChange(
													e.target.value
												)
											}
											placeholder="e.g., Generic Pharma"
										/>
									)}
								</form.Field>
							}
						</div>
					</CardContent>
				</Card>

				{/* Batch & Expiry */}
				<Card>
					<CardHeader>
						<CardTitle>Batch & Expiry Information</CardTitle>
						<CardDescription>
							Batch tracking and expiration details
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="batchNumber">
									Batch Number
								</Label>
								{
									<form.Field name="batchNumber">
										{(field: any) => (
											<Input
												id="batchNumber"
												value={field.state.value ?? ""}
												onChange={(e) =>
													field.handleChange(
														e.target.value
													)
												}
												placeholder="e.g., BT2024001"
											/>
										)}
									</form.Field>
								}
							</div>
							<div className="space-y-2">
								<Label htmlFor="expiryDate">Expiry Date</Label>
								{
									<form.Field name="expiryDate">
										{(field: any) => (
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
												disabled={(date) => {
													// Disable past dates for expiry dates
													const today = new Date();
													today.setHours(
														23,
														59,
														59,
														999
													); // End of today
													return date <= today;
												}}
												mode="single"
												captionLayout="dropdown"
												placeholder="Select expiry date"
											/>
										)}
									</form.Field>
								}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Stock & Pricing */}
				<Card>
					<CardHeader>
						<CardTitle>Stock & Pricing</CardTitle>
						<CardDescription>
							Inventory levels and pricing information
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor="quantity">
									Current Quantity *
								</Label>
								{
									<form.Field
										name="quantity"
										validators={{
											onChange: ({ value }) =>
												value == null ||
												Number(value) < 0
													? "Quantity must be >= 0"
													: undefined,
										}}
									>
										{(field: any) => (
											<Input
												id="quantity"
												type="number"
												min="0"
												value={String(
													field.state.value ?? 0
												)}
												onChange={(e) =>
													field.handleChange(
														Number.parseInt(
															e.target.value
														) || 0
													)
												}
												required
											/>
										)}
									</form.Field>
								}
							</div>
							<div className="space-y-2">
								<Label htmlFor="minStockLevel">
									Minimum Stock Level *
								</Label>
								{
									<form.Field
										name="minStockLevel"
										validators={{
											onChange: ({ value }) =>
												value == null ||
												Number(value) < 0
													? "Min stock must be >= 0"
													: undefined,
										}}
									>
										{(field: any) => (
											<Input
												id="minStockLevel"
												type="number"
												min="0"
												value={String(
													field.state.value ?? 0
												)}
												onChange={(e) =>
													field.handleChange(
														Number.parseInt(
															e.target.value
														) || 0
													)
												}
												required
											/>
										)}
									</form.Field>
								}
							</div>
							<div className="space-y-2">
								<Label htmlFor="unitPrice">
									Unit Price (EGP) *
								</Label>
								{
									<form.Field
										name="unitPrice"
										validators={{
											onChange: ({ value }) =>
												value == null ||
												Number(value) < 0
													? "Price must be >= 0"
													: undefined,
										}}
									>
										{(field: any) => (
											<Input
												id="unitPrice"
												type="number"
												step="0.01"
												min="0"
												value={String(
													field.state.value ?? 0
												)}
												onChange={(e) =>
													field.handleChange(
														Number.parseFloat(
															e.target.value
														) || 0
													)
												}
												required
											/>
										)}
									</form.Field>
								}
							</div>
						</div>
					</CardContent>
				</Card>

				{error && (
					<Alert variant="destructive">
						<AlertDescription>
							{(error as any).message}
						</AlertDescription>
					</Alert>
				)}

				{/* Actions */}
				<div className="flex justify-end gap-4">
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<Button type="submit" disabled={isPending}>
						{isPending
							? "Saving..."
							: medication
								? "Update Medication"
								: "Add Medication"}
					</Button>
				</div>
			</form>
		</div>
	);
}
