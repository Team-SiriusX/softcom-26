import { BusinessRole } from "@/generated/prisma";

export const PERMISSIONS = {
  // Business management
  MANAGE_BUSINESS: ["OWNER"],
  DELETE_BUSINESS: ["OWNER"],
  
  // Member management
  MANAGE_MEMBERS: ["OWNER", "ADMIN"],
  VIEW_MEMBERS: ["OWNER", "ADMIN", "ACCOUNTANT", "VIEWER"],
  
  // Transactions & Accounting
  CREATE_TRANSACTION: ["OWNER", "ADMIN", "ACCOUNTANT"],
  EDIT_TRANSACTION: ["OWNER", "ADMIN", "ACCOUNTANT"],
  DELETE_TRANSACTION: ["OWNER", "ADMIN"],
  VIEW_TRANSACTION: ["OWNER", "ADMIN", "ACCOUNTANT", "VIEWER"],
  
  // Accounts & Categories
  MANAGE_ACCOUNTS: ["OWNER", "ADMIN", "ACCOUNTANT"],
  VIEW_ACCOUNTS: ["OWNER", "ADMIN", "ACCOUNTANT", "VIEWER"],
  
  // Reports & Analytics
  VIEW_REPORTS: ["OWNER", "ADMIN", "ACCOUNTANT", "VIEWER"],
  EXPORT_DATA: ["OWNER", "ADMIN", "ACCOUNTANT"],
  
  // Invoices & Clients
  MANAGE_INVOICES: ["OWNER", "ADMIN", "ACCOUNTANT"],
  MANAGE_CLIENTS: ["OWNER", "ADMIN", "ACCOUNTANT"],
  VIEW_INVOICES: ["OWNER", "ADMIN", "ACCOUNTANT", "VIEWER"],
  VIEW_CLIENTS: ["OWNER", "ADMIN", "ACCOUNTANT", "VIEWER"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: BusinessRole, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return (allowedRoles as readonly string[]).includes(role);
}

/**
 * Check if a role can perform any of the given permissions
 */
export function hasAnyPermission(role: BusinessRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role can perform all of the given permissions
 */
export function hasAllPermissions(role: BusinessRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: BusinessRole): Permission[] {
  return Object.entries(PERMISSIONS)
    .filter(([_, allowedRoles]) => (allowedRoles as readonly string[]).includes(role))
    .map(([permission]) => permission as Permission);
}

/**
 * Role hierarchy for comparison
 */
const ROLE_HIERARCHY: Record<BusinessRole, number> = {
  VIEWER: 1,
  ACCOUNTANT: 2,
  ADMIN: 3,
  OWNER: 4,
};

/**
 * Check if one role is higher or equal to another
 */
export function isRoleHigherOrEqual(role: BusinessRole, compareRole: BusinessRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[compareRole];
}

/**
 * Check if one role is higher than another
 */
export function isRoleHigher(role: BusinessRole, compareRole: BusinessRole): boolean {
  return ROLE_HIERARCHY[role] > ROLE_HIERARCHY[compareRole];
}
