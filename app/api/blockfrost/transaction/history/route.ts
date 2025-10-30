import { type NextRequest, NextResponse } from "next/server"
import { blockfrostClient } from "@/lib/blockfrost-client"

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  const limit = Number.parseInt(req.nextUrl.searchParams.get('limit') || '10');

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  const transactions = await blockfrostClient.addressesTransactions(address, {
    count: limit,
  });
  
  return NextResponse.json(transactions);
}