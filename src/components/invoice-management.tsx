import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { type Invoice } from "@/hooks/useInvoices";
import {
	Search,
	Plus,
	Receipt,
	CheckCircle,
	Clock,
	AlertCircle,
	Trash2,
} from "lucide-react";
import { useDeleteInvoice } from "@/hooks/useInvoices";
import { toast } from "sonner";
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
import { Link } from "@tanstack/react-router";
import {
	useQuery,
	useInfiniteQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";
import ErrorComponent from "./error";

export function InvoiceManagement() {
	const [searchTerm, setSearchTerm] = useState("");
	const queryClient = useQueryClient();

	const {
		data,
		isLoading,
		isError,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery(
		trpc.invoices.getAll.infiniteQueryOptions(
			{
				search: searchTerm || undefined,
				limit: 20,
			},
			{
				getNextPageParam: (lastPage) =>
					lastPage.nextCursor ?? undefined,
			}
		)
	);

	const invoices = data?.pages?.flatMap((page) => page.data) || [];

	// Mutation for deleting invoices
	const { mutate: deleteInvoice, isPending: isDeleting } = useDeleteInvoice({
		onSuccess: () => {
			toast.success("Invoice deleted successfully");
			queryClient.invalidateQueries(
				trpc.invoices.getAll.infiniteQueryOptions(
					{
						search: searchTerm || undefined,
						limit: 20,
					},
					{
						getNextPageParam: (lastPage) =>
							lastPage.nextCursor ?? undefined,
					}
				)
			);
		},
		onError: (error: Error) => {
			console.error("Failed to delete invoice:", error);
			toast.error("Failed to delete invoice");
		},
	});

	const handleDeleteInvoice = (invoiceId: number) => {
		deleteInvoice({ id: invoiceId });
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
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(amount);
	};

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-display font-bold text-foreground">
						Invoice Management
					</h1>
					<p className="text-muted-foreground">
						Manage patient invoices and billing
					</p>
				</div>
				<Link to="/invoices/new">
					<Button className="flex items-center gap-2">
						<Plus className="h-4 w-4" />
						Create New Invoice
					</Button>
				</Link>
			</div>

			{/* Search */}
			<Card>
				<CardContent className="pt-6">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
						<Input
							placeholder="Search invoices by number or patient..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Invoice List */}
			{isError ? (
				<ErrorComponent error={new Error("Failed to fetch invoices")} />
			) : isLoading ? (
				<div className="flex items-center justify-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
				</div>
			) : invoices && invoices.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-8">
						<Receipt className="h-12 w-12 text-muted-foreground mb-4" />
						<h3 className="text-lg font-medium text-foreground mb-2">
							No invoices found
						</h3>
						<p className="text-muted-foreground text-center mb-4">
							{searchTerm
								? "No invoices match your search criteria."
								: "Get started by creating your first invoice."}
						</p>
						<Link to="/invoices/new">
							<Button className="flex items-center gap-2">
								<Plus className="h-4 w-4" />
								Create Invoice
							</Button>
						</Link>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{!!invoices &&
						invoices?.map((invoice: Invoice) => {
							if (!invoice) return null;
							const StatusIcon = getStatusIcon(invoice.status);
							const statusColor = getStatusColor(invoice.status);
							const isOverdue = invoice.status === "overdue";
							const isPending = invoice.status === "pending";
							const hasOutstanding =
								invoice.totalAmount > invoice.paidAmount;

							return (
								<Card
									key={invoice.id}
									className={`group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer border-border/50 hover:border-primary/20 ${
										isOverdue
											? "opacity-75 bg-red-50/30 dark:bg-red-950/10"
											: isPending
												? "bg-yellow-50/30 dark:bg-yellow-950/10"
												: hasOutstanding
													? "bg-orange-50/30 dark:bg-orange-950/10"
													: ""
									}`}
								>
									<CardContent className="p-6 grid">
										{/* Header */}
										<div className="flex items-start justify-between mb-4">
											<div className="flex items-center gap-3 flex-1">
												<div className="relative">
													<div
														className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
															isOverdue
																? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
																: isPending
																	? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
																	: "bg-primary/20 text-primary group-hover:bg-primary/30"
														}`}
													>
														<Receipt className="h-6 w-6" />
													</div>
													{(isOverdue ||
														hasOutstanding) && (
														<div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
															<span className="text-xs text-white font-bold">
																!
															</span>
														</div>
													)}
												</div>
												<div className="flex-1 min-w-0">
													<h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
														{invoice.invoiceNumber}
													</h3>
													<p className="text-sm text-muted-foreground truncate">
														{
															invoice.patient
																?.firstName
														}{" "}
														{
															invoice.patient
																?.lastName
														}
													</p>
												</div>
											</div>
											<div className="flex flex-col gap-1">
												<Badge
													variant={statusColor}
													className="border-0 text-xs"
												>
													{invoice.status}
												</Badge>
												{hasOutstanding && (
													<Badge className="bg-orange-100 text-orange-800 border-0 text-xs">
														Outstanding
													</Badge>
												)}
											</div>
										</div>

										{/* Key Information Grid */}
										<div className="grid grid-cols-2 gap-4 mb-4">
											{/* Total Amount */}
											<div className="space-y-1">
												<p className="text-xs text-muted-foreground">
													Total
												</p>
												<p className="text-lg font-bold">
													{formatCurrency(
														invoice.totalAmount
													)}
												</p>
											</div>

											{/* Amount Paid */}
											<div className="space-y-1">
												<p className="text-xs text-muted-foreground">
													Paid
												</p>
												<p className="text-lg font-bold text-green-600">
													{formatCurrency(
														invoice.paidAmount
													)}
												</p>
											</div>

											{/* Due Date */}
											<div className="space-y-1">
												<p className="text-xs text-muted-foreground">
													Due Date
												</p>
												<p className="text-sm font-medium">
													{invoice.dueDate
														? new Date(
																invoice.dueDate
															).toLocaleDateString()
														: "N/A"}
												</p>
											</div>

											{/* Outstanding */}
											<div className="space-y-1">
												<p className="text-xs text-muted-foreground">
													Outstanding
												</p>
												<p className="text-sm font-medium text-orange-600">
													{formatCurrency(
														invoice.totalAmount -
															invoice.paidAmount
													)}
												</p>
											</div>
										</div>

										{/* Outstanding Notice */}
										{hasOutstanding && (
											<div className="space-y-2 mb-4 pt-3 border-t border-border/50">
												<div className="flex justify-between items-center">
													<span className="text-xs text-muted-foreground">
														Outstanding Amount
													</span>
													<span className="text-sm font-semibold text-orange-600">
														{formatCurrency(
															invoice.totalAmount -
																invoice.paidAmount
														)}
													</span>
												</div>
											</div>
										)}

										{/* Metadata */}
										<div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
											<span>
												Created{" "}
												{new Date(
													invoice.createdAt
												).toLocaleDateString()}
											</span>
											{invoice.updatedAt !==
												invoice.createdAt && (
												<span>
													Updated{" "}
													{new Date(
														invoice.updatedAt
													).toLocaleDateString()}
												</span>
											)}
										</div>

										{/* Actions */}
										<div className="flex items-center justify-center gap-2 pt-4 mt-4 border-t border-border/50">
											<Link
												to="/invoices/$invoiceId"
												params={{
													invoiceId:
														invoice.id.toString(),
												}}
											>
												<Button
													variant="ghost"
													size="sm"
													className="opacity-20 group-hover:opacity-100 transition-all"
												>
													View Details
												</Button>
											</Link>
											<Link
												to="/invoices/edit/$invoiceId"
												params={{
													invoiceId:
														invoice.id.toLocaleString(),
												}}
											>
												<Button
													variant="outline"
													size="sm"
													className="opacity-20 group-hover:opacity-100 transition-all"
												>
													Edit Invoice
												</Button>
											</Link>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button
														variant="outline"
														size="sm"
														className="opacity-20 group-hover:opacity-100 transition-all text-red-600 hover:text-red-700 hover:bg-red-50"
														disabled={isDeleting}
														onClick={(e) =>
															e.stopPropagation()
														}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															Delete Invoice
														</AlertDialogTitle>
														<AlertDialogDescription>
															Are you sure you
															want to delete this
															invoice? This action
															cannot be undone.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>
															Cancel
														</AlertDialogCancel>
														<AlertDialogAction
															onClick={() =>
																handleDeleteInvoice(
																	invoice.id
																)
															}
															asChild
														>
															<Button variant="destructive">
																Delete
															</Button>
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</div>
									</CardContent>
								</Card>
							);
						})}
				</div>
			)}
			{/* Load More Section */}
			{invoices.length > 0 && (
				<div className="flex flex-col items-center gap-4 mt-8">
					{/* Patient Count Info */}
					<div className="text-sm text-muted-foreground">
						Showing {invoices.length} invoices
						{!hasNextPage && " (all loaded)"}
					</div>

					{/* Load More Button */}
					{hasNextPage && (
						<Button
							onClick={() => fetchNextPage()}
							disabled={isFetchingNextPage}
							className="min-w-[120px]"
							size="lg"
						>
							{isFetchingNextPage
								? "Loading..."
								: "Load More Invoices"}
						</Button>
					)}
				</div>
			)}
		</div>
	);
}
