"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2Icon, RotateCcwIcon, Loader2, MailIcon } from "lucide-react";
import { toggleUserStatus, resendInvitationEmail } from "@/lib/actions/auth";

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
    const [resending, setResending] = useState(false);


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

    const handleResendEmail = async () => {
        setResending(true);
        try {
            const result = await resendInvitationEmail(profile.id);
            if (result.success) {
                toast.success(`Invitation email resent to ${profile.email}`);
            } else {
                toast.error(result.error || "Failed to resend invitation email");
            }
        } catch (err) {
            toast.error("A connection error occurred. Please try again.");
        } finally {
            setResending(false);
        }
    };


    return (
        <div className="flex items-center gap-2">
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                onClick={handleResendEmail}
                disabled={resending || !profile.isActive}
                title="Resend Invitation Email"
            >
                {resending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <MailIcon className="h-4 w-4" />
                )}
            </Button>
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
