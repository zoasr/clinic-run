import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Role, roles, roleSchema } from "@/lib/auth";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const userFormSchema = z.object({
	username: z.string().min(3, "Username must be at least 3 characters"),
	email: z.email(),
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	role: roleSchema,
});

export const Route = createFileRoute("/_authenticated/users/$userId/edit")({
	loader: async ({ params }) => {
		const userData = await trpcClient.users.getById.query({
			id: params.userId,
		});
		return {
			user: userData,
			crumb: `Edit User ${params.userId}`,
		};
	},
	component: EditUserComponent,
});

function EditUserComponent() {
	const { userId } = Route.useParams();
	const { user } = Route.useLoaderData();
	const navigate = Route.useNavigate();
	const queryClient = useQueryClient();

	const updateUserMutation = useMutation(
		trpc.users.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.users.getAll.queryKey(),
				});
				toast.success("User updated successfully");
				navigate({ to: "/users" });
			},
			onError: (error: any) => {
				toast.error(error.message || "Failed to update user");
			},
		})
	);

	const form = useForm({
		defaultValues: {
			username: user?.username || "",
			email: user?.email || "",
			firstName: user?.firstName || "",
			lastName: user?.lastName || "",
			role: (user?.role ?? "staff") as Role,
		},
		validators: {
			onChange: userFormSchema,
		},
		onSubmit: async ({ value }) => {
			updateUserMutation.mutate({
				id: userId,
				data: value,
			});
		},
	});
	// return null;

	if (!user) return <div>User not found</div>;

	return (
		<div className="p-4 w-full mx-auto">
			<h1 className="text-2xl font-bold mb-4">Edit User</h1>
			<Card className="max-w-md mx-auto">
				<CardHeader>
					<CardTitle>Edit User Information</CardTitle>
					<CardDescription>
						Update the user's details and permissions.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="space-y-4"
					>
						<form.Field
							name="username"
							validators={{
								onChange: userFormSchema.shape.username,
							}}
						>
							{(field) => (
								<div>
									<Label htmlFor={field.name}>Username</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) =>
											field.handleChange(e.target.value)
										}
									/>
									{field.state.meta.errors && (
										<p className="mt-2 text-sm text-red-600">
											{field.state.meta.errors
												.map((error) => error?.message)
												.join(", ")}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Field
							name="email"
							validators={{
								onChange: userFormSchema.shape.email,
							}}
						>
							{(field) => (
								<div>
									<Label htmlFor={field.name}>Email</Label>
									<Input
										id={field.name}
										name={field.name}
										type="email"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) =>
											field.handleChange(e.target.value)
										}
									/>
									{field.state.meta.errors && (
										<p className="mt-2 text-sm text-red-600">
											{field.state.meta.errors
												.map((error) => error?.message)
												.join(", ")}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Field
							name="firstName"
							validators={{
								onChange: userFormSchema.shape.firstName,
							}}
						>
							{(field) => (
								<div>
									<Label htmlFor={field.name}>
										First Name
									</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) =>
											field.handleChange(e.target.value)
										}
									/>
									{field.state.meta.errors && (
										<p className="mt-2 text-sm text-red-600">
											{field.state.meta.errors
												.map((error) => error?.message)
												.join(", ")}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Field
							name="lastName"
							validators={{
								onChange: userFormSchema.shape.lastName,
							}}
						>
							{(field) => (
								<div>
									<Label htmlFor={field.name}>
										Last Name
									</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) =>
											field.handleChange(e.target.value)
										}
									/>
									{field.state.meta.errors && (
										<p className="mt-2 text-sm text-red-600">
											{field.state.meta.errors
												.map((error) => error?.message)
												.join(", ")}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Field
							name="role"
							validators={{ onChange: userFormSchema.shape.role }}
						>
							{(field) => (
								<div>
									<Label htmlFor={field.name}>Role</Label>
									<Select
										value={field.state.value}
										defaultValue={field.state.value}
										onValueChange={(value: Role) =>
											field.handleChange(value)
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{roles.map((role) => (
												<SelectItem
													key={role}
													value={role}
												>
													{role}
												</SelectItem>
											))}
										</SelectContent>
									</Select>

									{field.state.meta.errors && (
										<p className="mt-2 text-sm text-red-600">
											{field.state.meta.errors
												.map((error) => error?.message)
												.join(", ")}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<div className="flex gap-2 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => navigate({ to: "/users" })}
								className="flex-1"
							>
								Cancel
							</Button>
							<form.Subscribe
								selector={(state) => [
									state.canSubmit,
									state.isSubmitting,
								]}
							>
								{([canSubmit, isSubmitting]) => (
									<Button
										type="submit"
										disabled={!canSubmit || isSubmitting}
										className="flex-1"
									>
										{isSubmitting
											? "Updating..."
											: "Update User"}
									</Button>
								)}
							</form.Subscribe>
						</div>

						{updateUserMutation.error && (
							<Alert variant="destructive">
								<AlertDescription>
									{updateUserMutation.error.message}
								</AlertDescription>
							</Alert>
						)}
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
