import { hasPermission } from "./permissions";
import { ROUTE_PERMISSIONS } from "../route-permissions";

export function canAccessRoute(pathname: string, user: { roles: string[], superAdmin?: boolean }) {
    // Find the most specific matching route (longest prefix match)
    let matched = "";
    for (const route in ROUTE_PERMISSIONS) {
        if (pathname === route || pathname.startsWith(route + "/")) {
            if (route.length > matched.length) matched = route;
        }
    }
    const requiredRoles = ROUTE_PERMISSIONS[matched] || [];
    if (!requiredRoles.length) return true;
    return hasPermission(user, requiredRoles);
}
