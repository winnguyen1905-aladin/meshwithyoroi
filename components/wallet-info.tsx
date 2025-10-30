"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { WalletConnection } from "@/lib/cardano-types"

interface WalletInfoProps {
  wallet: WalletConnection
  onDisconnect: () => void
}

export function WalletInfo({ wallet, onDisconnect }: WalletInfoProps) {
  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 10)}...${addr.slice(-10)}`
  }

  return (
    <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Connected Wallet</h3>
        <Button variant="outline" size="sm" onClick={onDisconnect}>
          Disconnect
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">Wallet</p>
          <p className="font-medium capitalize">{wallet.name}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Address</p>
          <p className="font-mono text-sm break-all">{truncateAddress(wallet.address)}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Balance</p>
          <p className="text-2xl font-bold">{wallet.balance} ADA</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Network</p>
          <p className="font-medium">{wallet.networkId === 1 ? "Mainnet" : "Testnet"}</p>
        </div>
      </div>
    </Card>
  )
}
