"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MedicalRecordForm } from "@/components/medical-record-form"
import { MedicalRecordDetail } from "@/components/medical-record-detail"
import { api } from "@/lib/api"
import { Search, Plus, FileText, User, Calendar, Stethoscope } from "lucide-react"

interface MedicalRecord {
  id: number
  visitDate: string
  chiefComplaint?: string
  diagnosis?: string
  treatment?: string
  prescription?: string
  notes?: string
  vitalSigns?: string
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
  appointmentId?: number
}

interface Patient {
  id: number
  patientId: string
  firstName: string
  lastName: string
}

export function MedicalRecords() {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<string>("all")
  const [showForm, setShowForm] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null)

  useEffect(() => {
    loadRecords()
    loadPatients()
  }, [selectedPatient])

  const loadRecords = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (selectedPatient !== "all") {
        params.patientId = Number.parseInt(selectedPatient)
      }

      const data = await api.getMedicalRecords(params)
      setRecords(data)
    } catch (error) {
      console.error("Failed to load medical records:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadPatients = async () => {
    try {
      const data = await api.getPatients()
      setPatients(data)
    } catch (error) {
      console.error("Failed to load patients:", error)
    }
  }

  const handleRecordSaved = () => {
    setShowForm(false)
    setEditingRecord(null)
    loadRecords()
  }

  const parseVitalSigns = (vitalSigns?: string) => {
    if (!vitalSigns) return null
    try {
      return JSON.parse(vitalSigns)
    } catch {
      return null
    }
  }

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      searchTerm === "" ||
      `${record.patient.firstName} ${record.patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.chiefComplaint?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  if (selectedRecord) {
    return (
      <MedicalRecordDetail
        record={selectedRecord}
        onBack={() => setSelectedRecord(null)}
        onEdit={(record) => {
          setEditingRecord(record)
          setSelectedRecord(null)
          setShowForm(true)
        }}
      />
    )
  }

  if (showForm) {
    return (
      <MedicalRecordForm
        record={editingRecord}
        onSave={handleRecordSaved}
        onCancel={() => {
          setShowForm(false)
          setEditingRecord(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Medical Records</h1>
          <p className="text-muted-foreground">Patient medical history and records</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Medical Record
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by patient name, ID, diagnosis, or complaint..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Filter by patient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patients</SelectItem>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id.toString()}>
                    {patient.firstName} {patient.lastName} ({patient.patientId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Medical Records List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No medical records found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || selectedPatient !== "all"
                  ? "No records match your search criteria."
                  : "Get started by adding your first medical record."}
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Medical Record
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredRecords.map((record) => {
            const vitalSigns = parseVitalSigns(record.vitalSigns)
            return (
              <Card key={record.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1" onClick={() => setSelectedRecord(record)}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-secondary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {record.patient.firstName} {record.patient.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">ID: {record.patient.patientId}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(record.visitDate).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Stethoscope className="h-4 w-4 text-muted-foreground" />
                          <span>
                            Dr. {record.doctor.firstName} {record.doctor.lastName}
                          </span>
                        </div>

                        {vitalSigns && (
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>Vitals recorded</span>
                          </div>
                        )}
                      </div>

                      {record.chiefComplaint && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-foreground mb-1">Chief Complaint:</h4>
                          <p className="text-sm text-muted-foreground">{record.chiefComplaint}</p>
                        </div>
                      )}

                      {record.diagnosis && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-foreground mb-1">Diagnosis:</h4>
                          <Badge variant="outline" className="text-xs">
                            {record.diagnosis}
                          </Badge>
                        </div>
                      )}

                      {record.treatment && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-foreground mb-1">Treatment:</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">{record.treatment}</p>
                        </div>
                      )}

                      {vitalSigns && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <h4 className="text-sm font-medium text-foreground mb-2">Vital Signs:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            {vitalSigns.bloodPressure && (
                              <div>
                                <span className="text-muted-foreground">BP:</span> {vitalSigns.bloodPressure}
                              </div>
                            )}
                            {vitalSigns.temperature && (
                              <div>
                                <span className="text-muted-foreground">Temp:</span> {vitalSigns.temperature}°F
                              </div>
                            )}
                            {vitalSigns.pulse && (
                              <div>
                                <span className="text-muted-foreground">Pulse:</span> {vitalSigns.pulse} bpm
                              </div>
                            )}
                            {vitalSigns.weight && (
                              <div>
                                <span className="text-muted-foreground">Weight:</span> {vitalSigns.weight} lbs
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingRecord(record)
                        setShowForm(true)
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
