import { createClient } from "@/utils/supabase/server";
import { getProfileByEmail } from "@/lib/dal";
import {
    getOrgStats,
    getMostImpactUser,
    getMonthlyRevenue,
    getActiveEvents,
    getDigitalCardImpact,
    getDonationBreakdown,
    getDonationByItemCategory
} from "@/lib/dal/stats";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    CreditCardIcon,
    HeartHandshakeIcon,
    CalendarIcon,
    ArrowRightIcon,
    WalletIcon,
    HandCoinsIcon
} from "lucide-react";
import { formatAmount, cn } from "@/lib/utils";
import Link from "next/link";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { DigitalImpactChart } from "@/components/dashboard/DigitalImpactChart";
import { MostImpactUserCard } from "@/components/dashboard/MostImpactUserCard";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [
        profile,
        stats,
        topDonor,
        revenueData,
        activeEvents,
        digitalImpact,
        donationBreakdown,
        categoryData
    ] = await Promise.all([
        user?.email ? getProfileByEmail(user.email) : null,
        getOrgStats(),
        getMostImpactUser(),
        getMonthlyRevenue(),
        getActiveEvents(),
        getDigitalCardImpact(6),
        getDonationBreakdown(),
        getDonationByItemCategory()
    ]);

    return (
        <div className="max-w-7xl p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 pb-2">
                <div>
                    <h1 className="text-3xl font-black ">
                        Dashboard
                    </h1>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-medium">Welcome, {profile?.fullName?.split(" ")[0] || "User"}</span>
                </div>
            </div>

            {/* Active Events - MOVED TO TOP */}
            {activeEvents.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-[2px] text-muted-foreground">Active Events</h2>
                        <Link href="/dashboard/events" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                            View All <ArrowRightIcon className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {activeEvents.map((event: any) => (
                            <Link key={event.id} href={`/dashboard/events/${event.id}`}>
                                <Card className=" hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer group h-full">
                                    <CardContent className="px-3 flex flex-col justify-between h-full gap-2">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <StatusBadge variant="active" size="sm" />
                                                <div className="flex items-center gap-2">
                                                    <CalendarIcon className="h-3 w-3 text-muted-foreground/30" />
                                                    <span>
                                                        {event.startDate
                                                            ? format(new Date(event.startDate), "MMM d, yyyy")
                                                            : "No date"}
                                                    </span>
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-[13px] leading-tight group-hover:text-primary transition-colors line-clamp-1">
                                                {event.title}
                                            </h3>
                                        </div>

                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Raised"
                    value={formatAmount(stats.totalDonated)}
                    icon={HeartHandshakeIcon}
                    accent="emerald"
                />
                <StatCard
                    title="Paystack"
                    value={formatAmount(donationBreakdown.paystackTotal)}
                    icon={WalletIcon}
                    accent="blue"
                />
                <StatCard
                    title="Manual"
                    value={formatAmount(donationBreakdown.manualTotal)}
                    icon={HandCoinsIcon}
                    accent="amber"
                />
                <StatCard
                    title="Digital Cards"
                    value={stats.cardholders.toString()}
                    icon={CreditCardIcon}
                    accent="violet"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueChart data={revenueData} />
                <CategoryPieChart data={categoryData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Keep these as well but maybe in a lower section */}
                <DigitalImpactChart data={digitalImpact} />
                <MostImpactUserCard user={topDonor} />
            </div>

        </div>
    );
}

function StatCard({ title, value, icon: Icon, accent }: {
    title: string;
    value: string;
    icon: any;
    accent: "emerald" | "blue" | "amber" | "violet";
}) {
    const accentMap = {
        emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
        blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
        amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
        violet: { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-100" },
    };
    const a = accentMap[accent];

    return (
        <Card className=" hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">{title}</p>
                    <p className="text-xl font-black  truncate">{value}</p>
                </div>
                <div className={cn("p-2 rounded-lg shrink-0", a.bg, a.border, "border")}>
                    <Icon className={cn("h-4 w-4", a.text)} />
                </div>
            </CardContent>
        </Card>
    );
}
