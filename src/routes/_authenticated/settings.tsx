import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";
import { SystemSettingsForm } from "@/components/system-settings-form";
import ErrorComponent from "@/components/error";
import { PageLoading } from "@/components/ui/loading";

export const Route = createFileRoute("/_authenticated/settings")({
	loader: () => ({
		crumb: "System Settings",
	}),
	component: SettingsComponent,
});

function SettingsComponent() {
	const queryClient = useQueryClient();

	const {
		data: settings,
		isLoading,
		error,
	} = useQuery(
		trpc.systemSettings.getAll.queryOptions(undefined, {
			retry: false,
		})
	);

	const initializeDefaultsMutation = useMutation(
		trpc.systemSettings.initializeDefaults.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.systemSettings.getAll.queryKey(),
				});
			},
		})
	);

	console.log(error);

	if (isLoading) return <PageLoading text="Loading settings..." />;
	if (error) return <ErrorComponent error={error} />;

	return (
		<div className="p-4 w-full mx-auto">
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-2xl font-bold">System Settings</h1>
				{(!settings || settings.length === 0) && (
					<button
						onClick={() => initializeDefaultsMutation.mutate()}
						className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
						disabled={initializeDefaultsMutation.isPending}
					>
						{initializeDefaultsMutation.isPending
							? "Initializing..."
							: "Initialize Default Settings"}
					</button>
				)}
			</div>

			{settings && settings.length > 0 ? (
				<SystemSettingsForm settings={settings} />
			) : (
				<div className="text-center py-8">
					<p className="text-muted-foreground mb-4">
						No system settings found. Initialize default settings to
						get started.
					</p>
				</div>
			)}
		</div>
	);
}
