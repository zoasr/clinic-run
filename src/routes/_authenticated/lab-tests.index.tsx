import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AlertTriangle,
	Calendar,
	CheckCircle,
	Clock,
	Plus,
	Search,
	TestTube,
	Trash2,
	XCircle,
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
import { Input } from "@/components/ui/input";
import { LoadingCards } from "@/components/ui/loading";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeleteLabTest } from "@/hooks/useLabTests";
import type { LabTest } from "@/lib/schema-types";
import { trpc } from "@/lib/trpc-client";

export const Route = createFileRoute("/_authenticated/lab-tests/")({
	loader: () => ({
		crumb: "All Lab Tests",
	}),
	component: RouteComponent,
});

export function LabTestManagement() {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [activeTab, setActiveTab] = useState("tests");

	const {
		data,
		isLoading: loading,
		refetch,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery(
		trpc.labTests.getAll.infiniteQueryOptions(
			{
				search: searchTerm || undefined,
				status: statusFilter === "all" ? undefined : statusFilter,
				limit: 20,
			},
			{
				getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
			},
		),
	);

	const labTests = data?.pages?.flatMap((page) => page.data) || [];

	// Mutation for deleting lab tests
	const { mutate: deleteLabTest, isPending: isDeleting } = useDeleteLabTest({
		onSuccess: () => {
			toast.success("Lab test deleted successfully");
			refetch();
		},
		onError: (error: Error) => {
			console.error("Failed to delete lab test:", error);
			toast.error(`Failed to delete lab test: ${error.message}`);
		},
	});

	const handleDeleteLabTest = (labTestId: number) => {
		deleteLabTest({ id: labTestId });
	};

	const getStatusInfo = (status: string) => {
		switch (status) {
			case "completed":
				return {
					status: "completed",
					color: "bg-green-100 text-green-800",
					icon: CheckCircle,
				};
			case "in-progress":
				return {
					status: "in-progress",
					color: "bg-blue-100 text-blue-800",
					icon: AlertTriangle,
				};
			case "ordered":
				return {
					status: "ordered",
					color: "bg-yellow-100 text-yellow-800",
					icon: Clock,
				};
			default:
				return {
					status: "unknown",
					color: "bg-gray-100 text-gray-800",
					icon: XCircle,
				};
		}
	};

	const getUrgencyStatus = (labTest: LabTest) => {
		if (labTest.status === "completed") return null;

		const orderDate = new Date(labTest.orderDate);
		const today = new Date();
		const daysSinceOrder = Math.ceil(
			(today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24),
		);

		if (daysSinceOrder > 7)
			return { status: "urgent", color: "bg-red-100 text-red-800" };
		if (daysSinceOrder > 3)
			return {
				status: "pending",
				color: "bg-orange-100 text-orange-800",
			};
		return { status: "recent", color: "bg-green-100 text-green-800" };
	};

	const completedCount =
		labTests?.filter((test) => test.status === "completed").length || 0;
	const inProgressCount =
		labTests?.filter((test) => test.status === "in-progress").length || 0;
	const orderedCount =
		labTests?.filter((test) => test.status === "ordered").length || 0;
	const urgentCount =
		labTests?.filter((test) => {
			if (test.status === "completed") return false;
			const orderDate = new Date(test.orderDate);
			const today = new Date();
			const daysSinceOrder = Math.ceil(
				(today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24),
			);
			return daysSinceOrder > 7;
		}).length || 0;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-serif font-bold text-foreground">
						Lab Test Management
					</h1>
					<p className="text-muted-foreground">
						Manage laboratory tests and results
					</p>
				</div>
				<Link to="/lab-tests/new">
					<Button className="flex items-center gap-2">
						<Plus className="h-4 w-4" />
						Order Lab Test
					</Button>
				</Link>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Total Tests</p>
								<p className="text-2xl font-bold">{labTests?.length || 0}</p>
							</div>
							<TestTube className="h-8 w-8 text-blue-500" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Completed</p>
								<p className="text-2xl font-bold text-green-600">
									{completedCount}
								</p>
							</div>
							<CheckCircle className="h-8 w-8 text-green-500" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">In Progress</p>
								<p className="text-2xl font-bold text-blue-600">
									{inProgressCount}
								</p>
							</div>
							<AlertTriangle className="h-8 w-8 text-blue-500" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Urgent Review</p>
								<p className="text-2xl font-bold text-red-600">{urgentCount}</p>
							</div>
							<Calendar className="h-8 w-8 text-red-500" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardContent>
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
							<Input
								placeholder="Search lab tests by name, patient, or doctor..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="w-full sm:w-48">
								<SelectValue placeholder="Filter by status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Tests</SelectItem>
								<SelectItem value="ordered">Ordered</SelectItem>
								<SelectItem value="in-progress">In Progress</SelectItem>
								<SelectItem value="completed">Completed</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList>
					<TabsTrigger value="tests">Test List</TabsTrigger>
					<TabsTrigger value="alerts">Status Alerts</TabsTrigger>
				</TabsList>

				<TabsContent value="tests" className="space-y-4">
					{/* Lab Test List */}
					{loading ? (
						<LoadingCards />
					) : labTests?.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-8">
								<TestTube className="h-12 w-12 text-muted-foreground mb-4" />
								<h3 className="text-lg font-medium text-foreground mb-2">
									No lab tests found
								</h3>
								<p className="text-muted-foreground text-center mb-4">
									{searchTerm || statusFilter !== "all"
										? "No lab tests match your search criteria."
										: "Get started by ordering your first lab test."}
								</p>
								<Link to="/lab-tests/new">
									<Button>
										<Plus className="h-4 w-4 mr-2" />
										Order Lab Test
									</Button>
								</Link>
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
							{labTests &&
								labTests?.map((labTest) => {
									const statusInfo = getStatusInfo(labTest.status);
									const urgencyStatus = getUrgencyStatus(labTest);
									const StatusIcon = statusInfo.icon;
									const isUrgent =
										urgencyStatus && urgencyStatus.status === "urgent";
									const isPending =
										urgencyStatus && urgencyStatus.status === "pending";

									return (
										<Card
											key={labTest.id}
											className={`group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-border/50 hover:border-primary/20 ${
												isUrgent
													? " bg-red-100/30 dark:bg-red-800/10"
													: isPending
														? "bg-orange-100/30 dark:bg-orange-800/10"
														: ""
											}`}
										>
											<CardContent className="flex flex-col items-center justify-between h-full *:w-full">
												{/* Header */}
												<div className="flex items-start justify-between mb-4">
													<div className="flex items-center gap-3 flex-1">
														<div className="relative">
															<div
																className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
																	isUrgent
																		? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
																		: isPending
																			? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
																			: "bg-primary/20 text-primary group-hover:bg-primary/30"
																}`}
															>
																<TestTube className="h-6 w-6" />
															</div>
															{isUrgent && (
																<div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
																	<span className="text-xs text-white font-bold">
																		!
																	</span>
																</div>
															)}
														</div>
														<div className="flex-1 min-w-0">
															<h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
																{labTest.testName}
															</h3>
															<p className="text-sm text-muted-foreground truncate">
																{labTest.patient?.firstName}{" "}
																{labTest.patient?.lastName}
															</p>
														</div>
													</div>
													<div className="flex flex-col gap-1">
														<Badge
															className={`${statusInfo.color} border-0 text-xs`}
														>
															{statusInfo.status}
														</Badge>
														{urgencyStatus &&
															urgencyStatus.status !== "recent" && (
																<Badge
																	className={`${urgencyStatus.color} border-0 text-xs`}
																>
																	{urgencyStatus.status}
																</Badge>
															)}
													</div>
												</div>

												{/* Key Information Grid */}
												<div className="grid grid-cols-2 gap-4 mb-4">
													{/* Test Type */}
													<div className="space-y-1">
														<p className="text-xs text-muted-foreground">
															Test Type
														</p>
														<p className="text-sm font-medium">
															{labTest.testType}
														</p>
													</div>

													{/* Order Date */}
													<div className="space-y-1">
														<p className="text-xs text-muted-foreground">
															Ordered
														</p>
														<p className="text-sm font-medium">
															{new Date(labTest.orderDate).toLocaleDateString()}
														</p>
													</div>

													{/* Doctor */}
													<div className="space-y-1">
														<p className="text-xs text-muted-foreground">
															Doctor
														</p>
														<p className="text-sm font-medium">
															Dr. {labTest.doctor?.firstName}{" "}
															{labTest.doctor?.lastName}
														</p>
													</div>

													{/* Completed Date */}
													{labTest.completedDate && (
														<div className="space-y-1">
															<p className="text-xs text-muted-foreground">
																Completed
															</p>
															<p className="text-sm font-medium">
																{new Date(
																	labTest.completedDate,
																).toLocaleDateString()}
															</p>
														</div>
													)}
												</div>

												{/* Results Preview */}
												{labTest.results && (
													<div className="space-y-2 mb-4 pt-3 border-t border-border/50">
														<div className="flex justify-between items-center">
															<span className="text-xs text-muted-foreground">
																Results
															</span>
															<span className="text-sm line-clamp-2">
																{labTest.results.length > 50
																	? `${labTest.results.substring(0, 50)}...`
																	: labTest.results}
															</span>
														</div>
													</div>
												)}

												{/* Metadata */}
												<div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
													<span>
														Ordered{" "}
														{new Date(labTest.createdAt).toLocaleDateString()}
													</span>
													{labTest.updatedAt !== labTest.createdAt && (
														<span>
															Updated{" "}
															{new Date(labTest.updatedAt).toLocaleDateString()}
														</span>
													)}
												</div>

												{/* Actions */}
												<div className="flex items-center gap-2 pt-4 mt-4 border-t border-border/50">
													<Link
														to={`/lab-tests/$labTestId`}
														params={{
															labTestId: labTest.id.toString(),
														}}
														className="flex-1"
													>
														<Button size="sm" className="w-full transition-all">
															View Details
														</Button>
													</Link>
													<Link
														to={`/lab-tests/edit/$labTestId`}
														params={{
															labTestId: labTest.id.toString(),
														}}
													>
														<Button
															variant="outline"
															className="transition-all"
														>
															Edit Test
														</Button>
													</Link>
													<AlertDialog>
														<AlertDialogTrigger asChild>
															<Button
																variant="destructive"
																size="sm"
																disabled={isDeleting}
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</AlertDialogTrigger>
														<AlertDialogContent>
															<AlertDialogHeader>
																<AlertDialogTitle>
																	Delete Lab Test
																</AlertDialogTitle>
																<AlertDialogDescription>
																	Are you sure you want to delete this lab test
																	&quot;
																	{labTest.testName}
																	&quot; for {labTest.patient?.firstName}{" "}
																	{labTest.patient?.lastName}? This action
																	cannot be undone.
																</AlertDialogDescription>
															</AlertDialogHeader>
															<AlertDialogFooter>
																<AlertDialogCancel>Cancel</AlertDialogCancel>
																<AlertDialogAction
																	onClick={() =>
																		handleDeleteLabTest(labTest.id)
																	}
																	asChild
																>
																	<Button variant="destructive">Delete</Button>
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
					{labTests.length > 0 && (
						<div className="flex flex-col items-center gap-4 mt-8">
							<div className="text-sm text-muted-foreground">
								Showing {labTests.length} lab tests
								{!hasNextPage && " (all loaded)"}
							</div>
							{hasNextPage && (
								<Button
									onClick={() => fetchNextPage()}
									disabled={isFetchingNextPage}
									className="min-w-[120px]"
									size="lg"
								>
									{isFetchingNextPage ? "Loading..." : "Load More Lab Tests"}
								</Button>
							)}
						</div>
					)}
				</TabsContent>

				<TabsContent value="alerts" className="space-y-4">
					<div className="grid gap-4">
						{/* Urgent Tests */}
						{urgentCount > 0 && (
							<Card>
								<CardContent className="p-6">
									<div className="flex items-center gap-3 mb-4">
										<AlertTriangle className="h-6 w-6 text-red-500" />
										<div>
											<h3 className="font-semibold text-foreground">
												Urgent Review Required
											</h3>
											<p className="text-sm text-muted-foreground">
												{urgentCount} tests need immediate attention
											</p>
										</div>
									</div>
									<div className="space-y-2">
										{labTests
											?.filter((test) => {
												if (test.status === "completed") return false;
												const orderDate = new Date(test.orderDate);
												const today = new Date();
												const daysSinceOrder = Math.ceil(
													(today.getTime() - orderDate.getTime()) /
														(1000 * 60 * 60 * 24),
												);
												return daysSinceOrder > 7;
											})
											.map((labTest) => (
												<div
													key={labTest.id}
													className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
												>
													<div>
														<p className="font-medium">{labTest.testName}</p>
														<p className="text-sm text-muted-foreground">
															Patient: {labTest.patient?.firstName}{" "}
															{labTest.patient?.lastName}
														</p>
														<p className="text-sm text-muted-foreground">
															Ordered:{" "}
															{new Date(labTest.orderDate).toLocaleDateString()}
														</p>
													</div>
													<Link
														to={`/lab-tests/$labTestId`}
														params={{
															labTestId: labTest.id.toString(),
														}}
													>
														<Button size="sm">Review</Button>
													</Link>
												</div>
											))}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Pending Tests */}
						{inProgressCount > 0 && (
							<Card>
								<CardContent className="p-6">
									<div className="flex items-center gap-3 mb-4">
										<Clock className="h-6 w-6 text-primary" />
										<div>
											<h3 className="font-semibold text-foreground">
												Tests In Progress
											</h3>
											<p className="text-sm text-muted-foreground">
												{inProgressCount} tests are currently being processed
											</p>
										</div>
									</div>
									<div className="space-y-2">
										{labTests
											?.filter((test) => test.status === "in-progress")
											.map((labTest) => (
												<div
													key={labTest.id}
													className="flex items-center justify-between p-3 bg-blue-500/20 border rounded-lg"
												>
													<div>
														<p className="font-medium">{labTest.testName}</p>
														<p className="text-sm text-muted-foreground">
															Patient: {labTest.patient?.firstName}{" "}
															{labTest.patient?.lastName}
														</p>
													</div>
													<Link
														to={`/lab-tests/$labTestId`}
														params={{
															labTestId: labTest.id.toString(),
														}}
													>
														<Button size="sm">Update</Button>
													</Link>
												</div>
											))}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Recently Ordered */}
						{orderedCount > 0 && (
							<Card>
								<CardContent className="p-6">
									<div className="flex items-center gap-3 mb-4">
										<Calendar className="h-6 w-6 text-yellow-500" />
										<div>
											<h3 className="font-semibold text-foreground">
												Recently Ordered
											</h3>
											<p className="text-sm text-muted-foreground">
												{orderedCount} tests are waiting to be started
											</p>
										</div>
									</div>
									<div className="space-y-2">
										{labTests
											?.filter((test) => test.status === "ordered")
											.slice(0, 5)
											.map((labTest) => (
												<div
													key={labTest.id}
													className="flex items-center justify-between p-3 border border-yellow-50 bg-yellow-50/20 rounded-lg"
												>
													<div>
														<p className="font-medium">{labTest.testName}</p>
														<p className="text-sm text-muted-foreground">
															Patient: {labTest.patient?.firstName}{" "}
															{labTest.patient?.lastName}
														</p>
													</div>
													<Link
														to={`/lab-tests/$labTestId`}
														params={{
															labTestId: labTest.id.toString(),
														}}
													>
														<Button size="sm">Start</Button>
													</Link>
												</div>
											))}
									</div>
								</CardContent>
							</Card>
						)}

						{urgentCount === 0 &&
							inProgressCount === 0 &&
							orderedCount === 0 && (
								<Card>
									<CardContent className="flex flex-col items-center justify-center py-8">
										<CheckCircle className="h-12 w-12 text-green-500 mb-4" />
										<h3 className="text-lg font-medium text-foreground mb-2">
											All Caught Up!
										</h3>
										<p className="text-muted-foreground text-center">
											No urgent lab test alerts at this time.
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
	return <LabTestManagement />;
}
