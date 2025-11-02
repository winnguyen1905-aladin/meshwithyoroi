import { WalletName } from "../types/cardano.types"

// Utility functions for wallet detection and interaction
export const SUPPORTED_WALLETS = {
  lace: {
    name: "Lace",
    icon: "🔐",
    key: "cardano",
  },
  yoroi: {
    name: "Yoroi",
    icon: "🦊",
    key: "yoroi",
  },
  eternl: {
    name: "Eternl",
    icon: "♾️",
    key: "eternl",
  },
}

export const detectAvailableWallets = (): WalletName[] => {
  if (typeof window === "undefined") return []

  const available: WalletName[] = []

  // Check for Lace (uses cardano window object)
  if ((window as any).cardano?.lace) {
    available.push("lace")
  }

  // Check for Yoroi
  if ((window as any).cardano?.yoroi) {
    available.push("yoroi")
  }

  // Check for Eternl
  if ((window as any).cardano?.eternl) {
    available.push("eternl")
  }

  return available
}

export const getWalletAPI = async (walletName: string) => {
  if (typeof window === "undefined") throw new Error("Window not available")

  const cardano = (window as any).cardano
  if (!cardano) throw new Error("No Cardano wallets detected")

  let wallet
  switch (walletName.toLowerCase()) {
    case "lace":
      wallet = cardano.lace
      break
    case "yoroi":
      wallet = cardano.yoroi
      break
    case "eternl":
      wallet = cardano.eternl
      break
    default:
      throw new Error(`Unknown wallet: ${walletName}`)
  }

  if (!wallet) throw new Error(`${walletName} not installed`)

  return await wallet.enable()
}

export const formatLovelace = (lovelace: string | number): string => {
  let num: bigint
  
  if (typeof lovelace === "string") {
    // Check if the string is hexadecimal (starts with 0x or contains only hex characters)
    if (lovelace.startsWith('0x') || /^[0-9a-fA-F]+$/.test(lovelace)) {
      num = BigInt('0x' + lovelace.replace('0x', ''))
    } else {
      num = BigInt(lovelace)
    }
  } else {
    num = BigInt(lovelace)
  }
  
  const ada = Number(num) / 1_000_000
  return ada.toFixed(2)
}

export const toLovelace = (ada: number): string => {
  return (ada * 1_000_000).toString()
}
