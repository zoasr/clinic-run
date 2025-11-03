import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc-client";

interface StockUsageChartProps {
	medicationId: number;
	days?: number;
}

export function StockUsageChart({
	medicationId,
	days = 30,
}: StockUsageChartProps) {
	const { data: trends, isLoading } = useQuery(
		trpc.medications.getStockTrends.queryOptions({
			medicationId,
			days,
		}),
	);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Stock Usage Trends</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="h-32 flex items-center justify-center">
						<p className="text-muted-foreground">Loading trends...</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!trends || trends.totalChanges === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Stock Usage Trends</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="h-32 flex items-center justify-center">
						<p className="text-muted-foreground">
							No stock changes in the last {days} days
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const totalAdditions = trends.logs
		.filter((log) => log.quantityChanged > 0)
		.reduce((sum, log) => sum + log.quantityChanged, 0);

	const totalReductions = Math.abs(
		trends.logs
			.filter((log) => log.quantityChanged < 0)
			.reduce((sum, log) => sum + log.quantityChanged, 0),
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Stock Usage Trends (Last {days} days)</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<div className="grid grid-cols-3 gap-4">
						<div className="text-center p-3 bg-green-50 rounded-lg">
							<p className="text-sm text-green-700 font-medium">Stock Added</p>
							<p className="text-xl font-bold text-green-900">
								+{totalAdditions}
							</p>
						</div>
						<div className="text-center p-3 bg-red-50 rounded-lg">
							<p className="text-sm text-red-700 font-medium">Stock Used</p>
							<p className="text-xl font-bold text-red-900">
								-{totalReductions}
							</p>
						</div>
						<div className="text-center p-3 bg-blue-50 rounded-lg">
							<p className="text-sm text-blue-700 font-medium">Total Changes</p>
							<p className="text-xl font-bold text-blue-900">
								{trends.totalChanges}
							</p>
						</div>
					</div>

					<div className="space-y-2">
						<h4 className="text-sm font-medium">Recent Activity</h4>
						<div className="max-h-32 overflow-y-auto space-y-1">
							{trends.logs.slice(0, 5).map((log) => (
								<div key={log.id} className="flex justify-between text-sm">
									<span className="text-muted-foreground">
										{new Date(log.createdAt).toLocaleDateString()}
									</span>
									<span
										className={`font-medium ${
											log.quantityChanged > 0
												? "text-green-600"
												: "text-red-600"
										}`}
									>
										{log.quantityChanged > 0 ? "+" : ""}
										{log.quantityChanged}
									</span>
									<span className="text-muted-foreground truncate max-w-32">
										{log.reason}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
