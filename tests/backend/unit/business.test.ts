import { describe, it, expect, beforeEach, vi } from "vitest";
import business from "@/app/api/[[...route]]/controllers/(base)/business";
import { Hono } from "hono";
import {
  setupAuthenticatedUser,
  setupUnauthenticatedUser,
  resetAllMocks,
  mockUser,
  mockBusiness,
  db,
} from "./helpers";

// Helper to test Hono apps
async function testApp(app: Hono, path: string, options?: RequestInit) {
  const req = new Request(`http://localhost${path}`, options);
  return await app.request(req);
}

describe("Business API Endpoints", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe("GET /", () => {
    it("should return all businesses for authenticated user", async () => {
      setupAuthenticatedUser();
      const mockBusinesses = [mockBusiness];
      vi.mocked(db.business.findMany).mockResolvedValue(mockBusinesses as any);

      const res = await testApp(business, "/");
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data).toBeDefined();
      expect(data.data.length).toBe(1);
    });

    it("should return 401 if user is not authenticated", async () => {
      setupUnauthenticatedUser();

      const res = await testApp(business, "/");
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("GET /:id", () => {
    it("should return a specific business by id", async () => {
      setupAuthenticatedUser();
      const mockBusinessWithCount = {
        ...mockBusiness,
        _count: { transactions: 5, ledgerAccounts: 10, categories: 3 },
      };
      vi.mocked(db.business.findFirst).mockResolvedValue(mockBusinessWithCount as any);

      const res = await testApp(business, `/${mockBusiness.id}`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data).toBeDefined();
    });

    it("should return 404 if business not found", async () => {
      setupAuthenticatedUser();
      vi.mocked(db.business.findFirst).mockResolvedValue(null);

      const res = await testApp(business, "/non-existent");
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Business not found");
    });
  });

  describe("POST /", () => {
    it("should create a new business", async () => {
      setupAuthenticatedUser();
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: mockUser.id,
        subscriptionTier: "PRO",
      } as any);
      vi.mocked(db.business.count).mockResolvedValue(0);
      vi.mocked(db.business.create).mockResolvedValue(mockBusiness as any);

      const res = await testApp(business, "/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test", currency: "USD" }),
      });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.data).toBeDefined();
    });

    it("should return 403 if user reached limit", async () => {
      setupAuthenticatedUser();
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: mockUser.id,
        subscriptionTier: "FREE",
      } as any);
      vi.mocked(db.business.count).mockResolvedValue(1);

      const res = await testApp(business, "/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test", currency: "USD" }),
      });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain("limit");
    });
  });

  describe("PATCH /:id", () => {
    it("should update business", async () => {
      setupAuthenticatedUser();
      vi.mocked(db.business.updateMany).mockResolvedValue({ count: 1 } as any);

      const res = await testApp(business, `/${mockBusiness.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated" }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toBeDefined();
    });

    it("should return 404 if not found", async () => {
      setupAuthenticatedUser();
      vi.mocked(db.business.updateMany).mockResolvedValue({ count: 0 } as any);

      const res = await testApp(business, "/non-existent", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated" }),
      });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Business not found");
    });
  });

  describe("DELETE /:id", () => {
    it("should delete business", async () => {
      setupAuthenticatedUser();
      vi.mocked(db.business.deleteMany).mockResolvedValue({ count: 1 } as any);

      const res = await testApp(business, `/${mockBusiness.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toBeDefined();
    });

    it("should return 404 if not found", async () => {
      setupAuthenticatedUser();
      vi.mocked(db.business.deleteMany).mockResolvedValue({ count: 0 } as any);

      const res = await testApp(business, "/non-existent", {
        method: "DELETE",
      });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Business not found");
    });
  });
});
