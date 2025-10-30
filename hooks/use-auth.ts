"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSession, clearSession, isSessionValid } from "@/lib/session"

export interface AuthState {
  isAuthenticated: boolean
  address: string | null
  walletName: string | null
  isLoading: boolean
}

export function useAuth() {
  const router = useRouter()
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    address: null,
    walletName: null,
    isLoading: true,
  })

  useEffect(() => {
    const session = getSession()
    if (session && isSessionValid()) {
      setAuthState({
        isAuthenticated: true,
        address: session.address,
        walletName: session.walletName,
        isLoading: false,
      })
    } else {
      setAuthState({
        isAuthenticated: false,
        address: null,
        walletName: null,
        isLoading: false,
      })
    }
  }, [])

  const logout = () => {
    clearSession()
    setAuthState({
      isAuthenticated: false,
      address: null,
      walletName: null,
      isLoading: false,
    })
    router.push("/login")
  }

  return {
    ...authState,
    logout,
  }
}