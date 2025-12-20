# Backend Unit Tests

This directory contains unit tests for the backend API endpoints using **Vitest**.

## Running Tests

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with UI
pnpm test:ui
```

## Test Structure

### Files
- `helpers.ts` - Test utilities, mock data, and helper functions
- `business.test.ts` - Tests for business endpoints
- `categories.test.ts` - Tests for categories endpoints  
- `transactions.test.ts` - Tests for transactions endpoints

### Testing Pattern

Each test file follows this pattern:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import controller from "@/app/api/[[...route]]/controllers/(base)/controller";
import { Hono } from "hono";
import { setupAuthenticatedUser, resetAllMocks, db } from "./helpers";

// Helper to test Hono apps
async function testHonoApp(app: Hono, path: string, options?: RequestInit) {
  const req = new Request(`http://localhost${path}`, options);
  const res = await app.request(req);
  return res;
}

describe("Controller Tests", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it("should handle request", async () => {
    setupAuthenticatedUser();
    vi.mocked(db.model.findMany).mockResolvedValue([...] as any);

    const res = await testHonoApp(controller, "/");
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data).toBeDefined();
  });
});
```

## Mock Data

The `helpers.ts` file provides:

- **`mockUser`** - Test user object
- **`mockBusiness`** - Test business object
- **`mockCategory`** - Test category object
- **`setupAuthenticatedUser()`** - Mock authenticated user
- **`setupUnauthenticatedUser()`** - Mock unauthenticated state
- **`resetAllMocks()`** - Clear all mocks between tests

## Mocked Dependencies

The test setup automatically mocks:

- **Prisma client** (`@/lib/db`) - All database operations
- **currentUser helper** (`@/lib/current-user`) - Authentication

## Writing New Tests

1. Create a new test file: `<endpoint>.test.ts`
2. Import test utilities from `./helpers`
3. Use `testHonoApp()` helper to test Hono controllers
4. Mock database calls using `vi.mocked(db.model.method)`
5. Assert responses and verify mock calls

Example:

```typescript
it("should create a resource", async () => {
  setupAuthenticatedUser();
  vi.mocked(db.resource.create).mockResolvedValue(mockResource as any);

  const res = await testHonoApp(controller, "/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test" }),
  });

  expect(res.status).toBe(201);
  expect(db.resource.create).toHaveBeenCalled();
});
```

## Coverage

To add test coverage reporting, install:

```bash
pnpm add -D @vitest/coverage-v8
```

Then run:

```bash
pnpm test:run --coverage
```
