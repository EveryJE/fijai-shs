import { getDonationsByMethod, getDonationBreakdown } from "@/lib/dal/stats";
import { getAllEvents } from "@/lib/dal/events";
import { formatAmount } from "@/lib/utils";
import { HeartHandshakeIcon, WalletIcon, HandCoinsIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DonationsClient } from "@/components/dashboard/DonationsClient";

import { createClient } from "@/utils/supabase/server";

export default async function DonationsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [paystackDonations, manualDonations, breakdown, events] = await Promise.all([
        getDonationsByMethod("paystack", 100),
        getDonationsByMethod("manual", 100),
        getDonationBreakdown(),
        getAllEvents(),
    ]);

    return (
        <div className="max-w-7xl p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black tracking-tight">Donations</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage all contributions — both online payments and cash donations.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                            <HeartHandshakeIcon className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Total Raised</p>
                            <p className="text-lg font-black tracking-tight">{formatAmount(breakdown.paystackTotal + breakdown.manualTotal)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
                            <WalletIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Online ({breakdown.paystackCount})</p>
                            <p className="text-lg font-black tracking-tight">{formatAmount(breakdown.paystackTotal)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                            <HandCoinsIcon className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Manual ({breakdown.manualCount})</p>
                            <p className="text-lg font-black tracking-tight">{formatAmount(breakdown.manualTotal)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabbed Donations Table */}
            <DonationsClient
                paystackDonations={paystackDonations}
                manualDonations={manualDonations}
                events={events}
                currentUserId={user?.id}
            />
        </div>
    );
}
