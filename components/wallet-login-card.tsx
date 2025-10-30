"use client"
import { Loader2 } from "lucide-react"

interface WalletLoginCardProps {
  walletName: string
  isSelected: boolean
  isLoading: boolean
  onConnect: () => void
}

const walletInfo: Record<string, { icon: string; description: string; color: string }> = {
  Lace: {
    icon: "🔐",
    description: "Official Cardano wallet by IOG",
    color: "from-blue-500 to-blue-600",
  },
  Yoroi: {
    icon: "🛡️",
    description: "Lightweight Cardano wallet by Emurgo",
    color: "from-purple-500 to-purple-600",
  },
  Eternl: {
    icon: "✨",
    description: "Feature-rich Cardano wallet",
    color: "from-pink-500 to-pink-600",
  },
}

export function WalletLoginCard({ walletName, isSelected, isLoading, onConnect }: WalletLoginCardProps) {
  const info = walletInfo[walletName] || {
    icon: "💳",
    description: "Cardano wallet",
    color: "from-gray-500 to-gray-600",
  }

  return (
    <button
      onClick={onConnect}
      disabled={isLoading}
      className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-card hover:bg-card/80"
      } ${isLoading ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-lg bg-gradient-to-br ${info.color} flex items-center justify-center text-xl`}
          >
            {info.icon}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{walletName}</h3>
            <p className="text-sm text-muted-foreground">{info.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <svg
              className={`w-5 h-5 transition-transform ${isSelected ? "text-primary" : "text-muted-foreground"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </div>
    </button>
  )
}
