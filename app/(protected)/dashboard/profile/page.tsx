import { createClient } from "@/utils/supabase/server";
import { getProfileByEmail } from "@/lib/dal";
import { 
    getDonationsByContactPerson, 
    getDonationsByDigitalCard,
    getDonationsByUser
} from "@/lib/dal/donations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileGeneralSettings } from "@/components/dashboard/ProfileGeneralSettings";
import { PasswordResetForm } from "@/components/dashboard/PasswordResetForm";
import { ImpactTabContent } from "@/components/dashboard/ImpactTabContent";
import { UserCircleIcon, KeyIcon, HeartHandshakeIcon, GraduationCapIcon } from "lucide-react";

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const profile = user?.email 
        ? await getProfileByEmail(user.email) 
        : null;

    if (!profile) return <div>Profile not found</div>;

    const isAdmin = profile.roles.includes("admin");
    const isRSVP = profile.roles.includes("rsvp");
    const isCardholder = profile.roles.includes("cardholder");

    // Aggregate all impact donations for the user
    // 1. Donations raised via Referral Link (RSVP)
    // 2. Donations raised via Digital Card
    // 3. Donations made personally by the user (userId match)
    const [referralDonations, cardDonations, personalDonations] = await Promise.all([
        isRSVP && profile.contactPersons?.[0] 
            ? getDonationsByContactPerson(profile.contactPersons[0].id) 
            : Promise.resolve([]),
        isCardholder && profile.digitalCards?.[0] 
            ? getDonationsByDigitalCard(profile.digitalCards[0].id) 
            : Promise.resolve([]),
        getDonationsByUser(profile.id)
    ]);

    // Combine and deduplicate if necessary (though usually they are distinct)
    const allImpactDonations = [...referralDonations, ...cardDonations, ...personalDonations];
    
    // Use a Map to deduplicate by ID just in case and serialize Decimals for Client Components
    const uniqueDonations = Array.from(
        new Map(allImpactDonations.map(d => [d.id, {
            ...d,
            amount: Number(d.amount), // Serialize Decimal to Number
            donationItem: d.donationItem ? {
                ...d.donationItem,
                targetAmount: d.donationItem.targetAmount ? Number(d.donationItem.targetAmount) : null
            } : null
        }])).values()
    );

    return (
        <div className="max-w-6xl p-6 lg:p-10 space-y-12">
            <div className="flex flex-col md:flex-row items-baseline justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#730303] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
                         <GraduationCapIcon className="w-10 h-10" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-[#730303] uppercase">
                            My Profile
                        </h1>
                        <p className="text-muted-foreground mt-0.5 text-lg font-medium">
                            {profile.fullName || "User Account"} {profile.aliasName && `(${profile.aliasName})`}
                        </p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="general" className="space-y-10">
                <TabsList variant="institutional" className="p-1">
                    <TabsTrigger value="general" className="px-10 py-2.5 font-black uppercase tracking-[2px] text-[10px]">
                        <UserCircleIcon className="mr-2 h-4 w-4" />
                        General
                    </TabsTrigger>
                    <TabsTrigger value="security" className="px-10 py-2.5 font-black uppercase tracking-[2px] text-[10px]">
                        <KeyIcon className="mr-2 h-4 w-4" />
                        Security
                    </TabsTrigger>
                    {(isRSVP || isCardholder) && (
                        <TabsTrigger value="impact" className="px-10 py-2.5 font-black uppercase tracking-[2px] text-[10px]">
                            <HeartHandshakeIcon className="mr-2 h-4 w-4" />
                            My Impact
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="general" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <ProfileGeneralSettings profile={profile} isAdmin={isAdmin} />
                </TabsContent>

                <TabsContent value="security" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <PasswordResetForm />
                </TabsContent>

                {(isRSVP || isCardholder) && (
                    <TabsContent value="impact" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <ImpactTabContent 
                            donations={uniqueDonations} 
                            digitalCard={profile.digitalCards?.[0]}
                            rsvp={profile.contactPersons?.[0]}
                            profile={profile}
                        />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
