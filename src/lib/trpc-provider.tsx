import { QueryClientProvider } from "@tanstack/react-query";
import { TRPCProvider } from "./trpc.js";
import { queryClient, trpcClient } from "./trpc-client.js";

export function TRPCProviderWrapper({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<QueryClientProvider client={queryClient}>
			<TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
				{children}
			</TRPCProvider>
		</QueryClientProvider>
	);
}
