import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";

import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Fragment } from "react/jsx-runtime";
import { useMatches } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import NotFound from "@/components/not-found";
import ErrorComponent from "@/components/error";
import { PageLoading } from "@/components/ui/loading";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: ({ context, location }) => {
		if (!context.auth.isAuthenticated) {
			throw redirect({
				to: "/login",
				search: {
					// Save current location for redirect after login
					redirect: location.href,
				},
			});
		}
	},
	pendingComponent: () => {
		return <PageLoading text="Verifying authentication..." />;
	},
	notFoundComponent: () => {
		return <NotFound />;
	},
	errorComponent: ({ error }) => {
		return <ErrorComponent error={error} />;
	},

	component: () => {
		const matches = useMatches();

		const breadcrumbItems = matches
			.filter((match) => match.loaderData?.crumb)
			.map(({ pathname, loaderData }) => ({
				href: pathname,
				label: loaderData?.crumb || pathname,
			}));
		return (
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset>
					<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
						<SidebarTrigger className="-ml-1" />
						<Separator
							orientation="vertical"
							className="mr-2 data-[orientation=vertical]:h-4"
						/>
						<Breadcrumb>
							<BreadcrumbList>
								{breadcrumbItems.map((link, index) => (
									<Fragment key={link.label}>
										<BreadcrumbItem>
											<BreadcrumbLink asChild>
												<Link to={link.href}>
													{link.label}
												</Link>
											</BreadcrumbLink>
										</BreadcrumbItem>
										{index < breadcrumbItems.length - 1 && (
											<BreadcrumbSeparator />
										)}
									</Fragment>
								))}
							</BreadcrumbList>
						</Breadcrumb>
					</header>

					<main className="max-w-[1200px] w-full mx-auto">
						<Outlet />
					</main>
				</SidebarInset>
			</SidebarProvider>
		);
	},
});
