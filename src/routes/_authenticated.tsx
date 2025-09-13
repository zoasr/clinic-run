import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useMatches,
} from "@tanstack/react-router";
import { memo } from "react";
import { Fragment } from "react/jsx-runtime";
import { AppSidebar } from "@/components/app-sidebar";
import ErrorComponent from "@/components/error";
import NotFound from "@/components/not-found";
import { SessionManager } from "@/components/SessionManager";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PageLoading } from "@/components/ui/loading";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import {
	getAppearanceSettings,
	getClinicInfo,
	getCurrency,
	getSessionTimeout,
} from "@/lib/utils";

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
	loader: async () => {
		const appearanceSettings = await getAppearanceSettings();
		const clinicInfo = await getClinicInfo();
		const sessionTimeout = await getSessionTimeout();
		const currency = await getCurrency();
		return {
			appearanceSettings,
			clinicInfo,
			sessionTimeout,
			currency,
			crumb: "",
		};
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
	staleTime: 1000 * 60 * 60, // 1 hour

	component: () => {
		const { appearanceSettings } = Route.useLoaderData();

		return (
			<SessionManager>
				<SidebarProvider defaultOpen={!appearanceSettings.sidebarCollapsed}>
					<AppSidebar />
					<SidebarInset>
						<Header />
						<section className="max-w-[1200px] w-full h-full mx-auto">
							<Outlet />
						</section>
					</SidebarInset>
				</SidebarProvider>
			</SessionManager>
		);
	},
});

const Header = memo(() => {
	const matches = useMatches();

	const breadcrumbItems = matches
		.filter((match) => match.loaderData?.crumb)
		.map(({ pathname, loaderData }) => ({
			href: pathname,
			label: loaderData?.crumb || pathname,
		}));
	return (
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
									<Link to={link.href}>{link.label}</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							{index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
						</Fragment>
					))}
				</BreadcrumbList>
			</Breadcrumb>
		</header>
	);
});
