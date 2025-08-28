import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc-client";
import { ArrowLeft, Package } from "lucide-react";
import { type Medication } from "@/lib/schema-types";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface StockAdjustmentFormProps {
	medication: Medication;
	onSave: () => void;
	onCancel: () => void;
}

export function StockAdjustmentForm({
	medication,
	onSave,
	onCancel,
}: StockAdjustmentFormProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const updateMutation = useMutation(
		trpc.medications.update.mutationOptions()
	);

	const form = useForm({
		defaultValues: {
			adjustmentType: "add" as "add" | "remove" | "set",
			adjustmentQuantity: 0,
			reason: "",
		},
		onSubmit: async ({ value }) => {
			setLoading(true);
			setError("");

			if (value.adjustmentQuantity < 0) {
				setError("Adjustment quantity cannot be negative");
				setLoading(false);
				return;
			}

			if (
				value.adjustmentType === "remove" &&
				value.adjustmentQuantity > (medication.quantity ?? 0)
			) {
				setError("Cannot remove more than current stock");
				setLoading(false);
				return;
			}

			try {
				const newQuantity = calculateNewQuantity(
					value.adjustmentType,
					value.adjustmentQuantity
				);
				if (medication.id) {
					updateMutation.mutate({
						id: medication.id,
						data: {
							quantity: newQuantity,
						},
					});
				}
				onSave();
			} catch (err: any) {
				setError(err.message || "Failed to adjust stock");
			} finally {
				setLoading(false);
			}
		},
	});

	const calculateNewQuantity = (
		adjustmentType: "add" | "remove" | "set",
		adjustmentQuantity: number
	) => {
		if (medication.quantity === undefined) return 0;
		switch (adjustmentType) {
			case "add":
				return (medication.quantity ?? 0) + adjustmentQuantity;
			case "remove":
				return Math.max(
					0,
					+(medication.quantity ?? 0) - adjustmentQuantity
				);
			case "set":
				return adjustmentQuantity;
			default:
				return medication.quantity;
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="outline" size="sm" onClick={onCancel}>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back
				</Button>
				<div>
					<h1 className="text-2xl font-serif font-bold text-foreground">
						Stock Adjustment
					</h1>
					<p className="text-muted-foreground">
						Adjust inventory levels for {medication.name}
					</p>
				</div>
			</div>

			{/* Current Stock Info */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Package className="h-5 w-5" />
						Current Stock Information
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="text-center p-4 bg-muted/50 rounded-lg">
							<p className="text-sm text-muted-foreground">
								Current Stock
							</p>
							<p className="text-2xl font-bold">
								{medication.quantity}
							</p>
						</div>
						<div className="text-center p-4 bg-muted/50 rounded-lg">
							<p className="text-sm text-muted-foreground">
								Minimum Level
							</p>
							<p className="text-2xl font-bold">
								{medication.minStockLevel}
							</p>
						</div>
						<div className="text-center p-4 bg-muted/50 rounded-lg">
							<p className="text-sm text-muted-foreground">
								Unit Price
							</p>
							<p className="text-2xl font-bold">
								EGP{medication.unitPrice?.toFixed(2)}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<form onSubmit={form.handleSubmit} className="space-y-6">
				{/* Adjustment Details */}
				<Card>
					<CardHeader>
						<CardTitle>Adjustment Details</CardTitle>
						<CardDescription>
							Specify the type and amount of stock adjustment
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<form.Field
							name="adjustmentType"
							validators={{
								onChange: ({ value }) =>
									!value
										? "Adjustment type is required"
										: undefined,
							}}
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor="adjustmentType">
										Adjustment Type *
									</Label>
									<Select
										value={field.state.value}
										onValueChange={(
											value: "add" | "remove" | "set"
										) => field.handleChange(value)}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="add">
												Add Stock (Restock)
											</SelectItem>
											<SelectItem value="remove">
												Remove Stock (Usage/Damage)
											</SelectItem>
											<SelectItem value="set">
												Set Exact Quantity (Inventory
												Count)
											</SelectItem>
										</SelectContent>
									</Select>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-red-600 mt-1">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						/>

						<form.Field
							name="adjustmentQuantity"
							validators={{
								onChange: ({ value }) =>
									value == null || value < 0
										? "Quantity must be >= 0"
										: undefined,
							}}
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor="adjustmentQuantity">
										{field.form.state.values
											.adjustmentType === "set"
											? "New Quantity *"
											: "Adjustment Quantity *"}
									</Label>
									<Input
										id="adjustmentQuantity"
										type="number"
										min="0"
										value={field.state.value}
										onChange={(e) =>
											field.handleChange(
												Number.parseInt(
													e.target.value
												) || 0
											)
										}
										required
										placeholder={
											field.form.state.values
												.adjustmentType === "set"
												? "Enter new total quantity"
												: "Enter quantity to adjust"
										}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-red-600 mt-1">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						/>

						<form.Field
							name="reason"
							children={(field) => (
								<div className="space-y-2">
									<Label htmlFor="reason">
										Reason for Adjustment
									</Label>
									<Textarea
										id="reason"
										value={field.state.value}
										onChange={(e) =>
											field.handleChange(e.target.value)
										}
										placeholder="e.g., New stock delivery, expired items removed, inventory correction..."
										rows={3}
									/>
								</div>
							)}
						/>
					</CardContent>
				</Card>

				{/* Preview */}
				<Card>
					<CardHeader>
						<CardTitle>Adjustment Preview</CardTitle>
						<CardDescription>
							Review the changes before applying
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form.Subscribe
							selector={(state) => ({
								adjustmentType: state.values.adjustmentType,
								adjustmentQuantity:
									state.values.adjustmentQuantity,
							})}
							children={(formState) => {
								const newQuantity = calculateNewQuantity(
									formState.adjustmentType,
									formState.adjustmentQuantity
								);
								const difference =
									newQuantity - (medication.quantity ?? 0);
								const isValidQuantity =
									formState.adjustmentQuantity > 0;
								const isValidOperation =
									formState.adjustmentType !== "remove" ||
									formState.adjustmentQuantity <=
										(medication.quantity ?? 0);

								return (
									<>
										<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
											{/* Current Stock */}
											<div className="text-center p-4 border rounded-lg bg-blue-50 border-blue-200">
												<p className="text-sm text-blue-700 font-medium">
													Current Stock
												</p>
												<p className="text-2xl font-bold text-blue-900">
													{medication.quantity ?? 0}
												</p>
												<p className="text-xs text-blue-600">
													Min:{" "}
													{medication.minStockLevel ??
														0}
												</p>
											</div>

											{/* Adjustment Details */}
											<div className="text-center p-4 border rounded-lg bg-gray-50">
												<p className="text-sm text-gray-700 font-medium">
													Adjustment
												</p>
												<div className="flex items-center justify-center gap-1">
													<span className="text-lg font-bold">
														{formState.adjustmentType ===
															"add" && "+"}
														{formState.adjustmentType ===
															"remove" && "-"}
														{formState.adjustmentType ===
															"set" && "="}
													</span>
													<span className="text-xl font-bold text-gray-900">
														{formState.adjustmentQuantity ||
															0}
													</span>
												</div>
												<p className="text-xs text-gray-600 capitalize">
													{formState.adjustmentType ===
													"set"
														? "Set to"
														: formState.adjustmentType}
												</p>
											</div>

											{/* Difference */}
											<div
												className={cn(
													"text-center p-4 border rounded-lg",
													{
														"bg-green-50 border-green-200":
															difference > 0,
														"bg-red-50 border-red-200":
															difference < 0,
														"bg-yellow-50 border-yellow-200":
															difference === 0,
													}
												)}
											>
												<p
													className={cn(
														"text-sm font-medium",
														{
															"text-green-700":
																difference > 0,
															"text-red-700":
																difference < 0,
															"text-yellow-700":
																difference ===
																0,
														}
													)}
												>
													Change
												</p>
												<p
													className={cn(
														"text-xl font-bold",
														{
															"text-green-900":
																difference > 0,
															"text-red-900":
																difference < 0,
															"text-yellow-900":
																difference ===
																0,
														}
													)}
												>
													{difference > 0 && "+"}
													{difference}
												</p>
												<p
													className={cn("text-xs", {
														"text-green-600":
															difference > 0,
														"text-red-600":
															difference < 0,
														"text-yellow-600":
															difference === 0,
													})}
												>
													{difference > 0 &&
														"Increase"}
													{difference < 0 &&
														"Decrease"}
													{difference === 0 &&
														"No change"}
												</p>
											</div>

											{/* New Quantity */}
											<div
												className={cn(
													"text-center p-4 border rounded-lg",
													{
														"bg-green-50 border-green-200":
															newQuantity >
															(medication.minStockLevel ??
																0),
														"bg-yellow-50 border-yellow-200":
															newQuantity > 0 &&
															newQuantity <=
																(medication.minStockLevel ??
																	0),
														"bg-red-50 border-red-200":
															newQuantity <= 0,
													}
												)}
											>
												<p
													className={cn(
														"text-sm font-medium",
														{
															"text-green-700":
																newQuantity >
																(medication.minStockLevel ??
																	0),
															"text-yellow-700":
																newQuantity >
																	0 &&
																newQuantity <=
																	(medication.minStockLevel ??
																		0),
															"text-red-700":
																newQuantity <=
																0,
														}
													)}
												>
													New Quantity
												</p>
												<p
													className={cn(
														"text-2xl font-bold",
														{
															"text-green-900":
																newQuantity >
																(medication.minStockLevel ??
																	0),
															"text-yellow-900":
																newQuantity >
																	0 &&
																newQuantity <=
																	(medication.minStockLevel ??
																		0),
															"text-red-900":
																newQuantity <=
																0,
														}
													)}
												>
													{newQuantity}
												</p>
												<p
													className={cn("text-xs", {
														"text-green-600":
															newQuantity >
															(medication.minStockLevel ??
																0),
														"text-yellow-600":
															newQuantity > 0 &&
															newQuantity <=
																(medication.minStockLevel ??
																	0),
														"text-red-600":
															newQuantity <= 0,
													})}
												>
													{newQuantity >
														(medication.minStockLevel ??
															0) &&
														"Good stock level"}
													{newQuantity > 0 &&
														newQuantity <=
															(medication.minStockLevel ??
																0) &&
														"Low stock"}
													{newQuantity <= 0 &&
														"Out of stock"}
												</p>
											</div>
										</div>

										{/* Validation Messages */}
										{!isValidQuantity &&
											formState.adjustmentQuantity !==
												0 && (
												<Alert
													variant="destructive"
													className="mb-4"
												>
													<AlertDescription>
														Adjustment quantity must
														be greater than 0.
													</AlertDescription>
												</Alert>
											)}

										{!isValidOperation && (
											<Alert
												variant="destructive"
												className="mb-4"
											>
												<AlertDescription>
													Cannot remove more items
													than currently in stock (
													{medication.quantity ?? 0}).
												</AlertDescription>
											</Alert>
										)}

										{newQuantity <=
											(medication.minStockLevel ?? 0) &&
											newQuantity > 0 && (
												<Alert className="mb-4">
													<AlertDescription>
														⚠️ Warning: New quantity
														({newQuantity}) is at or
														below the minimum stock
														level (
														{medication.minStockLevel ??
															0}
														).
													</AlertDescription>
												</Alert>
											)}

										{newQuantity <= 0 && (
											<Alert
												variant="destructive"
												className="mb-4"
											>
												<AlertDescription>
													⚠️ Warning: This adjustment
													will result in zero or
													negative stock.
												</AlertDescription>
											</Alert>
										)}
									</>
								);
							}}
						/>
					</CardContent>
				</Card>

				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{/* Actions */}
				<div className="flex justify-end gap-4">
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<form.Field
						name="adjustmentQuantity"
						children={(field) => (
							<form.Subscribe
								selector={(state) => ({
									adjustmentType: state.values.adjustmentType,
									adjustmentQuantity:
										state.values.adjustmentQuantity,
								})}
								children={(formState) => {
									const isValidQuantity =
										formState.adjustmentQuantity > 0;
									const isValidOperation =
										formState.adjustmentType !== "remove" ||
										formState.adjustmentQuantity <=
											(medication.quantity ?? 0);

									return (
										<Button
											type="submit"
											disabled={
												loading ||
												!isValidQuantity ||
												!isValidOperation
											}
										>
											{loading
												? "Applying..."
												: "Apply Adjustment"}
										</Button>
									);
								}}
							/>
						)}
					/>
				</div>
			</form>
		</div>
	);
}
