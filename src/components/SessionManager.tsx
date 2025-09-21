import { redirect, useLoaderData } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";

interface SessionManagerProps {
	children: React.ReactNode;
}

export function SessionManager({ children }: SessionManagerProps) {
	const { logout, refreshAuth, isAuthenticated } = useAuth();
	const [showWarning, setShowWarning] = useState(false);
	const [timeRemaining, setTimeRemaining] = useState(60);
	const lastActivityRef = useRef(Date.now());
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const countdownRef = useRef<NodeJS.Timeout | null>(null);
	const { sessionTimeout: sessionTimeoutMinutes } = useLoaderData({
		from: "/_authenticated",
	});

	const sessionTimeoutMs = sessionTimeoutMinutes * 60 * 1000;
	const warningTimeMs = 60 * 1000;

	const resetActivity = useCallback(() => {
		lastActivityRef.current = Date.now();

		if (showWarning) {
			setShowWarning(false);
			setTimeRemaining(60);
			if (countdownRef.current) {
				clearInterval(countdownRef.current);
			}
		}
	}, [showWarning]);

	const handleActivity = useCallback(() => {
		if (!isAuthenticated) return;
		resetActivity();
	}, [isAuthenticated, resetActivity]);

	const extendSession = useCallback(async () => {
		try {
			await refreshAuth();
			resetActivity();
			setShowWarning(false);
			setTimeRemaining(60);
			toast.success("Session extended successfully");
		} catch (error) {
			console.error("Failed to extend session:", error);
			toast.error("Failed to extend session");
		}
	}, [refreshAuth, resetActivity]);

	const handleTimeout = useCallback(async () => {
		setShowWarning(false);
		toast.error("Your session has expired. Please log in again.");
		logout();
		throw redirect({
			to: "/login",
			search: { redirect: window.location.pathname },
		});
	}, [logout]);

	useEffect(() => {
		if (!isAuthenticated) return;

		const events = [
			"mousedown",
			"mouseup",
			"keypress",
			"scroll",
			"touchstart",
			"click",
		];

		events.forEach((event) => {
			document.addEventListener(event, handleActivity);
		});

		const checkTimeout = () => {
			const now = Date.now();
			const timeSinceActivity = now - lastActivityRef.current;
			const timeUntilTimeout =
				sessionTimeoutMs - timeSinceActivity + warningTimeMs;
			const timeUntilWarning = timeUntilTimeout - warningTimeMs;

			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

			if (timeUntilTimeout <= 0) {
				handleTimeout();
			} else if (timeUntilWarning <= 0 && !showWarning) {
				setShowWarning(true);
				setTimeRemaining(Math.floor(timeUntilTimeout / 1000));

				countdownRef.current = setInterval(() => {
					setTimeRemaining((prev) => {
						if (prev <= 1) {
							if (countdownRef.current) {
								clearInterval(countdownRef.current);
							}
							handleTimeout();
							return 0;
						}
						return prev - 1;
					});
				}, 1000);

				timeoutRef.current = setTimeout(() => {
					handleTimeout();
				}, timeUntilTimeout);
			} else {
				if (timeUntilWarning > 0) {
					warningTimeoutRef.current = setTimeout(() => {
						checkTimeout();
					}, timeUntilWarning);
				}

				timeoutRef.current = setTimeout(() => {
					checkTimeout();
				}, timeUntilTimeout);
			}
		};

		checkTimeout();

		const intervalId = setInterval(checkTimeout, 30000);

		return () => {
			events.forEach((event) => {
				document.removeEventListener(event, handleActivity);
			});

			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
			if (countdownRef.current) clearInterval(countdownRef.current);
			clearInterval(intervalId);
		};
	}, [
		isAuthenticated,
		sessionTimeoutMs,
		handleActivity,
		handleTimeout,
		showWarning,
	]);

	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === "auth-logout" && e.newValue === "true") {
				window.location.href = "/login";
			}
		};

		window.addEventListener("storage", handleStorageChange);
		return () => window.removeEventListener("storage", handleStorageChange);
	}, []);

	return (
		<>
			{children}
			<AlertDialog open={showWarning} onOpenChange={setShowWarning}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Session Expiring Soon</AlertDialogTitle>
						<AlertDialogDescription>
							Your session will expire in {timeRemaining} seconds due to
							inactivity. Would you like to continue working?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel asChild>
							<Button onClick={handleTimeout} variant="destructive">
								Log Out
							</Button>
						</AlertDialogCancel>
						<AlertDialogAction onClick={extendSession}>
							Continue Session
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

export function useResetActivity() {
	const [_lastReset, setLastReset] = useState(Date.now());

	const reset = useCallback(() => {
		setLastReset(Date.now());
		const event = new CustomEvent("user-activity");
		document.dispatchEvent(event);
	}, []);

	return reset;
}
