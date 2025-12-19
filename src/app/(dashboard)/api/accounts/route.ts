import { NextResponse } from "next/server"

// Mock ledger accounts data
const mockAccounts = [
  {
    id: "1",
    code: "1000",
    name: "Cash",
    type: "ASSET",
    subType: "CURRENT_ASSET",
    normalBalance: "DEBIT",
    currentBalance: 52450.0,
    isActive: true,
  },
  {
    id: "2",
    code: "1100",
    name: "Accounts Receivable",
    type: "ASSET",
    subType: "CURRENT_ASSET",
    normalBalance: "DEBIT",
    currentBalance: 18200.0,
    isActive: true,
  },
]

export async function GET() {
  return NextResponse.json({ accounts: mockAccounts })
}

export async function POST(request: Request) {
  const body = await request.json()
  const newAccount = {
    id: String(mockAccounts.length + 1),
    ...body,
    currentBalance: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  }

  return NextResponse.json({ account: newAccount }, { status: 201 })
}
