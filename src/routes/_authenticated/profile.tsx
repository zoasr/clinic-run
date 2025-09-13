import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ProfileForm } from "@/components/profile-form";
import { PageLoading } from "@/components/ui/loading";
import { trpc } from "@/lib/trpc-client";

export const Route = createFileRoute("/_authenticated/profile")({
	loader: () => ({
		crumb: "Profile",
	}),
	component: ProfileComponent,
});

function ProfileComponent() {
	const {
		data: profile,
		isLoading,
		error,
	} = useQuery(trpc.users.getProfile.queryOptions());

	if (isLoading) return <PageLoading text="Loading profile..." />;
	if (error) return <div>Error loading profile</div>;

	return (
		<div className="p-4 w-full mx-auto">
			<h1 className="text-2xl font-bold mb-4">My Profile</h1>
			{profile && <ProfileForm profile={profile} />}
		</div>
	);
}
