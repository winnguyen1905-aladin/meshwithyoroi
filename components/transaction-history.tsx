"use client"

import type { Transaction } from "@/lib/cardano-types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TransactionHistoryProps {
  transactions: Transaction[]
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }
  }

  const getTypeLabel = (type: Transaction["type"]) => {
    const labels: Record<Transaction["type"], string> = {
      deposit: "💰 Deposit",
      withdrawal: "🏦 Withdrawal",
      escrow: "🔒 Escrow",
      payment: "💳 Payment",
    }
    return labels[type]
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Transaction History</h3>

      {transactions.length === 0 ? (
        <p className="text-muted-foreground text-sm">No transactions yet</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium">{getTypeLabel(tx.type)}</p>
                <p className="text-sm text-muted-foreground">{new Date(tx.timestamp).toLocaleString()}</p>
              </div>

              <div className="text-right">
                <p className="font-semibold">{tx.amount} ADA</p>
                <Badge className={getStatusColor(tx.status)}>{tx.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
