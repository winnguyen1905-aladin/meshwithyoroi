import { type NextRequest, NextResponse } from "next/server"

/**
 * GET /api/escrow/list?address=<address>
 * Lists all escrow contracts for a wallet
 */
export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get("address")

    if (!address) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      address,
      escrows: [],
      total: 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch escrows" }, { status: 500 })
  }
}
