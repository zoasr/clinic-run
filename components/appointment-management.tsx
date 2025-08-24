"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppointmentForm } from "@/components/appointment-form"
import { AppointmentCalendar } from "@/components/appointment-calendar"
import { api } from "@/lib/api"
import { Search, Plus, Calendar, Clock, User } from "lucide-react"

interface Appointment {
  id: number
  appointmentDate: string
  appointmentTime: string
  duration: number
  type: string
  status: string
  notes?: string
  patient: {
    id: number
    firstName: string
    lastName: string
    patientId: string
  }
  doctor: {
    id: number
    firstName: string
    lastName: string
  }
}

export function AppointmentManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [activeView, setActiveView] = useState<"list" | "calendar">("list")

  useEffect(() => {
    loadAppointments()
  }, [statusFilter, dateFilter])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (statusFilter !== "all") params.status = statusFilter
      if (dateFilter) params.date = dateFilter

      const data = await api.getAppointments(params)
      setAppointments(data)
    } catch (error) {
      console.error("Failed to load appointments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAppointmentSaved = () => {
    setShowForm(false)
    setEditingAppointment(null)
    loadAppointments()
  }

  const handleStatusUpdate = async (appointmentId: number, newStatus: string) => {
    try {
      await api.updateAppointment(appointmentId, { status: newStatus })
      loadAppointments()
    } catch (error) {
      console.error("Failed to update appointment status:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "no-show":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "consultation":
        return "bg-purple-100 text-purple-800"
      case "checkup":
        return "bg-green-100 text-green-800"
      case "follow-up":
        return "bg-blue-100 text-blue-800"
      case "emergency":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      searchTerm === "" ||
      `${appointment.patient.firstName} ${appointment.patient.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      appointment.patient.patientId.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  if (showForm) {
    return (
      <AppointmentForm
        appointment={editingAppointment}
        onSave={handleAppointmentSaved}
        onCancel={() => {
          setShowForm(false)
          setEditingAppointment(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Appointment Management</h1>
          <p className="text-muted-foreground">Manage patient appointments and scheduling</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Schedule Appointment
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by patient name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no-show">No Show</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "list" | "calendar")}>
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Appointment List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No appointments found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || statusFilter !== "all" || dateFilter
                    ? "No appointments match your search criteria."
                    : "Get started by scheduling your first appointment."}
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAppointments.map((appointment) => (
                <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-secondary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {appointment.patient.firstName} {appointment.patient.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">ID: {appointment.patient.patientId}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {appointment.appointmentTime} ({appointment.duration} min)
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>
                              Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge className={getTypeColor(appointment.type)}>{appointment.type}</Badge>
                          </div>
                        </div>

                        {appointment.notes && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingAppointment(appointment)
                              setShowForm(true)
                            }}
                          >
                            Edit
                          </Button>

                          {appointment.status === "scheduled" && (
                            <Select
                              value={appointment.status}
                              onValueChange={(value) => handleStatusUpdate(appointment.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                <SelectItem value="no-show">No Show</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <AppointmentCalendar
            appointments={appointments}
            onAppointmentClick={(appointment) => {
              setEditingAppointment(appointment)
              setShowForm(true)
            }}
            onDateClick={() => setShowForm(true)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
