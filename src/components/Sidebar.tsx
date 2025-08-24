"use client";

import type React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";
import {
	HomeIcon,
	UserGroupIcon,
	CalendarIcon,
	DocumentTextIcon,
	CubeIcon,
	ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

const navigation = [
	{ name: "Dashboard", href: "/", icon: HomeIcon },
	{ name: "Patients", href: "/patients", icon: UserGroupIcon },
	{ name: "Appointments", href: "/appointments", icon: CalendarIcon },
	{
		name: "Medical Records",
		href: "/medical-records",
		icon: DocumentTextIcon,
	},
	{ name: "Inventory", href: "/inventory", icon: CubeIcon },
];

const Sidebar: React.FC = () => {
	const { user, logout } = useAuth();
	const location = useLocation();

	return (
		<div className="flex flex-col w-64 bg-background shadow-lg">
			<div className="flex items-center justify-center h-16 px-4 bg-blue-600">
				<h1 className="text-xl font-bold text-white font-display">
					Clinic System
				</h1>
			</div>

			<div className="flex-1 px-4 py-6">
				<nav className="space-y-2">
					{navigation.map((item) => {
						const isActive = location.pathname === item.href;
						return (
							<Link
								key={item.name}
								to={item.href}
								className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
									isActive
										? "bg-blue-100 text-blue-700"
										: "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
								}`}
							>
								<item.icon className="w-5 h-5 mr-3" />
								{item.name}
							</Link>
						);
					})}
				</nav>
			</div>

			<div className="p-4 border-t border-gray-200">
				<div className="flex items-center mb-4">
					<div className="flex-1">
						<p className="text-sm font-medium text-gray-900">
							{user?.firstName} {user?.lastName}
						</p>
						<p className="text-xs text-gray-500">{user?.role}</p>
					</div>
				</div>
				<button
					onClick={logout}
					className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
				>
					<ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
					Sign out
				</button>
			</div>
		</div>
	);
};

export default Sidebar;
