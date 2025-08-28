import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";
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
import { Role, roleSchema } from "@/lib/auth";

const userFormSchema = z.object({
	username: z.string().min(3, "Username must be at least 3 characters"),
	email: z.email(),
	password: z.string().min(8, "Password must be at least 8 characters"),
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	role: roleSchema,
});

export const Route = createFileRoute("/_authenticated/doctors/add")({
	loader: () => ({
		crumb: "Add Doctor",
	}),
	component: AddUserComponent,
});

function AddUserComponent() {
	const navigate = useNavigate({ from: "/doctors/add" });
	const queryClient = useQueryClient();
	const doctorsKey = trpc.users.getByRole.queryKey();

	const { mutate, isPending, error } = useMutation(
		trpc.users.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: doctorsKey });
				navigate({ to: "/doctors" });
			},
		})
	);

	const form = useForm({
		defaultValues: {
			username: "",
			email: "",
			password: "",
			firstName: "",
			lastName: "",
			role: "doctor",
		} as z.infer<typeof userFormSchema>,
		validators: {
			onChange: userFormSchema,
		},
		onSubmit: async ({ value }) => {
			mutate(value);
		},
	});

	return (
		<div className="p-4 w-full mx-auto">
			<h1 className="text-2xl font-bold mb-4">Add New Doctor</h1>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4 max-w-md mx-auto"
			>
				<form.Field
					name="username"
					validators={{ onChange: userFormSchema.shape.username }}
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
					validators={{ onChange: userFormSchema.shape.email }}
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
					name="password"
					validators={{ onChange: userFormSchema.shape.password }}
				>
					{(field) => (
						<div>
							<Label htmlFor={field.name}>Password</Label>
							<Input
								id={field.name}
								name={field.name}
								type="password"
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
					validators={{ onChange: userFormSchema.shape.firstName }}
				>
					{(field) => (
						<div>
							<Label htmlFor={field.name}>First Name</Label>
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
					validators={{ onChange: userFormSchema.shape.lastName }}
				>
					{(field) => (
						<div>
							<Label htmlFor={field.name}>Last Name</Label>
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
								onValueChange={(value: Role) =>
									field.handleChange(value)
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{["doctor"].map((role) => (
										<SelectItem key={role} value={role}>
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

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
				>
					{([canSubmit, isSubmitting]) => (
						<Button
							type="submit"
							disabled={!canSubmit || isSubmitting}
						>
							{isSubmitting ? "Adding Doctor..." : "Add Doctor"}
						</Button>
					)}
				</form.Subscribe>

				{error && (
					<p className="mt-2 text-sm text-red-600">
						{error?.message}
					</p>
				)}
			</form>
		</div>
	);
}
