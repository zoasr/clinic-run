// Enhanced TanStack Form implementation with complete settings and live updates
import { useState, useMemo, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { trpc } from "@/lib/trpc-client";
import { useTheme } from "@/contexts/ThemeContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface SystemSetting {
	id: number;
	key: string;
	value: string;
	description: string | null;
	category: string;
	isPublic: boolean;
	updatedBy: string | null;
	createdAt: string;
	updatedAt: string;
}

interface SystemSettingsFormProps {
	settings: SystemSetting[];
}

const systemSettingsSchema = z.object({
	clinic_name: z.string().min(1, "Clinic name is required"),
	clinic_address: z.string().optional(),
	clinic_phone: z.string().optional(),
	clinic_email: z.string().optional(),
	working_hours: z.string().optional(),
	session_timeout: z
		.number()
		.min(1, "Session timeout must be at least 1 minute"),
	password_min_length: z
		.number()
		.min(6, "Password must be at least 6 characters"),
	email_notifications: z.boolean(),
	appointment_reminders: z.boolean(),
	theme_mode: z.enum(["light", "dark", "system"]),
	sidebar_collapsed: z.boolean(),
	compact_mode: z.boolean(),
});

export function SystemSettingsForm({ settings }: SystemSettingsFormProps) {
	const [success, setSuccess] = useState("");
	const queryClient = useQueryClient();

	// Convert settings array to form object
	const initialValues = useMemo(() => {
		const formData: Record<string, any> = {};
		settings.forEach((setting) => {
			switch (setting.key) {
				case "session_timeout":
				case "password_min_length":
					formData[setting.key] = parseInt(setting.value) || 0;
					break;
				case "email_notifications":
				case "appointment_reminders":
				case "sidebar_collapsed":
				case "compact_mode":
					formData[setting.key] = setting.value === "true";
					break;
				default:
					formData[setting.key] = setting.value;
			}
		});
		return formData;
	}, [settings]);

	const updateSettingMutation = useMutation(
		trpc.systemSettings.update.mutationOptions({
			onSuccess: () => {
				setSuccess("Settings updated successfully!");
				// Invalidate both queries to ensure all components update
				queryClient.invalidateQueries({
					queryKey: trpc.systemSettings.getAll.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.systemSettings.getPublic.queryKey(),
				});
				setTimeout(() => setSuccess(""), 3000);
			},
			onError: (error: any) => {
				toast.error(error.message || "Failed to update settings");
			},
		})
	);

	const form = useForm({
		defaultValues: initialValues,
		validators: {
			onChange: systemSettingsSchema,
		},
		onSubmit: async ({ value }) => {
			// Update all settings
			const updates = Object.entries(value).map(([key, val]) => ({
				key,
				data: {
					value: String(val),
					isPublic: [
						"clinic_name",
						"clinic_address",
						"clinic_phone",
						"clinic_email",
						"working_hours",
						"theme_mode",
					].includes(key),
				},
			}));

			// Update settings one by one
			for (const update of updates) {
				await updateSettingMutation.mutateAsync(update);
			}
		},
	});

	// Group settings by category
	const groupedSettings = useMemo(() => {
		const groups: Record<string, SystemSetting[]> = {};
		settings.forEach((setting) => {
			if (!groups[setting.category]) {
				groups[setting.category] = [];
			}
			groups[setting.category].push(setting);
		});
		return groups;
	}, [settings]);

	return (
		<div className="space-y-6">
			{success && (
				<Alert>
					<AlertDescription>{success}</AlertDescription>
				</Alert>
			)}

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-6"
			>
				{/* Clinic Settings */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							Clinic Information
							<Badge variant="secondary">
								{groupedSettings.clinic?.length || 0}
							</Badge>
						</CardTitle>
						<CardDescription>
							Basic clinic information and contact details.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<form.Field
							name="clinic_name"
							validators={{
								onChange: z
									.string()
									.min(1, "Clinic name is required"),
							}}
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>
										Clinic Name
									</Label>
									<Input
										id={field.name}
										value={field.state.value || ""}
										onChange={(e) =>
											field.handleChange(e.target.value)
										}
										placeholder="Enter clinic name"
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{
												field.state.meta.errors[0]
													?.message
											}
										</p>
									)}
								</div>
							)}
						/>

						<form.Field
							name="clinic_address"
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Address</Label>
									<Textarea
										id={field.name}
										value={field.state.value || ""}
										onChange={(e) =>
											field.handleChange(e.target.value)
										}
										placeholder="Enter clinic address"
										rows={3}
									/>
								</div>
							)}
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<form.Field
								name="clinic_phone"
								children={(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>
											Phone
										</Label>
										<Input
											id={field.name}
											value={field.state.value || ""}
											onChange={(e) =>
												field.handleChange(
													e.target.value
												)
											}
											placeholder="Enter phone number"
										/>
									</div>
								)}
							/>

							<form.Field
								name="clinic_email"
								children={(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>
											Email
										</Label>
										<Input
											id={field.name}
											type="email"
											value={field.state.value || ""}
											onChange={(e) =>
												field.handleChange(
													e.target.value
												)
											}
											placeholder="Enter email address"
										/>
									</div>
								)}
							/>
						</div>

						<form.Field
							name="working_hours"
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>
										Working Hours
									</Label>
									<Input
										id={field.name}
										value={field.state.value || ""}
										onChange={(e) =>
											field.handleChange(e.target.value)
										}
										placeholder="e.g., 9:00 AM - 5:00 PM"
									/>
								</div>
							)}
						/>
					</CardContent>
				</Card>

				{/* Security Settings */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							Security Settings
							<Badge variant="secondary">
								{groupedSettings.security?.length || 0}
							</Badge>
						</CardTitle>
						<CardDescription>
							Configure security and authentication settings.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<form.Field
								name="session_timeout"
								validators={{
									onChange: z
										.number()
										.min(1, "Must be at least 1 minute"),
								}}
								children={(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>
											Session Timeout (minutes)
										</Label>
										<Input
											id={field.name}
											type="number"
											value={field.state.value || ""}
											onChange={(e) =>
												field.handleChange(
													parseInt(e.target.value) ||
														0
												)
											}
											min="1"
										/>
										{field.state.meta.errors.length > 0 && (
											<p className="text-sm text-destructive">
												{
													field.state.meta.errors[0]
														?.message
												}
											</p>
										)}
									</div>
								)}
							/>

							<form.Field
								name="password_min_length"
								validators={{
									onChange: z
										.number()
										.min(
											6,
											"Must be at least 6 characters"
										),
								}}
								children={(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>
											Minimum Password Length
										</Label>
										<Input
											id={field.name}
											type="number"
											value={field.state.value || ""}
											onChange={(e) =>
												field.handleChange(
													parseInt(e.target.value) ||
														0
												)
											}
											min="6"
										/>
										{field.state.meta.errors.length > 0 && (
											<p className="text-sm text-destructive">
												{
													field.state.meta.errors[0]
														?.message
												}
											</p>
										)}
									</div>
								)}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Notifications */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							Notifications
							<Badge variant="secondary">
								{groupedSettings.notifications?.length || 0}
							</Badge>
						</CardTitle>
						<CardDescription>
							Configure notification preferences.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<form.Field
							name="email_notifications"
							children={(field) => (
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label htmlFor={field.name}>
											Email Notifications
										</Label>
										<p className="text-sm text-muted-foreground">
											Enable email notifications for
											system events
										</p>
									</div>
									<Switch
										id={field.name}
										checked={field.state.value || false}
										onCheckedChange={field.handleChange}
									/>
								</div>
							)}
						/>

						<form.Field
							name="appointment_reminders"
							children={(field) => (
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label htmlFor={field.name}>
											Appointment Reminders
										</Label>
										<p className="text-sm text-muted-foreground">
											Send automatic appointment reminders
										</p>
									</div>
									<Switch
										id={field.name}
										checked={field.state.value || false}
										onCheckedChange={field.handleChange}
									/>
								</div>
							)}
						/>
					</CardContent>
				</Card>

				{/* Appearance Settings */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							Appearance
							<Badge variant="secondary">
								{groupedSettings.appearance?.length || 0}
							</Badge>
						</CardTitle>
						<CardDescription>
							Customize the application theme and layout.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<form.Field
							name="theme_mode"
							validators={{
								onChange: z.enum(["light", "dark", "system"]),
							}}
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>
										Theme Mode
									</Label>
									<Select
										value={field.state.value || "light"}
										onValueChange={field.handleChange}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select theme mode" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="light">
												Light
											</SelectItem>
											<SelectItem value="dark">
												Dark
											</SelectItem>
											<SelectItem value="system">
												System
											</SelectItem>
										</SelectContent>
									</Select>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructisve">
											{
												field.state.meta.errors[0]
													?.message
											}
										</p>
									)}
								</div>
							)}
						/>

						<div className="space-y-4">
							<form.Field
								name="sidebar_collapsed"
								children={(field) => (
									<div className="flex items-center justify-between">
										<div className="space-y-0.5">
											<Label htmlFor={field.name}>
												Collapsed Sidebar
											</Label>
											<p className="text-sm text-muted-foreground">
												Keep sidebar collapsed by
												default
											</p>
										</div>
										<Switch
											id={field.name}
											checked={field.state.value || false}
											onCheckedChange={field.handleChange}
										/>
									</div>
								)}
							/>

							<form.Field
								name="compact_mode"
								children={(field) => (
									<div className="flex items-center justify-between">
										<div className="space-y-0.5">
											<Label htmlFor={field.name}>
												Compact Mode
											</Label>
											<p className="text-sm text-muted-foreground">
												Use compact layout for better
												space utilization
											</p>
										</div>
										<Switch
											id={field.name}
											checked={field.state.value || false}
											onCheckedChange={field.handleChange}
										/>
									</div>
								)}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Form Actions */}
				<div className="flex justify-end gap-4">
					<Button
						type="button"
						variant="outline"
						onClick={() => form.reset()}
						disabled={form.state.isSubmitting}
					>
						Reset
					</Button>
					<form.Subscribe
						selector={(state) => [
							state.canSubmit,
							state.isSubmitting,
						]}
						children={([canSubmit, isSubmitting]) => (
							<Button
								type="submit"
								disabled={!canSubmit || isSubmitting}
							>
								{isSubmitting ? "Saving..." : "Save Settings"}
							</Button>
						)}
					/>
				</div>
			</form>

			{updateSettingMutation.error && (
				<Alert variant="destructive">
					<AlertDescription>
						{updateSettingMutation.error.message}
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
