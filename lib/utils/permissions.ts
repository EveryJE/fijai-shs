// Centralized permissions utility for role-based access and super admin override

export type Role = 'admin' | 'rsvp' | 'cardholder' | 'org' | 'event_manager' | string;

export interface UserPermissions {
    roles: Role[];
    superAdmin?: boolean;
}

// List of all possible roles in the system (update as needed)
export const ALL_ROLES: Role[] = [
    'admin',
    'rsvp',
    'cardholder',

];

/**
 * Checks if a user has a specific role or is a super admin (who has all permissions).
 * @param user - UserPermissions object
 * @param required - Role or array of roles required
 * @returns true if user has permission
 */
export function hasPermission(user: UserPermissions, required: Role | Role[]): boolean {
    if (user.superAdmin) return true;
    const requiredRoles = Array.isArray(required) ? required : [required];
    return user.roles.some((role) => requiredRoles.includes(role));
}

/**
 * Returns all permissions for a user, including super admin override.
 * @param user - UserPermissions object
 * @returns array of roles the user effectively has
 */
export function getEffectiveRoles(user: UserPermissions): Role[] {
    if (user.superAdmin) return ALL_ROLES;
    return user.roles;
}

/**
 * Utility to create a super admin UserPermissions object for development/testing.
 */
export function createSuperAdminUser(): UserPermissions {
    return { roles: [], superAdmin: true };
}
