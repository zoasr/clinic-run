import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/date-picker";
import { AppointmentCalendar } from "@/components/appointment-calendar";
import { Search, Plus, Calendar, Clock, User, Trash2 } from "lucide-react";
import {
	useAppointments,
	useUpdateAppointment,
	useDeleteAppointment,
} from "@/hooks/useAppointments";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AppointmentManagement() {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [dateFilter, setDateFilter] = useState("");
	const [activeView, setActiveView] = useState<"list" | "calendar">("list");
	const navigate = useNavigate();

	const {
		data: appointmentsData,
		isLoading,
		error,
		refetch,
	} = useAppointments({
		status: statusFilter !== "all" ? statusFilter : undefined,
		date: dateFilter || undefined,
		page: 1,
		limit: 100,
	});

	// Mutation for updating appointment status
	const { mutate: updateStatus, isPending: isUpdating } =
		useUpdateAppointment({
			onSuccess: () => {
				// Invalidate and refetch
				refetch();
			},

			onError: (error: Error) => {
				console.error("Failed to update appointment status:", error);
			},
		});

	const handleStatusUpdate = (appointmentId: number, newStatus: string) => {
		updateStatus({
			id: appointmentId,
			data: { status: newStatus },
		});
	};

	// Mutation for deleting appointments
	const { mutate: deleteAppointment, isPending: isDeleting } =
		useDeleteAppointment({
			onSuccess: () => {
				toast.success("Appointment deleted successfully");
				refetch();
			},
			onError: (error: Error) => {
				console.error("Failed to delete appointment:", error);
				toast.error("Failed to delete appointment");
			},
		});

	const handleDeleteAppointment = (appointmentId: number) => {
		deleteAppointment({ id: appointmentId });
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "scheduled":
				return "bg-blue-100 text-blue-800";
			case "completed":
				return "bg-green-100 text-green-800";
			case "cancelled":
				return "bg-red-100 text-red-800";
			case "no-show":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getTypeColor = (type: string) => {
		switch (type) {
			case "consultation":
				return "bg-purple-100 text-purple-800";
			case "checkup":
				return "bg-green-100 text-green-800";
			case "follow-up":
				return "bg-blue-100 text-blue-800";
			case "emergency":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	// Filter appointments based on search term
	const filteredAppointments = (appointmentsData || []).filter(
		(appointment: any) => {
			// Skip appointments with missing patient or doctor data
			if (!appointment.patient || !appointment.doctor) {
				return false;
			}

			const matchesSearch =
				searchTerm === "" ||
				`${appointment.patient.firstName} ${appointment.patient.lastName}`
					.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				appointment.patient.patientId
					.toLowerCase()
					.includes(searchTerm.toLowerCase());

			return matchesSearch;
		}
	);

	if (error) {
		return <div>Error loading appointments: {error.message}</div>;
	}

	return (
		<>
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-serif font-bold text-foreground">
						Appointment Management
					</h1>
					<p className="text-muted-foreground">
						Manage patient appointments and scheduling
					</p>
				</div>
				<Button
					onClick={() => {
						navigate({ to: "/appointments/new" });
					}}
					className="flex items-center gap-2"
				>
					<Plus className="h-4 w-4" />
					Schedule Appointment
				</Button>
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
							<Input
								placeholder="Search by patient name or ID..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Select
							value={statusFilter}
							onValueChange={setStatusFilter}
						>
							<SelectTrigger className="w-full sm:w-48">
								<SelectValue placeholder="Filter by status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="scheduled">
									Scheduled
								</SelectItem>
								<SelectItem value="completed">
									Completed
								</SelectItem>
								<SelectItem value="cancelled">
									Cancelled
								</SelectItem>
								<SelectItem value="no-show">No Show</SelectItem>
							</SelectContent>
						</Select>
						<DatePicker
							selected={
								dateFilter ? new Date(dateFilter) : undefined
							}
							onSelect={(date) => {
								setDateFilter(
									date ? date.toLocaleDateString() : ""
								);
							}}
							mode="single"
							captionLayout="dropdown"
							placeholder="Filter by date"
							className="w-full "
						/>
					</div>
				</CardContent>
			</Card>

			{/* View Toggle */}
			<Tabs
				value={activeView}
				onValueChange={(value) =>
					setActiveView(value as "list" | "calendar")
				}
			>
				<TabsList>
					<TabsTrigger value="list">List View</TabsTrigger>
					<TabsTrigger value="calendar">Calendar View</TabsTrigger>
				</TabsList>

				<TabsContent value="list" className="space-y-4">
					{/* Appointment List */}
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
						</div>
					) : filteredAppointments.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-8">
								<Calendar className="h-12 w-12 text-muted-foreground mb-4" />
								<h3 className="text-lg font-medium text-foreground mb-2">
									No appointments found
								</h3>
								<p className="text-muted-foreground text-center mb-4">
									{searchTerm ||
									statusFilter !== "all" ||
									dateFilter
										? "No appointments match your search criteria."
										: "Get started by scheduling your first appointment."}
								</p>
								<Button
									onClick={() =>
										navigate({ to: "/appointments/new" })
									}
								>
									<Plus className="h-4 w-4 mr-2" />
									Schedule Appointment
								</Button>
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{filteredAppointments.map((appointment: any) => {
								// Skip appointments with missing data
								if (
									!appointment.patient ||
									!appointment.doctor
								) {
									return null;
								}

								const appointmentDate = new Date(
									appointment.appointmentDate
								);
								const isToday =
									appointmentDate.toDateString() ===
									new Date().toDateString();
								const isPast = appointmentDate < new Date();

								return (
									<Card
										key={appointment.id}
										className={`group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-border/50 hover:border-primary/20 ${
											isToday
												? "ring-2 ring-primary/20 bg-primary/5"
												: ""
										} ${isPast && appointment.status === "scheduled" ? "opacity-75" : ""}`}
									>
										<CardContent className="p-6">
											{/* Header with Patient Info */}
											<div className="flex items-start justify-between mb-4">
												<div className="flex items-center gap-3 flex-1">
													<div className="relative">
														<div
															className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
																getTypeColor(
																	appointment.type
																).includes(
																	"purple"
																)
																	? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
																	: getTypeColor(
																				appointment.type
																		  ).includes(
																				"green"
																		  )
																		? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
																		: getTypeColor(
																					appointment.type
																			  ).includes(
																					"blue"
																			  )
																			? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
																			: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
															}`}
														>
															<User className="h-6 w-6" />
														</div>
														{isToday && (
															<div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
																<span className="text-xs text-primary-foreground font-bold">
																	!
																</span>
															</div>
														)}
													</div>
													<div className="flex-1 min-w-0">
														<h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
															{
																appointment
																	.patient
																	.firstName
															}{" "}
															{
																appointment
																	.patient
																	.lastName
															}
														</h3>
														<p className="text-sm text-muted-foreground font-mono">
															ID:{" "}
															{
																appointment
																	.patient
																	.patientId
															}
														</p>
													</div>
												</div>
												<div className="flex flex-col items-end gap-2">
													<Badge
														className={`${getStatusColor(appointment.status)} border-0`}
													>
														{appointment.status}
													</Badge>
													{isToday && (
														<Badge
															variant="outline"
															className="text-xs"
														>
															Today
														</Badge>
													)}
												</div>
											</div>

											{/* Appointment Details */}
											<div className="space-y-3">
												{/* Date & Time Row */}
												<div className="grid grid-cols-2 gap-4">
													<div className="flex items-center gap-2">
														<Calendar className="h-4 w-4 text-muted-foreground" />
														<div>
															<p className="text-sm font-medium">
																{appointmentDate.toLocaleDateString()}
															</p>
															<p className="text-xs text-muted-foreground">
																{appointmentDate.toLocaleDateString(
																	"en",
																	{
																		weekday:
																			"short",
																	}
																)}
															</p>
														</div>
													</div>
													<div className="flex items-center gap-2">
														<Clock className="h-4 w-4 text-muted-foreground" />
														<div>
															<p className="text-sm font-medium">
																{
																	appointment.appointmentTime
																}
															</p>
															<p className="text-xs text-muted-foreground">
																{
																	appointment.duration
																}{" "}
																min
															</p>
														</div>
													</div>
												</div>

												{/* Doctor & Type Row */}
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-2">
														<User className="h-4 w-4 text-muted-foreground" />
														<span className="text-sm">
															Dr.{" "}
															{
																appointment
																	.doctor
																	.firstName
															}{" "}
															{
																appointment
																	.doctor
																	.lastName
															}
														</span>
													</div>
													<Badge
														variant="outline"
														className={getTypeColor(
															appointment.type
														)}
													>
														{appointment.type}
													</Badge>
												</div>

												{/* Notes */}
												{appointment.notes && (
													<div className="pt-2 border-t border-border/50">
														<p className="text-sm text-muted-foreground line-clamp-2">
															{appointment.notes}
														</p>
													</div>
												)}
											</div>

											{/* Actions */}
											<div className="flex items-center justify-between pt-4 mt-4 border-t border-border/50">
												<div className="flex items-center gap-2">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => {
															navigate({
																to: `/appointments/$appointmentId`,
																params: {
																	appointmentId: `${appointment.id}`,
																},
															});
														}}
														className="opacity-20 cursor-pointer group-hover:opacity-100 transition-all"
													>
														View Details
													</Button>
													<AlertDialog>
														<AlertDialogTrigger
															asChild
														>
															<Button
																variant="ghost"
																size="sm"
																className="opacity-20 cursor-pointer group-hover:opacity-100 transition-all text-red-600 hover:text-red-700 hover:bg-red-50"
																disabled={
																	isDeleting
																}
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</AlertDialogTrigger>
														<AlertDialogContent>
															<AlertDialogHeader>
																<AlertDialogTitle>
																	Delete
																	Appointment
																</AlertDialogTitle>
																<AlertDialogDescription>
																	Are you sure
																	you want to
																	delete this
																	appointment?
																	This action
																	cannot be
																	undone.
																</AlertDialogDescription>
															</AlertDialogHeader>
															<AlertDialogFooter>
																<AlertDialogCancel>
																	Cancel
																</AlertDialogCancel>
																<AlertDialogAction
																	onClick={() =>
																		handleDeleteAppointment(
																			appointment.id
																		)
																	}
																	asChild
																>
																	<Button variant="destructive">
																		Delete
																	</Button>
																</AlertDialogAction>
															</AlertDialogFooter>
														</AlertDialogContent>
													</AlertDialog>
												</div>

												{appointment.status ===
													"scheduled" && (
													<Select
														value={
															appointment.status
														}
														onValueChange={(
															value
														) =>
															handleStatusUpdate(
																appointment.id,
																value
															)
														}
														disabled={isUpdating}
													>
														<SelectTrigger className="w-24 h-8 text-xs">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="scheduled">
																Scheduled
															</SelectItem>
															<SelectItem value="completed">
																Completed
															</SelectItem>
															<SelectItem value="cancelled">
																Cancelled
															</SelectItem>
															<SelectItem value="no-show">
																No Show
															</SelectItem>
														</SelectContent>
													</Select>
												)}
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					)}
				</TabsContent>

				<TabsContent value="calendar">
					<AppointmentCalendar
						appointments={filteredAppointments}
						onAppointmentClick={(appointment) => {
							navigate({
								to: `/appointments/$appointmentId`,
								params: {
									appointmentId: `${appointment.id}`,
								},
							});
						}}
						onDateClick={() =>
							navigate({ to: "/appointments/new" })
						}
					/>
				</TabsContent>
			</Tabs>
		</>
	);
}
