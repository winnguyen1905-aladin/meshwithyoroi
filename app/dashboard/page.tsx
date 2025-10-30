"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useCardanoWallet } from "@/hooks/use-cardano-wallet"
import { useTransactions } from "@/hooks/use-transactions"
import { useEscrow } from "@/hooks/use-escrow"
import { WalletSelector } from "@/components/wallet-selector"
import { WalletInfo } from "@/components/wallet-info"
import { TransactionBuilder } from "@/components/transaction-builder"
import { EscrowManager } from "@/components/escrow-manager"
import { TransactionHistory } from "@/components/transaction-history"
import { Button } from "@/components/ui/button"
import { v4 as uuidv4 } from "uuid"
import { WalletName } from "@/lib/cardano-types"

export default function DashboardPage() {
  const router = useRouter()
  const wallet = useCardanoWallet()
  const transactions = useTransactions()
  const escrow = useEscrow()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    transactions.loadTransactions()
    escrow.loadEscrows()
  }, [])

  if (!mounted) return null

  const handleBuildTransaction = async (data: {
    recipient: string
    amount: string
    type: "deposit" | "payment"
  }) => {
    const tx = {
      id: uuidv4(),
      type: data.type,
      amount: data.amount,
      recipient: data.recipient,
      status: "pending" as const,
      timestamp: Date.now(),
    }

    transactions.addTransaction(tx)

    setTimeout(() => {
      transactions.updateTransaction(tx.id, { status: "confirmed" })
    }, 3000)
  }

  const handleCreateEscrow = async (data: {
    recipient: string
    amount: string
    releaseCondition: string
  }) => {
    const escrowContract = {
      id: uuidv4(),
      sender: wallet.wallet?.address || "",
      recipient: data.recipient,
      amount: data.amount,
      releaseCondition: data.releaseCondition,
      status: "active" as const,
      createdAt: Date.now(),
    }

    escrow.createEscrow(escrowContract)
  }

  const handleReleaseEscrow = async (id: string) => {
    escrow.releaseEscrow(id)
  }

  const handleWalletConnect = async (walletName: WalletName) => {
    await wallet.connectWallet(walletName)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Manage your Cardano wallet and transactions</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/login")}>
            Back to Login
          </Button>
        </div>

        {!wallet.wallet ? (
          // Wallet Selection
          <div className="max-w-4xl mx-auto">
            <WalletSelector
              availableWallets={wallet.availableWallets}
              onSelect={handleWalletConnect}
              loading={wallet.loading}
            />
          </div>
        ) : (
          // Main Dashboard
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <WalletInfo wallet={wallet.wallet} onDisconnect={wallet.disconnectWallet} />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Transaction Builder */}
              <TransactionBuilder onSubmit={handleBuildTransaction} loading={wallet.loading} />

              {/* Escrow Manager */}
              <EscrowManager
                escrows={escrow.escrows}
                onCreateEscrow={handleCreateEscrow}
                onReleaseEscrow={handleReleaseEscrow}
                loading={wallet.loading}
              />

              {/* Transaction History */}
              <TransactionHistory transactions={transactions.transactions} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
