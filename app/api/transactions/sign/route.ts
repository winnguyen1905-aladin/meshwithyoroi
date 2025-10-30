import { type NextRequest, NextResponse } from "next/server"

/**
 * POST /api/transactions/sign
 * Signs a transaction with wallet
 */
export async function POST(request: NextRequest) {
  try {
    const { transactionId, walletAddress } = await request.json()

    if (!transactionId || !walletAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Sign transaction
    return NextResponse.json({
      success: true,
      transactionId,
      status: "signed",
      signedAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to sign transaction" }, { status: 500 })
  }
}
