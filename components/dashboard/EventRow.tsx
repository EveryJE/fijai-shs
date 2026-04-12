"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface EventRowProps {
    event: any;
    children: React.ReactNode;
}

export function EventRow({ event, children }: EventRowProps) {
    const router = useRouter();

    return (
        <TableRow
            className="hover:bg-muted/50 transition-colors cursor-pointer group"
            onClick={() => router.push(`/dashboard/events/${event.id}`)}
        >
            {children}
        </TableRow>
    );
}
