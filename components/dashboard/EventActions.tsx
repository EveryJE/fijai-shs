"use client";

import { EventSheet } from "@/components/dashboard/EventSheet";
import { Button } from "@/components/ui/button";
import { EyeIcon } from "lucide-react";

interface EventActionsProps {
    event: any;
}

export function EventActions({ event }: EventActionsProps) {
    return (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <EventSheet event={event} />
            <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <EyeIcon className="h-4 w-4 text-primary" />
            </Button>
        </div>
    );
}
