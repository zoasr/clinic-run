import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";
import type { AppRouter } from "lib/routers";
import type { inferRouterOutputs } from "@trpc/server";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type RouterOutput = inferRouterOutputs<AppRouter>;
type User = RouterOutput["users"]["getAll"][number];

export const Route = createFileRoute("/_authenticated/users/")({
	loader: () => ({
		crumb: "Users",
	}),
	component: UsersComponent,
});

function UsersComponent() {
	const {
		data: users,
		isLoading,
		error,
	} = useQuery(trpc.users.getAll.queryOptions());

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error loading users</div>;

	return (
		<div className="p-4 text-foreground">
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-2xl font-bold text-foreground">
					User Management
				</h1>
				<Button>
					<Link to="/users/add">Add User</Link>
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
						{users?.map((user: User) => (
							<TableRow key={user.id}>
								<TableCell>
									{user.firstName} {user.lastName}
								</TableCell>
								<TableCell>{user.email}</TableCell>
								<TableCell>{user.role}</TableCell>
								<TableCell>
									{user.isActive ? "Active" : "Inactive"}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
