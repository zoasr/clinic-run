import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
	Home,
	User,
	Calendar,
	Stethoscope,
	Pill,
	FileText,
	Settings,
	LogOut,
	Users,
	ClipboardList,
	Receipt,
	TestTube,
	Shield,
	Activity,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuItem,
	SidebarHeader,
	SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "@tanstack/react-router";
import { useMatches } from "@tanstack/react-router";
import { useClinicInfo } from "@/hooks/useSettings";

const navItems = [
	{
		name: "Dashboard",
		href: "/",
		icon: Home,
		title: "Dashboard",
		adminOnly: false,
	},
	{
		name: "Appointments",
		href: "/appointments",
		icon: Calendar,
		title: "Appointments",
		adminOnly: false,
	},
	{
		name: "Patients",
		href: "/patients",
		icon: Users,
		title: "Patients",
		adminOnly: false,
	},
	{
		name: "Doctors",
		href: "/doctors",
		icon: Stethoscope,
		title: "Doctors",
		adminOnly: false,
	},
	{
		name: "Users",
		href: "/users",
		icon: Users,
		title: "Users",
		adminOnly: true,
	},
	{
		name: "Medications",
		href: "/medications",
		icon: Pill,
		title: "Medications",
		adminOnly: false,
	},
	{
		name: "Prescriptions",
		href: "/prescriptions",
		icon: Pill,
		title: "Prescriptions",
		adminOnly: false,
	},
	{
		name: "Lab Tests",
		href: "/lab-tests",
		icon: TestTube,
		title: "Lab Tests",
		adminOnly: false,
	},
	{
		name: "Invoices",
		href: "/invoices",
		icon: Receipt,
		title: "Invoices",
		adminOnly: false,
	},
	{
		name: "Medical Records",
		href: "/medical-records",
		icon: FileText,
		title: "Medical Records",
		adminOnly: false,
	},
	{
		name: "Reports",
		href: "/reports",
		icon: ClipboardList,
		title: "Reports",
		adminOnly: true,
	},
	{
		name: "Settings",
		href: "/settings",
		icon: Settings,
		title: "Settings",
		adminOnly: true,
	},
];
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const navigate = useNavigate();
	const matches = useMatches();
	const { user, logout } = useAuth();
	const clinicInfo = useClinicInfo();

	const isActive = React.useCallback(
		(href: string) => {
			if (!matches || matches.length === 0) return false;

			// Check if any matched route corresponds to this navigation item
			return matches.some((match) => {
				// For exact matches
				if (
					match.fullPath === href &&
					match.routeId !== "__root__" &&
					match.routeId !== "/_authenticated"
				) {
					return true;
				}

				// For routes with parameters, check if the route path matches
				// TanStack Router provides the route path in match.route.path
				if (
					match.params &&
					match.pathname === href &&
					match.routeId !== "__root__" &&
					match.routeId !== "/_authenticated"
				) {
					return true;
				}

				// For nested routes, check if the current match is a child of this href
				if (href !== "/" && match.pathname?.startsWith(href)) {
					const nextChar = match.pathname[href.length];
					return !nextChar || nextChar === "/";
				}

				return false;
			});
		},
		[matches]
	);

	const isAdmin = user?.role === "admin";
	const isDoctor = user?.role === "doctor";
	const isStaff = user?.role === "staff";

	// Separate navigation items by access level
	const publicNavItems = navItems.filter((item) => !item.adminOnly);
	const adminNavItems = navItems.filter((item) => item.adminOnly);

	return (
		<Sidebar
			{...props}
			className="border-r-2 border-gradient-to-b from-primary/20 to-transparent"
		>
			<SidebarHeader className="border-b border-border/50 bg-gradient-to-r from-primary/10 to-secondary/10 p-6">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<Activity className="h-6 w-6 text-primary" />
					</div>
					<div>
						<h2 className="text-lg font-semibold text-foreground">
							{clinicInfo.name}
						</h2>
						<p className="text-xs text-muted-foreground">
							Medical Management
						</p>
					</div>
				</div>
			</SidebarHeader>

			<SidebarContent className="px-3 py-4">
				{/* Main Navigation */}
				<SidebarGroup>
					<SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
						Main Navigation
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu className="space-y-1">
							{publicNavItems.map((item) => {
								const Icon = item.icon;
								const active = isActive(item.href);

								return (
									<SidebarMenuItem key={item.href}>
										<Link
											to={item.href}
											className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
												active
													? "bg-primary/15 text-primary shadow-sm border border-primary/20"
													: "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm"
											}`}
											title={item.title}
										>
											<Icon
												className={`h-4 w-4 transition-colors ${
													active
														? "text-primary"
														: "text-muted-foreground group-hover:text-accent-foreground"
												}`}
											/>
											<span
												className={
													active
														? "font-semibold"
														: ""
												}
											>
												{item.name}
											</span>
											{active && (
												<div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
											)}
										</Link>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Admin Navigation */}
				{isAdmin && adminNavItems.length > 0 && (
					<SidebarGroup className="mt-6">
						<SidebarGroupLabel className="flex items-center gap-2 text-xs font-semibold text-orange-600 uppercase tracking-wider mb-3">
							<Shield className="h-3 w-3" />
							Administration
							<Badge
								variant="secondary"
								className="ml-auto text-xs bg-orange-100 text-orange-700"
							>
								Admin
							</Badge>
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu className="space-y-1">
								{adminNavItems.map((item) => {
									const Icon = item.icon;
									const active = isActive(item.href);

									return (
										<SidebarMenuItem key={item.href}>
											<Link
												to={item.href}
												className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 border ${
													active
														? "bg-orange-100 text-orange-800 shadow-sm border-orange-200"
														: "text-muted-foreground hover:bg-orange-100 hover:text-orange-800 hover:shadow-sm border-transparent hover:border-orange-100"
												}`}
												title={item.title}
											>
												<Icon
													className={`h-4 w-4 transition-colors ${
														active
															? "text-orange-600"
															: "text-muted-foreground group-hover:text-orange-600"
													}`}
												/>
												<span
													className={
														active
															? "font-semibold"
															: ""
													}
												>
													{item.name}
												</span>
												{active && (
													<div className="ml-auto h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
												)}
											</Link>
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				)}
			</SidebarContent>

			{/* User Profile Section */}
			<SidebarFooter className="border-t border-border/50 bg-gradient-to-r from-muted/30 to-muted/10 p-4">
				<div className="flex items-center gap-3 mb-4">
					<Avatar className="h-10 w-10 ring-2 ring-primary/20">
						<AvatarFallback className="bg-primary/10 text-primary font-semibold">
							{user?.name
								.split(" ")
								.map((n) => n[0])
								.join("")}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1 min-w-0">
						<p className="font-medium text-sm truncate">
							{user?.name}
						</p>
						<div className="flex items-center gap-2">
							<Badge
								variant={
									isAdmin
										? "default"
										: isDoctor
											? "secondary"
											: "outline"
								}
								className={`text-xs ${
									isAdmin
										? "bg-orange-100 text-orange-700 hover:bg-orange-200"
										: isDoctor
											? "bg-blue-100 text-blue-700"
											: "bg-gray-100 text-gray-700"
								}`}
							>
								{user?.role || "staff"}
							</Badge>
						</div>
					</div>
				</div>

				{/* Bottom Navigation */}
				<div className="flex items-center justify-between">
					<Button
						variant="ghost"
						size="sm"
						className="flex-1 justify-start gap-2 h-9 rounded-lg hover:bg-accent/50"
						asChild
					>
						<Link to="/profile" title="Profile">
							<User className="h-4 w-4" />
							<span className="text-sm">Profile</span>
						</Link>
					</Button>

					{isAdmin && (
						<Button
							variant="ghost"
							size="sm"
							className="flex-1 justify-start gap-2 h-9 rounded-lg hover:bg-accent/50"
							asChild
						>
							<Link to="/settings" title="Settings">
								<Settings className="h-4 w-4" />
								<span className="text-sm">Settings</span>
							</Link>
						</Button>
					)}

					<Button
						variant="ghost"
						size="sm"
						className="justify-center h-9 w-9 rounded-lg hover:bg-destructive/10 hover:text-destructive"
						onClick={() => {
							logout();
							navigate({
								to: "/login",
								search: {
									redirect: location.pathname,
								},
							});
						}}
						title="Logout"
					>
						<LogOut className="h-4 w-4" />
					</Button>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
