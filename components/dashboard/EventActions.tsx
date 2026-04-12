"use client";

import { useState, useTransition } from "react";
import { EventSheet } from "@/components/dashboard/EventSheet";
import { Button } from "@/components/ui/button";
import { EyeIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon, AlertTriangleIcon, Loader2Icon } from "lucide-react";
import { deleteEvent } from "@/lib/actions/events";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EventActionsProps {
    event: any;
}

export function EventActions({ event }: EventActionsProps) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleDelete = () => {
        startTransition(async () => {
            try {
                await deleteEvent(event.id);
                toast.success("Event deleted successfully");
                setDeleteDialogOpen(false);
                router.refresh();
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to delete event");
            }
        });
    };

    return (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => router.push(`/dashboard/events/${event.id}`)}
            >
                <EyeIcon className="h-4 w-4" />
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                            <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                    }
                />
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuGroup>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSheetOpen(true)} className="cursor-pointer">
                            <PencilIcon className="mr-2 h-3.5 w-3.5" />
                            Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="cursor-pointer text-destructive hover:text-red-200 focus:text-red-200">
                            <Trash2Icon className="mr-2 h-3.5 w-3.5" />
                            Delete Event
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Hidden Sheet triggered by state */}
            <EventSheet
                event={event}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                trigger={<span className="hidden" />}
            />

            {/* Delete Confirmation Modal */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-destructive/10">
                                <AlertTriangleIcon className="h-5 w-5 text-destructive" />
                            </div>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="pt-2">
                            This action cannot be undone. This will permanently delete the event
                            <span className="font-black text-foreground"> "{event.title}"</span> and remove all associated data, including categories and donation items.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <><Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
                            ) : (
                                "Delete Event"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
