"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { ArrowLeft, Edit, User, Phone, Mail, MapPin, AlertTriangle, Heart } from "lucide-react"

interface Patient {
  id: number
  patientId: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  phone?: string
  email?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  bloodType?: string
  allergies?: string
  medicalHistory?: string
  isActive: boolean
  createdAt: string
}

interface PatientDetailProps {
  patient: Patient
  onBack: () => void
  onEdit: (patient: Patient) => void
}

export function PatientDetail({ patient, onBack, onEdit }: PatientDetailProps) {
  const [appointments, setAppointments] = useState([])
  const [medicalRecords, setMedicalRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPatientData()
  }, [patient.id])

  const loadPatientData = async () => {
    try {
      setLoading(true)
      const [appointmentsData, recordsData] = await Promise.all([
        api.getAppointments({ patientId: patient.id }),
        api.getMedicalRecords({ patientId: patient.id }),
      ])
      setAppointments(appointmentsData)
      setMedicalRecords(recordsData)
    } catch (error) {
      console.error("Failed to load patient data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Button>
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-muted-foreground">Patient ID: {patient.patientId}</p>
          </div>
        </div>
        <Button onClick={() => onEdit(patient)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Patient
        </Button>
      </div>

      {/* Patient Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Basic Information</CardTitle>
            <User className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Age:</span>
                <span className="text-sm font-medium">{calculateAge(patient.dateOfBirth)} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Gender:</span>
                <Badge variant="outline" className="text-xs">
                  {patient.gender}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">DOB:</span>
                <span className="text-sm font-medium">{new Date(patient.dateOfBirth).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
            <Phone className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {patient.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{patient.email}</span>
                </div>
              )}
              {patient.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{patient.address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medical Info</CardTitle>
            <Heart className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {patient.bloodType && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Blood Type:</span>
                  <Badge variant="secondary" className="text-xs">
                    {patient.bloodType}
                  </Badge>
                </div>
              )}
              {patient.allergies && (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 text-destructive mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Allergies:</p>
                    <p className="text-sm">{patient.allergies}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="records">Medical Records</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Emergency Contact */}
            {(patient.emergencyContact || patient.emergencyPhone) && (
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {patient.emergencyContact && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Name:</span>
                      <span className="text-sm font-medium">{patient.emergencyContact}</span>
                    </div>
                  )}
                  {patient.emergencyPhone && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Phone:</span>
                      <span className="text-sm font-medium">{patient.emergencyPhone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Medical History */}
            {patient.medicalHistory && (
              <Card>
                <CardHeader>
                  <CardTitle>Medical History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{patient.medicalHistory}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>Recent Appointments</CardTitle>
              <CardDescription>Patient appointment history</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : appointments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No appointments found for this patient.</p>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment: any) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{appointment.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                        </p>
                      </div>
                      <Badge variant={appointment.status === "completed" ? "default" : "secondary"}>
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records">
          <Card>
            <CardHeader>
              <CardTitle>Medical Records</CardTitle>
              <CardDescription>Patient medical history and records</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : medicalRecords.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No medical records found for this patient.</p>
              ) : (
                <div className="space-y-4">
                  {medicalRecords.map((record: any) => (
                    <div key={record.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{record.chiefComplaint || "General Visit"}</h4>
                        <span className="text-sm text-muted-foreground">
                          {new Date(record.visitDate).toLocaleDateString()}
                        </span>
                      </div>
                      {record.diagnosis && (
                        <p className="text-sm mb-2">
                          <strong>Diagnosis:</strong> {record.diagnosis}
                        </p>
                      )}
                      {record.treatment && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Treatment:</strong> {record.treatment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
