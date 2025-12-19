import { NextResponse } from "next/server"

// Mock transactions data
const mockTransactions = [
  {
    id: "1",
    date: "2024-01-15T00:00:00Z",
    description: "Office Supplies Purchase",
    amount: -245.5,
    type: "EXPENSE",
    categoryId: "3",
    ledgerAccountId: "1",
    referenceNumber: "CHK-001",
    isReconciled: false,
  },
  {
    id: "2",
    date: "2024-01-14T00:00:00Z",
    description: "Client Payment - Project A",
    amount: 15000.0,
    type: "INCOME",
    categoryId: "1",
    ledgerAccountId: "2",
    referenceNumber: "INV-1024",
    isReconciled: true,
  },
]

export async function GET() {
  return NextResponse.json({ transactions: mockTransactions })
}

export async function POST(request: Request) {
  const body = await request.json()
  const newTransaction = {
    id: String(mockTransactions.length + 1),
    ...body,
    createdAt: new Date().toISOString(),
  }

  return NextResponse.json({ transaction: newTransaction }, { status: 201 })
}
