"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2Icon, RotateCcwIcon, Loader2 } from "lucide-react";
import { toggleUserStatus } from "@/lib/actions/auth";
import { toast } from "sonner";
import { CreateUserForm } from "@/components/dashboard/CreateUserForm";

interface MemberRowActionsProps {
    profile: {
        id: string;
        email: string;
        fullName: string | null;
        classYear: string | null;
        roles: string[];
        isActive: boolean;
    };
    events: any[];
}

export function MemberRowActions({ profile, events }: MemberRowActionsProps) {
    const [loading, setLoading] = useState(false);

    const handleToggleStatus = async () => {
        setLoading(true);
        try {
            const result = await toggleUserStatus(profile.id, !profile.isActive);
            if (result.success) {
                toast.success(profile.isActive ? "Member deactivated successfully" : "Member reactivated successfully");
            } else {
                toast.error(result.error || "Failed to update member status");
            }
        } catch (err) {
            toast.error("A connection error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <CreateUserForm events={events} profile={profile} />
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                onClick={handleToggleStatus}
                disabled={loading}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : profile.isActive ? (
                    <Trash2Icon className="h-4 w-4" />
                ) : (
                    <RotateCcwIcon className="h-4 w-4" />
                )}
            </Button>
        </div>
    );
}
