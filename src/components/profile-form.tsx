import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { User } from "@/hooks/useUsers";
import { trpc } from "@/lib/trpc-client";

const profileFormSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.string().email("Invalid email address"),
	username: z.string().min(3, "Username must be at least 3 characters"),
	name: z.string().min(5, "Name must be at least 5 characters"),
});

interface ProfileFormProps {
	profile: User;
}

export function ProfileForm({ profile }: ProfileFormProps) {
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const updateProfileMutation = useMutation(
		trpc.users.updateProfile.mutationOptions({
			onSuccess: () => {
				setSuccess("Profile updated successfully!");
				toast.success("Profile updated successfully!");
				queryClient.invalidateQueries({
					queryKey: trpc.users.getProfile.queryKey(),
				});
				setTimeout(() => setSuccess(""), 3000);
			},
			onError: (error: any) => {
				setError(error.message || "Failed to update profile");
				toast.error(error.message || "Failed to update profile");
			},
		}),
	);

	const changePasswordMutation = useMutation(
		trpc.users.changePassword.mutationOptions({
			onSuccess: () => {
				setSuccess("Password changed successfully!");
				toast.success("Password changed successfully!");
				setTimeout(() => setSuccess(""), 3000);
			},
			onError: (error: any) => {
				setError(error.message || "Failed to change password");
				toast.error(error.message || "Failed to change password");
			},
		}),
	);

	const profileForm = useForm({
		defaultValues: {
			firstName: profile?.firstName || "",
			lastName: profile?.lastName || "",
			email: profile?.email || "",
			username: profile?.username || "",
			name: profile?.name || "",
		},
		validators: {
			onChange: profileFormSchema,
		},
		onSubmit: async ({ value }) => {
			setError("");
			updateProfileMutation.mutate(value);
		},
	});

	const passwordForm = useForm({
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
		validators: {
			onChange: z
				.object({
					currentPassword: z.string().min(1, "Current password is required"),
					newPassword: z
						.string()
						.min(8, "New password must be at least 8 characters"),
					confirmPassword: z
						.string()
						.min(1, "Please confirm your new password"),
				})
				.refine((data) => data.newPassword === data.confirmPassword, {
					message: "Passwords don't match",
					path: ["confirmPassword"],
				}),
		},
		onSubmit: async ({ value }) => {
			setError("");
			changePasswordMutation.mutate({
				id: profile?.id || "",
				currentPassword: value.currentPassword,
				newPassword: value.newPassword,
			});
			navigate({
				to: "/login",
				search: { redirect: window.location.pathname },
			});
		},
	});

	return (
		<div className="space-y-6 max-w-2xl mx-auto">
			{/* Profile Information */}
			<Card>
				<CardHeader>
					<CardTitle>Profile Information</CardTitle>
					<CardDescription>
						Update your personal information and account details.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							profileForm.handleSubmit();
						}}
						className="space-y-4"
					>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<profileForm.Field
								name="firstName"
								validators={{
									onChange: profileFormSchema.shape.firstName,
								}}
							>
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>First Name</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
										{field.state.meta.errors && (
											<p className="text-sm text-red-600">
												{field.state.meta.errors
													.map((error) => error?.message)
													.join(", ")}
											</p>
										)}
									</div>
								)}
							</profileForm.Field>

							<profileForm.Field
								name="lastName"
								validators={{
									onChange: profileFormSchema.shape.lastName,
								}}
							>
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Last Name</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
										{field.state.meta.errors && (
											<p className="text-sm text-red-600">
												{field.state.meta.errors
													.map((error) => error?.message)
													.join(", ")}
											</p>
										)}
									</div>
								)}
							</profileForm.Field>
						</div>

						<profileForm.Field
							name="email"
							validators={{
								onChange: profileFormSchema.shape.email,
							}}
						>
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Email</Label>
									<Input
										id={field.name}
										name={field.name}
										type="email"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors && (
										<p className="text-sm text-red-600">
											{field.state.meta.errors
												.map((error) => error?.message)
												.join(", ")}
										</p>
									)}
								</div>
							)}
						</profileForm.Field>

						<profileForm.Field
							name="username"
							validators={{
								onChange: profileFormSchema.shape.username,
							}}
						>
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Username</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors && (
										<p className="text-sm text-red-600">
											{field.state.meta.errors
												.map((error) => error?.message)
												.join(", ")}
										</p>
									)}
								</div>
							)}
						</profileForm.Field>

						<profileForm.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button type="submit" disabled={!canSubmit || isSubmitting}>
									{isSubmitting ? "Updating..." : "Update Profile"}
								</Button>
							)}
						</profileForm.Subscribe>
					</form>
				</CardContent>
			</Card>

			{/* Account Information */}
			{profile ? (
				<Card>
					<CardHeader>
						<CardTitle>Account Information</CardTitle>
						<CardDescription>
							View your account details and role information.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex justify-between items-center">
								<span className="text-sm font-medium">Role:</span>
								<Badge variant="secondary">{profile.role}</Badge>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm font-medium">Status:</span>
								<Badge variant={profile.isActive ? "default" : "destructive"}>
									{profile.isActive ? "Active" : "Inactive"}
								</Badge>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm font-medium">Member since:</span>
								<span className="text-sm text-muted-foreground">
									{new Date(profile.createdAt).toLocaleDateString()}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			) : null}

			{/* Change Password */}
			<Card>
				<CardHeader>
					<CardTitle>Change Password</CardTitle>
					<CardDescription>
						Update your password to keep your account secure.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							passwordForm.handleSubmit();
						}}
						className="space-y-4"
					>
						<passwordForm.Field name="currentPassword">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Current Password</Label>
									<Input
										id={field.name}
										name={field.name}
										type="password"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors && (
										<p className="text-sm text-red-600">
											{field.state.meta.errors
												.map((error) => error?.message)
												.join(", ")}
										</p>
									)}
								</div>
							)}
						</passwordForm.Field>

						<passwordForm.Field name="newPassword">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>New Password</Label>
									<Input
										id={field.name}
										name={field.name}
										type="password"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors && (
										<p className="text-sm text-red-600">
											{field.state.meta.errors
												.map((error) => error?.message)
												.join(", ")}
										</p>
									)}
								</div>
							)}
						</passwordForm.Field>

						<passwordForm.Field name="confirmPassword">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Confirm New Password</Label>
									<Input
										id={field.name}
										name={field.name}
										type="password"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors && (
										<p className="text-sm text-red-600">
											{field.state.meta.errors
												.map((error) => error?.message)
												.join(", ")}
										</p>
									)}
								</div>
							)}
						</passwordForm.Field>

						<passwordForm.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button
									type="submit"
									disabled={!canSubmit || isSubmitting}
									variant="outline"
								>
									{isSubmitting ? "Changing..." : "Change Password"}
								</Button>
							)}
						</passwordForm.Subscribe>
					</form>
				</CardContent>
			</Card>

			{/* Status Messages */}
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			{success && (
				<Alert>
					<AlertDescription>{success}</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
