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
import type { AppRouter } from "@/lib/trpc";
import { trpc } from "@/lib/trpc-client";

interface SupplierFormProps {
	supplier?: any | null;
	onSave: () => void;
	onCancel: () => void;
}

export function SupplierForm({
	supplier,
	onSave,
	onCancel,
}: SupplierFormProps) {
	const queryClient = useQueryClient();

	const defaultValues = {
		name: supplier?.name ?? "",
		contactInfo: supplier?.contactInfo ?? "",
		address: supplier?.address ?? "",
	};

	const createMutation = useMutation(
		trpc.medicationSuppliers.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.medicationSuppliers.getAll.queryKey(),
					refetchType: "active",
				});
				onSave();
				toast.success("Supplier created successfully");
			},
			onError: (error: TRPCClientErrorLike<AppRouter>) => {
				toast.error(error.message || "Failed to create supplier");
			},
		}),
	);

	const updateMutation = useMutation(
		trpc.medicationSuppliers.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.medicationSuppliers.getAll.queryKey(),
					refetchType: "active",
				});
				onSave();
				toast.success("Supplier updated successfully");
			},
			onError: (error: TRPCClientErrorLike<AppRouter>) => {
				toast.error(error.message || "Failed to update supplier");
			},
		}),
	);

	const { isPending, error } = supplier?.id ? updateMutation : createMutation;

	const form = useForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			const sanitized = {
				name: value.name.trim(),
				contactInfo: value.contactInfo?.trim() || undefined,
				address: value.address?.trim() || undefined,
			};

			if (supplier?.id) {
				updateMutation.mutate({
					id: supplier.id,
					data: sanitized,
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
			</div>
			<div>
				<h1 className="text-2xl font-serif font-bold text-foreground">
					{supplier ? "Edit Supplier" : "Add New Supplier"}
				</h1>
				<p className="text-muted-foreground">
					{supplier
						? "Update supplier information"
						: "Add a new medication supplier"}
				</p>
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
						<CardTitle>Supplier Information</CardTitle>
						<CardDescription>
							Basic details about the medication supplier
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Supplier Name *</Label>
							<form.Field
								name="name"
								validators={{
									onChange: ({ value }) =>
										!value?.trim() ? "Name is required" : undefined,
								}}
							>
								{(field) => (
									<Input
										id="name"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										required
										placeholder="e.g., PharmaCorp Ltd."
									/>
								)}
							</form.Field>
						</div>

						<div className="space-y-2">
							<Label htmlFor="contactInfo">Contact Information</Label>
							<form.Field name="contactInfo">
								{(field) => (
									<Textarea
										id="contactInfo"
										value={field.state.value ?? ""}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Phone: +1-555-0123&#10;Email: contact@pharmacorp.com&#10;Website: www.pharmacorp.com"
										rows={4}
									/>
								)}
							</form.Field>
						</div>

						<div className="space-y-2">
							<Label htmlFor="address">Address</Label>
							<form.Field name="address">
								{(field) => (
									<Textarea
										id="address"
										value={field.state.value ?? ""}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Street address, city, state, postal code, country"
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
						{isPending
							? "Saving..."
							: supplier
								? "Update Supplier"
								: "Add Supplier"}
					</Button>
				</div>
			</form>
		</div>
	);
}
