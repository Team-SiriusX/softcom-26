# AI Coding Assistant Instructions

## Architecture Overview

This is a **Next.js 15 + Prisma accounting application** with double-entry bookkeeping. Key architecture:

- **API Layer**: Hono-based REST API in `src/app/api/[[...route]]/route.ts` with catch-all routing
- **Data Layer**: Custom Prisma client generated to `src/generated/prisma` (not default location)
- **Authentication**: Better Auth with session-based auth and middleware protection
- **State**: TanStack Query for server state, React Context for client state (selected business)
- **Database**: PostgreSQL with double-entry accounting (journal entries, ledger accounts)

## Critical Patterns

### Custom Prisma Location
Prisma client is generated to `src/generated/prisma` (defined in schema.prisma). Always import:
```typescript
import { PrismaClient } from "@/generated/prisma";
```

### API Structure (Hono)
- Controllers live in `src/app/api/[[...route]]/controllers/(base)/`
- Export controllers from `index.ts`, then register in `route.ts`
- Type-safe client via Hono RPC: `hc<AppType>()` in `src/lib/hono.ts`

Example controller pattern:
```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/current-user";

const app = new Hono()
  .get("/", async (c) => {
    const user = await currentUser();
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    // ... logic
  });

export default app;
```

### Authentication Patterns
- **Server-side**: Use `currentUser()` helper in API routes (from `src/lib/current-user.ts`)
- **Client-side**: Use `useSession()` from `src/lib/auth-client.ts`
- Middleware protects routes based on `src/routes.ts` config (publicRoutes, authRoutes)
- Better Auth config in `src/lib/auth.ts` with Prisma adapter

### Data Fetching (TanStack Query)
- Custom hooks in `src/hooks/` follow naming: `useGet*`, `useCreate*`, `useUpdate*`, `useDelete*`
- Use Hono RPC client for type safety: `InferRequestType`, `InferResponseType`
- Example from `use-business.ts`:
```typescript
export const useCreateBusiness = () => {
  const queryClient = useQueryClient();
  return useMutation<CreateBusinessResponse, Error, CreateBusinessRequest>({
    mutationFn: async (json) => {
      const response = await client.api.business.$post({ json });
      if (!response.ok) throw new Error("Failed to create business");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
};
```

### Business Context Pattern
Multi-tenant architecture where users own businesses:
- Selected business stored in `BusinessProvider` context + localStorage
- Pages check `selectedBusinessId` from `useSelectedBusiness()`
- Show "No Business Selected" alert if missing (see `src/app/dashboard/page.tsx`)
- All API calls scoped by businessId via middleware or query params

### Double-Entry Accounting Model
- **Transactions**: High-level user-facing records (income/expense/transfer)
- **JournalEntries**: Low-level accounting records linked to transactions
- **LedgerAccounts**: Chart of accounts with currentBalance tracking
- Each transaction creates 2+ journal entries (debit/credit)
- Account types: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE

## Developer Workflows

### Database Changes
```bash
# After editing schema.prisma
pnpm dlx prisma db push          # Push schema changes
pnpm dlx prisma generate         # Regenerate client to src/generated/prisma

# Seeding (requires userId in seed/index.ts)
npx tsx seed/index.ts            # Run comprehensive seed data
```

### Development
```bash
pnpm dev                         # Dev server with Turbopack
pnpm build                       # Production build
pnpm lint                        # ESLint
```

### Environment Variables
Required in `.env`:
```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000"  # Optional, defaults to localhost
```

## Project Conventions

### File Organization
- UI components in `src/components/ui/` (shadcn/ui)
- Feature components in `src/components/[feature]/`
- Hooks in `src/hooks/` named after feature (use-business.ts, use-transactions.ts)
- API controllers in `src/app/api/[[...route]]/controllers/(base)/`
- Route groups: `(auth)` for auth pages, `dashboard` for protected pages

### Import Aliases
Always use `@/*` for src imports (configured in tsconfig.json)

### Validation
Use Zod schemas with Hono's `zValidator` middleware in API routes

### UI Components
- shadcn/ui components with Tailwind CSS v4
- Radix UI primitives as base
- Use `cn()` utility from `src/lib/utils.ts` for class merging
- Icons from `lucide-react`

### Type Safety
- Leverage Hono RPC types: `InferRequestType`, `InferResponseType`
- Prisma types imported from `@/generated/prisma`
- React Hook Form with Zod resolvers for forms

## Common Gotchas

1. **Prisma import path**: Use `@/generated/prisma`, not `@prisma/client`
2. **Middleware auth**: API routes bypass middleware, must use `currentUser()` helper
3. **Business context**: Always check `selectedBusinessId` exists before API calls
4. **Hono routing**: Controllers must be registered in both `controllers/(base)/index.ts` and `route.ts`
5. **Protected pages**: Add to `publicRoutes` or `authRoutes` arrays in `src/routes.ts` for middleware
6. **Query invalidation**: Invalidate relevant queries after mutations for UI updates
