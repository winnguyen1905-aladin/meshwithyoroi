"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface TransactionBuilderProps {
  onSubmit: (data: {
    recipient: string
    amount: string
    type: "deposit" | "payment"
  }) => Promise<void>
  loading: boolean
}

export function TransactionBuilder({ onSubmit, loading }: TransactionBuilderProps) {
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState<"deposit" | "payment">("payment")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!recipient.trim()) {
      setError("Recipient address is required")
      return
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Amount must be greater than 0")
      return
    }

    try {
      await onSubmit({ recipient, amount, type })
      setRecipient("")
      setAmount("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed")
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Build Transaction</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Transaction Type</label>
          <div className="flex gap-4">
            {(["deposit", "payment"] as const).map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value={t}
                  checked={type === t}
                  onChange={(e) => setType(e.target.value as typeof t)}
                  className="w-4 h-4"
                />
                <span className="capitalize">{t}</span>
              </label>
            ))}
          </div>
        </div>

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

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-3">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Processing..." : "Build Transaction"}
        </Button>
      </form>
    </Card>
  )
}
