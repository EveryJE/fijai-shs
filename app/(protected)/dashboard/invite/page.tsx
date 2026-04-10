import { getAllProfiles, getAllEvents } from "@/lib/dal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateUserForm } from "@/components/dashboard/CreateUserForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { StatusBadge } from "@/components/ui/status-badge";
import { UsersIcon, ShieldCheckIcon } from "lucide-react";

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
                         <h1 className="text-4xl font-bold uppercase tracking-tighter text-[#730303] ">
                             Institutional Access
                         </h1>
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm font-normal">
                        Establish official alumni participation roles and system identities.
                    </p>
                </div>
                <CreateUserForm events={events} />
            </div>

            <Card className=" overflow-hidden bg-white text-black/90 gap-y-0 group">
                <CardHeader className="bg-muted/5 pb-8 border-b">
                     <div className="flex items-center gap-2">
                        <UsersIcon className="h-5 w-5 text-[#DAA520]" />
                        <CardTitle className="text-xl font-semibold  tracking-tight text-[#730303]">Active Member Roster</CardTitle>
                     </div>
                     <CardDescription className="text-sm font-normal opacity-60">Complete registry of verified alumni participants and administrators.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-primary-50/50 hover:bg-primary-50/50">
                                <TableHead className="w-[200px]">Full Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Roles</TableHead>
                                <TableHead>Added On</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {profiles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                        No participants yet. Start by inviting someone!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                profiles.map((profile: any) => (
                                    <TableRow key={profile.id} className="cursor-default hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium">
                                            {profile.fullName || "Anonymous"}
                                        </TableCell>
                                        <TableCell>{profile.email}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1.5">
                                                {profile.roles.map((role: any) => (
                                                    <StatusBadge key={role} variant={role} size="sm" />
                                                ))}
                                                {profile.roles.length === 0 && (
                                                    <span className="text-xs text-muted-foreground italic">None</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(profile.createdAt), "MMM d, yyyy")}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
