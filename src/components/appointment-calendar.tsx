import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface AppointmentCalendarProps {
	appointments: any[];
	onAppointmentClick: (appointment: any) => void;
	onDateClick: (date: string) => void;
}

export function AppointmentCalendar({
	appointments,
	onAppointmentClick,
	onDateClick,
}: AppointmentCalendarProps) {
	const [currentDate, setCurrentDate] = useState(new Date());

	const getDaysInMonth = (date: Date) => {
		return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	};

	const getFirstDayOfMonth = (date: Date) => {
		return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
	};

	const getAppointmentsForDate = (date: string) => {
		return appointments.filter((apt) => apt.appointmentDate === date);
	};

	const formatDate = (year: number, month: number, day: number) => {
		return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
	};

	const navigateMonth = (direction: "prev" | "next") => {
		setCurrentDate((prev) => {
			const newDate = new Date(prev);
			if (direction === "prev") {
				newDate.setMonth(prev.getMonth() - 1);
			} else {
				newDate.setMonth(prev.getMonth() + 1);
			}
			return newDate;
		});
	};

	const daysInMonth = getDaysInMonth(currentDate);
	const firstDayOfMonth = getFirstDayOfMonth(currentDate);
	const monthNames = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
	const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	const today = new Date();
	const isToday = (day: number) => {
		return (
			today.getDate() === day &&
			today.getMonth() === currentDate.getMonth() &&
			today.getFullYear() === currentDate.getFullYear()
		);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "scheduled":
				return "bg-blue-500";
			case "completed":
				return "bg-green-500";
			case "cancelled":
				return "bg-red-500";
			case "no-show":
				return "bg-gray-500";
			default:
				return "bg-gray-500";
		}
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<Calendar className="h-5 w-5" />
						{monthNames[currentDate.getMonth()]}{" "}
						{currentDate.getFullYear()}
					</CardTitle>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => navigateMonth("prev")}
						>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => navigateMonth("next")}
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-7 gap-1 mb-4">
					{dayNames.map((day) => (
						<div
							key={day}
							className="p-2 text-center text-sm font-medium text-muted-foreground"
						>
							{day}
						</div>
					))}
				</div>

				<div className="grid grid-cols-7 gap-1">
					{/* Empty cells for days before the first day of the month */}
					{Array.from({ length: firstDayOfMonth }, (_, i) => (
						<div key={`empty-${i}`} className="p-2 h-24"></div>
					))}

					{/* Days of the month */}
					{Array.from({ length: daysInMonth }, (_, i) => {
						const day = i + 1;
						const dateString = formatDate(
							currentDate.getFullYear(),
							currentDate.getMonth(),
							day
						);
						const dayAppointments =
							getAppointmentsForDate(dateString);

						return (
							<div
								key={day}
								className={`p-1 h-24 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
									isToday(day)
										? "bg-secondary/20 border-secondary"
										: "border-border"
								}`}
								onClick={() => onDateClick(dateString)}
							>
								<div className="flex justify-between items-start mb-1">
									<span
										className={`text-sm font-medium ${isToday(day) ? "text-secondary" : "text-foreground"}`}
									>
										{day}
									</span>
									{dayAppointments.length > 0 && (
										<Badge
											variant="secondary"
											className="text-xs px-1 py-0"
										>
											{dayAppointments.length}
										</Badge>
									)}
								</div>

								<div className="space-y-1">
									{dayAppointments
										.slice(0, 2)
										.map((appointment) => (
											<div
												key={appointment.id}
												className="text-xs p-1 rounded cursor-pointer hover:opacity-80"
												style={{
													backgroundColor: `${getStatusColor(appointment.status)}20`,
												}}
												onClick={(e) => {
													e.stopPropagation();
													onAppointmentClick(
														appointment
													);
												}}
											>
												<div className="flex items-center gap-1">
													<div
														className={`w-2 h-2 rounded-full ${getStatusColor(appointment.status)}`}
													></div>
													<span className="truncate">
														{
															appointment.appointmentTime
														}{" "}
														{
															appointment.patient
																.firstName
														}
													</span>
												</div>
											</div>
										))}
									{dayAppointments.length > 2 && (
										<div className="text-xs text-muted-foreground text-center">
											+{dayAppointments.length - 2} more
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>

				{/* Legend */}
				<div className="mt-6 flex flex-wrap gap-4 text-xs">
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-blue-500"></div>
						<span>Scheduled</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-green-500"></div>
						<span>Completed</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-red-500"></div>
						<span>Cancelled</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-gray-500"></div>
						<span>No Show</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
