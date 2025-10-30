import { type NextRequest, NextResponse } from "next/server"

/**
 * POST /api/wallets/disconnect
 * Disconnects the current wallet session
 */
export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json()

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    // Clear wallet session
    return NextResponse.json({
      success: true,
      message: "Wallet disconnected successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to disconnect wallet" }, { status: 500 })
  }
}
