import { AlertTriangle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function DemoTimer() {
	const { isDemo, demoTimeRemaining } = useAuth();
	if (!isDemo) return null;

	const minutes = Math.floor(demoTimeRemaining / (1000 * 60));
	const seconds = Math.floor((demoTimeRemaining % (1000 * 60)) / 1000);

	const isWarning = demoTimeRemaining < 5 * 60 * 1000; // 5 minutes
	const isCritical = demoTimeRemaining < 1 * 60 * 1000; // 1 minute

	const formatTime = (mins: number, secs: number) => {
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<Alert
			className={`mb-4 ${isCritical ? "border-red-500 bg-red-50" : isWarning ? "border-yellow-500 bg-yellow-50" : "border-blue-500 bg-blue-50"}`}
		>
			{isCritical ? (
				<AlertTriangle className={cn("h-4 w-4 !text-red-500")} />
			) : (
				<Clock
					className={cn("h-4 w-4", {
						"!text-yellow-500": isWarning,
						"!text-primary": !isWarning,
					})}
				/>
			)}
			<AlertDescription className="flex items-center justify-between">
				<span className="text-sm">
					This is a temporary demo session. You will be automatically logged out
					when time expires. And all data will be reset.
				</span>
				<Badge
					variant={
						isCritical ? "destructive" : isWarning ? "secondary" : "default"
					}
					className={cn(
						"ml-2 ",
						isCritical
							? "bg-red-600 text-red-50"
							: isWarning
								? "bg-yellow-600 text-yellow-50"
								: "bg-primary",
					)}
				>
					{formatTime(minutes, seconds)}
				</Badge>
			</AlertDescription>
		</Alert>
	);
}
