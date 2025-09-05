import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { useMedications } from "@/hooks/useMedications";
import type { AppRouter } from "@/lib/trpc";

type Medication =
	AppRouter["prescriptions"]["getAll"]["_def"]["$types"]["output"]["data"][number]["medication"];

const Medication = ({
	medication,
	onSelect,
	closeDialog,
}: {
	medication: Medication;
	onSelect: (medication: Medication) => void;
	closeDialog: () => void;
}) => {
	return (
		<>
			{!!medication ? (
				<div
					key={medication.id}
					className="flex items-center p-4 cursor-pointer border border-accent bg-accent/20"
					onClick={() => {
						onSelect(medication);
						closeDialog();
					}}
				>
					<span className="mr-4">{medication.id}</span>
					<span className="font-semibold">
						{medication.name} {medication.dosage}
					</span>
				</div>
			) : null}
		</>
	);
};

export default function SearchMedicationsDialog({
	onSelect,
	medication,
}: {
	onSelect: (medication: Medication) => void;
	medication: Medication;
}) {
	const [search, setSearch] = useState(medication?.name || "");
	const [open, setOpen] = useState(false);
	const [selectedMedication, setSelectedMedication] =
		useState<Medication | null>(medication);
	const { data } = useMedications(
		{
			search,
		},
		{
			enabled: !!search,
		}
	);
	const medications = data?.data;
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{selectedMedication ? (
					<Button type="button" variant="outline">
						<span className="mr-2">{selectedMedication.id}</span>
						<span className="font-semibold">
							{selectedMedication.name}
						</span>
					</Button>
				) : medication ? (
					<Button type="button" variant="outline">
						<span className="mr-2">{medication.id}</span>
						<span className="font-semibold">{medication.name}</span>
					</Button>
				) : (
					<Button type="button">Select Medication</Button>
				)}
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Search Medications</DialogTitle>
					<DialogDescription>
						Search for medications by name
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4">
					<Input
						placeholder="Search medications..."
						onChange={(e) => setSearch(e.target.value)}
						value={search}
						// defaultValue={medication?.name}
					/>
					<ScrollArea className="h-[300px] w-full rounded-md border p-4 space-y-2">
						{medications?.map((m) => (
							<Medication
								key={m.id}
								medication={m}
								onSelect={(medication) => {
									setSelectedMedication(medication);
									onSelect(medication);
								}}
								closeDialog={() => {
									setSearch(selectedMedication?.name || "");
									setOpen(false);
								}}
							/>
						))}
					</ScrollArea>
				</div>
			</DialogContent>
		</Dialog>
	);
}
