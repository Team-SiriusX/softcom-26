import { NextResponse } from "next/server"

// Mock categories data
const mockCategories = [
  {
    id: "1",
    name: "Operating Revenue",
    type: "INCOME",
    color: "#10b981",
    isActive: true,
  },
  {
    id: "2",
    name: "Other Revenue",
    type: "INCOME",
    color: "#3b82f6",
    isActive: true,
  },
  {
    id: "3",
    name: "Operating Expense",
    type: "EXPENSE",
    color: "#ef4444",
    isActive: true,
  },
]

export async function GET() {
  return NextResponse.json({ categories: mockCategories })
}

export async function POST(request: Request) {
  const body = await request.json()
  const newCategory = {
    id: String(mockCategories.length + 1),
    ...body,
    isActive: true,
    createdAt: new Date().toISOString(),
  }

  return NextResponse.json({ category: newCategory }, { status: 201 })
}
