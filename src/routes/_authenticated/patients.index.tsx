import { createFileRoute, Link } from "@tanstack/react-router";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, User, Phone, Mail } from "lucide-react";
import { LoadingCards } from "@/components/ui/loading";
import { useInfiniteQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";
import ErrorComponent from "@/components/error";

function PatientManagement() {
	const [searchTerm, setSearchTerm] = useState("");

	const {
		data,
		isLoading,
		isError,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery(
		trpc.patients.getAll.infiniteQueryOptions(
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

	const patients = data?.pages?.flatMap((page) => page.data) || [];

	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
		// Reset the infinite query when search changes
		// This will be handled automatically by React Query's key invalidation
	};

	const calculateAge = (dateOfBirth: Date) => {
		const today = new Date();
		const birthDate = new Date(dateOfBirth);
		let age = today.getFullYear() - birthDate.getFullYear();
		const monthDiff = today.getMonth() - birthDate.getMonth();

		if (
			monthDiff < 0 ||
			(monthDiff === 0 && today.getDate() < birthDate.getDate())
		) {
			age--;
		}

		return age;
	};

	return (
		<>
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-display font-bold text-foreground">
						Patient Management
					</h1>
					<p className="text-muted-foreground">
						Manage patient records and information
					</p>
				</div>
				<Link to="/patients/new">
					<Button className="flex items-center gap-2">
						<Plus className="h-4 w-4" />
						Add New Patient
					</Button>
				</Link>
			</div>

			{/* Search */}
			<Card>
				<CardContent className="pt-6">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
						<Input
							placeholder="Search patients by name..."
							value={searchTerm}
							onChange={(e) => handleSearchChange(e.target.value)}
							className="pl-10"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Patient List */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{isError ? (
					<ErrorComponent
						error={new Error("Failed to fetch patients")}
					/>
				) : isLoading ? (
					<div className="col-span-full">
						<LoadingCards />
					</div>
				) : patients.length === 0 ? (
					<div className="col-span-full">
						<Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
							<CardContent className="flex flex-col items-center justify-center py-12">
								<div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
									<User className="h-8 w-8 text-primary" />
								</div>
								<h3 className="text-xl font-semibold text-foreground mb-2">
									No patients found
								</h3>
								<p className="text-muted-foreground text-center mb-6 max-w-md">
									{searchTerm
										? "No patients match your search criteria. Try adjusting your search terms."
										: "Get started by adding your first patient to the system."}
								</p>
								<Link to="/patients/new">
									<Button size="lg" className="shadow-sm">
										<Plus className="h-4 w-4 mr-2" />
										Add First Patient
									</Button>
								</Link>
							</CardContent>
						</Card>
					</div>
				) : (
					patients?.map((patient) =>
						!!patient ? (
							<Card
								key={patient.id}
								className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer border-border/50 hover:border-primary/20"
							>
								<CardContent className="p-6">
									<div className="flex items-start justify-between mb-4">
										<Link
											className="flex items-center gap-3 flex-1"
											to="/patients/$patientId"
											params={{
												patientId: `${patient.id}`,
											}}
										>
											<div className="relative">
												<div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-colors">
													<User className="h-6 w-6 text-primary" />
												</div>
												<div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
											</div>
											<div className="flex-1 min-w-0">
												<h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
													{patient.firstName}{" "}
													{patient.lastName}
												</h3>
												<p className="text-sm text-muted-foreground font-mono">
													ID: {patient.patientId}
												</p>
											</div>
										</Link>
										<Link
											to="/patients/$patientId"
											params={{
												patientId: `${patient.id}`,
											}}
										>
											<Button
												variant="ghost"
												size="sm"
												className="opacity-20 group-hover:opacity-100 transition-all"
											>
												View
											</Button>
										</Link>
									</div>

									{/* Patient Details Grid */}
									<div className="space-y-3">
										{/* Primary Info Row */}
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<User className="h-4 w-4 text-muted-foreground" />
												<span className="text-sm text-muted-foreground">
													{calculateAge(
														patient.dateOfBirth
													)}{" "}
													old
												</span>
											</div>
											<Badge
												variant={
													patient.gender === "male"
														? "default"
														: "secondary"
												}
												className="text-xs"
											>
												{patient.gender}
											</Badge>
										</div>

										{/* Contact Info */}
										{(patient.phone || patient.email) && (
											<div className="space-y-2">
												{patient.phone && (
													<div className="flex items-center gap-2 text-sm">
														<Phone className="h-3 w-3 text-muted-foreground" />
														<span className="text-muted-foreground">
															{patient.phone}
														</span>
													</div>
												)}
												{patient.email && (
													<div className="flex items-center gap-2 text-sm">
														<Mail className="h-3 w-3 text-muted-foreground" />
														<span className="text-muted-foreground truncate">
															{patient.email}
														</span>
													</div>
												)}
											</div>
										)}

										{/* Medical Info */}
										{patient.bloodType && (
											<div className="flex items-center justify-between pt-2 border-t border-border/50">
												<span className="text-xs text-muted-foreground">
													Blood Type
												</span>
												<Badge
													variant="outline"
													className="font-mono"
												>
													{patient.bloodType}
												</Badge>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						) : null
					)
				)}
			</div>

			{/* Load More Section */}
			{patients.length > 0 && (
				<div className="flex flex-col items-center gap-4 mt-8">
					{/* Patient Count Info */}
					<div className="text-sm text-muted-foreground">
						Showing {patients.length} patients
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
								: "Load More Patients"}
						</Button>
					)}
				</div>
			)}
		</>
	);
}

export const Route = createFileRoute("/_authenticated/patients/")({
	component: () => <PatientManagement />,
	loader: () => ({
		crumb: "All Patients",
	}),
});
