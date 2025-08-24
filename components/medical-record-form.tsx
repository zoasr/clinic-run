"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"
import { ArrowLeft, Search, User } from "lucide-react"

interface Patient {
  id: number
  patientId: string
  firstName: string
  lastName: string
  phone?: string
  email?: string
}

interface Doctor {
  id: number
  firstName: string
  lastName: string
  role: string
}

interface VitalSigns {
  bloodPressure?: string
  temperature?: string
  pulse?: string
  respiratoryRate?: string
  weight?: string
  height?: string
  oxygenSaturation?: string
}

interface MedicalRecord {
  id?: number
  patientId: number
  doctorId: number
  appointmentId?: number
  visitDate: string
  chiefComplaint?: string
  diagnosis?: string
  treatment?: string
  prescription?: string
  notes?: string
  vitalSigns?: string
}

interface MedicalRecordFormProps {
  record?: MedicalRecord | null
  onSave: () => void
  onCancel: () => void
}

export function MedicalRecordForm({ record, onSave, onCancel }: MedicalRecordFormProps) {
  const [formData, setFormData] = useState<MedicalRecord>({
    patientId: 0,
    doctorId: 0,
    visitDate: new Date().toISOString().split("T")[0],
    chiefComplaint: "",
    diagnosis: "",
    treatment: "",
    prescription: "",
    notes: "",
    vitalSigns: "",
  })
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({})
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patientSearch, setPatientSearch] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadDoctors()
    loadPatients()
  }, [])

  useEffect(() => {
    if (record) {
      setFormData(record)
      // Find and set the selected patient
      const patient = patients.find((p) => p.id === record.patientId)
      if (patient) {
        setSelectedPatient(patient)
      }
      // Parse vital signs
      if (record.vitalSigns) {
        try {
          setVitalSigns(JSON.parse(record.vitalSigns))
        } catch {
          setVitalSigns({})
        }
      }
    }
  }, [record, patients])

  const loadPatients = async () => {
    try {
      const data = await api.getPatients({ search: patientSearch || undefined })
      setPatients(data)
    } catch (error) {
      console.error("Failed to load patients:", error)
    }
  }

  const loadDoctors = async () => {
    try {
      const data = await api.getUsers()
      setDoctors(data.filter((user: any) => user.role === "doctor" || user.role === "admin"))
    } catch (error) {
      console.error("Failed to load doctors:", error)
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadPatients()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [patientSearch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!selectedPatient) {
      setError("Please select a patient")
      setLoading(false)
      return
    }

    try {
      const recordData = {
        ...formData,
        patientId: selectedPatient.id,
        vitalSigns: Object.keys(vitalSigns).length > 0 ? JSON.stringify(vitalSigns) : "",
      }

      if (record?.id) {
        await api.updateMedicalRecord(record.id, recordData)
      } else {
        await api.createMedicalRecord(recordData)
      }
      onSave()
    } catch (err: any) {
      setError(err.message || "Failed to save medical record")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof MedicalRecord, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleVitalSignChange = (field: keyof VitalSigns, value: string) => {
    setVitalSigns((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">
            {record ? "Edit Medical Record" : "Add New Medical Record"}
          </h1>
          <p className="text-muted-foreground">
            {record ? "Update medical record details" : "Create a new patient medical record"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
            <CardDescription>Select the patient for this medical record</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPatient ? (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">ID: {selectedPatient.patientId}</p>
                    {selectedPatient.phone && <p className="text-sm text-muted-foreground">{selectedPatient.phone}</p>}
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedPatient(null)}>
                  Change Patient
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search patients by name or ID..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {patients.length > 0 && (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {patients.map((patient) => (
                      <div
                        key={patient.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedPatient(patient)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-secondary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {patient.firstName} {patient.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">ID: {patient.patientId}</p>
                          </div>
                        </div>
                        <Button type="button" variant="outline" size="sm">
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visit Information */}
        <Card>
          <CardHeader>
            <CardTitle>Visit Information</CardTitle>
            <CardDescription>Basic visit details and attending physician</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visitDate">Visit Date *</Label>
                <Input
                  id="visitDate"
                  type="date"
                  value={formData.visitDate}
                  onChange={(e) => handleChange("visitDate", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctorId">Attending Doctor *</Label>
                <Select
                  value={formData.doctorId.toString()}
                  onValueChange={(value) => handleChange("doctorId", Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        Dr. {doctor.firstName} {doctor.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vital Signs */}
        <Card>
          <CardHeader>
            <CardTitle>Vital Signs</CardTitle>
            <CardDescription>Record patient vital signs and measurements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bloodPressure">Blood Pressure</Label>
                <Input
                  id="bloodPressure"
                  placeholder="120/80"
                  value={vitalSigns.bloodPressure || ""}
                  onChange={(e) => handleVitalSignChange("bloodPressure", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°F)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  placeholder="98.6"
                  value={vitalSigns.temperature || ""}
                  onChange={(e) => handleVitalSignChange("temperature", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pulse">Pulse (bpm)</Label>
                <Input
                  id="pulse"
                  type="number"
                  placeholder="72"
                  value={vitalSigns.pulse || ""}
                  onChange={(e) => handleVitalSignChange("pulse", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="respiratoryRate">Respiratory Rate</Label>
                <Input
                  id="respiratoryRate"
                  type="number"
                  placeholder="16"
                  value={vitalSigns.respiratoryRate || ""}
                  onChange={(e) => handleVitalSignChange("respiratoryRate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="150"
                  value={vitalSigns.weight || ""}
                  onChange={(e) => handleVitalSignChange("weight", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (inches)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  placeholder="68"
                  value={vitalSigns.height || ""}
                  onChange={(e) => handleVitalSignChange("height", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle>Medical Information</CardTitle>
            <CardDescription>Clinical findings, diagnosis, and treatment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chiefComplaint">Chief Complaint</Label>
              <Textarea
                id="chiefComplaint"
                value={formData.chiefComplaint}
                onChange={(e) => handleChange("chiefComplaint", e.target.value)}
                placeholder="Patient's primary concern or reason for visit..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Input
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => handleChange("diagnosis", e.target.value)}
                placeholder="Primary diagnosis..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment">Treatment Plan</Label>
              <Textarea
                id="treatment"
                value={formData.treatment}
                onChange={(e) => handleChange("treatment", e.target.value)}
                placeholder="Treatment plan and procedures performed..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prescription">Prescription</Label>
              <Textarea
                id="prescription"
                value={formData.prescription}
                onChange={(e) => handleChange("prescription", e.target.value)}
                placeholder="Medications prescribed..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Additional observations, follow-up instructions, etc..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !selectedPatient}>
            {loading ? "Saving..." : record ? "Update Record" : "Create Record"}
          </Button>
        </div>
      </form>
    </div>
  )
}
