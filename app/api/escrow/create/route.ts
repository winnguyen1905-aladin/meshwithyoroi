import { type NextRequest, NextResponse } from "next/server"

/**
 * POST /api/escrow/create
 * Creates a new escrow contract
 */
export async function POST(request: NextRequest) {
  try {
    const { sender, recipient, amount, releaseCondition } = await request.json()

    if (!sender || !recipient || !amount || !releaseCondition) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const escrowId = Math.random().toString(36).substring(7)

    return NextResponse.json({
      success: true,
      escrowId,
      sender,
      recipient,
      amount,
      releaseCondition,
      status: "active",
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create escrow" }, { status: 500 })
  }
}
