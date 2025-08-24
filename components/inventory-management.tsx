"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MedicationForm } from "@/components/medication-form"
import { StockAdjustmentForm } from "@/components/stock-adjustment-form"
import { api } from "@/lib/api"
import { Search, Plus, Package, AlertTriangle, Calendar, Pill } from "lucide-react"

interface Medication {
  id: number
  name: string
  genericName?: string
  dosage?: string
  form?: string
  manufacturer?: string
  batchNumber?: string
  expiryDate?: string
  quantity: number
  minStockLevel: number
  unitPrice: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function InventoryManagement() {
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [stockFilter, setStockFilter] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [showStockAdjustment, setShowStockAdjustment] = useState(false)
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)
  const [activeTab, setActiveTab] = useState("inventory")

  useEffect(() => {
    loadMedications()
  }, [stockFilter])

  const loadMedications = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (searchTerm) params.search = searchTerm
      if (stockFilter === "low") params.lowStock = true

      const data = await api.getMedications(params)
      setMedications(data)
    } catch (error) {
      console.error("Failed to load medications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMedicationSaved = () => {
    setShowForm(false)
    setEditingMedication(null)
    loadMedications()
  }

  const handleStockAdjustmentSaved = () => {
    setShowStockAdjustment(false)
    setSelectedMedication(null)
    loadMedications()
  }

  const getStockStatus = (medication: Medication) => {
    if (medication.quantity === 0) return { status: "out-of-stock", color: "bg-red-100 text-red-800" }
    if (medication.quantity <= medication.minStockLevel)
      return { status: "low-stock", color: "bg-yellow-100 text-yellow-800" }
    return { status: "in-stock", color: "bg-green-100 text-green-800" }
  }

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null

    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) return { status: "expired", color: "bg-red-100 text-red-800" }
    if (daysUntilExpiry <= 30) return { status: "expiring-soon", color: "bg-orange-100 text-orange-800" }
    return { status: "valid", color: "bg-green-100 text-green-800" }
  }

  const filteredMedications = medications.filter((medication) => {
    const matchesSearch =
      searchTerm === "" ||
      medication.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medication.genericName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medication.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStockFilter =
      stockFilter === "all" ||
      (stockFilter === "low" && medication.quantity <= medication.minStockLevel) ||
      (stockFilter === "out" && medication.quantity === 0)

    return matchesSearch && matchesStockFilter
  })

  const lowStockCount = medications.filter((med) => med.quantity <= med.minStockLevel && med.quantity > 0).length
  const outOfStockCount = medications.filter((med) => med.quantity === 0).length
  const expiringCount = medications.filter((med) => {
    if (!med.expiryDate) return false
    const expiry = new Date(med.expiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
  }).length

  if (showForm) {
    return (
      <MedicationForm
        medication={editingMedication}
        onSave={handleMedicationSaved}
        onCancel={() => {
          setShowForm(false)
          setEditingMedication(null)
        }}
      />
    )
  }

  if (showStockAdjustment && selectedMedication) {
    return (
      <StockAdjustmentForm
        medication={selectedMedication}
        onSave={handleStockAdjustmentSaved}
        onCancel={() => {
          setShowStockAdjustment(false)
          setSelectedMedication(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground">Manage medications and medical supplies</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Medication
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{medications.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
              </div>
              <Package className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">{expiringCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search medications by name, generic name, or manufacturer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadMedications}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inventory">Inventory List</TabsTrigger>
          <TabsTrigger value="alerts">Stock Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          {/* Medication List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredMedications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No medications found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || stockFilter !== "all"
                    ? "No medications match your search criteria."
                    : "Get started by adding your first medication."}
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medication
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredMedications.map((medication) => {
                const stockStatus = getStockStatus(medication)
                const expiryStatus = getExpiryStatus(medication.expiryDate)

                return (
                  <Card key={medication.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                              <Pill className="h-5 w-5 text-secondary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{medication.name}</h3>
                              {medication.genericName && (
                                <p className="text-sm text-muted-foreground">Generic: {medication.genericName}</p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Dosage & Form</span>
                              <span className="text-sm font-medium">
                                {medication.dosage} {medication.form}
                              </span>
                            </div>

                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Stock Level</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{medication.quantity}</span>
                                <Badge className={stockStatus.color}>{stockStatus.status}</Badge>
                              </div>
                            </div>

                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Unit Price</span>
                              <span className="text-sm font-medium">${medication.unitPrice.toFixed(2)}</span>
                            </div>

                            {medication.expiryDate && (
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Expiry Date</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {new Date(medication.expiryDate).toLocaleDateString()}
                                  </span>
                                  {expiryStatus && <Badge className={expiryStatus.color}>{expiryStatus.status}</Badge>}
                                </div>
                              </div>
                            )}
                          </div>

                          {medication.manufacturer && (
                            <div className="mb-3">
                              <span className="text-xs text-muted-foreground">Manufacturer: </span>
                              <span className="text-sm">{medication.manufacturer}</span>
                            </div>
                          )}

                          {medication.batchNumber && (
                            <div className="mb-3">
                              <span className="text-xs text-muted-foreground">Batch: </span>
                              <span className="text-sm">{medication.batchNumber}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Min Stock Level: {medication.minStockLevel}</span>
                            <span>•</span>
                            <span>Added: {new Date(medication.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingMedication(medication)
                              setShowForm(true)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMedication(medication)
                              setShowStockAdjustment(true)
                            }}
                          >
                            Adjust Stock
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4">
            {/* Low Stock Alerts */}
            {lowStockCount > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="h-6 w-6 text-yellow-500" />
                    <div>
                      <h3 className="font-semibold text-foreground">Low Stock Alert</h3>
                      <p className="text-sm text-muted-foreground">{lowStockCount} items need restocking</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {medications
                      .filter((med) => med.quantity <= med.minStockLevel && med.quantity > 0)
                      .map((medication) => (
                        <div
                          key={medication.id}
                          className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{medication.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Current: {medication.quantity} | Min: {medication.minStockLevel}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedMedication(medication)
                              setShowStockAdjustment(true)
                            }}
                          >
                            Restock
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Out of Stock Alerts */}
            {outOfStockCount > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Package className="h-6 w-6 text-red-500" />
                    <div>
                      <h3 className="font-semibold text-foreground">Out of Stock</h3>
                      <p className="text-sm text-muted-foreground">{outOfStockCount} items are out of stock</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {medications
                      .filter((med) => med.quantity === 0)
                      .map((medication) => (
                        <div key={medication.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-medium">{medication.name}</p>
                            <p className="text-sm text-muted-foreground">Stock depleted</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedMedication(medication)
                              setShowStockAdjustment(true)
                            }}
                          >
                            Restock
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Expiring Soon Alerts */}
            {expiringCount > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="h-6 w-6 text-orange-500" />
                    <div>
                      <h3 className="font-semibold text-foreground">Expiring Soon</h3>
                      <p className="text-sm text-muted-foreground">{expiringCount} items expire within 30 days</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {medications
                      .filter((med) => {
                        if (!med.expiryDate) return false
                        const expiry = new Date(med.expiryDate)
                        const today = new Date()
                        const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
                      })
                      .map((medication) => {
                        const expiry = new Date(medication.expiryDate!)
                        const today = new Date()
                        const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                        return (
                          <div
                            key={medication.id}
                            className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{medication.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Expires in {daysUntilExpiry} days ({expiry.toLocaleDateString()})
                              </p>
                            </div>
                            <Badge variant="outline" className="text-orange-700">
                              {daysUntilExpiry} days
                            </Badge>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            )}

            {lowStockCount === 0 && outOfStockCount === 0 && expiringCount === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Package className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">All Good!</h3>
                  <p className="text-muted-foreground text-center">
                    No stock alerts at this time. All medications are adequately stocked.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
