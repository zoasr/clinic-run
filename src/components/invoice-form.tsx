import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { TRPCClientErrorLike } from "@trpc/client";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { usePatient } from "@/hooks/usePatients";
import type { AppRouter } from "@/lib/trpc";
import { queryKeys, trpc } from "@/lib/trpc-client";
import { formatCurrency } from "@/lib/utils";
import { DatePicker } from "./date-picker";
import SearchPatientsDialog from "./search-patients-dialog";

type InvoiceInput = AppRouter["invoices"]["create"]["_def"]["$types"]["input"];
type Invoice = AppRouter["invoices"]["getById"]["_def"]["$types"]["output"];

type InvoiceFormValues = InvoiceInput;

interface InvoiceItem {
	description: string;
	amount: number;
}

interface InvoiceFormProps {
	invoice?: Invoice | null;
	onSave: () => void;
	onCancel: () => void;
}

export function InvoiceForm({ invoice, onSave, onCancel }: InvoiceFormProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [items, setItems] = useState<InvoiceItem[]>(
		invoice?.items
			? JSON.parse(invoice.items)
			: [{ description: "", amount: 0 }],
	);

	const { data: patient } = usePatient(invoice?.patientId || 0);

	const defaultValues: InvoiceFormValues = {
		patientId: invoice?.patientId ?? 0,
		appointmentId: invoice?.appointmentId ?? undefined,
		totalAmount: invoice?.totalAmount ?? 0,
		paidAmount: invoice?.paidAmount ?? 0,
		status: invoice?.status ?? "pending",
		dueDate: invoice?.dueDate ?? new Date(),
		items: invoice?.items ?? "",
	};

	const createMutation = useMutation(
		trpc.invoices.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: queryKeys.invoices.all(),
					refetchType: "active",
				});
				router.invalidate();
				onSave();
				toast.success("Invoice created successfully");
			},
			onError: (error: TRPCClientErrorLike<AppRouter>) => {
				toast.error(error.message || "Failed to create invoice");
			},
		}),
	);

	const updateMutation = useMutation(
		trpc.invoices.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: queryKeys.invoices.all(),
					refetchType: "active",
				});
				onSave();
				toast.success("Invoice updated successfully");
			},
			onError: (error: TRPCClientErrorLike<AppRouter>) => {
				toast.error(error.message || "Failed to update invoice");
			},
		}),
	);

	const { isPending, error } = invoice?.id ? updateMutation : createMutation;

	const calculateTotal = (currentItems: InvoiceItem[]) => {
		return currentItems.reduce((sum, item) => sum + (item.amount || 0), 0);
	};

	const addItem = () => {
		setItems([...items, { description: "", amount: 0 }]);
	};

	const removeItem = (index: number) => {
		if (items.length > 1) {
			const newItems = items.filter((_, i) => i !== index);
			setItems(newItems);
		}
	};

	const updateItem = (
		index: number,
		field: keyof InvoiceItem,
		value: string | number,
	) => {
		const newItems = [...items];
		newItems[index] = { ...newItems[index], [field]: value };
		setItems(newItems);
	};

	const form = useForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			const totalAmount = calculateTotal(items);
			const itemsJson = JSON.stringify(items);

			const sanitized = {
				patientId: value.patientId,
				appointmentId: value.appointmentId || undefined,
				totalAmount,
				paidAmount: value.paidAmount || 0,
				status: value.status,
				dueDate: value.dueDate || undefined,
				items: itemsJson,
			};

			if (invoice?.id) {
				updateMutation.mutate({ id: invoice.id, data: sanitized });
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
					{invoice ? "Edit Invoice" : "Create New Invoice"}
				</h1>
				<p className="text-muted-foreground">
					{invoice
						? "Update invoice details and billing information"
						: "Create a new invoice for patient services"}
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
							Select the patient for this invoice
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<form.Field
								name="patientId"
								validators={{
									onChange: ({ value }) =>
										!value || value === 0 ? "Patient is required" : undefined,
								}}
							>
								{(field) => (
									<div>
										<Label htmlFor="patientId">Patient *</Label>
										<SearchPatientsDialog
											patient={patient}
											onSelect={(patient) => {
												field.handleChange(patient?.id || 0);
											}}
										/>
									</div>
								)}
							</form.Field>
						</div>
					</CardContent>
				</Card>

				{/* Invoice Items */}
				<Card>
					<CardHeader>
						<CardTitle>Invoice Items</CardTitle>
						<CardDescription>
							Add services, medications, or other charges
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{items.map((item, index) => (
							<div key={index} className="flex gap-4 items-end">
								<div className="flex-1 space-y-2">
									<Label>Description</Label>
									<Input
										value={item.description}
										onChange={(e) =>
											updateItem(index, "description", e.target.value)
										}
										placeholder="Service or item description"
									/>
								</div>
								<div className="w-32 space-y-2">
									<Label>Amount</Label>
									<Input
										type="number"
										step="0.01"
										min="0"
										value={item.amount}
										onChange={(e) =>
											updateItem(
												index,
												"amount",
												parseFloat(e.target.value) || 0,
											)
										}
										placeholder="0.00"
									/>
								</div>
								{items.length > 1 && (
									<Button
										type="button"
										variant="outline"
										size="icon"
										onClick={() => removeItem(index)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								)}
							</div>
						))}

						<Button
							type="button"
							variant="outline"
							onClick={addItem}
							className="flex items-center gap-2"
						>
							<Plus className="h-4 w-4" />
							Add Item
						</Button>

						<div className="pt-4 border-t">
							<div className="flex justify-between items-center">
								<span className="text-lg font-semibold">Total Amount:</span>
								<span className="text-2xl font-bold text-primary">
									{formatCurrency(calculateTotal(items))}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Payment Information */}
				<Card>
					<CardHeader>
						<CardTitle>Payment Information</CardTitle>
						<CardDescription>Payment status and due date</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor="paidAmount">Amount Paid</Label>
								<form.Field name="paidAmount">
									{(field) => (
										<Input
											id="paidAmount"
											type="number"
											step="0.01"
											min="0"
											value={field.state.value || ""}
											onChange={(e) =>
												field.handleChange(parseFloat(e.target.value) || 0)
											}
											placeholder="0.00"
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
											!value ? "Status is required" : undefined,
									}}
								>
									{(field) => (
										<Select
											value={field.state.value}
											onValueChange={(value) => field.handleChange(value)}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select status" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="pending">Pending</SelectItem>
												<SelectItem value="paid">Paid</SelectItem>
												<SelectItem value="overdue">Overdue</SelectItem>
											</SelectContent>
										</Select>
									)}
								</form.Field>
							</div>

							<div className="space-y-2">
								<Label htmlFor="dueDate">Due Date</Label>
								<form.Field name="dueDate">
									{(field) => (
										<DatePicker
											mode="single"
											captionLayout="dropdown"
											selected={
												field.state.value
													? new Date(field.state.value)
													: undefined
											}
											onSelect={(value: Date | undefined) => {
												field.handleChange(value ? value : new Date());
											}}
										/>
									)}
								</form.Field>
							</div>
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
						{isPending ? "Saving..." : invoice ? "Update" : "Create"}
					</Button>
				</div>
			</form>
		</div>
	);
}
