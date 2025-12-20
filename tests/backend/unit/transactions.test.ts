import { describe, it, expect, beforeEach, vi } from "vitest";
import transactions from "@/app/api/[[...route]]/controllers/(base)/transactions";
import { Hono } from "hono";
import {
  resetAllMocks,
  mockBusiness,
  mockCategory,
  db,
} from "./helpers";

const mockTransaction = {
  id: "transaction-1",
  type: "EXPENSE" as const,
  amount: 100,
  description: "Test",
  date: new Date(),
  businessId: mockBusiness.id,
  categoryId: mockCategory.id,
  isReconciled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

async function testApp(app: Hono, path: string, options?: RequestInit) {
  const req = new Request(`http://localhost${path}`, options);
  return await app.request(req);
}

describe("Transactions API Endpoints", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe("GET /", () => {
    it("should return all transactions", async () => {
      const mockTransactions = [{
        ...mockTransaction,
        category: mockCategory,
        ledgerAccount: null,
        journalEntries: [],
      }];
      vi.mocked(db.transaction.findMany).mockResolvedValue(mockTransactions as any);
      vi.mocked(db.transaction.count).mockResolvedValue(1);

      const res = await testApp(transactions, `/?businessId=${mockBusiness.id}`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data).toBeDefined();
      expect(data.data.length).toBe(1);
      expect(data.pagination).toBeDefined();
    });

    it("should filter by type", async () => {
      vi.mocked(db.transaction.findMany).mockResolvedValue([mockTransaction] as any);
      vi.mocked(db.transaction.count).mockResolvedValue(1);

      const res = await testApp(transactions, `/?businessId=${mockBusiness.id}&type=EXPENSE`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data).toBeDefined();
    });

    it("should support pagination", async () => {
      vi.mocked(db.transaction.findMany).mockResolvedValue([mockTransaction] as any);
      vi.mocked(db.transaction.count).mockResolvedValue(100);

      const res = await testApp(transactions, `/?businessId=${mockBusiness.id}&page=2&limit=10`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.total).toBe(100);
    });
  });

  describe("GET /:id", () => {
    it("should return a specific transaction", async () => {
      vi.mocked(db.transaction.findUnique).mockResolvedValue({
        ...mockTransaction,
        category: mockCategory,
        ledgerAccount: null,
        journalEntries: [],
      } as any);

      const res = await testApp(transactions, `/${mockTransaction.id}`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data).toBeDefined();
    });

    it("should return 404 if not found", async () => {
      vi.mocked(db.transaction.findUnique).mockResolvedValue(null);

      const res = await testApp(transactions, "/non-existent");
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Transaction not found");
    });
  });

  describe("POST /", () => {
    it("should create a transaction", async () => {
      vi.mocked(db.business.findUnique).mockResolvedValue({
        ...mockBusiness,
        user: { subscriptionTier: "PRO" },
      } as any);
      vi.mocked(db.transaction.count).mockResolvedValue(0);
      vi.mocked(db.ledgerAccount.findUnique).mockResolvedValue({
        id: "account-1",
        balanceType: "DEBIT",
        currentBalance: 1000,
      } as any);
      vi.mocked(db.category.findUnique).mockResolvedValue(mockCategory as any);
      vi.mocked(db.$transaction).mockResolvedValue([mockTransaction] as any);

      const res = await testApp(transactions, "/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: mockBusiness.id,
          type: "EXPENSE",
          amount: 100,
          description: "Test",
          date: "2025-12-20",
          categoryId: mockCategory.id,
          ledgerAccountId: "account-1",
        }),
      });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.data).toBeDefined();
    });

    it("should return 403 if limit reached", async () => {
      vi.mocked(db.business.findUnique).mockResolvedValue({
        ...mockBusiness,
        user: { subscriptionTier: "FREE" },
      } as any);
      vi.mocked(db.transaction.count).mockResolvedValue(50);

      const res = await testApp(transactions, "/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: mockBusiness.id,
          type: "EXPENSE",
          amount: 100,
          description: "Test",
          date: "2025-12-20",
          categoryId: mockCategory.id,
          ledgerAccountId: "account-1",
        }),
      });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain("limit");
    });
  });

  describe("DELETE /:id", () => {
    it("should delete transaction", async () => {
      vi.mocked(db.transaction.findUnique).mockResolvedValue({
        ...mockTransaction,
        journalEntries: [
          { id: "e1", ledgerAccountId: "a1", amount: 100, entryType: "DEBIT" },
          { id: "e2", ledgerAccountId: "a2", amount: 100, entryType: "CREDIT" },
        ],
      } as any);
      vi.mocked(db.ledgerAccount.findUnique)
        .mockResolvedValueOnce({ id: "a1", currentBalance: 1000, balanceType: "DEBIT" } as any)
        .mockResolvedValueOnce({ id: "a2", currentBalance: 500, balanceType: "CREDIT" } as any);
      vi.mocked(db.$transaction).mockResolvedValue([{ count: 1 }] as any);

      const res = await testApp(transactions, `/${mockTransaction.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toBeDefined();
    });

    it("should return 404 if not found", async () => {
      vi.mocked(db.transaction.findUnique).mockResolvedValue(null);

      const res = await testApp(transactions, "/non-existent", {
        method: "DELETE",
      });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Transaction not found");
    });
  });
});
