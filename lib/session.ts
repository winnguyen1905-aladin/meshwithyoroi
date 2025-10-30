/**
 * Session management utilities for wallet authentication
 */

export interface WalletSession {
  address: string
  walletName: string
  connectedAt: number
  expiresAt: number
}

const SESSION_KEY = "cardano_wallet_session"
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export function createSession(address: string, walletName: string): WalletSession {
  return {
    address,
    walletName,
    connectedAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION,
  }
}

export function saveSession(session: WalletSession): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }
}

export function getSession(): WalletSession | null {
  if (typeof window === "undefined") return null

  const session = localStorage.getItem(SESSION_KEY)
  if (!session) return null

  const parsed = JSON.parse(session) as WalletSession

  // Check if session is expired
  if (parsed.expiresAt < Date.now()) {
    clearSession()
    return null
  }

  return parsed
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY)
  }
}

export function isSessionValid(): boolean {
  const session = getSession()
  return session !== null && session.expiresAt > Date.now()
}
