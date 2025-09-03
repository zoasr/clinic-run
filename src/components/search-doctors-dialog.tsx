import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { useDoctors } from "@/hooks/useUsers";
import { type Doctor } from "@/lib/schema-types";
import { User } from "lucide-react";
import { Input } from "./ui/input";
import { trpc } from "@/lib/trpc-client";
import { useQuery } from "@tanstack/react-query";

const Doctor = ({
	doctor,
	onSelect,
	closeDialog,
}: {
	doctor: Doctor;
	onSelect: (doctor: Doctor) => void;
	closeDialog: () => void;
}) => {
	return (
		<>
			{!!doctor ? (
				<div
					key={doctor.id}
					className="flex gap-4 items-center p-4 cursor-pointer border border-accent bg-accent/20"
					onClick={() => {
						onSelect(doctor);
						closeDialog();
					}}
				>
					<User />
					<span className="font-semibold">
						{doctor.firstName} {doctor.lastName}
					</span>
					<span className="max-w-[10ch] truncate">{doctor.id}</span>
				</div>
			) : null}
		</>
	);
};

export default function DoctorsDialog({
	onSelect,
	doctorId,
}: {
	onSelect: (doctor: Doctor) => void;
	doctorId: string;
}) {
	const [open, setOpen] = useState(false);
	const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
	const [search, setSearch] = useState("");
	const { data: doctors } = useQuery(trpc.users.getDoctors.queryOptions());
	const doctor = doctors?.find((d) => d.id === doctorId);
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{selectedDoctor ? (
					<Button type="button" variant="outline">
						<span className="mr-2 truncate max-w-[5ch]">
							{selectedDoctor.id}
						</span>
						<span className="font-semibold">
							{selectedDoctor.firstName} {selectedDoctor.lastName}
						</span>
					</Button>
				) : !!doctor ? (
					<Button type="button" variant="outline">
						<span className="mr-2 truncate max-w-[5ch]">
							{doctor?.id}
						</span>
						<span className="font-semibold">
							{doctor?.firstName} {doctor?.lastName}
						</span>
					</Button>
				) : (
					<Button type="button">Select Doctor</Button>
				)}
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Search Doctors</DialogTitle>
					<DialogDescription>
						Search for doctors by name
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4">
					<Input
						placeholder="Search doctors..."
						onChange={(e) => setSearch(e.target.value)}
						value={search}
					/>
					<ScrollArea className="h-[300px] w-full rounded-md border p-4 space-y-2">
						{doctors?.map((d) => (
							<Doctor
								key={d.id}
								doctor={d}
								onSelect={(doctor) => {
									setSelectedDoctor(doctor);
									onSelect(doctor);
								}}
								closeDialog={() => setOpen(false)}
							/>
						))}
					</ScrollArea>
				</div>
			</DialogContent>
		</Dialog>
	);
}
