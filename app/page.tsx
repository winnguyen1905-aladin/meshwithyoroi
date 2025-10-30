"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCardanoWallet } from "@/hooks/use-cardano-wallet"

export default function Home() {
  const router = useRouter()
  const wallet = useCardanoWallet()
  
  useEffect(() => {
    // Redirect to login page on mount
    router.push("/login")
  }, [router])

  return null
}