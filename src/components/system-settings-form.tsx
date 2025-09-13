import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import $ from "currency-symbol-map";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useMemo, useState } from "react";
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
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { systemSettingsSchema } from "@/hooks/useSettings";
import { trpc } from "@/lib/trpc-client";
import { cn, setSettings } from "@/lib/utils";

interface SystemSetting {
	id: number;
	key: string;
	value: string;
	description: string | null;
	category: string;
	isPublic: boolean;
	updatedBy: string | null;
	createdAt: Date;
	updatedAt: Date;
}

interface SystemSettingsFormProps {
	settings: SystemSetting[];
}

const currencies = Intl.supportedValuesOf("currency");

const CurrencySelector = ({
	onChange,
	value,
}: {
	onChange: (value: string) => void;
	value?: string;
}) => {
	const [open, setOpen] = useState(false);
	const [currencyValue, setCurrencyValue] = useState(value || "USD");

	const getDisplayName = (currency: string) => {
		const dsiplayName = new Intl.DisplayNames(["en"], {
			type: "currency",
		}).of(currency);
		return dsiplayName;
	};

	const currencyItems = useMemo(() => {
		return currencies.map((c) => {
			const dsiplayName = getDisplayName(c);
			return (
				<CommandItem
					key={c}
					value={dsiplayName}
					onSelect={(currentValue) => {
						setCurrencyValue(currentValue === value ? "" : c);
						onChange(c);
						setOpen(false);
					}}
				>
					<CheckIcon
						className={cn(
							"mr-2 h-4 w-4",
							value === c ? "opacity-100" : "opacity-0",
						)}
					/>
					<span className="font-bold text-primary">{$(c)} </span>
					<span className="">{dsiplayName}</span>
				</CommandItem>
			);
		});
	}, []);
	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between"
				>
					<div className="flex gap-2">
						<span className="font-bold text-primary">{$(currencyValue)} </span>
						<span className="">{getDisplayName(currencyValue)}</span>
					</div>
					<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="p-0">
				<Command onValueChange={onChange}>
					<CommandInput placeholder="Search currency..." />
					<CommandList>
						<CommandEmpty>No currency found.</CommandEmpty>
						<CommandGroup>{currencyItems}</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};

