import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { WalletProvider } from "@/context/wallet-context"
import { Providers } from "./providers"
import { AppHeader } from "@/components/app-header"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Cardano Wallet Manager",
  description: "Connect your Cardano wallet and manage transactions with escrow support",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <Providers>
          <WalletProvider>
            <AppHeader />
            {children}
          </WalletProvider>
        </Providers>
      </body>
    </html>
  )
}
