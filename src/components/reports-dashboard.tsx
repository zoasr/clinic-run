import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	CalendarDays,
	DollarSign,
	Pill,
	TrendingUp,
	Users,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc-client";

export function ReportsDashboard() {
	const [selectedPeriod, setSelectedPeriod] = useState<"30" | "90" | "365">(
		"30",
	);

	// Fetch all report data
	const { data: patientStats, isLoading: patientLoading } = useQuery(
		trpc.reports.getPatientStats.queryOptions({}),
	);
	const { data: appointmentStats, isLoading: appointmentLoading } = useQuery(
		trpc.reports.getAppointmentStats.queryOptions({}),
	);
	const { data: financialStats, isLoading: financialLoading } = useQuery(
		trpc.reports.getFinancialStats.queryOptions({}),
	);
	const { data: inventoryStats, isLoading: inventoryLoading } = useQuery(
		trpc.reports.getInventoryStats.queryOptions(),
	);
	const { data: monthlyTrends, isLoading: trendsLoading } = useQuery(
		trpc.reports.getMonthlyTrends.queryOptions({
			months: 6,
		}),
	);

	const isLoading =
		patientLoading ||
		appointmentLoading ||
		financialLoading ||
		inventoryLoading ||
		trendsLoading;

	if (isLoading) {
		return <Loading />;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Reports</h1>
					<p className="text-muted-foreground">
						Comprehensive analytics and insights for your clinic
					</p>
				</div>
			</div>
			<div className="flex items-center space-x-2">
				<Button
					variant={selectedPeriod === "30" ? "default" : "outline"}
					size="sm"
					onClick={() => setSelectedPeriod("30")}
				>
					Last 30 Days
				</Button>
				<Button
					variant={selectedPeriod === "90" ? "default" : "outline"}
					size="sm"
					onClick={() => setSelectedPeriod("90")}
				>
					Last 90 Days
				</Button>
				<Button
					variant={selectedPeriod === "365" ? "default" : "outline"}
					size="sm"
					onClick={() => setSelectedPeriod("365")}
				>
					Last Year
				</Button>
			</div>

			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="patients">Patients</TabsTrigger>
					<TabsTrigger value="appointments">Appointments</TabsTrigger>
					<TabsTrigger value="financial">Financial</TabsTrigger>
					<TabsTrigger value="inventory">Inventory</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4 w-full">
					{/* Key Metrics Cards */}
					<div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Total Patients
								</CardTitle>
								<Users className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{patientStats?.totalPatients || 0}
								</div>
								<p className="text-xs text-muted-foreground">
									{patientStats?.activePatients || 0} active patients
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Appointments
								</CardTitle>
								<CalendarDays className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{appointmentStats?.totalAppointments || 0}
								</div>
								<p className="text-xs text-muted-foreground">
									{Math.round(appointmentStats?.completionRate || 0)}%
									completion rate
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Revenue</CardTitle>
								<DollarSign className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									${(financialStats?.totalRevenue || 0).toLocaleString()}
								</div>
								<p className="text-xs text-muted-foreground">
									${(financialStats?.outstandingAmount || 0).toLocaleString()}{" "}
									outstanding
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Inventory Status
								</CardTitle>
								<Pill className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{inventoryStats?.totalMedications || 0}
								</div>
								<p className="text-xs text-muted-foreground">
									{inventoryStats?.lowStockCount || 0} low stock items
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Charts and Trends */}
					<div className="grid gap-4 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Monthly Trends</CardTitle>
								<CardDescription>
									Appointments and revenue over the last 6 months
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{monthlyTrends?.map((trend) => (
										<div
											key={trend.month}
											className="flex items-center justify-between"
										>
											<div className="flex items-center space-x-2">
												<TrendingUp className="h-4 w-4 text-muted-foreground" />
												<span className="text-sm font-medium">
													{trend.month}
												</span>
											</div>
											<div className="flex items-center space-x-4">
												<span className="text-sm text-muted-foreground">
													{trend.appointments} appointments
												</span>
												<span className="text-sm font-medium">
													${trend.revenue.toLocaleString()}
												</span>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="patients" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Patient Demographics</CardTitle>
							<CardDescription>
								Age and gender distribution of patients
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 md:grid-cols-2">
								<div>
									<h4 className="text-sm font-medium mb-2">Age Distribution</h4>
									<div className="space-y-2">
										{Object.entries(patientStats?.ageDistribution || {}).map(
											([age, count]) => (
												<div
													key={age}
													className="flex items-center justify-between"
												>
													<span className="text-sm">{age} years</span>
													<span className="text-sm font-medium">{count}</span>
												</div>
											),
										)}
									</div>
								</div>
								<div>
									<h4 className="text-sm font-medium mb-2">
										Gender Distribution
									</h4>
									<div className="space-y-2">
										{Object.entries(patientStats?.genderDistribution || {}).map(
											([gender, count]) => (
												<div
													key={gender}
													className="flex items-center justify-between"
												>
													<span className="text-sm capitalize">{gender}</span>
													<span className="text-sm font-medium">{count}</span>
												</div>
											),
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="appointments" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Appointment Statistics</CardTitle>
							<CardDescription>
								Appointment status and type breakdown
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 md:grid-cols-2">
								<div>
									<h4 className="text-sm font-medium mb-2">
										Status Distribution
									</h4>
									<div className="space-y-2">
										{Object.entries(
											appointmentStats?.statusDistribution || {},
										).map(([status, count]) => (
											<div
												key={status}
												className="flex items-center justify-between"
											>
												<span className="text-sm capitalize">{status}</span>
												<span className="text-sm font-medium">{count}</span>
											</div>
										))}
									</div>
								</div>
								<div>
									<h4 className="text-sm font-medium mb-2">
										Type Distribution
									</h4>
									<div className="space-y-2">
										{Object.entries(
											appointmentStats?.typeDistribution || {},
										).map(([type, count]) => (
											<div
												key={type}
												className="flex items-center justify-between"
											>
												<span className="text-sm capitalize">
													{type.replace("-", " ")}
												</span>
												<span className="text-sm font-medium">{count}</span>
											</div>
										))}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="financial" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Financial Overview</CardTitle>
							<CardDescription>
								Revenue, payments, and outstanding amounts
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 md:grid-cols-3">
								<div className="text-center">
									<div className="text-2xl font-bold text-green-600">
										${(financialStats?.totalRevenue || 0).toLocaleString()}
									</div>
									<p className="text-sm text-muted-foreground">Total Revenue</p>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-blue-600">
										${(financialStats?.totalPaid || 0).toLocaleString()}
									</div>
									<p className="text-sm text-muted-foreground">Total Paid</p>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-orange-600">
										${(financialStats?.outstandingAmount || 0).toLocaleString()}
									</div>
									<p className="text-sm text-muted-foreground">Outstanding</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="inventory" className="space-y-4">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Inventory Status</CardTitle>
									<CardDescription>
										Medication stock levels and alerts
									</CardDescription>
								</div>
								<Button asChild>
									<Link to="/reports/inventory">Detailed inventory reports</Link>
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 md:grid-cols-4">
								<div className="text-center">
									<div className="text-2xl font-bold">
										{inventoryStats?.totalMedications || 0}
									</div>
									<p className="text-sm text-muted-foreground">Total Items</p>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-green-600">
										{inventoryStats?.stockLevels?.healthy || 0}
									</div>
									<p className="text-sm text-muted-foreground">Healthy Stock</p>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-yellow-600">
										{inventoryStats?.stockLevels?.low || 0}
									</div>
									<p className="text-sm text-muted-foreground">Low Stock</p>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-red-600">
										{inventoryStats?.stockLevels?.out || 0}
									</div>
									<p className="text-sm text-muted-foreground">Out of Stock</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