export function SystemSettingsForm({ settings }: SystemSettingsFormProps) {
	const queryClient = useQueryClient();

	const getByKey = (key: string) => {
		return settings.find((s) => s.key === key)?.value;
	};

	// Convert settings array to form object
	const initialValues = useMemo(() => {
		const formData: Record<string, any> = {
			clinic_name: getByKey("clinic_name") || "",
			clinic_address: getByKey("clinic_address") || "",
			clinic_phone: getByKey("clinic_phone") || "",
			clinic_email: getByKey("clinic_email") || "",
			currency: getByKey("currency") || "USD",
			working_hours: getByKey("working_hours") || "",
			session_timeout: Number(getByKey("session_timeout")) || 24 * 60,
			password_min_length: Number(getByKey("password_min_length")) || 8,
			theme_mode: getByKey("theme_mode") || "system",
			sidebar_collapsed: Boolean(getByKey("sidebar_collapsed")) || false,
			compact_mode: Boolean(getByKey("compact_mode")) || false,
		};

		const parsed = systemSettingsSchema.safeParse(formData);
		if (parsed.success)
			settings.forEach((setting) => {
				switch (setting.key) {
					case "session_timeout":
					case "password_min_length":
						formData[setting.key] = parseInt(setting.value) || 8;
						break;
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

	const updateSettingsMutation = useMutation(
		trpc.systemSettings.updateAll.mutationOptions({
			onSuccess: () => {
				// Invalidate both queries to ensure all components update
				queryClient.invalidateQueries({
					queryKey: trpc.systemSettings.getAll.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.systemSettings.getPublic.queryKey(),
				});
				setSettings();
			},
			onError: (error: any) => {
				toast.error(error.message || "Failed to update settings");
			},
		}),
	);

	const form = useForm({
		defaultValues: initialValues,
		validators: {
			onChange: systemSettingsSchema,
			onMount: systemSettingsSchema,
		},
		onSubmit: async ({ value }) => {
			// Update all settings
			const updates = Object.entries(value).map(([key, val]) => ({
				key,
				value: String(val),
				isPublic: [
					"clinic_name",
					"clinic_address",
					"clinic_phone",
					"clinic_email",
					"currency",
					"working_hours",
					"theme_mode",
					"session_timeout",
					"sidebar_collapsed",
					"compact_mode",
				].includes(key),
				category: settings.find((s) => s.key === key)?.category || "clinic",
			}));

			await updateSettingsMutation.mutateAsync(updates);

			toast.success("Settings updated successfully!");
		},
	});

	return (
		<div className="space-y-6">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-6"
			>
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
								onChange: z.string().min(1, "Clinic name is required"),
							}}
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Clinic Name</Label>
									<Input
										id={field.name}
										value={field.state.value || ""}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Enter clinic name"
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{field.state.meta.errors[0]?.message}
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
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Enter clinic address"
										rows={3}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{field.state.meta.errors[0]?.message}
										</p>
									)}
								</div>
							)}
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<form.Field
								name="clinic_phone"
								children={(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Phone</Label>
										<Input
											id={field.name}
											value={field.state.value || ""}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Enter phone number"
										/>
										{field.state.meta.errors.length > 0 && (
											<p className="text-sm text-destructive">
												{field.state.meta.errors[0]?.message}
											</p>
										)}
									</div>
								)}
							/>

							<form.Field
								name="clinic_email"
								children={(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Email</Label>
										<Input
											id={field.name}
											type="email"
											value={field.state.value || ""}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Enter email address"
										/>
										{field.state.meta.errors.length > 0 && (
											<p className="text-sm text-destructive">
												{field.state.meta.errors[0]?.message}
											</p>
										)}
									</div>
								)}
							/>
						</div>

						<form.Field
							name="working_hours"
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Working Hours</Label>
									<Input
										id={field.name}
										value={field.state.value || ""}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="e.g., 9:00 AM - 5:00 PM"
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{field.state.meta.errors[0]?.message}
										</p>
									)}
								</div>
							)}
						/>
						<form.Field
							name="currency"
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>
										Currency for invoices, and medication prices
									</Label>
									<CurrencySelector
										onChange={(val) => field.handleChange(val)}
										value={field.state.value}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{field.state.meta.errors[0]?.message}
										</p>
									)}
								</div>
							)}
						/>
					</CardContent>
				</Card>

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
									onChange: z.number().min(1, "Must be at least 1 minute"),
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
												field.handleChange(parseInt(e.target.value) || 0)
											}
											min="1"
										/>
										{field.state.meta.errors.length > 0 && (
											<p className="text-sm text-destructive">
												{field.state.meta.errors[0]?.message}
											</p>
										)}
									</div>
								)}
							/>

							<form.Field
								name="password_min_length"
								validators={{
									onChange: z.number().min(6, "Must be at least 6 characters"),
								}}
								children={(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Minimum Password Length</Label>
										<Input
											id={field.name}
											type="number"
											value={field.state.value || ""}
											onChange={(e) =>
												field.handleChange(parseInt(e.target.value) || 0)
											}
											min="6"
										/>
										{field.state.meta.errors.length > 0 && (
											<p className="text-sm text-destructive">
												{field.state.meta.errors[0]?.message}
											</p>
										)}
									</div>
								)}
							/>
						</div>
					</CardContent>
				</Card>

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
									<Label htmlFor={field.name}>Theme Mode</Label>
									<Select
										value={field.state.value || "light"}
										onValueChange={field.handleChange}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select theme mode" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="light">Light</SelectItem>
											<SelectItem value="dark">Dark</SelectItem>
											<SelectItem value="system">System</SelectItem>
										</SelectContent>
									</Select>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{field.state.meta.errors[0]?.message}
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
											<Label htmlFor={field.name}>Collapsed Sidebar</Label>
											<p className="text-sm text-muted-foreground">
												Keep sidebar collapsed by default
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
											<Label htmlFor={field.name}>Compact Mode</Label>
											<p className="text-sm text-muted-foreground">
												Use compact layout for better space utilization
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
						selector={(state) => [state.canSubmit, state.isSubmitting]}
						children={([canSubmit, isSubmitting]) => (
							<Button type="submit" disabled={!canSubmit || isSubmitting}>
								{isSubmitting ? "Saving..." : "Save Settings"}
							</Button>
						)}
					/>
				</div>
			</form>

			{updateSettingsMutation.error && (
				<Alert variant="destructive">
					<AlertDescription>
						{updateSettingsMutation.error.message}
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
