import { describe, it, expect, beforeEach, vi } from "vitest";
import categories from "@/app/api/[[...route]]/controllers/(base)/categories";
import { Hono } from "hono";
import {
  resetAllMocks,
  mockBusiness,
  mockCategory,
  db,
} from "./helpers";

async function testApp(app: Hono, path: string, options?: RequestInit) {
  const req = new Request(`http://localhost${path}`, options);
  return await app.request(req);
}

describe("Categories API Endpoints", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe("GET /", () => {
    it("should return all categories for a business", async () => {
      const mockCategories = [{
        ...mockCategory,
        parent: null,
        children: [],
        _count: { transactions: 5 },
      }];
      vi.mocked(db.category.findMany).mockResolvedValue(mockCategories as any);

      const res = await testApp(categories, `/?businessId=${mockBusiness.id}`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data).toBeDefined();
      expect(data.data.length).toBe(1);
    });

    it("should filter by type", async () => {
      vi.mocked(db.category.findMany).mockResolvedValue([mockCategory] as any);

      const res = await testApp(categories, `/?businessId=${mockBusiness.id}&type=EXPENSE`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data).toBeDefined();
    });
  });

  describe("GET /:id", () => {
    it("should return a specific category", async () => {
      vi.mocked(db.category.findUnique).mockResolvedValue({
        ...mockCategory,
        parent: null,
        children: [],
        transactions: [],
      } as any);

      const res = await testApp(categories, `/${mockCategory.id}`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data).toBeDefined();
    });

    it("should return 404 if not found", async () => {
      vi.mocked(db.category.findUnique).mockResolvedValue(null);

      const res = await testApp(categories, "/non-existent");
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Category not found");
    });
  });

  describe("POST /", () => {
    it("should create a new category", async () => {
      vi.mocked(db.category.findUnique).mockResolvedValue(null);
      vi.mocked(db.category.create).mockResolvedValue(mockCategory as any);

      const res = await testApp(categories, "/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: mockBusiness.id,
          name: "Test Category",
          type: "EXPENSE",
        }),
      });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.data).toBeDefined();
    });

    it("should return 400 if name exists", async () => {
      vi.mocked(db.category.findUnique).mockResolvedValue(mockCategory as any);

      const res = await testApp(categories, "/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: mockBusiness.id,
          name: "Existing",
          type: "EXPENSE",
        }),
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Category name already exists");
    });
  });

  describe("PATCH /:id", () => {
    it("should update category", async () => {
      vi.mocked(db.category.findUnique).mockResolvedValue(null);
      vi.mocked(db.category.update).mockResolvedValue(mockCategory as any);

      const res = await testApp(categories, `/${mockCategory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated" }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data).toBeDefined();
    });
  });

  describe("DELETE /:id", () => {
    it("should soft delete category", async () => {
      vi.mocked(db.category.findUnique).mockResolvedValue(mockCategory as any);
      vi.mocked(db.category.update).mockResolvedValue({
        ...mockCategory,
        isActive: false,
      } as any);

      const res = await testApp(categories, `/${mockCategory.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.isActive).toBe(false);
    });
  });
});
