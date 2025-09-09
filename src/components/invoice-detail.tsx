import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	ArrowLeft,
	Receipt,
	User,
	Calendar,
	DollarSign,
	CheckCircle,
	Clock,
	AlertCircle,
	Edit,
	CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc-client";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@/lib/trpc";
import type { Invoice } from "@/hooks/useInvoices";
import ErrorComponent from "./error";

interface InvoiceDetailProps {
	invoice: Invoice;
	onBack: () => void;
	onEdit: (invoice: Invoice) => void;
}

export function InvoiceDetail({ invoice, onBack, onEdit }: InvoiceDetailProps) {
	const queryClient = useQueryClient();
	const [paymentAmount, setPaymentAmount] = useState("");

	const markAsPaidMutation = useMutation(
		trpc.invoices.markAsPaid.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.invoices.getById.queryKey({
						id: invoice?.id,
					}),
					refetchType: "active",
				});
				toast.success("Payment recorded successfully");
				setPaymentAmount("");
			},
			onError: (error: TRPCClientErrorLike<AppRouter>) => {
				toast.error(error.message || "Failed to record payment");
			},
		})
	);

	const handlePayment = () => {
		const amount = parseFloat(paymentAmount);
		if (!amount || amount <= 0) {
			toast.error("Please enter a valid payment amount");
			return;
		}

		if (!invoice?.id) {
			toast.error("Invoice ID is missing");
			return;
		}
		markAsPaidMutation.mutate({
			id: invoice?.id,
			paidAmount: amount,
		});
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "paid":
				return "default";
			case "pending":
				return "secondary";
			case "overdue":
				return "destructive";
			default:
				return "outline";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "paid":
				return CheckCircle;
			case "pending":
				return Clock;
			case "overdue":
				return AlertCircle;
			default:
				return Receipt;
		}
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-us", {
			style: "currency",
			currency: "EGP",
		}).format(amount);
	};

	if (!invoice) {
		return <ErrorComponent error={new Error("Invoice not found")} />;
	}

	const StatusIcon = getStatusIcon(invoice?.status || "pending");
	const outstandingAmount = invoice?.totalAmount - invoice?.paidAmount || 0;

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="outline" size="sm" onClick={onBack}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back
					</Button>
					<div>
						<h1 className="text-2xl font-display font-bold text-foreground">
							Invoice {invoice.invoiceNumber}
						</h1>
						<p className="text-muted-foreground">
							Invoice for {invoice.patient?.firstName}{" "}
							{invoice.patient?.lastName}
						</p>
					</div>
				</div>

				<Button
					variant="outline"
					onClick={() => onEdit(invoice)}
					className="flex items-center gap-2"
				>
					<Edit className="h-4 w-4" />
					Edit Invoice
				</Button>
			</div>

			{/* Status Banner */}
			<Card>
				<CardContent>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<StatusIcon className="h-6 w-6 text-muted-foreground" />
							<div>
								<h3 className="font-semibold text-foreground">
									Status: {invoice.status}
								</h3>
								<p className="text-sm text-muted-foreground">
									{invoice.status === "paid"
										? "This invoice has been fully paid"
										: invoice.status === "overdue"
											? "This invoice is past its due date"
											: "This invoice is pending payment"}
								</p>
							</div>
							<Badge
								variant={getStatusColor(invoice.status)}
								className="ml-4"
							>
								{invoice.status}
							</Badge>
						</div>

						<div className="text-right">
							<p className="text-2xl font-bold text-primary">
								{formatCurrency(invoice.totalAmount)}
							</p>
							<p className="text-sm text-muted-foreground">
								Total Amount
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Payment Section */}
			{outstandingAmount > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CreditCard className="h-5 w-5" />
							Record Payment
						</CardTitle>
						<CardDescription>
							Record a payment towards this invoice
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<p className="text-sm text-muted-foreground">
										Outstanding Amount
									</p>
									<p className="text-lg font-semibold text-orange-600">
										{formatCurrency(outstandingAmount)}
									</p>
								</div>
								<div className="space-y-2">
									<Label htmlFor="paymentAmount">
										Payment Amount
									</Label>
									<Input
										id="paymentAmount"
										type="number"
										step="0.01"
										min="0"
										max={outstandingAmount}
										value={paymentAmount}
										onChange={(e) =>
											setPaymentAmount(e.target.value)
										}
										placeholder="Enter payment amount"
									/>
								</div>
								<div className="flex items-end">
									<Button
										onClick={handlePayment}
										disabled={
											markAsPaidMutation.isPending ||
											!paymentAmount
										}
										className="w-full"
									>
										{markAsPaidMutation.isPending
											? "Recording..."
											: "Record Payment"}
									</Button>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Invoice Information */}
			<div className="grid gap-6 md:grid-cols-2">
				{/* Patient Information */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<User className="h-5 w-5" />
							Patient Information
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<p className="text-sm text-muted-foreground">
								Name
							</p>
							<p className="font-medium">
								{invoice.patient?.firstName}{" "}
								{invoice.patient?.lastName}
							</p>
							<p className="text-sm text-muted-foreground">
								ID: {invoice.patient?.patientId}
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Invoice Details */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Receipt className="h-5 w-5" />
							Invoice Details
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<p className="text-sm text-muted-foreground">
								Invoice Number
							</p>
							<p className="font-medium font-mono">
								{invoice.invoiceNumber}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">
								Due Date
							</p>
							<p className="font-medium">
								{invoice.dueDate
									? new Date(
											invoice.dueDate
										).toLocaleDateString()
									: "N/A"}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Invoice Items */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<DollarSign className="h-5 w-5" />
						Invoice Items
					</CardTitle>
					<CardDescription>
						Breakdown of services and charges
					</CardDescription>
				</CardHeader>
				<CardContent>
					{invoice.items ? (
						<div className="space-y-3">
							<div className="space-y-2 divide-y divide-border/50">
								{JSON.parse(invoice.items).map(
									(item: any, index: number) => (
										<div
											key={index}
											className="flex justify-between items-center py-2"
										>
											<span className="text-sm">
												{item.description || "Service"}
											</span>
											<span className="font-medium text-destructive">
												-
												{formatCurrency(
													item.amount || 0
												)}
											</span>
										</div>
									)
								)}
							</div>
							<div className="flex justify-between items-center pt-3 border-t border-border font-semibold">
								<span>Total</span>
								<span className="text-destructive">
									-{formatCurrency(invoice.totalAmount)}
								</span>
							</div>
						</div>
					) : (
						<p className="text-muted-foreground">
							No items details available
						</p>
					)}
				</CardContent>
			</Card>

			{/* Payment Summary */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<DollarSign className="h-5 w-5" />
						Payment Summary
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="text-center p-4 bg-muted/50 rounded-lg">
							<p className="text-sm text-muted-foreground">
								Total Amount
							</p>
							<p className="text-2xl font-bold text-foreground">
								{formatCurrency(invoice.totalAmount)}
							</p>
						</div>
						<div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
							<p className="text-sm text-muted-foreground">
								Amount Paid
							</p>
							<p className="text-2xl font-bold text-green-600">
								{formatCurrency(invoice.paidAmount)}
							</p>
						</div>
						<div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
							<p className="text-sm text-muted-foreground">
								Outstanding
							</p>
							<p className="text-2xl font-bold text-orange-600">
								{formatCurrency(outstandingAmount)}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Invoice Metadata */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Calendar className="h-5 w-5" />
						Invoice Timeline
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<p className="text-sm text-muted-foreground">
								Created
							</p>
							<p className="font-medium">
								{new Date(
									invoice.createdAt
								).toLocaleDateString()}{" "}
								at{" "}
								{new Date(
									invoice.createdAt
								).toLocaleTimeString()}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">
								Last Updated
							</p>
							<p className="font-medium">
								{new Date(
									invoice.updatedAt
								).toLocaleDateString()}{" "}
								at{" "}
								{new Date(
									invoice.updatedAt
								).toLocaleTimeString()}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{markAsPaidMutation.error && (
				<Alert variant="destructive">
					<AlertDescription>
						{markAsPaidMutation.error.message}
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
