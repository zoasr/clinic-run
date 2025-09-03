import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
import { toast } from "sonner";
import { redirect, useLoaderData } from "@tanstack/react-router";
import { Button } from "./ui/button";

interface SessionManagerProps {
	children: React.ReactNode;
}

export function SessionManager({ children }: SessionManagerProps) {
	const { logout, refreshAuth, isAuthenticated } = useAuth();
	const [showWarning, setShowWarning] = useState(false);
	const [timeRemaining, setTimeRemaining] = useState(60); // 60 seconds warning
	const lastActivityRef = useRef(Date.now());
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const countdownRef = useRef<NodeJS.Timeout | null>(null);
	const { sessionTimeout: sessionTimeoutMinutes } = useLoaderData({
		from: "/_authenticated",
	});

	// Convert minutes to milliseconds
	const sessionTimeoutMs = sessionTimeoutMinutes * 60 * 1000;
	const warningTimeMs = 60 * 1000; // Show warning 1 minute before timeout

	// Reset activity timestamp
	const resetActivity = useCallback(() => {
		lastActivityRef.current = Date.now();

		// If warning is showing, hide it and reset timers
		if (showWarning) {
			setShowWarning(false);
			setTimeRemaining(60);
			if (countdownRef.current) {
				clearInterval(countdownRef.current);
			}
		}
	}, [showWarning]);

	// Handle user activity
	const handleActivity = useCallback(() => {
		if (!isAuthenticated) return;
		resetActivity();
	}, [isAuthenticated, resetActivity]);

	// Extend session
	const extendSession = useCallback(async () => {
		try {
			// Refresh the auth session
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

	// Handle session timeout
	const handleTimeout = useCallback(async () => {
		setShowWarning(false);
		toast.error("Your session has expired. Please log in again.");
		logout();
		throw redirect({
			to: "/login",
			search: { redirect: window.location.pathname },
		});
	}, [logout]);

	// Setup activity listeners and timeout logic
	useEffect(() => {
		if (!isAuthenticated) return;

		// Activity event listeners
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

		// Setup timeout check
		const checkTimeout = () => {
			const now = Date.now();
			const timeSinceActivity = now - lastActivityRef.current;
			const timeUntilTimeout =
				sessionTimeoutMs - timeSinceActivity + warningTimeMs;
			const timeUntilWarning = timeUntilTimeout - warningTimeMs; // padded with 1 minute

			// Clear existing timeouts
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			if (warningTimeoutRef.current)
				clearTimeout(warningTimeoutRef.current);

			if (timeUntilTimeout <= 0) {
				// Session has expired
				handleTimeout();
			} else if (timeUntilWarning <= 0 && !showWarning) {
				// Show warning dialog
				setShowWarning(true);
				setTimeRemaining(Math.floor(timeUntilTimeout / 1000));

				// Start countdown
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

				// Set timeout for auto-logout
				timeoutRef.current = setTimeout(() => {
					handleTimeout();
				}, timeUntilTimeout);
			} else {
				// Schedule warning
				if (timeUntilWarning > 0) {
					warningTimeoutRef.current = setTimeout(() => {
						checkTimeout();
					}, timeUntilWarning);
				}

				// Schedule timeout check
				timeoutRef.current = setTimeout(() => {
					checkTimeout();
				}, timeUntilTimeout);
			}
		};

		// Initial check
		checkTimeout();

		// Check periodically (every 30 seconds)
		const intervalId = setInterval(checkTimeout, 30000);

		// Cleanup
		return () => {
			events.forEach((event) => {
				document.removeEventListener(event, handleActivity);
			});

			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			if (warningTimeoutRef.current)
				clearTimeout(warningTimeoutRef.current);
			if (countdownRef.current) clearInterval(countdownRef.current);
			clearInterval(intervalId);
		};
	}, [
		isAuthenticated,
		sessionTimeoutMs,
		warningTimeMs,
		handleActivity,
		handleTimeout,
		showWarning,
	]);

	// Listen for storage events (for multi-tab logout)
	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === "auth-logout" && e.newValue === "true") {
				// Another tab initiated logout
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
						<AlertDialogTitle>
							Session Expiring Soon
						</AlertDialogTitle>
						<AlertDialogDescription>
							Your session will expire in {timeRemaining} seconds
							due to inactivity. Would you like to continue
							working?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel asChild>
							<Button
								onClick={handleTimeout}
								variant="destructive"
							>
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

// Hook to programmatically reset activity (useful for API calls)
export function useResetActivity() {
	const [lastReset, setLastReset] = useState(Date.now());

	const reset = useCallback(() => {
		setLastReset(Date.now());
		// Dispatch a custom event that SessionManager can listen to
		const event = new CustomEvent("user-activity");
		document.dispatchEvent(event);
	}, []);

	return reset;
}
