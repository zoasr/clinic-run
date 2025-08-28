import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
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
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "@tanstack/react-router";

const navItems = [
	{ name: "Dashboard", href: "/", icon: Home },
	{ name: "Appointments", href: "/appointments", icon: Calendar },
	{ name: "Patients", href: "/patients", icon: Users },
	{ name: "Doctors", href: "/doctors", icon: Stethoscope },
	{ name: "Users", href: "/users", icon: Users },
	{ name: "Medications", href: "/medications", icon: Pill },
	{ name: "Prescriptions", href: "/prescriptions", icon: Pill },
	{ name: "Lab Tests", href: "/lab-tests", icon: TestTube },
	{ name: "Invoices", href: "/invoices", icon: Receipt },
	{ name: "Records", href: "/records", icon: FileText },
	{ name: "Reports", href: "/reports", icon: ClipboardList },
	{ name: "Settings", href: "/settings", icon: Settings },
];
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const navigate = useNavigate();
	const location = useLocation();
	const { user, logout } = useAuth();

	const isActive = (href: string) => location.pathname === href;

	return (
		<Sidebar {...props}>
			<SidebarContent>
				{/* User Profile Section */}
				<SidebarGroup>
					<SidebarGroupContent className="space-y-4 p-4">
						<div className="flex items-center space-x-3">
							<Avatar className="h-10 w-10">
								{/* <AvatarImage
									src={user.avatar}
									alt={user.name}
								/> */}
								<AvatarFallback>
									{user?.name
										.split(" ")
										.map((n) => n[0])
										.join("")}
								</AvatarFallback>
							</Avatar>
							<div>
								<p className="font-medium">{user?.name}</p>
							</div>
						</div>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Main Navigation */}
				<SidebarGroup>
					<SidebarGroupLabel>Navigation</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => {
								const Icon = item.icon;
								const active = isActive(item.href);

								return (
									<SidebarMenuItem key={item.href}>
										<Link
											to={item.href}
											className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
												active
													? "bg-primary/10 text-primary font-medium"
													: "hover:bg-accent hover:text-accent-foreground"
											}`}
										>
											<Icon className="h-5 w-5" />
											<span>{item.name}</span>
										</Link>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			{/* Bottom Navigation */}
			<SidebarRail />

			<SidebarMenu className="flex flex-row items-center gap-2 p-8">
				<SidebarMenuItem>
					<Button
						variant="ghost"
						size="icon"
						className="rounded-full"
					>
						<User className="h-5 w-5" />
						<span className="sr-only">Profile</span>
					</Button>
				</SidebarMenuItem>
				<SidebarMenuItem>
					<Button
						variant="ghost"
						size="icon"
						className="rounded-full"
					>
						<Settings className="h-5 w-5" />
						<span className="sr-only">Settings</span>
					</Button>
				</SidebarMenuItem>
				<SidebarMenuItem>
					<Button
						variant="ghost"
						size="icon"
						className="rounded-full"
						onClick={() => {
							logout();
							navigate({
								to: "/login",
								search: {
									redirect: location.pathname,
								},
							});
						}}
					>
						<LogOut className="h-5 w-5" />
						<span className="sr-only">Logout</span>
					</Button>
				</SidebarMenuItem>
			</SidebarMenu>
		</Sidebar>
	);
}
