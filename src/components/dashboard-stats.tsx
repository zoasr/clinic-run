import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useTRPC } from "@/hooks/useTRPC";
import { useQuery } from "@tanstack/react-query";
import { Users, Calendar, FileText, Package } from "lucide-react";

export function DashboardStats() {
	const trpc = useTRPC();

	const {
		data: stats,
		isLoading,
		error,
	} = useQuery(trpc.dashboard.getStats.queryOptions());

	if (isLoading) {
		return (
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
		);
	}

	if (error) {
		return (
			<div className="text-center py-8">
				<p className="text-red-600">
					Failed to load dashboard stats: {error.message}
				</p>
			</div>
		);
	}

	const statCards = [
		{
			title: "Total Patients",
			value: stats?.totalPatients || 0,
			description: "Active patient records",
			icon: Users,
			color: "text-blue-600",
		},
		{
			title: "Today's Appointments",
			value: stats?.todayAppointments || 0,
			description: "Scheduled for today",
			icon: Calendar,
			color: "text-green-600",
		},
		{
			title: "Pending Appointments",
			value: stats?.pendingAppointments || 0,
			description: "Awaiting confirmation",
			icon: FileText,
			color: "text-yellow-600",
		},
		{
			title: "Low Stock Items",
			value: stats?.lowStockMedications || 0,
			description: "Need restocking",
			icon: Package,
			color: "text-red-600",
		},
	];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-serif font-bold text-foreground">
					Dashboard
				</h1>
				<p className="text-muted-foreground">
					Overview of your clinic operations
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{statCards.map((card) => {
					const Icon = card.icon;
					return (
						<Card key={card.title}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									{card.title}
								</CardTitle>
								<Icon className={`h-4 w-4 ${card.color}`} />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{card.value}
								</div>
								<p className="text-xs text-muted-foreground">
									{card.description}
								</p>
							</CardContent>
						</Card>
					);
				})}
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
						<CardDescription>
							Common tasks and shortcuts
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
							<span className="text-sm font-medium">
								Add New Patient
							</span>
							<Users className="h-4 w-4 text-muted-foreground" />
						</div>
						<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
							<span className="text-sm font-medium">
								Schedule Appointment
							</span>
							<Calendar className="h-4 w-4 text-muted-foreground" />
						</div>
						<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
							<span className="text-sm font-medium">
								Update Inventory
							</span>
							<Package className="h-4 w-4 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>System Status</CardTitle>
						<CardDescription>
							Current system information
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
							<span className="text-sm font-medium">
								Database
							</span>
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 bg-green-500 rounded-full"></div>
								<span className="text-xs text-green-700">
									Online
								</span>
							</div>
						</div>
						<div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
							<span className="text-sm font-medium">
								API Server
							</span>
							<div className="flex items-center gap-2">
								<div className="w-2 h-4 bg-green-500 rounded-full"></div>
								<span className="text-xs text-green-700">
									Running
								</span>
							</div>
						</div>
						<div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
							<span className="text-sm font-medium">
								Last Backup
							</span>
							<span className="text-xs text-blue-700">
								Auto-saved
							</span>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
