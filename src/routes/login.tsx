import { useForm } from "@tanstack/react-form";
import {
	createFileRoute,
	redirect,
	useLoaderData,
	useNavigate,
} from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { PageLoading } from "@/components/ui/loading";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { trpcClient } from "@/lib/trpc-client";
import { getClinicInfo } from "@/lib/utils";

export const Route = createFileRoute("/login")({
	validateSearch: (search) => ({
		redirect: (search.redirect as string) || "/",
	}),
	beforeLoad: ({ context, search }) => {
		if (context.auth.isAuthenticated) {
			throw redirect({ to: search.redirect });
		}
	},
	pendingComponent: () => {
		return <PageLoading text="Checking authentication..." />;
	},
	loader: async () => {
		const { exists, user } = await trpcClient.users.checkDemoUser.query();
		const clinicInfo = await getClinicInfo();

		return exists
			? { exists, user, crumb: "Login", clinicInfo }
			: { exists: false, user: null, crumb: "Login", clinicInfo };
	},
	component: LoginForm,
});

function LoginForm() {
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [copiedField, setCopiedField] = useState<"email" | "password" | null>(
		null,
	);
	const { login } = useAuth();
	const navigate = useNavigate();
	const {
		clinicInfo: { name: clinicName },
	} = Route.useLoaderData();
	const defaultUser = useLoaderData({ from: "/login" });

	const copyToClipboard = async (text: string, field: "email" | "password") => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			toast.success(
				`${field === "email" ? "Email" : "Password"} copied to clipboard!`,
			);

			setTimeout(() => setCopiedField(null), 2000);
		} catch (_err) {
			toast.error("Failed to copy to clipboard");
		}
	};

	const copyAllCredentials = async () => {
		try {
			const credentials = `Email: ${defaultUser?.user?.email}\nPassword: admin123`;
			await navigator.clipboard.writeText(credentials);
			setCopiedField("email");
			toast.success("All demo credentials copied to clipboard!");

			setTimeout(() => setCopiedField(null), 2000);
		} catch (_err) {
			toast.error("Failed to copy to clipboard");
		}
	};

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			setIsLoading(true);
			setError("");

			try {
				const success = await login(value.email, value.password);
				if (success) {
					navigate({ to: "/" });
				} else {
					setError("Invalid email or password");
				}
			} catch (err: any) {
				setError(err.message || "Login failed");
			} finally {
				setIsLoading(false);
			}
		},
	});

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20 flex items-center justify-center p-4">
			<div className="w-full max-w-md space-y-8">
				{/* Logo and Welcome Section */}
				<div className="text-center space-y-4">
					<div className="flex justify-center">
						<img
							src="/logo-light.svg"
							alt={`${clinicName} Logo`}
							className="h-16 w-auto dark:hidden"
						/>
						<img
							src="/logo-dark.svg"
							alt={`${clinicName} Logo`}
							className="h-16 w-auto hidden dark:block"
						/>
					</div>
					<div className="space-y-2">
						<h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
						<p className="text-muted-foreground">
							<span className="text-primary font-bold">{clinicName}</span>{" "}
							Dashboard
						</p>
					</div>
				</div>

				{/* Login Card */}
				<Card className="shadow-xl border-0 bg-card/95 backdrop-blur-sm">
					<CardHeader className="text-center pb-2">
						<CardTitle className="text-xl font-semibold text-card-foreground">
							Sign In to Your Account
						</CardTitle>
						<CardDescription className="text-muted-foreground">
							Access your{" "}
							<span className="text-primary font-bold">{clinicName}</span>{" "}
							dashboard and manage patient care
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<form
							onSubmit={(e) => {
								e.preventDefault();
								form.handleSubmit();
							}}
							className="space-y-5"
						>
							<form.Field
								name="email"
								validators={{
									onChange: z.email(),
								}}
								children={(field) => (
									<div className="space-y-2">
										<Label
											htmlFor="email"
											className="text-sm font-medium text-foreground"
										>
											Email Address
										</Label>
										<Input
											id="email"
											type="email"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											required
											placeholder="Enter your email"
											className="h-11"
										/>
										{field.state.meta.errors.length > 0 && (
											<p className="text-sm text-destructive mt-1">
												{field.state.meta.errors[0]?.message}
											</p>
										)}
									</div>
								)}
							/>
							<form.Field
								name="password"
								validators={{
									onChange: ({ value }) =>
										!value
											? "Password is required"
											: value.length < 6
												? "Password must be at least 6 characters"
												: undefined,
								}}
								children={(field) => (
									<div className="space-y-2">
										<Label
											htmlFor="password"
											className="text-sm font-medium text-foreground"
										>
											Password
										</Label>
										<Input
											id="password"
											type="password"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											required
											placeholder="Enter your password"
											className="h-11"
										/>
										{field.state.meta.errors.length > 0 && (
											<p className="text-sm text-destructive mt-1">
												{field.state.meta.errors[0]}
											</p>
										)}
									</div>
								)}
							/>
							{error && (
								<Alert variant="destructive">
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}
							<Button
								type="submit"
								className="w-full h-11 bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary/95 hover:to-primary text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-200"
								disabled={isLoading}
							>
								{isLoading ? "Signing in..." : "Sign In to Dashboard"}
							</Button>
						</form>

						{/* Default Credentials - Only show if demo user exists and credentials are default */}
						{defaultUser.exists && !!defaultUser.user && (
							<div className="space-y-4">
								<Separator />
								<div className="text-xs text-muted-foreground text-center space-y-3">
									<div className="flex items-center justify-center gap-2">
										<p className="font-medium">Default Credentials:</p>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
											onClick={copyAllCredentials}
										>
											<Copy className="h-3 w-3 mr-1" />
											Copy All
										</Button>
									</div>
									<div className="space-y-2">
										<div className="flex items-center justify-center gap-2">
											<span>Email: {defaultUser?.user?.email}</span>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
												onClick={() =>
													copyToClipboard(
														defaultUser?.user?.email || "",
														"email",
													)
												}
											>
												{copiedField === "email" ? (
													<Check className="h-3 w-3 text-green-500" />
												) : (
													<Copy className="h-3 w-3" />
												)}
											</Button>
										</div>
										<div className="flex items-center justify-center gap-2">
											<span>Password: admin123</span>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
												onClick={() => copyToClipboard("admin123", "password")}
											>
												{copiedField === "password" ? (
													<Check className="h-3 w-3 text-green-500" />
												) : (
													<Copy className="h-3 w-3" />
												)}
											</Button>
										</div>
									</div>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
