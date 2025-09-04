import { createFileRoute, Link } from "@tanstack/react-router";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { trpc } from "@/lib/trpc-client";
import {
	Search,
	Plus,
	Package,
	AlertTriangle,
	Calendar,
	Pill,
	Trash2,
} from "lucide-react";
import {
	useQuery,
	useMutation,
	useQueryClient,
	useInfiniteQuery,
} from "@tanstack/react-query";
import { Medication } from "@/lib/schema-types";
import { useDeleteMedication } from "@/hooks/useMedications";
import { toast } from "sonner";
import { LoadingCards, TableLoading } from "@/components/ui/loading";
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

export const Route = createFileRoute("/_authenticated/medications/")({
	loader: () => ({
		crumb: "All Medications",
	}),
	component: RouteComponent,
});

export function InventoryManagement() {
	const [searchTerm, setSearchTerm] = useState("");
	const [stockFilter, setStockFilter] = useState("all");
	const [activeTab, setActiveTab] = useState("inventory");

	const {
		data,
		isLoading: loading,
		error,
		refetch,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery(
		trpc.medications.getAll.infiniteQueryOptions(
			{
				search: searchTerm || undefined,
				lowStock: stockFilter === "low" ? true : undefined,
				outOfStock: stockFilter === "out" ? true : undefined,
				limit: 20,
			},
			{
				getNextPageParam: (lastPage) =>
					lastPage.nextCursor ?? undefined,
			}
		)
	);
	const { data: lowStockMeds } = useQuery(
		trpc.medications.getAllLowStock.queryOptions()
	);
	const { data: outOfStockMeds } = useQuery(
		trpc.medications.getAllOutOfStock.queryOptions()
	);

	// Mutation for deleting medications
	const { mutate: deleteMedication, isPending: isDeleting } =
		useDeleteMedication({
			onSuccess: () => {
				toast.success("Medication deleted successfully");
				refetch();
			},
			onError: (error: Error) => {
				console.error("Failed to delete medication:", error);
				toast.error(`Failed to delete medication: ${error.message}`);
			},
		});

	const handleDeleteMedication = (medicationId: number) => {
		deleteMedication({ id: medicationId });
	};

	const getStockStatus = (medication: Medication) => {
		if (medication.quantity === 0)
			return { status: "out-of-stock", color: "bg-red-100 text-red-800" };
		if ((medication.quantity ?? 0) <= (medication.minStockLevel ?? 0))
			return {
				status: "low-stock",
				color: "bg-yellow-100 text-yellow-800",
			};
		return { status: "in-stock", color: "bg-green-100 text-green-800" };
	};

	const getExpiryStatus = (expiryDate: string | null) => {
		if (!expiryDate) return null;

		const today = new Date();
		const expiry = new Date(expiryDate);
		const daysUntilExpiry = Math.ceil(
			(expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
		);

		if (daysUntilExpiry < 0)
			return { status: "expired", color: "bg-red-100 text-red-800" };
		if (daysUntilExpiry <= 30)
			return {
				status: "expiring-soon",
				color: "bg-orange-100 text-orange-800",
			};
		return { status: "valid", color: "bg-green-100 text-green-800" };
	};
	const medications = data?.pages?.flatMap((page) => page.data) || [];

	const lowStockCount = lowStockMeds?.length;
	const outOfStockCount = outOfStockMeds?.length;
	const expiringCount = medications?.filter((med) => {
		if (!med.expiryDate) return false;
		const expiry = new Date(med.expiryDate);
		const today = new Date();
		const daysUntilExpiry = Math.ceil(
			(expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
		);
		return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
	}).length;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-serif font-bold text-foreground">
						Inventory Management
					</h1>
					<p className="text-muted-foreground">
						Manage medications and medical supplies
					</p>
				</div>
				<Link to="/medications/new">
					<Button className="flex items-center gap-2">
						<Plus className="h-4 w-4" />
						Add Medication
					</Button>
				</Link>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">
									Total Items
								</p>
								<p className="text-2xl font-bold">
									{medications?.length || 0}
								</p>
							</div>
							<Package className="h-8 w-8 text-blue-500" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">
									Low Stock
								</p>
								<p className="text-2xl font-bold text-yellow-600">
									{lowStockCount}
								</p>
							</div>
							<AlertTriangle className="h-8 w-8 text-yellow-500" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">
									Out of Stock
								</p>
								<p className="text-2xl font-bold text-red-600">
									{outOfStockCount}
								</p>
							</div>
							<Package className="h-8 w-8 text-red-500" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">
									Expiring Soon
								</p>
								<p className="text-2xl font-bold text-orange-600">
									{expiringCount}
								</p>
							</div>
							<Calendar className="h-8 w-8 text-orange-500" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
							<Input
								placeholder="Search medications by name, generic name, or manufacturer..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Select
							value={stockFilter}
							onValueChange={setStockFilter}
						>
							<SelectTrigger className="w-full sm:w-48">
								<SelectValue placeholder="Filter by stock" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Items</SelectItem>
								<SelectItem value="low">Low Stock</SelectItem>
								<SelectItem value="out">
									Out of Stock
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList>
					<TabsTrigger value="inventory">Inventory List</TabsTrigger>
					<TabsTrigger value="alerts">Stock Alerts</TabsTrigger>
				</TabsList>

				<TabsContent value="inventory" className="space-y-4">
					{/* Medication List */}
					{loading ? (
						<LoadingCards />
					) : medications?.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-8">
								<Package className="h-12 w-12 text-muted-foreground mb-4" />
								<h3 className="text-lg font-medium text-foreground mb-2">
									No medications found
								</h3>
								<p className="text-muted-foreground text-center mb-4">
									{searchTerm || stockFilter !== "all"
										? "No medications match your search criteria."
										: "Get started by adding your first medication."}
								</p>
								<Link to="/medications/new">
									<Button>
										<Plus className="h-4 w-4 mr-2" />
										Add Medication
									</Button>
								</Link>
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{medications &&
								medications?.map((medication) => {
									const stockStatus =
										getStockStatus(medication);
									const expiryStatus = getExpiryStatus(
										medication?.expiryDate
									);
									const isLowStock =
										medication.quantity <=
											medication.minStockLevel &&
										medication.quantity > 0;
									const isOutOfStock =
										medication.quantity === 0;
									const isExpiringSoon =
										expiryStatus &&
										(expiryStatus.status ===
											"expiring-soon" ||
											expiryStatus.status === "expired");

									return (
										<Card
											key={medication.id}
											className={`group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer border-border/50 hover:border-primary/20 ${
												isOutOfStock
													? "opacity-75 bg-red-50/30 dark:bg-red-950/10"
													: isLowStock
														? "bg-yellow-50/30 dark:bg-yellow-950/10"
														: isExpiringSoon
															? "bg-orange-50/30 dark:bg-orange-950/10"
															: ""
											}`}
										>
											<CardContent className="p-6">
												{/* Header */}
												<div className="flex items-start justify-between mb-4">
													<div className="flex items-center gap-3 flex-1">
														<div className="relative">
															<div
																className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
																	isOutOfStock
																		? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
																		: isLowStock
																			? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
																			: "bg-primary/20 text-primary group-hover:bg-primary/30"
																}`}
															>
																<Pill className="h-6 w-6" />
															</div>
															{(isLowStock ||
																isOutOfStock) && (
																<div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
																	<span className="text-xs text-white font-bold">
																		!
																	</span>
																</div>
															)}
														</div>
														<div className="flex-1 min-w-0">
															<h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
																{
																	medication.name
																}
															</h3>
															{medication.genericName && (
																<p className="text-sm text-muted-foreground truncate">
																	{
																		medication.genericName
																	}
																</p>
															)}
														</div>
													</div>
													<div className="flex flex-col gap-1">
														<Badge
															className={`${stockStatus.color} border-0 text-xs`}
														>
															{stockStatus.status}
														</Badge>
														{isExpiringSoon && (
															<Badge
																className={`${expiryStatus.color} border-0 text-xs`}
															>
																{
																	expiryStatus.status
																}
															</Badge>
														)}
													</div>
												</div>

												{/* Key Information Grid */}
												<div className="grid grid-cols-2 gap-4 mb-4">
													{/* Stock Level */}
													<div className="space-y-1">
														<p className="text-xs text-muted-foreground">
															Stock
														</p>
														<div className="flex items-center gap-2">
															<span className="text-lg font-bold">
																{
																	medication.quantity
																}
															</span>
															<span className="text-xs text-muted-foreground">
																/{" "}
																{
																	medication.minStockLevel
																}{" "}
																min
															</span>
														</div>
													</div>

													{/* Price */}
													<div className="space-y-1">
														<p className="text-xs text-muted-foreground">
															Price
														</p>
														<p className="text-lg font-bold">
															$
															{medication.unitPrice.toFixed(
																2
															)}
														</p>
													</div>

													{/* Dosage & Form */}
													<div className="space-y-1">
														<p className="text-xs text-muted-foreground">
															Dosage
														</p>
														<p className="text-sm font-medium">
															{medication.dosage}{" "}
															{medication.form}
														</p>
													</div>

													{/* Expiry Date */}
													{medication.expiryDate && (
														<div className="space-y-1">
															<p className="text-xs text-muted-foreground">
																Expires
															</p>
															<p className="text-sm font-medium">
																{new Date(
																	medication.expiryDate
																).toLocaleDateString()}
															</p>
														</div>
													)}
												</div>

												{/* Additional Info */}
												{(medication.manufacturer ||
													medication.batchNumber) && (
													<div className="space-y-2 mb-4 pt-3 border-t border-border/50">
														{medication.manufacturer && (
															<div className="flex justify-between items-center">
																<span className="text-xs text-muted-foreground">
																	Manufacturer
																</span>
																<span className="text-sm">
																	{
																		medication.manufacturer
																	}
																</span>
															</div>
														)}
														{medication.batchNumber && (
															<div className="flex justify-between items-center">
																<span className="text-xs text-muted-foreground">
																	Batch
																</span>
																<span className="text-sm font-mono">
																	{
																		medication.batchNumber
																	}
																</span>
															</div>
														)}
													</div>
												)}

												{/* Metadata */}
												<div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
													<span>
														Added{" "}
														{new Date(
															medication.createdAt
														).toLocaleDateString()}
													</span>
													{medication.updatedAt !==
														medication.createdAt && (
														<span>
															Updated{" "}
															{new Date(
																medication.updatedAt
															).toLocaleDateString()}
														</span>
													)}
												</div>

												{/* Actions */}
												<div className="flex items-center gap-2 pt-4 mt-4 border-t border-border/50">
													<Link
														to={`/medications/$medicationId`}
														params={{
															medicationId:
																medication.id.toString(),
														}}
														className="flex-1"
													>
														<Button
															variant="ghost"
															size="sm"
															className="w-full opacity-20 group-hover:opacity-100 transition-all"
														>
															View Details
														</Button>
													</Link>
													<Link
														to={`/medications/stock/$medicationId`}
														params={{
															medicationId:
																medication.id.toString(),
														}}
													>
														<Button
															variant="outline"
															size="sm"
															className="opacity-20 group-hover:opacity-100 transition-all"
														>
															Adjust Stock
														</Button>
													</Link>
													<AlertDialog>
														<AlertDialogTrigger
															asChild
														>
															<Button
																variant="outline"
																size="sm"
																className="opacity-20 group-hover:opacity-100 transition-all text-red-600 hover:text-red-700 hover:bg-red-50"
																disabled={
																	isDeleting
																}
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</AlertDialogTrigger>
														<AlertDialogContent>
															<AlertDialogHeader>
																<AlertDialogTitle>
																	Delete
																	Medication
																</AlertDialogTitle>
																<AlertDialogDescription>
																	Are you sure
																	you want to
																	delete this
																	medication?
																	This action
																	cannot be
																	undone.
																</AlertDialogDescription>
															</AlertDialogHeader>
															<AlertDialogFooter>
																<AlertDialogCancel>
																	Cancel
																</AlertDialogCancel>
																<AlertDialogAction
																	onClick={() =>
																		handleDeleteMedication(
																			medication.id
																		)
																	}
																	className="bg-red-600 hover:bg-red-700"
																>
																	Delete
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
					{medications.length > 0 && (
						<div className="flex flex-col items-center gap-4 mt-8">
							<div className="text-sm text-muted-foreground">
								Showing {medications.length} medications
								{!hasNextPage && " (all loaded)"}
							</div>
							{hasNextPage && (
								<Button
									onClick={() => fetchNextPage()}
									disabled={isFetchingNextPage}
									className="min-w-[120px]"
									size="lg"
								>
									{isFetchingNextPage
										? "Loading..."
										: "Load More Medications"}
								</Button>
							)}
						</div>
					)}
				</TabsContent>

				<TabsContent value="alerts" className="space-y-4">
					<div className="grid gap-4">
						{/* Low Stock Alerts */}
						{!!lowStockCount && lowStockCount > 0 && (
							<Card>
								<CardContent className="p-6">
									<div className="flex items-center gap-3 mb-4">
										<AlertTriangle className="h-6 w-6 text-yellow-500" />
										<div>
											<h3 className="font-semibold text-foreground">
												Low Stock Alert
											</h3>
											<p className="text-sm text-muted-foreground">
												{lowStockCount} items need
												restocking
											</p>
										</div>
									</div>
									<div className="space-y-2">
										{lowStockMeds?.map((medication) => (
											<div
												key={medication.id}
												className="flex items-center justify-between p-3 rounded-lg border bg-warning/10 "
											>
												<div>
													<p className="font-medium">
														{medication.name}
													</p>
													<p className="text-sm text-muted-foreground">
														Current:{" "}
														{medication.quantity} |
														Min:{" "}
														{
															medication.minStockLevel
														}
													</p>
												</div>
												<Link
													to="/medications/stock/$medicationId"
													params={{
														medicationId:
															medication.id.toString(),
													}}
												>
													<Button size="sm">
														Restock
													</Button>
												</Link>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Out of Stock Alerts */}
						{!!outOfStockCount && outOfStockCount > 0 && (
							<Card>
								<CardContent className="p-6">
									<div className="flex items-center gap-3 mb-4">
										<Package className="h-6 w-6 text-red-500" />
										<div>
											<h3 className="font-semibold text-foreground">
												Out of Stock
											</h3>
											<p className="text-sm text-muted-foreground">
												{outOfStockCount} items are out
												of stock
											</p>
										</div>
									</div>
									<div className="space-y-2">
										{outOfStockMeds?.map((medication) => (
											<div
												key={medication.id}
												className="flex items-center justify-between p-3 rounded-lg border bg-destructive/10 "
											>
												<div>
													<p className="font-medium">
														{medication.name}
													</p>
													<p className="text-sm text-muted-foreground">
														Stock depleted
													</p>
												</div>
												<Link
													to="/medications/stock/$medicationId"
													params={{
														medicationId:
															medication.id.toString(),
													}}
												>
													<Button size="sm">
														Restock
													</Button>
												</Link>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Expiring Soon Alerts */}
						{!!expiringCount && expiringCount > 0 && (
							<Card>
								<CardContent className="p-6">
									<div className="flex items-center gap-3 mb-4">
										<Calendar className="h-6 w-6 text-orange-500" />
										<div>
											<h3 className="font-semibold text-foreground">
												Expiring Soon
											</h3>
											<p className="text-sm text-muted-foreground">
												{expiringCount} items expire
												within 30 days
											</p>
										</div>
									</div>
									<div className="space-y-2">
										{medications
											.filter((med) => {
												if (!med.expiryDate)
													return false;
												const expiry = new Date(
													med.expiryDate
												);
												const today = new Date();
												const daysUntilExpiry =
													Math.ceil(
														(expiry.getTime() -
															today.getTime()) /
															(1000 *
																60 *
																60 *
																24)
													);
												return (
													daysUntilExpiry <= 30 &&
													daysUntilExpiry >= 0
												);
											})
											.map((medication) => {
												const expiry = new Date(
													medication.expiryDate!
												);
												const today = new Date();
												const daysUntilExpiry =
													Math.ceil(
														(expiry.getTime() -
															today.getTime()) /
															(1000 *
																60 *
																60 *
																24)
													);

												return (
													<div
														key={medication.id}
														className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
													>
														<div>
															<p className="font-medium">
																{
																	medication.name
																}
															</p>
															<p className="text-sm text-muted-foreground">
																Expires in{" "}
																{
																	daysUntilExpiry
																}{" "}
																days (
																{expiry.toLocaleDateString()}
																)
															</p>
														</div>
														<Badge
															variant="outline"
															className="text-orange-700"
														>
															{daysUntilExpiry}{" "}
															days
														</Badge>
													</div>
												);
											})}
									</div>
								</CardContent>
							</Card>
						)}

						{lowStockCount === 0 &&
							outOfStockCount === 0 &&
							expiringCount === 0 && (
								<Card>
									<CardContent className="flex flex-col items-center justify-center py-8">
										<Package className="h-12 w-12 text-green-500 mb-4" />
										<h3 className="text-lg font-medium text-foreground mb-2">
											All Good!
										</h3>
										<p className="text-muted-foreground text-center">
											No stock alerts at this time. All
											medications are adequately stocked.
										</p>
									</CardContent>
								</Card>
							)}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

function RouteComponent() {
	return <InventoryManagement />;
}
