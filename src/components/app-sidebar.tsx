import { Link, useLoaderData } from "@tanstack/react-router";
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
	ChevronUp,
	ChevronDown,
	ChevronsUpDown,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
	SidebarRail,
	SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "@tanstack/react-router";
import { memo, useMemo, useState } from "react";
import { cva } from "class-variance-authority";

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
const navItemVariants = cva(
	"group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 active:scale-95",
	{
		variants: {
			variant: {
				public: "[&.active]:bg-primary/15 [&.active]:text-primary [&.active]:shadow-sm [&.active]:border [&.active]:border-primary/20 text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm border-transparent",
				admin: "[&.active]:bg-orange-100 [&.active]:text-orange-800 [&.active]:shadow-sm [&.active]:border-orange-200 text-muted-foreground hover:bg-orange-100 hover:text-orange-800 hover:shadow-sm border-transparent hover:border-orange-100",
			},
		},

		defaultVariants: {
			variant: "public",
		},
	}
);

const navItemIconVariants = cva("h-4 w-4 transition-colors", {
	variants: {
		variant: {
			public: "group-[&.active]:text-primary text-muted-foreground group-hover:text-accent-foreground",
			admin: "text-muted-foreground group-hover:text-orange-600 group-[&.active]:text-orange-600",
		},
	},
	defaultVariants: {
		variant: "public",
	},
});

const NavItem = memo(
	({
		item,
		variant = "public",
	}: {
		item: (typeof navItems)[number];
		variant?: "public" | "admin";
	}) => {
		const Icon = item.icon;

		return (
			<SidebarMenuItem key={item.href}>
				<SidebarMenuButton asChild key={item.href}>
					<Link
						to={item.href}
						className={navItemVariants({ variant })}
						title={item.title}
					>
						<Icon className={navItemIconVariants({ variant })} />
						<span className="group-[&.active]:font-bold">
							{item.name}
						</span>
						<div
							className={`ml-auto h-1.5 w-1.5 rounded-full animate-pulse group-[&.active]:block hidden ${
								variant === "admin"
									? "bg-orange-500"
									: "bg-primary"
							}`}
						/>
					</Link>
				</SidebarMenuButton>
			</SidebarMenuItem>
		);
	}
);
export const AppSidebar = memo(
	({ ...props }: React.ComponentProps<typeof Sidebar>) => {
		const navigate = useNavigate();
		const { user, logout } = useAuth();
		const { clinicInfo } = useLoaderData({ from: "/_authenticated" });
		const [isFooterOpen, setIsFooterOpen] = useState(true);

		const isAdmin = user?.role === "admin";
		const isDoctor = user?.role === "doctor";
		const isStaff = user?.role === "staff";

		// Separate navigation items by access level
		const publicNavItems = useMemo(
			() => navItems.filter((item) => !item.adminOnly),
			[navItems]
		);
		const adminNavItems = useMemo(
			() => navItems.filter((item) => item.adminOnly),
			[navItems]
		);

		const publicNavItemsEls = useMemo(() => {
			return publicNavItems.map((item) => (
				<NavItem key={item.href} item={item} variant="public" />
			));
		}, [publicNavItems]);

		const adminNavItemsEls = useMemo(() => {
			return adminNavItems.map((item) => (
				<NavItem key={item.href} item={item} variant="admin" />
			));
		}, [adminNavItems]);

		return (
			<Sidebar {...props} collapsible="icon">
				<SidebarHeader className="items-center justify-center border-b border-border/50 bg-gradient-to-r from-primary/10 to-secondary/10  h-16 transition-[padding]">
					<SidebarMenuButton size="lg" className="!bg-transparent">
						<Link to="/" className="flex items-center gap-3 h-full">
							<Activity className="text-sidebar-primary flex aspect-square size-8 items-center justify-center" />
							<div className="">
								<h2 className="text-lg font-semibold text-foreground">
									{clinicInfo.name}
								</h2>
							</div>
						</Link>
					</SidebarMenuButton>
				</SidebarHeader>

				<SidebarContent className="">
					{/* Main Navigation */}
					<SidebarGroup>
						<SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
							Main Navigation
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu className="space-y-1">
								{publicNavItemsEls}
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
									{adminNavItemsEls}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					)}
				</SidebarContent>

				<SidebarFooter>
					<SidebarMenu>
						<SidebarMenuItem>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<SidebarMenuButton
										size="lg"
										className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:p-0"
									>
										<Avatar className="size-8 rounded-full text-primary ">
											<AvatarImage
												src={
													user?.image
														? user.image
														: ""
												}
												alt={user?.name}
											/>
											<AvatarFallback className="rounded-lg bg-primary/20">
												{user?.name
													?.split(" ")
													.map((n) => n[0])
													.join("")
													.toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="grid flex-1 text-left text-sm leading-tight">
											<span className="truncate font-semibold">
												{user?.name}
											</span>
											<span className="truncate text-xs">
												{user?.email}{" "}
												<Badge
													variant={
														user?.role as
															| "admin"
															| "doctor"
															| "staff"
													}
												>
													{user?.role}
												</Badge>
											</span>
										</div>
										<ChevronsUpDown className="ml-auto size-4" />
									</SidebarMenuButton>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
									side="bottom"
									align="end"
									sideOffset={4}
								>
									<DropdownMenuLabel className="p-0 font-normal">
										<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
											<Avatar className="size-8 rounded-full text-primary ">
												<AvatarImage
													src={
														user?.image
															? user.image
															: ""
													}
													alt={user?.name}
												/>
												<AvatarFallback className="rounded-lg bg-primary/20">
													{user?.name
														?.split(" ")
														.map((n) => n[0])
														.join("")
														.toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div className="grid flex-1 text-left text-sm leading-tight">
												<span className="truncate font-semibold">
													{user?.name}
												</span>
												<span className="truncate text-xs">
													{user?.email}
												</span>
											</div>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<Link to="/profile">
											<User className="size-4" />
											Profile
										</Link>
									</DropdownMenuItem>
									{isAdmin && (
										<DropdownMenuItem asChild>
											<Link to="/settings">
												<Settings className="size-4" />
												Settings
											</Link>
										</DropdownMenuItem>
									)}
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<Button
											onClick={() => {
												logout();
												navigate({
													to: "/login",
													search: {
														redirect:
															location.pathname,
													},
												});
											}}
											variant="destructive"
											className="w-full"
										>
											<LogOut className="size-4 text-white" />
											Log out
										</Button>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarFooter>
				<SidebarRail />
			</Sidebar>
		);
	}
);
