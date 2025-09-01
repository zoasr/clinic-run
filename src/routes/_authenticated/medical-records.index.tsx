import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, User, Calendar, Activity, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
	useMedicalRecordsInfinite,
	useDeleteMedicalRecord,
} from "@/hooks/useMedicalRecords";
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
import LoadMore from "@/components/load-more";

function MedicalRecordsPage() {
	const [searchTerm, setSearchTerm] = useState("");

	const {
		data,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		refetch,
	} = useMedicalRecordsInfinite({
		search: searchTerm,
		limit: 20,
	});

	// Mutation for deleting medical records
	const { mutate: deleteMedicalRecord, isPending: isDeleting } =
		useDeleteMedicalRecord({
			onSuccess: () => {
				toast.success("Medical record deleted successfully");
				refetch();
			},
			onError: (error: Error) => {
				console.error("Failed to delete medical record:", error);
				toast.error("Failed to delete medical record");
			},
		});

	const handleDeleteMedicalRecord = (recordId: number) => {
		deleteMedicalRecord({ id: recordId });
	};

	// Flatten the infinite query data
	const records = data?.pages.flatMap((page) => page.data) || [];
	const vitalSigns = (vitalSigns?: string | null) => {
		if (!vitalSigns) return null;
		try {
			return JSON.parse(vitalSigns);
		} catch {
			return null;
		}
	};

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Medical Records</h1>
				<Link to="/medical-records/new">
					<Button>
						<Plus className="h-4 w-4 mr-2" />
						Add Record
					</Button>
				</Link>
			</div>

			{/* Search */}
			<Card>
				<CardContent className="pt-6">
					<div className="relative">
						<Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Search records by patient, doctor, or diagnosis..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Medical Records Table */}
			<Card>
				<CardHeader>
					<CardTitle>Medical Records</CardTitle>
					<CardDescription>
						View and manage patient medical records
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Patient</TableHead>
									<TableHead>Doctor</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Diagnosis</TableHead>
									<TableHead>Vital Signs</TableHead>
									<TableHead>Treatment</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{records.map((record) => (
									<TableRow key={record.id}>
										<TableCell>
											<Link
												to={`/medical-records/$medicalRecordId`}
												params={{
													medicalRecordId:
														record.id.toString(),
												}}
											>
												<div className="flex items-center cursor-pointer hover:text-primary transition-colors">
													<User className="h-4 w-4 mr-2 text-gray-400" />
													{record.patient?.firstName}{" "}
													{record.patient?.lastName}
												</div>
											</Link>
										</TableCell>
										<TableCell>
											<Link
												to={`/medical-records/$medicalRecordId`}
												params={{
													medicalRecordId:
														record.id.toString(),
												}}
											>
												<div className="cursor-pointer hover:text-primary transition-colors">
													Dr.{" "}
													{record.doctor?.firstName}{" "}
													{record.doctor?.lastName}
												</div>
											</Link>
										</TableCell>
										<TableCell>
											<Link
												to={`/medical-records/$medicalRecordId`}
												params={{
													medicalRecordId:
														record.id.toString(),
												}}
											>
												<div className="flex items-center text-sm cursor-pointer hover:text-primary transition-colors">
													<Calendar className="h-3 w-3 mr-1" />
													{record.visitDate.toLocaleDateString()}
													{record.visitDate.toLocaleTimeString()}
												</div>
											</Link>
										</TableCell>
										<TableCell>
											<Link
												to={`/medical-records/$medicalRecordId`}
												params={{
													medicalRecordId:
														record.id.toString(),
												}}
											>
												<div className="cursor-pointer hover:text-primary transition-colors">
													<Badge variant="outline">
														{record.diagnosis}
													</Badge>
												</div>
											</Link>
										</TableCell>
										<TableCell>
											<Link
												to={`/medical-records/$medicalRecordId`}
												params={{
													medicalRecordId:
														record.id.toString(),
												}}
											>
												<div className="space-y-1 text-xs cursor-pointer hover:text-primary transition-colors">
													<div className="flex items-center">
														<Activity className="h-3 w-3 mr-1" />
														BP:{" "}
														{vitalSigns(
															record.vitalSigns
														)?.bloodPressure ||
															"N/A"}
													</div>
													<div>
														HR:{" "}
														{vitalSigns(
															record.vitalSigns
														)?.heartRate || "N/A"}
													</div>
													<div>
														Temp:{" "}
														{vitalSigns(
															record.vitalSigns
														)?.temperature || "N/A"}
													</div>
												</div>
											</Link>
										</TableCell>
										<TableCell className="max-w-xs truncate">
											<Link
												to={`/medical-records/$medicalRecordId`}
												params={{
													medicalRecordId:
														record.id.toString(),
												}}
											>
												<div className="cursor-pointer hover:text-primary transition-colors">
													{record.treatment}
												</div>
											</Link>
										</TableCell>
										<TableCell>
											<div
												onClick={(e) =>
													e.stopPropagation()
												}
											>
												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button
															variant="outline"
															size="sm"
															className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
																Delete Medical
																Record
															</AlertDialogTitle>
															<AlertDialogDescription>
																Are you sure you
																want to delete
																this medical
																record? This
																action cannot be
																undone.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>
																Cancel
															</AlertDialogCancel>
															<AlertDialogAction
																onClick={() =>
																	handleDeleteMedicalRecord(
																		record.id
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
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}

					{/* Load More Button */}
					<LoadMore
						label="Records"
						results={records}
						fetchNextPage={fetchNextPage}
						hasNextPage={hasNextPage}
						isFetchingNextPage={isFetchingNextPage}
					/>
				</CardContent>
			</Card>
		</div>
	);
}

export const Route = createFileRoute("/_authenticated/medical-records/")({
	component: MedicalRecordsPage,
});
