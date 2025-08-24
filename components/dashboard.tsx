"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PatientManagement } from "@/components/patient-management"
import { AppointmentManagement } from "@/components/appointment-management"
import { MedicalRecords } from "@/components/medical-records"
import { InventoryManagement } from "@/components/inventory-management"
import { DashboardStats } from "@/components/dashboard-stats"
import { Users, Calendar, FileText, Package, Home, LogOut, Menu, X } from "lucide-react"

interface DashboardProps {
  onLogout: () => void
}

type ActiveSection = "dashboard" | "patients" | "appointments" | "records" | "inventory"

export function Dashboard({ onLogout }: DashboardProps) {
  const [activeSection, setActiveSection] = useState<ActiveSection>("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const user = JSON.parse(localStorage.getItem("clinic_user") || "{}")

  const navigation = [
    { id: "dashboard", name: "Dashboard", icon: Home },
    { id: "patients", name: "Patients", icon: Users },
    { id: "appointments", name: "Appointments", icon: Calendar },
    { id: "records", name: "Medical Records", icon: FileText },
    { id: "inventory", name: "Inventory", icon: Package },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case "patients":
        return <PatientManagement />
      case "appointments":
        return <AppointmentManagement />
      case "records":
        return <MedicalRecords />
      case "inventory":
        return <InventoryManagement />
      default:
        return <DashboardStats />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
          <h1 className="text-lg font-serif font-bold text-sidebar-foreground">Clinic System</h1>
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    setActiveSection(item.id as ActiveSection)
                    setSidebarOpen(false)
                  }}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Button>
              )
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium text-sidebar-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sidebar-foreground/70 capitalize">{user.role}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <h2 className="text-xl font-serif font-semibold text-foreground capitalize">
                {activeSection === "dashboard" ? "Dashboard" : navigation.find((n) => n.id === activeSection)?.name}
              </h2>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{renderContent()}</div>
        </main>
      </div>
    </div>
  )
}
