import { User } from "lucide-react";
import { useState } from "react";
import type { Doctor } from "@/lib/schema-types";
import { useDoctors } from "@/hooks/useUsers";
import { SearchDialog } from "./search-dialog";

const DoctorItem = ({
	doctor,
	onSelect,
	isSelected,
}: {
	doctor: Doctor;
	onSelect: () => void;
	isSelected?: boolean;
}) => {
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
					{doctor.firstName} {doctor.lastName}
				</div>
				<div className="text-sm text-muted-foreground truncate">
					ID: {doctor.id}
				</div>
			</div>
		</div>
	);
};

export default function DoctorsDialog({
	onSelect,
	doctorId,
}: {
	onSelect: (doctor: Doctor) => void;
	doctorId: string;
}) {
	const [search, setSearch] = useState("");
	const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

	const { data, isLoading } = useDoctors(
		{ search: search || undefined },
		{ enabled: search.length > 0 },
	);

	const doctors = data || [];

	// Find the currently selected doctor
	const currentDoctor =
		selectedDoctor ||
		(doctorId ? doctors.find((d) => d.id === doctorId) : null);

	const handleSelect = (doctor: Doctor) => {
		setSelectedDoctor(doctor);
		onSelect(doctor);
	};

	return (
		<SearchDialog
			title="Search Doctors"
			description="Search for doctors by name or ID"
			placeholder="Search doctors..."
			items={doctors}
			renderItem={(doctor, onSelect, isSelected) => (
				<DoctorItem
					key={doctor.id}
					doctor={doctor}
					onSelect={onSelect}
					isSelected={isSelected}
				/>
			)}
			onItemSelect={handleSelect}
			selectedItem={currentDoctor || undefined}
			getItemKey={(doctor) => doctor.id}
			getItemDisplay={(doctor) =>
				`${doctor.firstName} ${doctor.lastName} (${doctor.id})`
			}
			isLoading={isLoading}
			emptyMessage="No doctors found matching your search"
			searchValue={search}
			onSearchChange={setSearch}
		/>
	);
}
