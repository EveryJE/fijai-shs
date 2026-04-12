"use client";

import { TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";

interface EventRowProps {
    event: any;
    children: React.ReactNode;
}

export function EventRow({ event, children }: EventRowProps) {
    const router = useRouter();

    const handleRowClick = () => {
        router.push(`/dashboard/events/${event.id}`);
    };

    return (
        <TableRow
            className="hover:bg-muted/50 transition-colors cursor-pointer group"
            onClick={handleRowClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    handleRowClick();
                }
            }}
            tabIndex={0}
            role="link"
            aria-label={`View details for ${event.title}`}
        >
            {children}
        </TableRow>
    );
}
