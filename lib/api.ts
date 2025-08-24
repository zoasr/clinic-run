const API_BASE_URL = "http://localhost:3001/api"

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies for session management
      ...options,
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Network error" }))
      throw new Error(error.error || "Request failed")
    }

    return response.json()
  }

  // Auth methods
  async signIn(email: string, password: string) {
    return this.request("/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async signUp(
    email: string,
    password: string,
    name: string,
    username: string,
    firstName: string,
    lastName: string,
    role = "staff",
  ) {
    return this.request("/auth/sign-up/email", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        name,
        username,
        firstName,
        lastName,
        role,
      }),
    })
  }

  async signOut() {
    return this.request("/auth/sign-out", {
      method: "POST",
    })
  }

  async getSession() {
    return this.request("/auth/get-session")
  }

  // Patient methods
  async getPatients(params?: { search?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append("search", params.search)
    if (params?.page) searchParams.append("page", params.page.toString())
    if (params?.limit) searchParams.append("limit", params.limit.toString())

    return this.request(`/patients?${searchParams}`)
  }

  async getPatient(id: number) {
    return this.request(`/patients/${id}`)
  }

  async createPatient(patient: any) {
    return this.request("/patients", {
      method: "POST",
      body: JSON.stringify(patient),
    })
  }

  async updatePatient(id: number, patient: any) {
    return this.request(`/patients/${id}`, {
      method: "PUT",
      body: JSON.stringify(patient),
    })
  }

  // Appointment methods
  async getAppointments(params?: { date?: string; status?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.date) searchParams.append("date", params.date)
    if (params?.status) searchParams.append("status", params.status)
    if (params?.page) searchParams.append("page", params.page.toString())
    if (params?.limit) searchParams.append("limit", params.limit.toString())

    return this.request(`/appointments?${searchParams}`)
  }

  async createAppointment(appointment: any) {
    return this.request("/appointments", {
      method: "POST",
      body: JSON.stringify(appointment),
    })
  }

  async updateAppointment(id: number, appointment: any) {
    return this.request(`/appointments/${id}`, {
      method: "PUT",
      body: JSON.stringify(appointment),
    })
  }

  // Medical records methods
  async getMedicalRecords(params?: { patientId?: number; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.patientId) searchParams.append("patientId", params.patientId.toString())
    if (params?.page) searchParams.append("page", params.page.toString())
    if (params?.limit) searchParams.append("limit", params.limit.toString())

    return this.request(`/medical-records?${searchParams}`)
  }

  async createMedicalRecord(record: any) {
    return this.request("/medical-records", {
      method: "POST",
      body: JSON.stringify(record),
    })
  }

  async updateMedicalRecord(id: number, record: any) {
    return this.request(`/medical-records/${id}`, {
      method: "PUT",
      body: JSON.stringify(record),
    })
  }

  // Medication methods
  async getMedications(params?: { search?: string; lowStock?: boolean; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append("search", params.search)
    if (params?.lowStock) searchParams.append("lowStock", "true")
    if (params?.page) searchParams.append("page", params.page.toString())
    if (params?.limit) searchParams.append("limit", params.limit.toString())

    return this.request(`/medications?${searchParams}`)
  }

  async createMedication(medication: any) {
    return this.request("/medications", {
      method: "POST",
      body: JSON.stringify(medication),
    })
  }

  async updateMedication(id: number, medication: any) {
    return this.request(`/medications/${id}`, {
      method: "PUT",
      body: JSON.stringify(medication),
    })
  }

  // Dashboard methods
  async getDashboardStats() {
    return this.request("/dashboard/stats")
  }

  // Users methods
  async getUsers() {
    return this.request("/users")
  }

  async createUser(user: any) {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(user),
    })
  }
}

export const api = new ApiClient()
