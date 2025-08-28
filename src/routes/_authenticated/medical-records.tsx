import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/date-picker";
import { Plus, Search, User, Calendar, Activity } from "lucide-react";

interface MedicalRecord {
	id: string;
	patientName: string;
	patientId: string;
	doctorName: string;
	date: string;
	diagnosis: string;
	treatment: string;
	prescription: string;
	notes: string;
	vitalSigns: {
		bloodPressure: string;
		heartRate: string;
		temperature: string;
		weight: string;
		height: string;
	};
	createdAt: string;
}

function MedicalRecordsPage() {
	const [records, setRecords] = useState<MedicalRecord[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [newRecord, setNewRecord] = useState<Partial<MedicalRecord>>({
		vitalSigns: {},
	});

	useEffect(() => {
		fetchRecords();
	}, []);

	const fetchRecords = async () => {
		try {
			setIsLoading(true);
			// Mock data - replace with actual API call
			const mockRecords: MedicalRecord[] = [
				{
					id: "1",
					patientName: "John Doe",
					patientId: "1",
					doctorName: "Dr. Smith",
					date: "2024-03-15",
					diagnosis: "Hypertension",
					treatment: "Lifestyle changes, medication",
					prescription: "Lisinopril 10mg daily",
					notes: "Patient shows improvement in blood pressure control",
					vitalSigns: {
						bloodPressure: "140/90",
						heartRate: "72",
						temperature: "98.6",
						weight: "180",
						height: "5'10\"",
					},
					createdAt: "2024-03-15",
				},
				{
					id: "2",
					patientName: "Jane Smith",
					patientId: "2",
					doctorName: "Dr. Johnson",
					date: "2024-03-14",
					diagnosis: "Asthma exacerbation",
					treatment: "Inhaler therapy, follow-up in 2 weeks",
					prescription: "Albuterol inhaler as needed",
					notes: "Patient experiencing seasonal allergies triggering asthma",
					vitalSigns: {
						bloodPressure: "120/80",
						heartRate: "85",
						temperature: "99.1",
						weight: "135",
						height: "5'6\"",
					},
					createdAt: "2024-03-14",
				},
			];
			setRecords(mockRecords);
		} catch (error) {
			console.error("Failed to fetch medical records:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const filteredRecords = records.filter(
		(record) =>
			record.patientName
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			record.doctorName
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const handleAddRecord = async () => {
		try {
			const record: MedicalRecord = {
				...newRecord,
				id: Date.now().toString(),
				createdAt: new Date().toISOString().split("T")[0],
			} as MedicalRecord;

			setRecords([...records, record]);
			setNewRecord({ vitalSigns: {} });
			setIsAddDialogOpen(false);
		} catch (error) {
			console.error("Failed to add medical record:", error);
		}
	};

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold text-gray-900">
					Medical Records
				</h1>
				<Dialog
					open={isAddDialogOpen}
					onOpenChange={setIsAddDialogOpen}
				>
					<DialogTrigger asChild>
						<Button>
							<Plus className="h-4 w-4 mr-2" />
							Add Record
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Add Medical Record</DialogTitle>
							<DialogDescription>
								Create a new medical record for a patient.
							</DialogDescription>
						</DialogHeader>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="patientName">
									Patient Name
								</Label>
								<Input
									id="patientName"
									value={newRecord.patientName || ""}
									onChange={(e) =>
										setNewRecord({
											...newRecord,
											patientName: e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="doctorName">Doctor</Label>
								<Input
									id="doctorName"
									value={newRecord.doctorName || ""}
									onChange={(e) =>
										setNewRecord({
											...newRecord,
											doctorName: e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="date">Date</Label>
								<DatePicker
									selected={
										newRecord.date
											? new Date(newRecord.date)
											: undefined
									}
									onSelect={(date) => {
										setNewRecord({
											...newRecord,
											date: date
												? date.toISOString()
												: "",
										});
									}}
									mode="single"
									captionLayout="dropdown"
									placeholder="Select visit date"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="diagnosis">Diagnosis</Label>
								<Input
									id="diagnosis"
									value={newRecord.diagnosis || ""}
									onChange={(e) =>
										setNewRecord({
											...newRecord,
											diagnosis: e.target.value,
										})
									}
								/>
							</div>
							<div className="col-span-2 space-y-2">
								<Label htmlFor="treatment">Treatment</Label>
								<Textarea
									id="treatment"
									value={newRecord.treatment || ""}
									onChange={(e) =>
										setNewRecord({
											...newRecord,
											treatment: e.target.value,
										})
									}
								/>
							</div>
							<div className="col-span-2 space-y-2">
								<Label htmlFor="prescription">
									Prescription
								</Label>
								<Textarea
									id="prescription"
									value={newRecord.prescription || ""}
									onChange={(e) =>
										setNewRecord({
											...newRecord,
											prescription: e.target.value,
										})
									}
								/>
							</div>

							{/* Vital Signs */}
							<div className="col-span-2">
								<Label className="text-base font-semibold">
									Vital Signs
								</Label>
								<div className="grid grid-cols-3 gap-4 mt-2">
									<div className="space-y-2">
										<Label htmlFor="bloodPressure">
											Blood Pressure
										</Label>
										<Input
											id="bloodPressure"
											placeholder="120/80"
											value={
												newRecord.vitalSigns
													?.bloodPressure || ""
											}
											onChange={(e) =>
												setNewRecord({
													...newRecord,
													vitalSigns: {
														...newRecord.vitalSigns,
														bloodPressure:
															e.target.value,
													},
												})
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="heartRate">
											Heart Rate
										</Label>
										<Input
											id="heartRate"
											placeholder="72 bpm"
											value={
												newRecord.vitalSigns
													?.heartRate || ""
											}
											onChange={(e) =>
												setNewRecord({
													...newRecord,
													vitalSigns: {
														...newRecord.vitalSigns,
														heartRate:
															e.target.value,
													},
												})
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="temperature">
											Temperature
										</Label>
										<Input
											id="temperature"
											placeholder="98.6°F"
											value={
												newRecord.vitalSigns
													?.temperature || ""
											}
											onChange={(e) =>
												setNewRecord({
													...newRecord,
													vitalSigns: {
														...newRecord.vitalSigns,
														temperature:
															e.target.value,
													},
												})
											}
										/>
									</div>
								</div>
							</div>

							<div className="col-span-2 space-y-2">
								<Label htmlFor="notes">Notes</Label>
								<Textarea
									id="notes"
									value={newRecord.notes || ""}
									onChange={(e) =>
										setNewRecord({
											...newRecord,
											notes: e.target.value,
										})
									}
								/>
							</div>
						</div>
						<div className="flex justify-end space-x-2 mt-4">
							<Button
								variant="outline"
								onClick={() => setIsAddDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button onClick={handleAddRecord}>
								Add Record
							</Button>
						</div>
					</DialogContent>
				</Dialog>
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
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredRecords.map((record) => (
									<TableRow key={record.id}>
										<TableCell>
											<div className="flex items-center">
												<User className="h-4 w-4 mr-2 text-gray-400" />
												{record.patientName}
											</div>
										</TableCell>
										<TableCell>
											{record.doctorName}
										</TableCell>
										<TableCell>
											<div className="flex items-center text-sm">
												<Calendar className="h-3 w-3 mr-1" />
												{record.date}
											</div>
										</TableCell>
										<TableCell>
											<Badge variant="outline">
												{record.diagnosis}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="space-y-1 text-xs">
												<div className="flex items-center">
													<Activity className="h-3 w-3 mr-1" />
													BP:{" "}
													{
														record.vitalSigns
															.bloodPressure
													}
												</div>
												<div>
													HR:{" "}
													{
														record.vitalSigns
															.heartRate
													}
												</div>
												<div>
													Temp:{" "}
													{
														record.vitalSigns
															.temperature
													}
												</div>
											</div>
										</TableCell>
										<TableCell className="max-w-xs truncate">
											{record.treatment}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

export const Route = createFileRoute("/_authenticated/medical-records")({
	component: MedicalRecordsPage,
	beforeLoad: async ({ context }) => {
		// Authentication is handled by the root layout
		// If we reach here, the user is authenticated
	},
});
