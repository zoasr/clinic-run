import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";
import { SystemSettingsForm } from "@/components/system-settings-form";
import ErrorComponent from "@/components/error";
import { PageLoading } from "@/components/ui/loading";
import { systemSettingsSchema } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";

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

	if (isLoading) return <PageLoading text="Loading settings..." />;
	if (error) return <ErrorComponent error={error} />;

	return (
		<div className="p-4 w-full mx-auto h-full grid ">
			{settings &&
			settings.length >= systemSettingsSchema.keyof().options.length ? (
				<SystemSettingsForm settings={settings} />
			) : (
				<div className="text-center py-8 grid gap-4 size-auto m-auto">
					<h1 className="text-2xl font-bold">System Settings</h1>

					<Button
						onClick={() => initializeDefaultsMutation.mutate()}
						size="lg"
						className="px-4 py-2 text-xl"
						disabled={initializeDefaultsMutation.isPending}
					>
						{initializeDefaultsMutation.isPending
							? "Initializing..."
							: "Initialize Default Settings"}
					</Button>
					<p className="text-muted-foreground mb-4">
						Not All system settings have been configured yet.
						Initialize them useing the button above
					</p>
				</div>
			)}
		</div>
	);
}
