import { useLoaderData } from "@tanstack/react-router";
import { Calendar, Pill, User } from "lucide-react";
import { usePatient } from "@/hooks/usePatients";
import type { Prescription } from "@/hooks/usePrescriptions";
import { PrescriptionPrintTemplateSkeleton } from "./prescription-print-template-skeleton";

interface PrescriptionPrintTemplateProps {
	prescription: Prescription;
}

export function PrescriptionPrintTemplate({
	prescription,
}: PrescriptionPrintTemplateProps) {
	const { clinicInfo } = useLoaderData({ from: "/_authenticated" });

	const { data: patient, isLoading } = usePatient(prescription?.patientId || 0);

	if (!prescription) return null;
	return isLoading ? (
		<PrescriptionPrintTemplateSkeleton />
	) : (
		<div className="prescription-print-template bg-white text-black print-only">
			{/* Header */}
			<div className="border-b-2 border-gray-800 pb-6 mb-8">
				<div className="flex justify-between items-start">
					<div className="flex-1">
						<h1 className="text-4xl font-bold text-gray-800 mb-2">
							PRESCRIPTION
						</h1>
						<div className="text-sm text-gray-600 space-y-1">
							<p className="font-semibold">Prescription #: {prescription.id}</p>
							<p>
								Date: {new Date(prescription.createdAt).toLocaleDateString()}
							</p>
							<p>
								Status: {prescription.isDispensed ? "Dispensed" : "Pending"}
							</p>
						</div>
					</div>

					<div className="text-right">
						<div className="text-3xl font-bold text-gray-800 mb-2">
							Clinic Run
						</div>
						<div className="text-sm text-gray-600">
							<p>Address: {clinicInfo.address}</p>
							<p>Phone: {clinicInfo.phone}</p>
							<p>Email: {clinicInfo.email}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Patient and Doctor Information */}
			<div className="grid grid-cols-2 gap-8 mb-8">
				<div>
					<h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
						<User className="h-5 w-5" />
						Patient Information
					</h2>
					<div className="bg-gray-50 p-4 rounded">
						<div className="font-semibold text-lg text-gray-800 mb-1">
							{prescription.patient?.firstName} {prescription.patient?.lastName}
						</div>
						<div className="text-sm text-gray-600 space-y-1">
							<p>Patient ID: {prescription.patient?.patientId}</p>
							<p>Phone: {patient?.phone}</p>
							<p>Email: {patient?.email}</p>
						</div>
					</div>
				</div>

				<div>
					<h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
						<User className="h-5 w-5" />
						Prescribing Doctor
					</h2>
					<div className="bg-gray-50 p-4 rounded">
						<div className="font-semibold text-lg text-gray-800 mb-1">
							Dr. {prescription.doctor?.firstName}{" "}
							{prescription.doctor?.lastName}
						</div>
					</div>
				</div>
			</div>

			{/* Medication Details */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
					<Pill className="h-5 w-5" />
					Medication Prescription
				</h2>
				<div className="border border-gray-300 rounded-lg overflow-hidden">
					<div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
						<h3 className="font-semibold text-gray-800">
							{prescription.medication?.name || "Unknown Medication"}
						</h3>
					</div>
					<div className="p-4">
						<div className="grid grid-cols-2 gap-6">
							<div className="space-y-3">
								<div>
									<p className="text-sm text-gray-600">Dosage</p>
									<p className="font-medium">{prescription.dosage}</p>
								</div>
								<div>
									<p className="text-sm text-gray-600">Form</p>
									<p className="font-medium">
										{prescription.medication?.form || "N/A"}
									</p>
								</div>
								<div>
									<p className="text-sm text-gray-600">Quantity</p>
									<p className="font-medium">{prescription.quantity} units</p>
								</div>
							</div>
							<div className="space-y-3">
								<div>
									<p className="text-sm text-gray-600">Frequency</p>
									<p className="font-medium">{prescription.frequency}</p>
								</div>
								<div>
									<p className="text-sm text-gray-600">Duration</p>
									<p className="font-medium">{prescription.duration}</p>
								</div>
							</div>
						</div>

						{prescription.instructions && (
							<div className="mt-6 pt-4 border-t border-gray-200">
								<p className="text-sm text-gray-600 mb-2">Instructions</p>
								<div className="p-3 bg-gray-50 rounded-md">
									<p className="text-sm">{prescription.instructions}</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Prescription Timeline */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
					<Calendar className="h-5 w-5" />
					Prescription Timeline
				</h2>
				<div className="grid grid-cols-2 gap-6">
					<div className="bg-gray-50 p-4 rounded">
						<p className="text-sm text-gray-600">Prescribed Date</p>
						<p className="font-medium">
							{new Date(prescription.createdAt).toLocaleDateString()} at{" "}
							{new Date(prescription.createdAt).toLocaleTimeString()}
						</p>
					</div>
					<div className="bg-gray-50 p-4 rounded">
						<p className="text-sm text-gray-600">Last Updated</p>
						<p className="font-medium">
							{new Date(prescription.updatedAt).toLocaleDateString()} at{" "}
							{new Date(prescription.updatedAt).toLocaleTimeString()}
						</p>
					</div>
				</div>
			</div>

			{/* Footer */}
			<div className="border-t border-gray-300 pt-6 text-center text-sm text-gray-600">
				<p className="mb-2">
					This prescription is issued by Clinic Run for the treatment of the
					named patient.
				</p>
				<p>
					For questions about this prescription, please contact us at{" "}
					{clinicInfo.phone} or {clinicInfo.email}.
				</p>
				<p className="mt-4 text-xs">
					This is a computer-generated prescription. Keep this document for your
					records.
				</p>
			</div>
		</div>
	);
}
