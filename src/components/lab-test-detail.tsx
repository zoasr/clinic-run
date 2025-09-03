import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
	TestTube,
	User,
	Calendar,
	FileText,
	CheckCircle,
	Clock,
	AlertCircle,
	Edit,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc-client";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@/lib/trpc";
import type { LabTest } from "@/hooks/useLabTests";
import { Link } from "@tanstack/react-router";

interface LabTestDetailProps {
	labTest: LabTest;
	onBack: () => void;
}

export function LabTestDetail({ labTest, onBack }: LabTestDetailProps) {
	const queryClient = useQueryClient();
	const [results, setResults] = useState(labTest?.results || "");
	const [completedDate, setCompletedDate] = useState(
		labTest?.completedDate || new Date()
	);

	const updateStatusMutation = useMutation(
		trpc.labTests.updateStatus.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["labTests"],
					refetchType: "active",
				});
				toast.success("Lab test status updated successfully");
			},
			onError: (error: TRPCClientErrorLike<AppRouter>) => {
				toast.error(
					error.message || "Failed to update lab test status"
				);
			},
		})
	);

	const handleStatusUpdate = (
		newStatus: "ordered" | "in-progress" | "completed"
	) => {
		const updateData: any = {
			id: labTest?.id,
			status: newStatus,
		};

		if (newStatus === "completed") {
			updateData.results = results;
			updateData.completedDate =
				completedDate || new Date().toLocaleDateString();
		}

		updateStatusMutation.mutate(updateData);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "completed":
				return "default";
			case "in-progress":
				return "secondary";
			case "ordered":
				return "outline";
			default:
				return "outline";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "completed":
				return CheckCircle;
			case "in-progress":
				return AlertCircle;
			case "ordered":
				return Clock;
			default:
				return TestTube;
		}
	};

	const StatusIcon = getStatusIcon(labTest?.status || "");

	if (!labTest) return null;
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
							{labTest.testName}
						</h1>
						<p className="text-muted-foreground">
							Lab test for {labTest.patient?.firstName}{" "}
							{labTest.patient?.lastName}
						</p>
					</div>
				</div>

				<Link
					to="/lab-tests/edit/$labTestId"
					params={{ labTestId: labTest.id.toString() }}
				>
					<Button
						variant="outline"
						className="flex items-center gap-2"
					>
						<Edit className="h-4 w-4" />
						Edit Test
					</Button>
				</Link>
			</div>

			{/* Status Banner */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<StatusIcon className="h-6 w-6 text-muted-foreground" />
							<div>
								<h3 className="font-semibold text-foreground">
									Status: {labTest.status}
								</h3>
								<p className="text-sm text-muted-foreground">
									{labTest.status === "completed"
										? "Test completed and results available"
										: labTest.status === "in-progress"
											? "Test is currently being processed"
											: "Test has been ordered and is pending"}
								</p>
							</div>
							<Badge
								variant={getStatusColor(labTest.status)}
								className="ml-4"
							>
								{labTest.status}
							</Badge>
						</div>

						{/* Status Update Actions */}
						<div className="flex items-center gap-2">
							{labTest.status === "ordered" && (
								<Button
									onClick={() =>
										handleStatusUpdate("in-progress")
									}
									disabled={updateStatusMutation.isPending}
									variant="outline"
									size="sm"
								>
									Start Test
								</Button>
							)}
							{labTest.status === "in-progress" && (
								<Button
									onClick={() =>
										handleStatusUpdate("completed")
									}
									disabled={updateStatusMutation.isPending}
									size="sm"
								>
									Complete Test
								</Button>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Quick Results Entry */}
			{labTest.status === "in-progress" && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Enter Results
						</CardTitle>
						<CardDescription>
							Record the test results and completion date
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="completedDate">
									Completed Date
								</Label>
								<Input
									id="completedDate"
									type="date"
									value={
										completedDate
											.toISOString()
											.split("T")[0]
									}
									onChange={(e) =>
										setCompletedDate(
											new Date(e.target.value)
										)
									}
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="results">Test Results</Label>
							<Textarea
								id="results"
								value={results}
								onChange={(e) => setResults(e.target.value)}
								placeholder="Enter test results and findings..."
								rows={4}
							/>
						</div>
						<Button
							onClick={() => handleStatusUpdate("completed")}
							disabled={
								updateStatusMutation.isPending ||
								!results.trim()
							}
							className="w-full"
						>
							{updateStatusMutation.isPending
								? "Saving..."
								: "Save Results & Complete"}
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Test Information */}
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
								{labTest.patient?.firstName}{" "}
								{labTest.patient?.lastName}
							</p>
							<p className="text-sm text-muted-foreground">
								ID: {labTest.patient?.patientId}
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Doctor Information */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<User className="h-5 w-5" />
							Ordering Doctor
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<p className="text-sm text-muted-foreground">
								Name
							</p>
							<p className="font-medium">
								Dr. {labTest.doctor?.firstName}{" "}
								{labTest.doctor?.lastName}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Test Details */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TestTube className="h-5 w-5" />
						Test Details
					</CardTitle>
					<CardDescription>
						Laboratory test information and specifications
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-3">
							<div>
								<p className="text-sm text-muted-foreground">
									Test Name
								</p>
								<p className="font-medium">
									{labTest.testName}
								</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">
									Test Type
								</p>
								<p className="font-medium">
									{labTest.testType}
								</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">
									Order Date
								</p>
								<p className="font-medium">
									{new Date(
										labTest.orderDate
									).toLocaleDateString()}
								</p>
							</div>
						</div>

						<div className="space-y-3">
							<div>
								<p className="text-sm text-muted-foreground">
									Completed Date
								</p>
								<p className="font-medium">
									{labTest.completedDate
										? new Date(
												labTest.completedDate
											).toLocaleDateString()
										: "Not completed"}
								</p>
							</div>
							{labTest.normalRange && (
								<div>
									<p className="text-sm text-muted-foreground">
										Normal Range
									</p>
									<p className="font-medium">
										{labTest.normalRange}
									</p>
								</div>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Results Section */}
			{labTest.results && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Test Results
						</CardTitle>
						<CardDescription>
							Laboratory findings and results
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="p-4 bg-muted/50 rounded-md">
							<p className="text-sm whitespace-pre-wrap">
								{labTest.results}
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Notes Section */}
			{labTest.notes && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Additional Notes
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="p-4 bg-muted/50 rounded-md">
							<p className="text-sm whitespace-pre-wrap">
								{labTest.notes}
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Test Metadata */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Calendar className="h-5 w-5" />
						Test Timeline
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
									labTest.createdAt
								).toLocaleDateString()}{" "}
								at{" "}
								{new Date(
									labTest.createdAt
								).toLocaleTimeString()}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">
								Last Updated
							</p>
							<p className="font-medium">
								{new Date(
									labTest.updatedAt
								).toLocaleDateString()}{" "}
								at{" "}
								{new Date(
									labTest.updatedAt
								).toLocaleTimeString()}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{updateStatusMutation.error && (
				<Alert variant="destructive">
					<AlertDescription>
						{updateStatusMutation.error.message}
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
