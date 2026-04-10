import {
    LayoutDashboard,
    Users,
    HeartHandshake,
    CalendarDays,
    Settings,
    UserCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    roles?: string[];
    items?: {
        title: string;
        url: string;
    }[];
}

export const navMain: NavItem[] = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Members",
        url: "/dashboard/participants",
        icon: Users,
        roles: ["admin"],
        items: [
            {
                title: "Member Registry",
                url: "/dashboard/invite",
            },
        ],
    },
    {
        title: "Donations",
        url: "/dashboard/donations",
        icon: HeartHandshake,
        roles: ["admin", "rsvp", "cardholder"],
    },
    {
        title: "Events",
        url: "/dashboard/events",
        icon: CalendarDays,
        roles: ["admin"],
    },
    {
        title: "Organization",
        url: "/dashboard/organization",
        icon: Settings,
        roles: ["admin"],
    },
];

export const navUser: NavItem[] = [
    {
        title: "My Profile",
        url: "/dashboard/profile",
        icon: UserCircle,
    },
];
