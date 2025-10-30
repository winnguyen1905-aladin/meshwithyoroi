"use client"

import { useState, useCallback, useEffect } from "react"
import type { CardanoAPI, WalletConnection, WalletName } from "@/lib/cardano-types"
import { detectAvailableWallets, getWalletAPI, formatLovelace } from "@/lib/wallet-utils"
import { createSession, saveSession, clearSession, isSessionValid, getSession } from "@/lib/session"

// Authentication types
interface BackendResponse<T> {
  success: boolean
  data: T
  message?: string
}

interface ChallengeData {
  message: string
  nonce: string
  externalAad?: string
}

interface VerifyData {
  accessToken: string
  user: {
    id: string
    newAccount: boolean
  }
}

interface AuthState {
  isAuthenticated: boolean
  user: { id: string; newAccount: boolean } | null
  accessToken: string | null
  step: 'select' | 'connected' | 'signing' | 'authenticated'
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

export const useCardanoWallet = () => {
  const [wallet, setWallet] = useState<WalletConnection | null>(null)
  const [walletAPI, setWalletAPI] = useState<CardanoAPI | null>(null)
  const [availableWallets, setAvailableWallets] = useState<WalletName[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    step: 'select'
  })

  // Detect available wallets on mount
  useEffect(() => {
    const available = detectAvailableWallets()
    setAvailableWallets(available)
  }, [])

  // Check for existing session on mount
  useEffect(() => {
    const session = getSession()
    if (session && isSessionValid()) {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        step: 'authenticated'
      }))
    }
  }, [])

  const connectWallet = useCallback(async (walletName: WalletName) => {
    setError(null)
    setLoading(true)
    try {
      
      const wallet = window.cardano?.[walletName]
      if (!wallet) {
        throw new Error(`${walletName} wallet not found`)
      }

      const api = await wallet.enable() as CardanoAPI
      setWalletAPI(api)

      // Get wallet address (CIP-30 returns hex, need to keep as bech32)
      const addresses = await api.getUsedAddresses()
      const hexAddr = addresses.length > 0 ? addresses[0] : await api.getChangeAddress()
      
      // Import Cardano library to decode address
      const { Address } = await import('@emurgo/cardano-serialization-lib-browser')
      const addr = Address.from_bytes(Buffer.from(hexAddr, 'hex'))
      const bech32Address = addr.to_bech32()

      // Get wallet info
      const networkId = await api.getNetworkId()
      const balanceLovelace = await api.getBalance()

      const connection: WalletConnection = {
        name: walletName,
        address: bech32Address,
        balance: formatLovelace(balanceLovelace),
        networkId,
        isConnected: true,
      }

      setWallet(connection)
      setAuthState(prev => ({ ...prev, step: 'connected' }))
      localStorage.setItem("connectedWallet", walletName)
      return connection
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet"
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const authenticate = useCallback(async () => {
    if (!walletAPI || !wallet || !wallet.address) {
      setError('Wallet not connected')
      return
    }

    setLoading(true)
    setError(null)
    setAuthState(prev => ({ ...prev, step: 'signing' }))

    try {
      // Step 1: Request challenge from backend
      console.log('📤 Requesting challenge:', { address: wallet.address, walletType: wallet.name })
      const challengeRes = await fetch(`${API_BASE_URL}/auth/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: wallet.address,
          walletType: wallet.name.toUpperCase(),
        }),
      })

      if (!challengeRes.ok) {
        throw new Error('Failed to get challenge from server')
      }

      const challengeData: BackendResponse<ChallengeData> = await challengeRes.json()
      const { message, nonce } = challengeData.data
      console.log('📥 Challenge received:', { nonce, message })

      // Step 2: Get stake address (reward address) for signing
      // IMPORTANT: We must sign with stake address to verify ownership!
      const rewardAddresses = await walletAPI.getRewardAddresses()
      if (!rewardAddresses || rewardAddresses.length === 0) {
        throw new Error('No reward address found in wallet')
      }
      const stakeAddrHex = rewardAddresses[0]
      
      // Debug: Convert stake address hex to bech32
      const { Address } = await import('@emurgo/cardano-serialization-lib-browser')
      const stakeAddrBech32 = Address.from_bytes(Buffer.from(stakeAddrHex, 'hex')).to_bech32()
      
      console.log('=== Frontend Signing Debug ===')
      console.log('🔑 Stake address (hex):', stakeAddrHex)
      console.log('🔑 Stake address (bech32):', stakeAddrBech32)
      console.log('📝 Message:', message)
      console.log('📝 Message length:', message.length)

      // Step 3: Sign with STAKE ADDRESS
      const messageHex = Buffer.from(message, 'utf8').toString('hex')
      const signResult = await walletAPI.signData(stakeAddrHex, messageHex)
      console.log('Done Step 3: ✍️ Signature created with stake key')

      // Step 4: Get externalAad from challenge response
      const externalAad = challengeData.data.externalAad || ''
      console.log('Done Step 4: 🔑 External AAD:', externalAad)
      
      // Step 5: Verify with backend
      const verifyPayload = {
        walletAddress: wallet.address,
        nonce,
        coseSign1: signResult.signature,
        externalAad,
        publicKey: signResult.key,
        walletType: wallet.name.toUpperCase(),
      }
      console.log('Done Step 5: 📝 Verify payload:', verifyPayload) 
      const verifyRes = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifyPayload),
      })
      console.log('Done Step 6: 📝 Verify response:', verifyRes)
      if (!verifyRes.ok) {
        const errorData = await verifyRes.json().catch(() => ({}))
        throw new Error(errorData.message || 'Verification failed')
      }
      const verifyData: BackendResponse<VerifyData> = await verifyRes.json()
      const { accessToken, user: userData } = verifyData.data
      
      // Create and save session
      const session = createSession(wallet.address, wallet.name)
      saveSession(session)
      console.log('Done Step 8: 📝 Session:', session)
      // Update auth state
      setAuthState({
        isAuthenticated: true,
        user: userData,
        accessToken,
        step: 'authenticated'
      })
      console.log('✅ Authentication successful!')
      return { accessToken, user: userData }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
      setAuthState(prev => ({ ...prev, step: 'connected' }))
      console.error('❌ Authentication error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [walletAPI, wallet])

  const disconnectWallet = useCallback(() => {
    setError(null)
    setWallet(null)
    setWalletAPI(null)
    setAuthState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      step: 'select'
    })
    clearSession()
    localStorage.removeItem("connectedWallet")
  }, [])

  const getBalance = useCallback(async () => {
    if (!walletAPI) throw new Error("Wallet not connected")
    const balance = await walletAPI.getBalance()
    return formatLovelace(balance)
  }, [walletAPI])

  const signTransaction = useCallback(
    async (tx: string) => {
      if (!walletAPI) throw new Error("Wallet not connected")
      return await walletAPI.signTx(tx)
    },
    [walletAPI],
  )

  const submitTransaction = useCallback(
    async (tx: string) => {
      if (!walletAPI) throw new Error("Wallet not connected")
      return await walletAPI.submitTx(tx)
    },
    [walletAPI],
  )

  return {
    wallet,
    walletAPI,
    availableWallets,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    authenticate,
    getBalance,
    signTransaction,
    submitTransaction,
    // Authentication state
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    accessToken: authState.accessToken,
    authStep: authState.step
  }
}
