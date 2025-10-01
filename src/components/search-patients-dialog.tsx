import { User } from "lucide-react";
import { useState } from "react";
import { type Patient, usePatients } from "@/hooks/usePatients";
import { SearchDialog } from "./search-dialog";

const PatientItem = ({
	patient,
	onSelect,
	isSelected,
}: {
	patient: Patient;
	onSelect: () => void;
	isSelected?: boolean;
}) => {
	if (!patient) return null;

	return (
		<div
			className={`flex gap-4 items-center p-4 cursor-pointer border rounded-md transition-colors ${
				isSelected
					? "border-primary bg-primary/10"
					: "border-accent bg-accent/20 hover:bg-accent/30"
			}`}
			onClick={onSelect}
		>
			<User className="h-5 w-5 text-muted-foreground" />
			<div className="flex-1 min-w-0">
				<div className="font-semibold truncate">
					{patient.firstName} {patient.lastName}
				</div>
				<div className="text-sm text-muted-foreground">
					Patient ID: {patient.patientId}
				</div>
			</div>
		</div>
	);
};

export default function SearchPatientsDialog({
	onSelect,
	patient,
}: {
	onSelect: (patient: Patient) => void;
	patient?: Patient;
}) {
	const [search, setSearch] = useState(
		patient ? `${patient.firstName} ${patient.lastName}` : "",
	);
	const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>(
		patient,
	);

	const { data, isLoading } = usePatients(
		{ search: search || undefined },
		{ enabled: search.length > 0 },
	);

	const patients = data?.data || [];

	const handleSelect = (patient: Patient) => {
		setSelectedPatient(patient);
		onSelect(patient);
	};

	return (
		<SearchDialog
			title="Search Patients"
			description="Search for patients by name or patient ID"
			placeholder="Search patients..."
			items={patients}
			renderItem={(patient, onSelect, isSelected) => (
				<PatientItem
					key={patient.id}
					patient={patient}
					onSelect={onSelect}
					isSelected={isSelected}
				/>
			)}
			onItemSelect={handleSelect}
			selectedItem={selectedPatient}
			getItemKey={(patient) => patient.id.toString()}
			getItemDisplay={(patient) =>
				`${patient.firstName} ${patient.lastName} (${patient.patientId})`
			}
			isLoading={isLoading}
			emptyMessage="No patients found matching your search"
			searchValue={search}
			onSearchChange={setSearch}
		/>
	);
}
