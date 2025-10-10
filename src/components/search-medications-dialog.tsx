import { Pill } from "lucide-react";
import { useState } from "react";
import { type Medication, useMedications } from "@/hooks/useMedications";
import { SearchDialog } from "./search-dialog";

const MedicationItem = ({
	medication,
	onSelect,
	isSelected,
}: {
	medication: Medication;
	onSelect: () => void;
	isSelected?: boolean;
}) => {
	if (!medication) return null;

	return (
		<button
			type="button"
			className={`flex gap-4 items-center p-4 w-full cursor-pointer border rounded-md transition-colors ${
				isSelected
					? "border-primary bg-primary/10"
					: "border-accent bg-accent/20 hover:bg-accent/30"
			}`}
			onClick={onSelect}
		>
			<Pill className="h-5 w-5 text-muted-foreground" />
			<div className="flex-1 min-w-0">
				<div className="font-semibold truncate">{medication.name}</div>
				<div className="text-sm text-muted-foreground">
					{medication.dosage} • ID: {medication.id}
				</div>
			</div>
		</button>
	);
};

export default function SearchMedicationsDialog({
	onSelect,
	medication,
}: {
	onSelect: (medication: Medication) => void;
	medication?: Medication;
}) {
	const [search, setSearch] = useState(medication?.name || "");
	const [selectedMedication, setSelectedMedication] = useState<
		Medication | undefined
	>(medication);

	const { data, isLoading } = useMedications(
		{ search: search || undefined },
		{ enabled: search.length > 0 },
	);

	const medications = data?.data || [];

	const handleSelect = (med: Medication) => {
		setSelectedMedication(med);
		onSelect(med);
	};

	return (
		<SearchDialog
			title="Search Medications"
			description="Search for medications by name"
			placeholder="Search medications..."
			items={medications}
			renderItem={(medication, onSelect, isSelected) => (
				<MedicationItem
					key={medication?.id}
					medication={medication}
					onSelect={onSelect}
					isSelected={isSelected}
				/>
			)}
			onItemSelect={handleSelect}
			selectedItem={selectedMedication}
			getItemKey={(medication) => medication.id.toString()}
			getItemDisplay={(medication) => (
				<>
					{medication.name}{" "}
					<span className="text-primary font-bold">({medication.dosage})</span>
				</>
			)}
			isLoading={isLoading}
			emptyMessage="No medications found matching your search"
			searchValue={search}
			onSearchChange={setSearch}
		/>
	);
}
