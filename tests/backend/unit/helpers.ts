import { vi } from "vitest";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/current-user";

export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
};

export const mockBusiness = {
  id: "test-business-id",
  name: "Test Business",
  email: "business@example.com",
  phone: "1234567890",
  address: "123 Test St",
  taxId: "TAX123",
  currency: "PKR",
  fiscalYearStart: 1,
  userId: mockUser.id,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockCategory = {
  id: "test-category-id",
  name: "Test Category",
  type: "EXPENSE" as const,
  businessId: mockBusiness.id,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function setupAuthenticatedUser() {
  vi.mocked(currentUser).mockResolvedValue(mockUser as any);
}

export function setupUnauthenticatedUser() {
  vi.mocked(currentUser).mockResolvedValue(null);
}

export function resetAllMocks() {
  vi.clearAllMocks();
}

export { db };
