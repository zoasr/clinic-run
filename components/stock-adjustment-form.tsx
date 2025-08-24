"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"
import { ArrowLeft, Package } from "lucide-react"

interface Medication {
  id: number
  name: string
  genericName?: string
  dosage?: string
  form?: string
  quantity: number
  minStockLevel: number
  unitPrice: number
}

interface StockAdjustmentFormProps {
  medication: Medication
  onSave: () => void
  onCancel: () => void
}

export function StockAdjustmentForm({ medication, onSave, onCancel }: StockAdjustmentFormProps) {
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove" | "set">("add")
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const calculateNewQuantity = () => {
    switch (adjustmentType) {
      case "add":
        return medication.quantity + adjustmentQuantity
      case "remove":
        return Math.max(0, medication.quantity - adjustmentQuantity)
      case "set":
        return adjustmentQuantity
      default:
        return medication.quantity
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (adjustmentQuantity < 0) {
      setError("Adjustment quantity cannot be negative")
      setLoading(false)
      return
    }

    if (adjustmentType === "remove" && adjustmentQuantity > medication.quantity) {
      setError("Cannot remove more than current stock")
      setLoading(false)
      return
    }

    try {
      const newQuantity = calculateNewQuantity()
      await api.updateMedication(medication.id, {
        ...medication,
        quantity: newQuantity,
      })
      onSave()
    } catch (err: any) {
      setError(err.message || "Failed to adjust stock")
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-2xl font-serif font-bold text-foreground">Stock Adjustment</h1>
          <p className="text-muted-foreground">Adjust inventory levels for {medication.name}</p>
        </div>
      </div>

      {/* Current Stock Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Current Stock Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <p className="text-2xl font-bold">{medication.quantity}</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Minimum Level</p>
              <p className="text-2xl font-bold">{medication.minStockLevel}</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Unit Price</p>
              <p className="text-2xl font-bold">${medication.unitPrice.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Adjustment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Adjustment Details</CardTitle>
            <CardDescription>Specify the type and amount of stock adjustment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adjustmentType">Adjustment Type *</Label>
              <Select
                value={adjustmentType}
                onValueChange={(value: "add" | "remove" | "set") => setAdjustmentType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Stock (Restock)</SelectItem>
                  <SelectItem value="remove">Remove Stock (Usage/Damage)</SelectItem>
                  <SelectItem value="set">Set Exact Quantity (Inventory Count)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustmentQuantity">
                {adjustmentType === "set" ? "New Quantity *" : "Adjustment Quantity *"}
              </Label>
              <Input
                id="adjustmentQuantity"
                type="number"
                min="0"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(Number.parseInt(e.target.value) || 0)}
                required
                placeholder={adjustmentType === "set" ? "Enter new total quantity" : "Enter quantity to adjust"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Adjustment</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., New stock delivery, expired items removed, inventory correction..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Adjustment Preview</CardTitle>
            <CardDescription>Review the changes before applying</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Current Quantity</p>
                <p className="text-xl font-bold">{medication.quantity}</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Adjustment</p>
                <p className="text-xl font-bold">
                  {adjustmentType === "add" && "+"}
                  {adjustmentType === "remove" && "-"}
                  {adjustmentType === "set" && "→ "}
                  {adjustmentQuantity}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground">New Quantity</p>
                <p className="text-xl font-bold">{calculateNewQuantity()}</p>
              </div>
            </div>

            {calculateNewQuantity() <= medication.minStockLevel && (
              <Alert className="mt-4">
                <AlertDescription>
                  Warning: The new quantity ({calculateNewQuantity()}) is at or below the minimum stock level (
                  {medication.minStockLevel}).
                </AlertDescription>
              </Alert>
            )}
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
          <Button type="submit" disabled={loading || adjustmentQuantity === 0}>
            {loading ? "Applying..." : "Apply Adjustment"}
          </Button>
        </div>
      </form>
    </div>
  )
}
