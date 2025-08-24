"use client"

import { createFileRoute, redirect } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, AlertTriangle, Calendar, Pill } from "lucide-react"

interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  minStock: number
  maxStock: number
  unitPrice: number
  supplier: string
  batchNumber: string
  expiryDate: string
  location: string
  createdAt: string
}

function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({})

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setIsLoading(true)
      // Mock data - replace with actual API call
      const mockInventory: InventoryItem[] = [
        {
          id: "1",
          name: "Paracetamol 500mg",
          category: "Pain Relief",
          quantity: 150,
          minStock: 50,
          maxStock: 500,
          unitPrice: 0.25,
          supplier: "PharmaCorp",
          batchNumber: "PC2024001",
          expiryDate: "2025-12-31",
          location: "Shelf A1",
          createdAt: "2024-01-15",
        },
        {
          id: "2",
          name: "Amoxicillin 250mg",
          category: "Antibiotics",
          quantity: 25,
          minStock: 30,
          maxStock: 200,
          unitPrice: 1.5,
          supplier: "MediSupply",
          batchNumber: "MS2024002",
          expiryDate: "2024-06-30",
          location: "Shelf B2",
          createdAt: "2024-02-10",
        },
        {
          id: "3",
          name: "Insulin Pen",
          category: "Diabetes",
          quantity: 8,
          minStock: 10,
          maxStock: 50,
          unitPrice: 45.0,
          supplier: "DiabetesCare",
          batchNumber: "DC2024003",
          expiryDate: "2024-04-15",
          location: "Refrigerator R1",
          createdAt: "2024-03-01",
        },
      ]
      setInventory(mockInventory)
    } catch (error) {
      console.error("Failed to fetch inventory:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= item.minStock) return { status: "Low Stock", color: "bg-red-100 text-red-800" }
    if (item.quantity >= item.maxStock) return { status: "Overstock", color: "bg-yellow-100 text-yellow-800" }
    return { status: "In Stock", color: "bg-green-100 text-green-800" }
  }

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 90 // Expiring within 90 days
  }

  const handleAddItem = async () => {
    try {
      const item: InventoryItem = {
        ...newItem,
        id: Date.now().toString(),
        createdAt: new Date().toISOString().split("T")[0],
      } as InventoryItem

      setInventory([...inventory, item])
      setNewItem({})
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Failed to add inventory item:", error)
    }
  }

  const lowStockItems = inventory.filter((item) => item.quantity <= item.minStock)
  const expiringItems = inventory.filter((item) => isExpiringSoon(item.expiryDate))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
              <DialogDescription>Add a new medication or supply to inventory.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={newItem.name || ""}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pain Relief">Pain Relief</SelectItem>
                    <SelectItem value="Antibiotics">Antibiotics</SelectItem>
                    <SelectItem value="Diabetes">Diabetes</SelectItem>
                    <SelectItem value="Cardiovascular">Cardiovascular</SelectItem>
                    <SelectItem value="Supplies">Medical Supplies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Current Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newItem.quantity || ""}
                  onChange={(e) => setNewItem({ ...newItem, quantity: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Minimum Stock</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={newItem.minStock || ""}
                  onChange={(e) => setNewItem({ ...newItem, minStock: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price ($)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  value={newItem.unitPrice || ""}
                  onChange={(e) => setNewItem({ ...newItem, unitPrice: Number.parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={newItem.supplier || ""}
                  onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batchNumber">Batch Number</Label>
                <Input
                  id="batchNumber"
                  value={newItem.batchNumber || ""}
                  onChange={(e) => setNewItem({ ...newItem, batchNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={newItem.expiryDate || ""}
                  onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem}>Add Item</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {(lowStockItems.length > 0 || expiringItems.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowStockItems.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-800 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Low Stock Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="text-red-600">{item.quantity} left</span>
                    </div>
                  ))}
                  {lowStockItems.length > 3 && (
                    <p className="text-xs text-gray-500">+{lowStockItems.length - 3} more items</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {expiringItems.length > 0 && (
            <Card className="border-yellow-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-yellow-800 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Expiring Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiringItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="text-yellow-600">{item.expiryDate}</span>
                    </div>
                  ))}
                  {expiringItems.length > 3 && (
                    <p className="text-xs text-gray-500">+{expiringItems.length - 3} more items</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search inventory by name, category, or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>Manage medications and medical supplies</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => {
                  const stockStatus = getStockStatus(item)
                  const expiringSoon = isExpiringSoon(item.expiryDate)

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Pill className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-500">Batch: {item.batchNumber}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{item.quantity} units</div>
                          <div className="text-gray-500">Min: {item.minStock}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={stockStatus.color}>{stockStatus.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center text-sm ${expiringSoon ? "text-yellow-600" : ""}`}>
                          <Calendar className="h-3 w-3 mr-1" />
                          {item.expiryDate}
                          {expiringSoon && <AlertTriangle className="h-3 w-3 ml-1" />}
                        </div>
                      </TableCell>
                      <TableCell>{item.supplier}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">${(item.quantity * item.unitPrice).toFixed(2)}</div>
                          <div className="text-gray-500">${item.unitPrice}/unit</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute("/inventory")({
  component: InventoryPage,
  beforeLoad: ({ context }) => {
    const token = localStorage.getItem("clinic_token")
    if (!token) {
      throw redirect({
        to: "/login",
      })
    }
  },
})
