import { getOrganization } from "@/lib/dal/stats";
import { getProfileById } from "@/lib/dal/profile";
import { createClient } from "@/utils/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrgGeneralSettings } from "@/components/dashboard/OrgGeneralSettings";
import { OrgAccountDetails } from "@/components/dashboard/OrgAccountDetails";
import { Building2Icon, LandmarkIcon } from "lucide-react";

export default async function OrgSettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const [org, profile] = await Promise.all([
        getOrganization(),
        user ? getProfileById(user.id) : Promise.resolve(null)
    ]);

    return (
        <div className="max-w-7xl p-6 lg:p-10  space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-4xl font-black tracking-tighter text-[#730303] uppercase">
                    Institution Settings
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Manage Fijai SHS branding and financial payout credentials.
                </p>
            </div>

            <Tabs defaultValue="general" className="space-y-8">
                <TabsList variant="institutional" className="p-1.5 shadow-xl shadow-primary/5">
                    <TabsTrigger value="general" className="px-10 py-2.5 font-black uppercase tracking-[2px] text-[10px]">
                        <Building2Icon className="mr-2 h-4 w-4" />
                        Branding
                    </TabsTrigger>
                    <TabsTrigger value="payouts" className="px-10 py-2.5 font-black uppercase tracking-[2px] text-[10px]">
                        <LandmarkIcon className="mr-2 h-4 w-4" />
                        Payout Details
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="animate-in fade-in slide-in-from-left-2 duration-500">
                    <OrgGeneralSettings organization={org} />
                </TabsContent>
                <TabsContent value="payouts" className="animate-in fade-in slide-in-from-right-2 duration-500">
                    <OrgAccountDetails organization={org} userRoles={profile?.roles || []} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
