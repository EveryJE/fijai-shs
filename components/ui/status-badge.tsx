"use client"

import { Check, Clock, X, AlertTriangle, Minus, Ban, Play, Calendar, Crown, ShieldCheck, User, CreditCard } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type StatusVariant =
    | 'active'
    | 'inactive'
    | 'approved'
    | 'pending'
    | 'review'
    | 'rejected'
    | 'cancelled'
    | 'warning'
    | 'success'
    | 'current'
    | 'past'
    | 'draft'
    | 'closed'
    | 'view'
    | 'info'
    | 'error'
    | 'default'
    | 'completed'
    | 'ongoing'
    | 'ended'
    | 'published'
    | 'upcoming'
    | 'owner'
    | 'admin'
    | 'member'
    | 'rsvp'
    | 'cardholder'
    | 'paid'

interface StatusConfig {
    icon: LucideIcon
    iconBgColor: string
    textColor: string
    borderColor: string
    bgColor: string
    defaultText: string
}

const statusConfigs: Record<StatusVariant, StatusConfig> = {
    active: {
        icon: Check,
        iconBgColor: "bg-emerald-500",
        textColor: "text-emerald-700",
        borderColor: "border-emerald-200",
        bgColor: "bg-emerald-50",
        defaultText: "Active",
    },
    paid: {
        icon: Check,
        iconBgColor: "bg-emerald-500",
        textColor: "text-emerald-700",
        borderColor: "border-emerald-200",
        bgColor: "bg-emerald-50",
        defaultText: "Paid",
    },
    inactive: {
        icon: Minus,
        iconBgColor: "bg-red-500",
        textColor: "text-red-700",
        borderColor: "border-red-200",
        bgColor: "bg-red-50",
        defaultText: "Archived",
    },
    approved: {
        icon: Check,
        iconBgColor: "bg-emerald-500",
        textColor: "text-emerald-700",
        borderColor: "border-emerald-200",
        bgColor: "bg-emerald-50",
        defaultText: "Approved",
    },
    completed: {
        icon: Check,
        iconBgColor: "bg-emerald-500",
        textColor: "text-emerald-700",
        borderColor: "border-emerald-200",
        bgColor: "bg-emerald-50",
        defaultText: "Completed",
    },
    pending: {
        icon: Clock,
        iconBgColor: "bg-amber-500",
        textColor: "text-amber-700",
        borderColor: "border-amber-200",
        bgColor: "bg-amber-50",
        defaultText: "Pending",
    },
    review: {
        icon: Clock,
        iconBgColor: "bg-amber-500",
        textColor: "text-amber-700",
        borderColor: "border-amber-200",
        bgColor: "bg-amber-50",
        defaultText: "In Review",
    },
    rejected: {
        icon: X,
        iconBgColor: "bg-red-500",
        textColor: "text-red-700",
        borderColor: "border-red-200",
        bgColor: "bg-red-50",
        defaultText: "Rejected",
    },
    cancelled: {
        icon: Ban,
        iconBgColor: "bg-gray-500",
        textColor: "text-gray-700",
        borderColor: "border-gray-200",
        bgColor: "bg-gray-50",
        defaultText: "Cancelled",
    },
    warning: {
        icon: AlertTriangle,
        iconBgColor: "bg-orange-500",
        textColor: "text-orange-700",
        borderColor: "border-orange-200",
        bgColor: "bg-orange-50",
        defaultText: "Warning",
    },
    success: {
        icon: Check,
        iconBgColor: "bg-emerald-500",
        textColor: "text-emerald-700",
        borderColor: "border-emerald-200",
        bgColor: "bg-emerald-50",
        defaultText: "Success",
    },
    current: {
        icon: Check,
        iconBgColor: "bg-emerald-500",
        textColor: "text-emerald-700",
        borderColor: "border-emerald-200",
        bgColor: "bg-emerald-50",
        defaultText: "Current",
    },
    past: {
        icon: Minus,
        iconBgColor: "bg-slate-500",
        textColor: "text-slate-700",
        borderColor: "border-slate-200",
        bgColor: "bg-slate-50",
        defaultText: "Past",
    },
    draft: {
        icon: Clock,
        iconBgColor: "bg-blue-500",
        textColor: "text-blue-700",
        borderColor: "border-blue-200",
        bgColor: "bg-blue-50",
        defaultText: "Draft",
    },
    closed: {
        icon: X,
        iconBgColor: "bg-red-500",
        textColor: "text-red-700",
        borderColor: "border-red-200",
        bgColor: "bg-red-50",
        defaultText: "Closed",
    },
    info: {
        icon: Clock,
        iconBgColor: "bg-blue-500",
        textColor: "text-blue-700",
        borderColor: "border-blue-200",
        bgColor: "bg-blue-50",
        defaultText: "Info",
    },
    error: {
        icon: X,
        iconBgColor: "bg-red-500",
        textColor: "text-red-700",
        borderColor: "border-red-200",
        bgColor: "bg-red-50",
        defaultText: "Error",
    },
    default: {
        icon: Minus,
        iconBgColor: "bg-gray-500",
        textColor: "text-gray-700",
        borderColor: "border-gray-200",
        bgColor: "bg-gray-50",
        defaultText: "",
    },
    view: {
        icon: Minus,
        iconBgColor: "bg-gray-500",
        textColor: "text-gray-700",
        borderColor: "border-gray-200",
        bgColor: "bg-gray-50",
        defaultText: "View Details",
    },
    ongoing: {
        icon: Play,
        iconBgColor: "bg-green-500",
        textColor: "text-green-700",
        borderColor: "border-green-200",
        bgColor: "bg-green-50",
        defaultText: "Ongoing",
    },
    ended: {
        icon: Check,
        iconBgColor: "bg-slate-500",
        textColor: "text-slate-700",
        borderColor: "border-slate-200",
        bgColor: "bg-slate-50",
        defaultText: "Ended",
    },
    published: {
        icon: Check,
        iconBgColor: "bg-emerald-500",
        textColor: "text-emerald-700",
        borderColor: "border-emerald-200",
        bgColor: "bg-emerald-50",
        defaultText: "Published",
    },
    upcoming: {
        icon: Calendar,
        iconBgColor: "bg-blue-500",
        textColor: "text-blue-700",
        borderColor: "border-blue-200",
        bgColor: "bg-blue-50",
        defaultText: "Upcoming",
    },
    owner: {
        icon: Crown,
        iconBgColor: "bg-[#730303]",
        textColor: "text-[#730303]",
        borderColor: "border-[#730303]/20",
        bgColor: "bg-[#730303]/5",
        defaultText: "Owner",
    },
    admin: {
        icon: ShieldCheck,
        iconBgColor: "bg-primary-500",
        textColor: "text-primary-600",
        borderColor: "border-primary/20",
        bgColor: "bg-primary/5",
        defaultText: "Admin",
    },
    member: {
        icon: User,
        iconBgColor: "bg-[#1B3A5C]",
        textColor: "text-[#1B3A5C]",
        borderColor: "border-[#1B3A5C]/20",
        bgColor: "bg-[#1B3A5C]/5",
        defaultText: "Member",
    },
    rsvp: {
        icon: User,
        iconBgColor: "bg-accent-500",
        textColor: "text-accent-600",
        borderColor: "border-accent/20",
        bgColor: "bg-accent/5",
        defaultText: "RSVP Holder",
    },
    cardholder: {
        icon: CreditCard,
        iconBgColor: "bg-secondary-500",
        textColor: "text-secondary-600",
        borderColor: "border-secondary/20",
        bgColor: "bg-secondary/5",
        defaultText: "Digital Card",
    },
}

