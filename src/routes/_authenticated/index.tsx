import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Users,
	Calendar,
	FileText,
	Package,
	AlertTriangle,
	Clock,
	Plus,
	ArrowRight,
	Activity,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";
import { cn } from "@/lib/utils";

export function DashboardPage() {
	const {
		data: stats,
		isLoading: statsLoading,
		error: statsError,
	} = useQuery(trpc.dashboard.getStats.queryOptions());

	const { data: recentActivity, isLoading: activityLoading } = useQuery(
		trpc.dashboard.getRecentActivity.queryOptions({ limit: 5 })
	);

	const { data: upcomingAppointments, isLoading: appointmentsLoading } =
		useQuery(
			trpc.dashboard.getUpcomingAppointments.queryOptions({ days: 3 })
		);

	if (statsLoading) {
		return (
			<div className="space-y-6 p-6">
				<div>
					<h1 className="text-2xl font-serif font-bold text-foreground">
						Dashboard
					</h1>
					<p className="text-muted-foreground">
						Loading clinic overview...
					</p>
				</div>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{[...Array(4)].map((_, i) => (
						<Card key={i}>
							<CardContent className="p-6">
								<div className="animate-pulse">
									<div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
									<div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
									<div className="h-3 bg-muted rounded w-full"></div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	if (statsError) {
		return (
			<div className="space-y-6 p-6">
				<div>
					<h1 className="text-2xl font-serif font-bold text-foreground">
						Dashboard
					</h1>
					<p className="text-muted-foreground">Clinic overview</p>
				</div>
				<Alert variant="destructive">
					<AlertTriangle className="h-4 w-4" />
					<AlertDescription>
						Failed to load dashboard data: {statsError.message}
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	// Critical alerts based on real data
	const criticalAlerts: Array<{
		type: "warning" | "info" | "destructive";
		message: string;
		action: string;
		actionText: string;
	}> = [];

	// Out of stock medications - highest priority
	if ((stats?.outOfStockMedications ?? 0) > 0) {
		criticalAlerts.push({
			type: "destructive",
			message: `${stats?.outOfStockMedications} medications are completely out of stock`,
			action: "/inventory",
			actionText: "Restock Now",
		});
	}

	// Low stock medications - medium priority
	if (
		(stats?.lowStockMedications ?? 0) > 0 &&
		(stats?.outOfStockMedications ?? 0) === 0
	) {
		criticalAlerts.push({
			type: "warning",
			message: `${stats?.lowStockMedications} medications are running low on stock`,
			action: "/inventory",
			actionText: "Manage Inventory",
		});
	}

	// High number of pending appointments
	if ((stats?.pendingAppointments ?? 0) > 10) {
		criticalAlerts.push({
			type: "warning",
			message: `${stats?.pendingAppointments} appointments need confirmation`,
			action: "/appointments",
			actionText: "Review Appointments",
		});
	}

	// No appointments scheduled for today
	if (
		(stats?.todayAppointments ?? 0) === 0 &&
		(stats?.upcomingAppointments ?? 0) === 0
	) {
		criticalAlerts.push({
			type: "info",
			message: "No appointments scheduled for today",
			action: "/appointments/new",
			actionText: "Schedule Appointment",
		});
	}

	// Significant change in appointment volume
	if (stats && Math.abs(stats.appointmentChange) > 50) {
		const changeType =
			stats.appointmentChange > 0 ? "increase" : "decrease";
		criticalAlerts.push({
			type: "info",
			message: `Appointment volume ${changeType} of ${Math.abs(stats.appointmentChange)}% compared to yesterday`,
			action: "/appointments",
			actionText: "View Details",
		});
	}

	// Calculate real trends and statuses
	const getPatientTrend = () => {
		if (!stats) return "Loading...";
		return `${stats.totalPatients} active patients`;
	};

	const getAppointmentTrend = () => {
		if (!stats) return "Loading...";
		const change = stats.appointmentChange;
		if (change > 0) return `+${change}% vs yesterday`;
		if (change < 0) return `${change}% vs yesterday`;
		return "Same as yesterday";
	};

	const getPendingStatus = () => {
		if (!stats) return "Loading...";
		const count = stats.pendingAppointments;
		if (count === 0) return "All clear";
		if (count <= 3) return "Manage soon";
		return `${count} need attention`;
	};

	const getStockStatus = () => {
		if (!stats) return "Loading...";
		const total = stats.totalMedications;
		const low = stats.lowStockMedications;
		const out = stats.outOfStockMedications;
		if (out > 0) return `${out} out of stock`;
		if (low > 0) return `${low} low stock`;
		return "All stocked";
	};

	const getOutOfStockStatus = () => {
		if (!stats) return "Loading...";
		const outOfStock = stats.outOfStockMedications;
		const total = stats.totalMedications;
		if (outOfStock === 0) return "All stocked";
		return `${outOfStock} items unavailable`;
	};

	const statCards = [
		{
			title: "Total Patients",
			value: stats?.totalPatients || 0,
			description: "Active patient records",
			icon: Users,
			color: "text-blue-600",
			trend: getPatientTrend(),
			link: "/patients",
		},
		{
			title: "Today's Appointments",
			value: stats?.todayAppointments || 0,
			description: "Scheduled for today",
			icon: Calendar,
			color: "text-green-600",
			trend: getAppointmentTrend(),
			link: "/appointments",
		},
		{
			title: "Pending Appointments",
			value: stats?.pendingAppointments || 0,
			description: "Awaiting confirmation",
			icon: FileText,
			color: "text-yellow-600",
			trend: getPendingStatus(),
			link: "/appointments",
		},
		{
			title: "Out of Stock",
			value: stats?.outOfStockMedications || 0,
			description: "Completely unavailable",
			icon: Package,
			color: "text-red-600",
			trend: getOutOfStockStatus(),
			link: "/inventory",
		},
		{
			title: "Low Stock Items",
			value: stats?.lowStockMedications || 0,
			description: "Need restocking",
			icon: AlertTriangle,
			color: "text-orange-600",
			trend: getStockStatus(),
			link: "/inventory",
		},
	];

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-serif font-bold text-foreground">
						Dashboard
					</h1>
					<p className="text-muted-foreground mt-1">
						Welcome back! Here's your clinic overview for today.
					</p>
				</div>
				<div className="flex gap-3">
					<Button asChild variant="outline">
						<Link to="/patients/new">
							<Plus className="h-4 w-4 mr-2" />
							New Patient
						</Link>
					</Button>
					<Button asChild>
						<Link to="/appointments/new">
							<Calendar className="h-4 w-4 mr-2" />
							Book Appointment
						</Link>
					</Button>
				</div>
			</div>

			{/* Critical Alerts */}
			{criticalAlerts.length > 0 && (
				<div className="space-y-3">
					{criticalAlerts.map((alert, index) => (
						<Alert
							key={index}
							className="items-center text-destructive"
							variant={
								alert.type === "info" ? "default" : alert.type
							}
						>
							<AlertTriangle className="h-4 w-4" />
							<AlertDescription className="flex items-center justify-between text-destructive">
								<span>{alert.message}</span>
								<Button asChild variant="outline" size="sm">
									<Link to={alert.action}>
										{alert.actionText}
										<ArrowRight className="h-3 w-3 ml-1" />
									</Link>
								</Button>
							</AlertDescription>
						</Alert>
					))}
				</div>
			)}

			{/* Key Metrics */}
			<div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
				{statCards.map((card) => {
					const Icon = card.icon;
					return (
						<Link key={card.title} to={card.link} className="block">
							<Card
								className={cn(
									"hover:shadow-md transition-all cursor-pointer hover:-translate-y-1",
									{
										"border-destructive/20 border":
											card.color === "text-red-600",
										"border-yellow-600/20 border":
											card.color === "text-yellow-600",
										"border-green-600/20 border":
											card.color === "text-green-600",
										"border-blue-600/20 border":
											card.color === "text-blue-600",
										"border-orange-600/20 border":
											card.color === "text-orange-600",
									}
								)}
							>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium text-muted-foreground">
										{card.title}
									</CardTitle>
									<Icon className={`h-5 w-5 ${card.color}`} />
								</CardHeader>
								<CardContent>
									<div className="text-3xl font-bold mb-1">
										{card.value}
									</div>
									<div className="flex items-center justify-between">
										<p className="text-xs text-muted-foreground">
											{card.description}
										</p>
										<Badge
											variant="outline"
											className={cn(`text-xs`, {
												"border-destructive/30 bg-destructive/10 border":
													card.color ===
													"text-red-600",
												"border-yellow-600/30 bg-yellow-600/10 border":
													card.color ===
													"text-yellow-600",
												"border-green-600/30 bg-green-600/10 border":
													card.color ===
													"text-green-600",
												"border-blue-600/30 bg-blue-600/10 border":
													card.color ===
													"text-blue-600",
												"border-orange-600/30 bg-orange-600/10 border":
													card.color ===
													"text-orange-600",
											})}
										>
											{card.trend}
										</Badge>
									</div>
								</CardContent>
							</Card>
						</Link>
					);
				})}
			</div>

			{/* Main Content Grid */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Recent Activity */}
				<div className="lg:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Activity className="h-5 w-5" />
								Recent Activity
							</CardTitle>
							<CardDescription>
								Latest appointments and medical records
							</CardDescription>
						</CardHeader>
						<CardContent>
							{activityLoading ? (
								<div className="space-y-3">
									{[...Array(3)].map((_, i) => (
										<div key={i} className="animate-pulse">
											<div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
											<div className="h-3 bg-muted rounded w-1/2"></div>
										</div>
									))}
								</div>
							) : recentActivity ? (
								<div className="space-y-4">
									{/* Recent Appointments */}
									{recentActivity.recentAppointments
										?.slice(0, 3)
										.map((appointment: any) => (
											<div
												key={appointment.id}
												className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
											>
												<div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
												<div className="flex-1">
													<p className="text-sm font-medium">
														Appointment with{" "}
														{
															appointment.patient
																?.firstName
														}{" "}
														{
															appointment.patient
																?.lastName
														}
													</p>
													<p className="text-xs text-muted-foreground">
														{new Date(
															appointment.appointmentDate
														).toLocaleDateString()}{" "}
														at{" "}
														{
															appointment.appointmentTime
														}
													</p>
												</div>
												<Badge
													variant="outline"
													className="text-xs"
												>
													{appointment.status}
												</Badge>
											</div>
										))}

									{/* Recent Medical Records */}
									{recentActivity.recentMedicalRecords
										?.slice(0, 2)
										.map((record: any) => (
											<div
												key={record.id}
												className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
											>
												<div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
												<div className="flex-1">
													<p className="text-sm font-medium">
														Medical record for{" "}
														{
															record.patient
																?.firstName
														}{" "}
														{
															record.patient
																?.lastName
														}
													</p>
													<p className="text-xs text-muted-foreground">
														{new Date(
															record.visitDate
														).toLocaleDateString()}
													</p>
												</div>
												<Badge
													variant="outline"
													className="text-xs"
												>
													Record
												</Badge>
											</div>
										))}
								</div>
							) : (
								<p className="text-sm text-muted-foreground text-center py-4">
									No recent activity
								</p>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Quick Actions & Upcoming */}
				<div className="space-y-6">
					{/* Quick Actions */}
					<Card>
						<CardHeader>
							<CardTitle>Quick Actions</CardTitle>
							<CardDescription>
								Common tasks and shortcuts
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<Button
								asChild
								variant="outline"
								className="w-full justify-start"
							>
								<Link to="/patients/new">
									<Users className="h-4 w-4 mr-3" />
									Add New Patient
								</Link>
							</Button>
							<Button
								asChild
								variant="outline"
								className="w-full justify-start"
							>
								<Link to="/appointments/new">
									<Calendar className="h-4 w-4 mr-3" />
									Schedule Appointment
								</Link>
							</Button>

							<Button
								asChild
								variant="outline"
								className="w-full justify-start"
							>
								<Link to="/medical-records">
									<FileText className="h-4 w-4 mr-3" />
									View Records
								</Link>
							</Button>
						</CardContent>
					</Card>

					{/* Upcoming Appointments */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Clock className="h-5 w-5" />
								Upcoming Appointments
							</CardTitle>
							<CardDescription>Next 3 days</CardDescription>
						</CardHeader>
						<CardContent>
							{appointmentsLoading ? (
								<div className="space-y-2">
									{[...Array(2)].map((_, i) => (
										<div key={i} className="animate-pulse">
											<div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
											<div className="h-3 bg-muted rounded w-1/2"></div>
										</div>
									))}
								</div>
							) : upcomingAppointments &&
							  upcomingAppointments.length > 0 ? (
								<div className="space-y-3">
									{upcomingAppointments
										.slice(0, 4)
										.map((appointment: any) => (
											<div
												key={appointment.id}
												className="flex items-start gap-3 p-2 bg-muted/20 rounded"
											>
												<div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
												<div className="flex-1">
													<p className="text-sm font-medium">
														{
															appointment.patient
																?.firstName
														}{" "}
														{
															appointment.patient
																?.lastName
														}
													</p>
													<p className="text-xs text-muted-foreground">
														{new Date(
															appointment.appointmentDate
														).toLocaleDateString()}{" "}
														at{" "}
														{
															appointment.appointmentTime
														}
													</p>
												</div>
												<Badge
													variant="outline"
													className="text-xs"
												>
													{appointment.type}
												</Badge>
											</div>
										))}
									{upcomingAppointments.length > 4 && (
										<Button
											asChild
											variant="ghost"
											size="sm"
											className="w-full"
										>
											<Link to="/appointments">
												View All Appointments
												<ArrowRight className="h-3 w-3 ml-1" />
											</Link>
										</Button>
									)}
								</div>
							) : (
								<div className="text-center py-4">
									<Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
									<p className="text-sm text-muted-foreground">
										No upcoming appointments
									</p>
									<Button asChild size="sm" className="mt-2">
										<Link to="/appointments/new">
											Schedule One
										</Link>
									</Button>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/_authenticated/")({
	loader: () => ({
		crumb: "Dashboard",
	}),
	component: DashboardPage,
});
