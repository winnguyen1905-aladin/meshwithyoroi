"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SUPPORTED_WALLETS } from "@/utils/wallet-utils"
import { WalletName } from "@/types/cardano.types"

interface WalletSelectorProps {
  availableWallets: WalletName[]
  onSelect: (walletName: WalletName) => Promise<void>
  loading: boolean
} 

export function WalletSelector({ availableWallets, onSelect, loading }: WalletSelectorProps) {
  const [selectedWallet, setSelectedWallet] = useState<WalletName | null>(null)

  const handleConnect = async (walletName: WalletName) => {
    setSelectedWallet(walletName)
    try {
      await onSelect(walletName)
    } finally {
      setSelectedWallet(null)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
      <p className="text-muted-foreground">Select a supported Cardano wallet to get started</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(SUPPORTED_WALLETS).map(([key, wallet]) => {
          const isAvailable = availableWallets.includes(key as WalletName)
          const isSelected = selectedWallet === key

          return (
            <Card
              key={key}
              className={`p-6 cursor-pointer transition-all ${
                isAvailable ? "hover:border-primary hover:shadow-lg" : "opacity-50 cursor-not-allowed"
              } ${isSelected ? "border-primary shadow-lg" : ""}`}
              onClick={() => isAvailable && handleConnect(key as WalletName)}
            >
              <div className="text-4xl mb-4">{wallet.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{wallet.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{isAvailable ? "Installed" : "Not installed"}</p>
              <Button
                disabled={!isAvailable || loading || isSelected}
                onClick={() => handleConnect(key as WalletName)}
                className="w-full"
              >
                {isSelected ? "Connecting..." : "Connect"}
              </Button>
            </Card>
          )
        })}
      </div>

      {availableWallets.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            No Cardano wallets detected. Please install Lace, Yoroi, or Eternl to continue.
          </p>
        </div>
      )}
    </div>
  )
}