interface StatusBadgeProps {
    readonly variant: string
    readonly text?: string
    readonly className?: string
    readonly showIcon?: boolean
    readonly size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
    sm: {
        container: "px-2 py-0.5 text-[10px]",
        icon: "size-2",
        iconPadding: "p-0.5"
    },
    md: {
        container: "px-2.5 py-1 text-xs",
        icon: "size-2.5",
        iconPadding: "p-0.5"
    },
    lg: {
        container: "px-3 py-1.5 text-sm",
        icon: "size-3",
        iconPadding: "p-1"
    }
}

export function StatusBadge({
    variant,
    text,
    className,
    showIcon = false,
    size = 'sm'
}: StatusBadgeProps): React.ReactElement {
    const normalizedVariant = variant.toLowerCase().replace(/ /g, "_") as StatusVariant
    const config = statusConfigs[normalizedVariant] || statusConfigs.default
    const Icon = config.icon
    const displayText = text || config.defaultText || variant.replace(/_/g, " ")
    const sizeConfig = sizeClasses[size]

    return (
        <span
            className={cn(
                "inline-flex w-fit gap-1.5 items-center rounded border font-medium transition-colors tracking-tight",
                config.textColor,
                config.borderColor,
                config.bgColor,
                sizeConfig.container,
                className
            )}
        >
            {showIcon && (
                <span className={cn("rounded flex items-center justify-center text-white shrink-0", config.iconBgColor, sizeConfig.iconPadding)}>
                    <Icon className={cn(sizeConfig.icon, "stroke-[3]")} />
                </span>
            )}
            <span className="capitalize">{displayText}</span>
        </span>
    )
}
