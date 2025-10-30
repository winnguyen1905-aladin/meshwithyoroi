export type WalletName = 'yoroi' | 'lace' | 'nami' | 'eternl'

export interface CardanoWallet {
  enable: () => Promise<CardanoAPI>
  isEnabled: () => Promise<boolean>
  apiVersion: string
  name: string
  icon: string
}

export interface CardanoAPI {
  getBalance: () => Promise<string>
  getUsedAddresses: () => Promise<string[]>
  getUnusedAddresses: () => Promise<string[]>
  getChangeAddress: () => Promise<string>
  signTx: (tx: string, partialSign?: boolean) => Promise<string>
  signData: (addr: string, payload: string) => Promise<{ signature: string; key: string }>
  submitTx: (tx: string) => Promise<string>
  getNetworkId: () => Promise<number>
  getRewardAddresses: () => Promise<string[]>
  getUtxos?: () => Promise<string[]>
}

export interface WalletConnection {
  name: string
  address: string
  balance: string
  networkId: number
  isConnected: boolean
}

export interface Transaction {
  id: string
  type: "deposit" | "withdrawal" | "escrow" | "payment"
  amount: string
  recipient?: string
  status: "pending" | "confirmed" | "failed"
  timestamp: number
  hash?: string
}

export interface EscrowContract {
  id: string
  sender: string
  recipient: string
  amount: string
  releaseCondition: string
  status: "active" | "released" | "cancelled"
  createdAt: number
  releaseAt?: number
}

export interface AddressOption {
  address: string
  balance?: number
  hasUtxos: boolean
}

declare global {
  interface Window {
    cardano?: {
      [key: string]: CardanoWallet
    }
  }
}
