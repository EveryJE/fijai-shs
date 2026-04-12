"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon, HomeIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Breadcrumbs() {
    const pathname = usePathname();
    const pathSegments = pathname.split("/").filter((v) => v);

    // Map segments to readable names
    const segmentMap: Record<string, string> = {
        dashboard: "Home",
        events: "Events",
        donations: "Donations",
        profile: "Profile",
        organization: "Organization",
        invite: "Invite Members",
        members: "Members",
        settings: "Settings",
    };

    return (
        <nav className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
            {pathSegments.map((segment, index) => {
                const isLast = index === pathSegments.length - 1;
                const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
                const label = segmentMap[segment] || segment;

                // Handle UUIDs or IDs in paths (optional: you could fetch names, but static map is safer for now)
                const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) || /^[0-9a-z]{20,}$/i.test(segment);
                const displayLabel = isId ? "Details" : label;

                return (
                    <div key={href} className="flex items-center gap-1">
                        {index > 0 && <ChevronRightIcon className="h-3.5 w-3.5 opacity-40" />}
                        {isLast ? (
                            <span className="text-primary font-black animate-in fade-in slide-in-from-left-1 duration-300">
                                {displayLabel}
                            </span>
                        ) : (
                            <Link
                                href={href}
                                className="hover:text-foreground hover:bg-muted/50 px-2 py-0.5 rounded-md transition-all flex items-center gap-1.5"
                            >
                                {segment === "dashboard" && <HomeIcon className="h-3.5 w-3.5" />}
                                {displayLabel}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
