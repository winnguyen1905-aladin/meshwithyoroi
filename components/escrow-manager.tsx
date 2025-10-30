"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { EscrowContract } from "@/lib/cardano-types"

interface EscrowManagerProps {
  escrows: EscrowContract[]
  onCreateEscrow: (data: {
    recipient: string
    amount: string
    releaseCondition: string
  }) => Promise<void>
  onReleaseEscrow: (id: string) => Promise<void>
  loading: boolean
}

export function EscrowManager({ escrows, onCreateEscrow, onReleaseEscrow, loading }: EscrowManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [condition, setCondition] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!recipient.trim() || !amount || !condition.trim()) {
      setError("All fields are required")
      return
    }

    try {
      await onCreateEscrow({ recipient, amount, releaseCondition: condition })
      setRecipient("")
      setAmount("")
      setCondition("")
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create escrow")
    }
  }

  const activeEscrows = escrows.filter((e) => e.status === "active")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Escrow Contracts</h3>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "default"}>
          {showForm ? "Cancel" : "Create Escrow"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Recipient Address</label>
              <Input
                type="text"
                placeholder="Enter recipient address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Amount (ADA)</label>
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Release Condition</label>
              <Input
                type="text"
                placeholder="e.g., Service completion, Delivery confirmation"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Escrow"}
            </Button>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {activeEscrows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active escrow contracts</p>
        ) : (
          activeEscrows.map((escrow) => (
            <Card key={escrow.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium">{escrow.amount} ADA</p>
                  <p className="text-sm text-muted-foreground">To: {escrow.recipient.slice(0, 20)}...</p>
                  <p className="text-sm text-muted-foreground mt-1">Condition: {escrow.releaseCondition}</p>
                </div>
                <Button size="sm" onClick={() => onReleaseEscrow(escrow.id)} disabled={loading}>
                  Release
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
