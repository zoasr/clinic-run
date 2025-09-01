export interface User {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  role: "admin" | "doctor" | "nurse" | "receptionist"
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Patient {
  id: number
  patientId: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: "male" | "female" | "other"
  phone: string
  email: string
  address: string
  emergencyContact: string
  emergencyPhone: string
  bloodType: string
  allergies: string
  medicalHistory: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Appointment {
  id: number
  patientId: number
  doctorId: number
  appointmentDate: Date
  appointmentTime: string
  duration: number
  type: "consultation" | "follow-up" | "emergency" | "routine"
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show"
  notes: string
  createdAt: Date
  updatedAt: Date
  patient?: {
    id: number
    firstName: string
    lastName: string
    patientId: string
  }
  doctor?: {
    id: number
    firstName: string
    lastName: string
  }
}

export interface MedicalRecord {
  id: number
  patientId: number
  doctorId: number
  visitDate: Date
  chiefComplaint: string
  diagnosis: string
  treatment: string
  prescription: string
  notes: string
  vitalSigns: {
    temperature: number
    bloodPressure: string
    heartRate: number
    respiratoryRate: number
    oxygenSaturation: number
    weight: number
    height: number
  }
  createdAt: Date
  updatedAt: Date
  patient?: {
    id: number
    firstName: string
    lastName: string
    patientId: string
  }
  doctor?: {
    id: number
    firstName: string
    lastName: string
  }
}

export interface Medication {
  id: number
  name: string
  genericName: string
  dosage: string
  form: "tablet" | "capsule" | "liquid" | "injection" | "cream" | "other"
  manufacturer: string
  batchNumber: string
  expiryDate: Date | null
  quantity: number
  minStockLevel: number
  unitPrice: number
  supplier: string
  description: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DashboardStats {
  totalPatients: number
  todayAppointments: number
  pendingAppointments: number
  lowStockMedications: number
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
