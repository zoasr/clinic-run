import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/doctors/")({
	loader: () => ({
		crumb: "Doctors",
	}),
	component: UsersComponent,
});

function UsersComponent() {
	const {
		data: doctors,
		isLoading,
		error,
	} = useQuery(
		trpc.users.getByRole.queryOptions({
			role: "doctor",
		})
	);

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error loading doctors</div>;

	return (
		<div className="p-4 text-foreground">
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-2xl font-bold text-foreground">Doctors</h1>
				<Button>
					<Link to="/doctors/add">Add Doctor</Link>
				</Button>
			</div>
			<div className="overflow-x-auto">
				<Table className="border rounded-lg">
					<TableHeader className="bg-accent">
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{doctors?.map((doctor) => (
							<TableRow key={doctor.id}>
								<TableCell>
									{doctor.firstName} {doctor.lastName}
								</TableCell>
								<TableCell>{doctor.email}</TableCell>
								<TableCell>{doctor.role}</TableCell>
								<TableCell>
									{doctor.isActive ? "Active" : "Inactive"}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
