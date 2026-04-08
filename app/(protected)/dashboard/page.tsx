import { createClient } from "@/utils/supabase/server";
import { getProfileByEmail } from "@/lib/dal";
import { 
    getOrgStats, 
    getRecentTransactions, 
    getMostImpactUser, 
    getMonthlyRevenue, 
    getActiveEvent,
    getDigitalCardImpact
} from "@/lib/dal/stats";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    UsersIcon, 
    UserCheckIcon, 
    CreditCardIcon, 
    HeartHandshakeIcon, 
    Building2Icon,
    WalletIcon,
    FlameIcon,
    TrendingUpIcon,
    CalendarIcon
} from "lucide-react";
import { formatAmount, cn } from "@/lib/utils";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { DigitalImpactChart } from "@/components/dashboard/DigitalImpactChart";
import { MostImpactUserCard } from "@/components/dashboard/MostImpactUserCard";
import { RecentTransactionsTable } from "@/components/dashboard/RecentTransactionsTable";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [profile, stats, transactions, topDonor, revenueData, activeEvent, digitalImpact] = await Promise.all([
        user?.email ? getProfileByEmail(user.email) : null,
        getOrgStats(),
        getRecentTransactions(8),
        getMostImpactUser(),
        getMonthlyRevenue(),
        getActiveEvent(),
        getDigitalCardImpact(6)
    ]);

    const isAdmin = profile?.roles.includes("admin");

    return (
        <div className="mx-auto max-w-7xl p-6 lg:p-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            
            {/* Header / Active Event Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-4">
                     <div className="flex flex-col md:flex-row items-baseline justify-between gap-4 border-b pb-8">
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-[3px] text-[#730303] mb-1">Administrative Intelligence</p>
                            <h1 className="text-5xl font-black tracking-tighter text-[#730303] uppercase">
                                Institutional Pulse
                            </h1>
                            <p className="text-muted-foreground mt-2 text-lg font-medium">
                                Monitoring Fijai SHS Alumni Philanthropy & Impact
                            </p>
                         </div>
                         <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-full px-6 border border-muted-foreground/10 shadow-inner">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-background ring-2 ring-emerald-500/10">
                                    <span className="text-[10px] font-black text-emerald-700">{stats.totalUsers}</span>
                                </div>
                            </div>
                            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                                Global Membership
                            </span>
                         </div>
                    </div>

                    {activeEvent ? (
                        <Card className="border-none shadow-2xl bg-white overflow-hidden relative group min-h-[220px] flex flex-col justify-center">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                <FlameIcon className="w-64 h-64 text-[#730303]" />
                            </div>
                            <CardHeader className="relative px-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full border border-amber-200 mb-4 w-fit shadow-sm">
                                     <FlameIcon className="h-3 w-3 animate-pulse" />
                                     <span className="text-[10px] font-black uppercase tracking-widest">Active Campaign</span>
                                </div>
                                <CardTitle className="text-4xl font-black tracking-tight text-[#730303] uppercase max-w-2xl">{activeEvent.title}</CardTitle>
                                <CardDescription className="text-base font-medium max-w-xl line-clamp-2 mt-2">{activeEvent.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="relative px-10 pb-0">
                                <div className="flex items-center gap-8 pt-4">
                                     <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#DAA520]">
                                        <TrendingUpIcon className="h-4 w-4" />
                                        Performance Tracking Active
                                     </div>
                                     <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                                        <CalendarIcon className="h-4 w-4" />
                                        Campaign Ongoing
                                     </div>
                                </div>
                                <Link 
                                    href={`/dashboard/events/${activeEvent.id}`}
                                    className="absolute bottom-6 right-10 text-[10px] font-black uppercase tracking-[3px] text-muted-foreground hover:text-primary transition-colors border-b border-muted-foreground/20 pb-1"
                                >
                                    Manage Event Details →
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-2 border-dashed border-muted-foreground/10 bg-muted/10 h-40 flex flex-col items-center justify-center p-10 text-center">
                             <CalendarIcon className="h-8 w-8 text-muted-foreground/20 mb-3" />
                             <p className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground/40">No ongoing fundraising campaigns found</p>
                             <Link href="/dashboard/events" className="text-[10px] font-black uppercase tracking-widest text-primary mt-2">Initialize Campaign →</Link>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Logged in user info card */}
                    <Card className="border-none shadow-xl bg-white overflow-hidden text-center h-full flex flex-col justify-center p-8 bg-[radial-gradient(circle_at_top_right,rgba(115,3,3,0.05),transparent_60%)]">
                        <div className="mx-auto relative mb-6">
                            <Avatar className="h-24 w-24 border-4 border-[#DAA520]/20 mx-auto shadow-2xl transition-transform hover:scale-105 duration-500">
                                <AvatarImage src={profile?.avatarUrl || ""} />
                                <AvatarFallback className="bg-[#730303] text-white text-2xl font-black">
                                    {(profile?.fullName || "A").charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full border-2 border-white shadow-lg">
                                <Building2Icon className="h-3 w-3" />
                            </div>
                        </div>
                        <div className="space-y-1">
                             <p className="text-[10px] font-black uppercase tracking-widest text-[#DAA520]">Access Level</p>
                             <h3 className="text-xl font-black tracking-tight text-[#730303] leading-tight">{profile?.fullName || "User Account"}</h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5 justify-center mt-6">
                             {profile?.roles.map((role:any) => (
                                <div key={role} className="bg-muted px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm">
                                    {role}
                                </div>
                             ))}
                        </div>
                        <div className="pt-8 mt-auto border-t border-muted-foreground/5 py-3">
                             <Link href="/dashboard/profile" className="text-[10px] font-black uppercase tracking-[3px] text-muted-foreground hover:text-primary transition-colors">
                                Identity & Security →
                             </Link>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Donations" 
                    value={formatAmount(stats.totalDonated)} 
                    icon={HeartHandshakeIcon} 
                    color="text-emerald-600"
                    trend="+12% from last week"
                />
                <StatCard 
                    title="Alumni Members" 
                    value={stats.totalUsers.toString()} 
                    icon={UsersIcon} 
                    color="text-blue-600"
                    trend="Institutional reach"
                />
                <StatCard 
                    title="RSVP Referrals" 
                    value={stats.rsvpUsers.toString()} 
                    icon={UserCheckIcon} 
                    color="text-[#730303]"
                    trend="Contact influence"
                />
                <StatCard 
                    title="Digital Cards" 
                    value={stats.cardholders.toString()} 
                    icon={CreditCardIcon} 
                    color="text-[#DAA520]"
                    trend="Campaign adoption"
                />
            </div>

            {/* Charts and Impact Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                <RevenueChart data={revenueData} />
                <DigitalImpactChart data={digitalImpact} />
                <MostImpactUserCard user={topDonor} />
            </div>

            {/* Transactions Section */}
            <div className="space-y-6">
                <RecentTransactionsTable transactions={transactions} />
            </div>

        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
    return (
        <Card className="border-none shadow-xl overflow-hidden bg-white hover:bg-muted/5 transition-all duration-300 relative group">
            <div className="absolute top-0 left-0 w-1 h-full bg-muted-foreground/10 group-hover:bg-primary transition-colors" />
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-[#730303]/60">{title}</CardTitle>
                <div className={cn("p-2 rounded-xl bg-muted/50 border border-muted ring-4 ring-muted/20", color)}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-black tracking-tighter text-[#730303]">{value}</div>
                <div className="flex items-center gap-1.5 mt-3 opacity-60">
                     <p className="text-[10px] font-bold uppercase tracking-widest">{trend}</p>
                </div>
            </CardContent>
        </Card>
    );
}
