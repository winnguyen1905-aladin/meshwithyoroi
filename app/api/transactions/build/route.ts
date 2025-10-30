import { type NextRequest, NextResponse } from "next/server"

/**
 * POST /api/transactions/build
 * Builds an unsigned transaction
 */
export async function POST(request: NextRequest) {
  try {
    const { sender, recipient, amount, type } = await request.json()

    if (!sender || !recipient || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["deposit", "payment"].includes(type)) {
      return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 })
    }

    // Build transaction
    const transactionId = Math.random().toString(36).substring(7)

    return NextResponse.json({
      success: true,
      transactionId,
      type,
      sender,
      recipient,
      amount,
      status: "unsigned",
      fee: "170000", // Estimated fee in lovelace
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to build transaction" }, { status: 500 })
  }
}
