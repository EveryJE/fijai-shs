import { getAllProfiles, getAllEvents } from "@/lib/dal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UsersIcon, ShieldCheckIcon } from "lucide-react";
import { MemberTableClient } from "@/components/dashboard/MemberTableClient";
import { CreateUserForm } from "@/components/dashboard/CreateUserForm";

export default async function ParticipantsPage() {
    const [profiles, events] = await Promise.all([
        getAllProfiles(),
        getAllEvents(),
    ]);

    return (
        <div className=" max-w-7xl p-6 lg:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="flex flex-col md:flex-row items-baseline md:items-center justify-between border-b pb-8 gap-6 group">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#730303]/10 rounded-md text-[#730303]">
                            <ShieldCheckIcon className="h-6 w-6" />
                        </div>
                        <h1 className="text-4xl font-bold uppercase  text-[#730303] ">
                            Institutional Access
                        </h1>
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm font-normal">
                        Establish official alumni participation roles and system identities.
                    </p>
                </div>
                <CreateUserForm events={events} />
            </div>

            <Card className=" overflow-hidden bg-white text-black/90 gap-y-0 group border-none ">
                <CardHeader className="bg-muted/5 pb-8 border-b">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <UsersIcon className="h-5 w-5 text-[#DAA520]" />
                                <CardTitle className="text-xl font-bold text-[#730303]">Active Member Roster</CardTitle>
                            </div>
                            <CardDescription className="text-sm opacity-60">Complete registry of verified alumni participants and administrators.</CardDescription>
                        </div>
                        <div className="bg-[#730303]/5 px-4 py-2 rounded border border-[#730303]/10">
                            <span className="text-[10px] font-medium uppercase  text-[#730303]">Total Population: {profiles.length}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <MemberTableClient profiles={profiles} events={events} />
                </CardContent>
            </Card>
        </div>
    );
}
