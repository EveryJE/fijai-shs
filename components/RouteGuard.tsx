"use client";
import { useRoutePermission } from "@/hooks/useRoutePermission";

export function RouteGuard({ user, children }: { user: any, children: React.ReactNode }) {
  const permitted = useRoutePermission(user);

  if (!permitted) {
    return <div style={{ color: "red", textAlign: "center", marginTop: 40 }}>You are not permitted to view this page.</div>;
  }
  return <>{children}</>;
}
