import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	ArrowLeft,
	Edit,
	User,
	Calendar,
	Stethoscope,
	FileText,
	Pill,
} from "lucide-react";
import { MedicalRecord } from "@/hooks/useMedicalRecords";

interface MedicalRecordDetailProps {
	record: MedicalRecord;
	onBack: () => void;
	onEdit: (record: MedicalRecord) => void;
}

export function MedicalRecordDetail({
	record,
	onBack,
	onEdit,
}: MedicalRecordDetailProps) {
	const parseVitalSigns = (vitalSigns?: string | null) => {
		if (!vitalSigns) return null;
		try {
			return JSON.parse(vitalSigns);
		} catch {
			return null;
		}
	};

	if (!record) {
		return <div>Record not found</div>;
	}

	const vitalSigns = parseVitalSigns(record.vitalSigns);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="outline" size="sm" onClick={onBack}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Records
					</Button>
					<div>
						<h1 className="text-2xl font-serif font-bold text-foreground">
							Medical Record
						</h1>
						<p className="text-muted-foreground">
							{record.patient?.firstName}{" "}
							{record.patient?.lastName} -{" "}
							{new Date(record.visitDate).toLocaleDateString()}
						</p>
					</div>
				</div>
				<Button onClick={() => onEdit(record)}>
					<Edit className="h-4 w-4 mr-2" />
					Edit Record
				</Button>
			</div>

			{/* Patient & Visit Overview */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Patient Information
						</CardTitle>
						<User className="h-4 w-4 ml-auto text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div>
								<p className="font-semibold">
									{record.patient?.firstName}{" "}
									{record.patient?.lastName}
								</p>
								<p className="text-sm text-muted-foreground">
									ID: {record.patient?.patientId}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Visit Details
						</CardTitle>
						<Calendar className="h-4 w-4 ml-auto text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex justify-between">
								<span className="text-sm text-muted-foreground">
									Date:
								</span>
								<span className="text-sm font-medium">
									{new Date(
										record.visitDate
									).toLocaleDateString()}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm text-muted-foreground">
									Time
								</span>
								<span className="text-sm font-medium">
									{new Date(
										record.visitDate
									).toLocaleTimeString()}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm text-muted-foreground">
									Doctor:
								</span>
								<span className="text-sm font-medium">
									Dr. {record.doctor?.firstName}{" "}
									{record.doctor?.lastName}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Record Status
						</CardTitle>
						<FileText className="h-4 w-4 ml-auto text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<Badge variant="default" className="w-fit">
								Complete
							</Badge>
							{record.appointmentId && (
								<p className="text-xs text-muted-foreground">
									Linked to appointment #
									{record.appointmentId}
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Vital Signs */}
			{vitalSigns && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Stethoscope className="h-5 w-5" />
							Vital Signs
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
							{vitalSigns.bloodPressure && (
								<div className="text-center p-3 bg-muted/50 rounded-lg">
									<p className="text-sm text-muted-foreground">
										Blood Pressure
									</p>
									<p className="font-semibold">
										{vitalSigns.bloodPressure}
									</p>
								</div>
							)}
							{vitalSigns.temperature && (
								<div className="text-center p-3 bg-muted/50 rounded-lg">
									<p className="text-sm text-muted-foreground">
										Temperature
									</p>
									<p className="font-semibold">
										{vitalSigns.temperature}°C
									</p>
								</div>
							)}
							{vitalSigns.pulse && (
								<div className="text-center p-3 bg-muted/50 rounded-lg">
									<p className="text-sm text-muted-foreground">
										Pulse
									</p>
									<p className="font-semibold">
										{vitalSigns.pulse} bpm
									</p>
								</div>
							)}
							{vitalSigns.respiratoryRate && (
								<div className="text-center p-3 bg-muted/50 rounded-lg">
									<p className="text-sm text-muted-foreground">
										Respiratory Rate
									</p>
									<p className="font-semibold">
										{vitalSigns.respiratoryRate}
									</p>
								</div>
							)}
							{vitalSigns.weight && (
								<div className="text-center p-3 bg-muted/50 rounded-lg">
									<p className="text-sm text-muted-foreground">
										Weight
									</p>
									<p className="font-semibold">
										{vitalSigns.weight} kg
									</p>
								</div>
							)}
							{vitalSigns.height && (
								<div className="text-center p-3 bg-muted/50 rounded-lg">
									<p className="text-sm text-muted-foreground">
										Height
									</p>
									<p className="font-semibold">
										{vitalSigns.height} cm
									</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Clinical Information */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Chief Complaint & Diagnosis */}
				<div className="space-y-6">
					{record.chiefComplaint && (
						<Card>
							<CardHeader>
								<CardTitle>Chief Complaint</CardTitle>
								<CardDescription>
									Patient's primary concern
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm leading-relaxed">
									{record.chiefComplaint}
								</p>
							</CardContent>
						</Card>
					)}

					{record.diagnosis && (
						<Card>
							<CardHeader>
								<CardTitle>Diagnosis</CardTitle>
								<CardDescription>
									Clinical diagnosis
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Badge variant="outline" className="text-sm">
									{record.diagnosis}
								</Badge>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Treatment & Prescription */}
				<div className="space-y-6">
					{record.treatment && (
						<Card>
							<CardHeader>
								<CardTitle>Treatment Plan</CardTitle>
								<CardDescription>
									Procedures and treatment provided
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm leading-relaxed whitespace-pre-wrap">
									{record.treatment}
								</p>
							</CardContent>
						</Card>
					)}

					{record.prescription && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Pill className="h-4 w-4" />
									Prescription
								</CardTitle>
								<CardDescription>
									Medications prescribed
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm leading-relaxed whitespace-pre-wrap">
									{record.prescription}
								</p>
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			{/* Additional Notes */}
			{record.notes && (
				<Card>
					<CardHeader>
						<CardTitle>Additional Notes</CardTitle>
						<CardDescription>
							Additional observations and instructions
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm leading-relaxed whitespace-pre-wrap">
							{record.notes}
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
