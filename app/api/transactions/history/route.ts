import { type NextRequest, NextResponse } from "next/server"

/**
 * GET /api/transactions/history?address=<address>&limit=<limit>
 * Retrieves transaction history for a wallet
 */
export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get("address")
    const limit = Number.parseInt(request.nextUrl.searchParams.get("limit") || "10")

    if (!address) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    // Mock transaction history
    return NextResponse.json({
      success: true,
      address,
      transactions: [],
      total: 0,
      limit,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch transaction history" }, { status: 500 })
  }
}
