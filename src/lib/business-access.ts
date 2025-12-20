import { db } from "@/lib/db";
import { BusinessRole } from "@/generated/prisma";

/**
 * Get a user's role in a business
 * Returns OWNER if they own the business, or their member role if they're a member
 */
export async function getUserBusinessRole(
  userId: string,
  businessId: string
): Promise<BusinessRole | null> {
  // Check if they own the business
  const business = await db.business.findFirst({
    where: {
      id: businessId,
      userId: userId,
    },
  });

  if (business) {
    return "OWNER";
  }

  // Check if they're a member
  const member = await db.businessMember.findUnique({
    where: {
      businessId_userId: {
        businessId,
        userId,
      },
      status: "ACTIVE",
    },
  });

  return member?.role || null;
}

/**
 * Check if a user has access to a business (owner or active member)
 */
export async function hasBusinessAccess(
  userId: string,
  businessId: string
): Promise<boolean> {
  const role = await getUserBusinessRole(userId, businessId);
  return role !== null;
}

/**
 * Check if a user is the owner of a business
 */
export async function isBusinessOwner(
  userId: string,
  businessId: string
): Promise<boolean> {
  const business = await db.business.findFirst({
    where: {
      id: businessId,
      userId: userId,
    },
  });

  return !!business;
}

/**
 * Get all businesses a user has access to (owned + memberships)
 */
export async function getUserBusinesses(userId: string) {
  const ownedBusinesses = await db.business.findMany({
    where: { userId },
  });

  const memberships = await db.businessMember.findMany({
    where: {
      userId,
      status: "ACTIVE",
    },
    include: {
      business: true,
    },
  });

  return {
    owned: ownedBusinesses,
    memberships: memberships.map(m => ({
      ...m.business,
      role: m.role,
      membershipId: m.id,
    })),
  };
}
