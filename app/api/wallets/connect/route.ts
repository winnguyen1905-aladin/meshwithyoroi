import { type NextRequest, NextResponse } from "next/server"

/**
 * POST /api/wallets/connect
 * Initiates wallet connection and validates wallet availability
 */
export async function POST(request: NextRequest) {
  try {
    const { walletName } = await request.json()

    if (!walletName) {
      return NextResponse.json({ error: "Wallet name is required" }, { status: 400 })
    }

    // Validate wallet is supported
    const supportedWallets = ["Lace", "Yoroi", "Eternl"]
    if (!supportedWallets.includes(walletName)) {
      return NextResponse.json({ error: "Unsupported wallet" }, { status: 400 })
    }

    // Return wallet connection metadata
    return NextResponse.json({
      success: true,
      wallet: walletName,
      message: `Ready to connect ${walletName}`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to connect wallet" }, { status: 500 })
  }
}
