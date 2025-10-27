import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Building2,
	Edit,
	MoreHorizontal,
	Plus,
	Search,
	Trash2,
} from "lucide-react";
import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { LoadingCards } from "@/components/ui/loading";
import { useDeleteSupplier } from "@/hooks/useSuppliers";
import { trpc } from "@/lib/trpc-client";

export function SupplierManagement() {
	const [searchTerm, setSearchTerm] = useState("");

	const {
		data: suppliers,
		isLoading,
		refetch,
	} = useQuery(trpc.medicationSuppliers.getAll.queryOptions());

	// Mutation for deleting suppliers
	const { mutate: deleteSupplier, isPending: isDeleting } = useDeleteSupplier({
		onSuccess: () => {
			toast.success("Supplier deleted successfully");
			refetch();
		},
		onError: (error: Error) => {
			console.error("Failed to delete supplier:", error);
			toast.error(`Failed to delete supplier: ${error.message}`);
		},
	});

	const handleDeleteSupplier = (supplierId: number) => {
		deleteSupplier({ id: supplierId });
	};

	const filteredSuppliers = suppliers?.filter((supplier) =>
		supplier.name.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-serif font-bold text-foreground">
						Supplier Management
					</h1>
					<p className="text-muted-foreground">
						Manage medication suppliers and their information
					</p>
				</div>
				<Link to="/medications/suppliers/new">
					<Button className="flex items-center gap-2">
						<Plus className="h-4 w-4" />
						Add Supplier
					</Button>
				</Link>
			</div>

			{/* Search */}
			<Card>
				<CardContent className="pt-6">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
						<Input
							placeholder="Search suppliers by name..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Suppliers List */}
			{isLoading ? (
				<LoadingCards />
			) : filteredSuppliers?.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-8">
						<Building2 className="h-12 w-12 text-muted-foreground mb-4" />
						<h3 className="text-lg font-medium text-foreground mb-2">
							No suppliers found
						</h3>
						<p className="text-muted-foreground text-center mb-4">
							{searchTerm
								? "No suppliers match your search criteria."
								: "Get started by adding your first supplier."}
						</p>
						<Link to="/medications/suppliers/new">
							<Button>
								<Plus className="h-4 w-4 mr-2" />
								Add Supplier
							</Button>
						</Link>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(350px,1fr))]">
					{filteredSuppliers?.map((supplier) => (
						<Card
							key={supplier.id}
							className="group hover:shadow-lg transition-all duration-200"
						>
							<CardContent className="p-6">
								{/* Header */}
								<div className="flex items-start justify-between mb-4">
									<div className="flex items-center gap-3 flex-1">
										<div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
											<Building2 className="h-6 w-6 text-primary" />
										</div>
										<div className="flex-1 min-w-0">
											<h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
												{supplier.name}
											</h3>
											<p className="text-sm text-muted-foreground">
												Added{" "}
												{new Date(supplier.createdAt).toLocaleDateString()}
											</p>
										</div>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="sm">
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<Link
												to={`/medications/suppliers/$supplierId/edit`}
												params={{ supplierId: supplier.id.toString() }}
											>
												<DropdownMenuItem>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
											</Link>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<DropdownMenuItem
														className="text-destructive focus:text-destructive"
														onSelect={(e) => e.preventDefault()}
													>
														<Trash2 className="h-4 w-4 mr-2" />
														Delete
													</DropdownMenuItem>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>Delete Supplier</AlertDialogTitle>
														<AlertDialogDescription>
															Are you sure you want to delete "{supplier.name}"?
															This action cannot be undone.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancel</AlertDialogCancel>
														<AlertDialogAction
															onClick={() => handleDeleteSupplier(supplier.id)}
															className="bg-red-600 hover:bg-red-700"
														>
															Delete
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>

								{/* Contact Info */}
								{supplier.contactInfo && (
									<div className="space-y-2 mb-4">
										<p className="text-sm font-medium text-foreground">
											Contact
										</p>
										<p className="text-sm text-muted-foreground whitespace-pre-line">
											{supplier.contactInfo}
										</p>
									</div>
								)}

								{/* Address */}
								{supplier.address && (
									<div className="space-y-2">
										<p className="text-sm font-medium text-foreground">
											Address
										</p>
										<p className="text-sm text-muted-foreground whitespace-pre-line">
											{supplier.address}
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}

function RouteComponent() {
	return <SupplierManagement />;
}
