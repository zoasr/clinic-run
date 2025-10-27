import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, TrendingUp } from "lucide-react";
import { useState } from "react";
import { StockUsageChart } from "@/components/stock-usage-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc-client";

export const Route = createFileRoute("/_authenticated/reports/inventory")({
	loader: () => ({
		crumb: "Inventory Reports",
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const [selectedMedicationId, setSelectedMedicationId] = useState<
		number | null
	>(null);
	const [reportPeriod, setReportPeriod] = useState("30");

	const { data: medications } = useQuery(
		trpc.medications.getAll.queryOptions({
			limit: 100,
		}),
	);

	const { data: inventoryData } = useQuery(
		trpc.medications.getInventory.queryOptions({
			limit: 100,
		}),
	);

	const handleExportReport = () => {
		if (!inventoryData?.data) return;

		const csvData = inventoryData.data.map((med) => ({
			Name: med.name,
			"Generic Name": med.genericName || "",
			Quantity: med.quantity,
			"Min Stock Level": med.minStockLevel,
			"Unit Price": med.unitPrice,
			"Total Value": (med.quantity || 0) * (med.unitPrice || 0),
			Status:
				med.quantity === 0
					? "Out of Stock"
					: (med.quantity || 0) <= (med.minStockLevel || 0)
						? "Low Stock"
						: "In Stock",
			"Expiry Date": med.expiryDate
				? new Date(med.expiryDate).toLocaleDateString()
				: "",
			"Days to Expiry": med.daysToExpiry || "",
		}));

		const csvString = [
			Object.keys(csvData[0]).join(","),
			...csvData.map((row) =>
				Object.values(row)
					.map((value) =>
						typeof value === "string" && value.includes(",")
							? `"${value}"`
							: value,
					)
					.join(","),
			),
		].join("\n");

		const blob = new Blob([csvString], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `inventory-report-${new Date().toISOString().split("T")[0]}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	};

	const totalValue =
		inventoryData?.data?.reduce(
			(sum, med) => sum + (med.quantity || 0) * (med.unitPrice || 0),
			0,
		) || 0;

	const lowStockCount =
		inventoryData?.data?.filter(
			(med) =>
				(med.quantity || 0) <= (med.minStockLevel || 0) &&
				(med.quantity || 0) > 0,
		).length || 0;

	const outOfStockCount =
		inventoryData?.data?.filter((med) => (med.quantity || 0) === 0).length || 0;

	const expiringSoonCount =
		inventoryData?.data?.filter((med) => med.isExpiringSoon).length || 0;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-serif font-bold text-foreground">
						Inventory Reports
					</h1>
					<p className="text-muted-foreground">
						Comprehensive inventory analysis and reporting
					</p>
				</div>
				<Button
					onClick={handleExportReport}
					className="flex items-center gap-2"
				>
					<Download className="h-4 w-4" />
					Export Report
				</Button>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Total Items</p>
								<p className="text-2xl font-bold">
									{inventoryData?.data?.length || 0}
								</p>
							</div>
							<TrendingUp className="h-8 w-8 text-blue-500" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Total Value</p>
								<p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
							</div>
							<TrendingUp className="h-8 w-8 text-green-500" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Low Stock Items</p>
								<p className="text-2xl font-bold text-yellow-600">
									{lowStockCount}
								</p>
							</div>
							<TrendingUp className="h-8 w-8 text-yellow-500" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Expiring Soon</p>
								<p className="text-2xl font-bold text-orange-600">
									{expiringSoonCount}
								</p>
							</div>
							<TrendingUp className="h-8 w-8 text-orange-500" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Stock Trends Analysis */}
			<Card>
				<CardHeader>
					<CardTitle>Stock Usage Trends</CardTitle>
					<div className="flex gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">Select Medication</label>
							<Select
								value={selectedMedicationId?.toString() || ""}
								onValueChange={(value) =>
									setSelectedMedicationId(value ? parseInt(value) : null)
								}
							>
								<SelectTrigger className="w-64">
									<SelectValue placeholder="Choose a medication" />
								</SelectTrigger>
								<SelectContent>
									{medications?.data?.map((med) => (
										<SelectItem key={med.id} value={med.id.toString()}>
											{med.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">Time Period</label>
							<Select value={reportPeriod} onValueChange={setReportPeriod}>
								<SelectTrigger className="w-32">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="7">7 days</SelectItem>
									<SelectItem value="30">30 days</SelectItem>
									<SelectItem value="90">90 days</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{selectedMedicationId ? (
						<StockUsageChart
							medicationId={selectedMedicationId}
							days={parseInt(reportPeriod)}
						/>
					) : (
						<div className="h-32 flex items-center justify-center text-muted-foreground">
							Select a medication to view stock usage trends
						</div>
					)}
				</CardContent>
			</Card>

			{/* Inventory Details Table */}
			<Card>
				<CardHeader>
					<CardTitle>Inventory Details</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b">
									<th className="text-left p-2">Medication</th>
									<th className="text-left p-2">Quantity</th>
									<th className="text-left p-2">Min Level</th>
									<th className="text-left p-2">Unit Price</th>
									<th className="text-left p-2">Total Value</th>
									<th className="text-left p-2">Status</th>
									<th className="text-left p-2">Expiry</th>
								</tr>
							</thead>
							<tbody>
								{inventoryData?.data?.map((med) => (
									<tr key={med.id} className="border-b">
										<td className="p-2 font-medium">{med.name}</td>
										<td className="p-2">{med.quantity}</td>
										<td className="p-2">{med.minStockLevel}</td>
										<td className="p-2">${med.unitPrice?.toFixed(2)}</td>
										<td className="p-2">
											${((med.quantity || 0) * (med.unitPrice || 0)).toFixed(2)}
										</td>
										<td className="p-2">
											<span
												className={`px-2 py-1 rounded text-xs ${
													med.quantity === 0
														? "bg-red-100 text-red-800"
														: (med.quantity || 0) <= (med.minStockLevel || 0)
															? "bg-yellow-100 text-yellow-800"
															: "bg-green-100 text-green-800"
												}`}
											>
												{med.quantity === 0
													? "Out of Stock"
													: (med.quantity || 0) <= (med.minStockLevel || 0)
														? "Low Stock"
														: "In Stock"}
											</span>
										</td>
										<td className="p-2">
											{med.expiryDate
												? new Date(med.expiryDate).toLocaleDateString()
												: "N/A"}
											{med.daysToExpiry && med.daysToExpiry <= 30 && (
												<span className="ml-2 text-orange-600 text-xs">
													({med.daysToExpiry} days)
												</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
