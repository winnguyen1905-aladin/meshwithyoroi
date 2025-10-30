"use client"

import { useState, useCallback } from "react"
import type { Transaction } from "@/lib/cardano-types"

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  const addTransaction = useCallback((tx: Transaction) => {
    setTransactions((prev) => [tx, ...prev])
    // Persist to localStorage
    const stored = localStorage.getItem("cardano_transactions")
    const txList = stored ? JSON.parse(stored) : []
    localStorage.setItem("cardano_transactions", JSON.stringify([tx, ...txList]))
  }, [])

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx)))

    const stored = localStorage.getItem("cardano_transactions")
    const txList = stored ? JSON.parse(stored) : []
    const updated = txList.map((tx: Transaction) => (tx.id === id ? { ...tx, ...updates } : tx))
    localStorage.setItem("cardano_transactions", JSON.stringify(updated))
  }, [])

  const loadTransactions = useCallback(() => {
    setLoading(true)
    try {
      const stored = localStorage.getItem("cardano_transactions")
      if (stored) {
        setTransactions(JSON.parse(stored))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const getTransactionsByType = useCallback(
    (type: Transaction["type"]) => {
      return transactions.filter((tx) => tx.type === type)
    },
    [transactions],
  )

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    loadTransactions,
    getTransactionsByType,
  }
}
