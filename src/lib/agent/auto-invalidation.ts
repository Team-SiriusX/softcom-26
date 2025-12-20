/**
 * Auto Cache Invalidation Helpers
 *
 * Automatically invalidate agent cache when financial data changes.
 * Import and use these wrappers instead of direct Prisma calls.
 */

import { db } from "@/lib/db";
import { invalidateCache } from "@/lib/agent";

/**
 * Create transaction with auto cache invalidation
 */
export async function createTransactionWithInvalidation(
  businessId: string,
  data: any
) {
  const transaction = await db.transaction.create({ data });
  
  // Invalidate cache in background (don't block)
  invalidateCache(businessId).catch((err) => {
    console.error("[Cache] Failed to invalidate after transaction create:", err);
  });

  return transaction;
}

/**
 * Update transaction with auto cache invalidation
 */
export async function updateTransactionWithInvalidation(
  businessId: string,
  id: string,
  data: any
) {
  const transaction = await db.transaction.update({
    where: { id },
    data,
  });

  invalidateCache(businessId).catch((err) => {
    console.error("[Cache] Failed to invalidate after transaction update:", err);
  });

  return transaction;
}

/**
 * Delete transaction with auto cache invalidation
 */
export async function deleteTransactionWithInvalidation(
  businessId: string,
  id: string
) {
  const transaction = await db.transaction.delete({
    where: { id },
  });

  invalidateCache(businessId).catch((err) => {
    console.error("[Cache] Failed to invalidate after transaction delete:", err);
  });

  return transaction;
}

/**
 * Bulk create transactions with auto cache invalidation
 */
export async function createManyTransactionsWithInvalidation(
  businessId: string,
  data: any[]
) {
  const result = await db.transaction.createMany({ data });

  invalidateCache(businessId).catch((err) => {
    console.error("[Cache] Failed to invalidate after bulk transaction create:", err);
  });

  return result;
}

/**
 * Update ledger account with auto cache invalidation
 */
export async function updateLedgerAccountWithInvalidation(
  businessId: string,
  id: string,
  data: any
) {
  const account = await db.ledgerAccount.update({
    where: { id },
    data,
  });

  invalidateCache(businessId).catch((err) => {
    console.error("[Cache] Failed to invalidate after account update:", err);
  });

  return account;
}

/**
 * Create ledger account with auto cache invalidation
 */
export async function createLedgerAccountWithInvalidation(
  businessId: string,
  data: any
) {
  const account = await db.ledgerAccount.create({ data });

  invalidateCache(businessId).catch((err) => {
    console.error("[Cache] Failed to invalidate after account create:", err);
  });

  return account;
}

/**
 * Generic wrapper for any business data mutation
 * Use this for other models (categories, journal entries, etc.)
 */
export async function mutateWithInvalidation<T>(
  businessId: string,
  mutation: () => Promise<T>
): Promise<T> {
  const result = await mutation();

  invalidateCache(businessId).catch((err) => {
    console.error("[Cache] Failed to invalidate after mutation:", err);
  });

  return result;
}

/**
 * Example usage in your transaction API:
 *
 * // Before
 * const transaction = await db.transaction.create({ data });
 *
 * // After
 * const transaction = await createTransactionWithInvalidation(businessId, data);
 *
 * // Or with generic wrapper
 * const transaction = await mutateWithInvalidation(businessId, () =>
 *   db.transaction.create({ data })
 * );
 */
