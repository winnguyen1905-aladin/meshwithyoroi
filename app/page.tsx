"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    // Redirect to login page on mount
    router.push("/login")
  }, [router])
  return null
}