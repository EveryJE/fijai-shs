"use client";
import { useMemo } from "react";
import { canAccessRoute } from "@/lib/utils/checkRoutePermission";
import { usePathname } from "next/navigation";

export function useRoutePermission(user: { roles: string[], superAdmin?: boolean }) {
    const pathname = usePathname();
    return useMemo(() => canAccessRoute(pathname, user), [pathname, user]);
}
