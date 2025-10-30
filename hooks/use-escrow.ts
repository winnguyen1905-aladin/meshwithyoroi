"use client"

import { useState, useCallback } from "react"
import type { EscrowContract } from "@/lib/cardano-types"

export const useEscrow = () => {
  const [escrows, setEscrows] = useState<EscrowContract[]>([])
  const [loading, setLoading] = useState(false)

  const createEscrow = useCallback((escrow: EscrowContract) => {
    setEscrows((prev) => [escrow, ...prev])
    const stored = localStorage.getItem("cardano_escrows")
    const list = stored ? JSON.parse(stored) : []
    localStorage.setItem("cardano_escrows", JSON.stringify([escrow, ...list]))
  }, [])

  const updateEscrow = useCallback((id: string, updates: Partial<EscrowContract>) => {
    setEscrows((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)))

    const stored = localStorage.getItem("cardano_escrows")
    const list = stored ? JSON.parse(stored) : []
    const updated = list.map((e: EscrowContract) => (e.id === id ? { ...e, ...updates } : e))
    localStorage.setItem("cardano_escrows", JSON.stringify(updated))
  }, [])

  const loadEscrows = useCallback(() => {
    setLoading(true)
    try {
      const stored = localStorage.getItem("cardano_escrows")
      if (stored) {
        setEscrows(JSON.parse(stored))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const getActiveEscrows = useCallback(() => {
    return escrows.filter((e) => e.status === "active")
  }, [escrows])

  const releaseEscrow = useCallback(
    (id: string) => {
      updateEscrow(id, { status: "released" })
    },
    [updateEscrow],
  )

  return {
    escrows,
    loading,
    createEscrow,
    updateEscrow,
    loadEscrows,
    getActiveEscrows,
    releaseEscrow,
  }
}
