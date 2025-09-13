import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc-client";

/**
 * Custom hook that provides tRPC functionality with authentication context
 * This ensures that all tRPC calls include proper authentication headers
 */
export function useTRPC() {
	const { user, session } = useAuth();

	// Return tRPC with additional auth context
	return {
		...trpc,
		// Add auth context for convenience
		auth: {
			user,
			session,
			isAuthenticated: !!user && !!session,
		},
	};
}

export { trpc };
