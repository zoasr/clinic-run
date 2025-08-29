import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "@tanstack/react-router";
import z from "zod";

export function LoginForm() {
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { login } = useAuth();
	const navigate = useNavigate();

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
		<div className="min-h-screen flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-serif font-bold text-primary">
						Clinic Run
					</CardTitle>
					<CardDescription>
						Sign in to access your clinic dashboard
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
						className="space-y-4"
					>
						<form.Field
							name="email"
							validators={{
								onChange: z.email(),
							}}
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										value={field.state.value}
										onChange={(e) =>
											field.handleChange(e.target.value)
										}
										required
										placeholder="Enter your email"
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-red-600 mt-1">
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
									<Label htmlFor="password">Password</Label>
									<Input
										id="password"
										type="password"
										value={field.state.value}
										onChange={(e) =>
											field.handleChange(e.target.value)
										}
										required
										placeholder="Enter your password"
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-red-600 mt-1">
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
							className="w-full"
							disabled={isLoading}
						>
							{isLoading ? "Signing in..." : "Sign In"}
						</Button>
					</form>
					<div className="mt-4 text-sm text-muted-foreground text-center">
						Default login: admin@clinic.com / admin123
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
