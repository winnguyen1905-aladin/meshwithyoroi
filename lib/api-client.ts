/**
 * API Client for Cardano Wallet Manager
 * Centralized API communication layer
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: error.error || "Request failed" }
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // Wallet APIs
  async connectWallet(walletName: string) {
    return this.request("/api/wallets/connect", {
      method: "POST",
      body: JSON.stringify({ walletName }),
    })
  }

  async disconnectWallet(walletAddress: string) {
    return this.request("/api/wallets/disconnect", {
      method: "POST",
      body: JSON.stringify({ walletAddress }),
    })
  }

  async getBalance(address: string) {
    return this.request(`/api/wallets/balance?address=${address}`)
  }

  // Transaction APIs
  async buildTransaction(sender: string, recipient: string, amount: string, type: "deposit" | "payment") {
    return this.request("/api/transactions/build", {
      method: "POST",
      body: JSON.stringify({ sender, recipient, amount, type }),
    })
  }

  async signTransaction(transactionId: string, walletAddress: string) {
    return this.request("/api/transactions/sign", {
      method: "POST",
      body: JSON.stringify({ transactionId, walletAddress }),
    })
  }

  async submitTransaction(transactionId: string, signedTx: string) {
    return this.request("/api/transactions/submit", {
      method: "POST",
      body: JSON.stringify({ transactionId, signedTx }),
    })
  }

  async getTransactionHistory(address: string, limit = 10) {
    return this.request(`/api/transactions/history?address=${address}&limit=${limit}`)
  }

  // Escrow APIs
  async createEscrow(sender: string, recipient: string, amount: string, releaseCondition: string) {
    return this.request("/api/escrow/create", {
      method: "POST",
      body: JSON.stringify({ sender, recipient, amount, releaseCondition }),
    })
  }

  async releaseEscrow(escrowId: string, releaser: string) {
    return this.request("/api/escrow/release", {
      method: "POST",
      body: JSON.stringify({ escrowId, releaser }),
    })
  }

  async listEscrows(address: string) {
    return this.request(`/api/escrow/list?address=${address}`)
  }

  // User APIs
  async getUserProfile(address: string) {
    return this.request(`/api/users/profile?address=${address}`)
  }

  async updateUserProfile(address: string, username: string, email: string) {
    return this.request("/api/users/profile", {
      method: "POST",
      body: JSON.stringify({ address, username, email }),
    })
  }

  async getUserSettings(address: string) {
    return this.request(`/api/users/settings?address=${address}`)
  }

  async updateUserSettings(address: string, settings: Record<string, any>) {
    return this.request("/api/users/settings", {
      method: "POST",
      body: JSON.stringify({ address, settings }),
    })
  }
}

export const apiClient = new ApiClient()
