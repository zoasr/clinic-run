import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { type Patient, usePatients } from "@/hooks/usePatients";
import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

const Patient = ({
	patient,
	onSelect,
	closeDialog,
}: {
	patient?: Patient;
	onSelect: (patient: Patient) => void;
	closeDialog: () => void;
}) => {
	return (
		<>
			{patient ? (
				<div
					key={patient.id}
					className="flex items-center p-4 cursor-pointer border border-accent bg-accent/20 rounded-md"
					onClick={() => {
						onSelect(patient);
						closeDialog();
					}}
				>
					<span className="mr-4">{patient.patientId}</span>
					<span className="font-semibold">
						{patient.firstName} {patient.lastName}
					</span>
				</div>
			) : null}
		</>
	);
};

export default function SearchPatientsDialog({
	onSelect,
	patient,
}: {
	onSelect: (patient: Patient) => void;
	patient: Patient;
}) {
	const [open, setOpen] = useState(false);
	const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
		patient ? patient : null
	);
	const [search, setSearch] = useState(
		selectedPatient
			? `${selectedPatient.firstName} ${selectedPatient.lastName}`
			: ""
	);
	const { data } = usePatients(
		{
			search,
		},
		{
			enabled: !!search,
		}
	);
	const patients = data?.data;
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{selectedPatient ? (
					<Button type="button" variant="outline">
						<span className="mr-2">
							{selectedPatient.patientId}
						</span>
						<span className="font-semibold">
							{selectedPatient.firstName}{" "}
							{selectedPatient.lastName}
						</span>
					</Button>
				) : patient ? (
					<Button type="button" variant="outline">
						<span className="mr-2">{patient.patientId}</span>
						<span className="font-semibold">
							{patient.firstName} {patient.lastName}
						</span>
					</Button>
				) : (
					<Button type="button">Select Patient</Button>
				)}
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Search Patients</DialogTitle>
					<DialogDescription>
						Search for patients by name
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4">
					<Input
						placeholder="Search patients..."
						onChange={(e) => setSearch(e.target.value)}
						value={search}
					/>
					<ScrollArea className="h-[300px] w-full rounded-md border p-4 space-y-2">
						<div className="grid gap-4 my-auto h-[100px]">
							{!!patients ? (
								patients?.map((p) => (
									<Patient
										key={p.id}
										patient={p}
										onSelect={(patient) => {
											setSelectedPatient(patient);
											setSearch(
												`${patient?.firstName} ${patient?.lastName}` ||
													""
											);
											onSelect(patient);
										}}
										closeDialog={() => {
											setOpen(false);
										}}
									/>
								))
							) : (
								<div className="w-full my-auto h-full text-center flex items-center justify-center">
									<p className="">
										Start searching for patients
									</p>
								</div>
							)}
						</div>
					</ScrollArea>
				</div>
			</DialogContent>
		</Dialog>
	);
}
