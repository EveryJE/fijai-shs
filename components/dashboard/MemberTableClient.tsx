"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";
import { MemberRowActions } from "@/components/dashboard/MemberRowActions";
import { cn } from "@/lib/utils";
import { SearchIcon, FilterIcon } from "lucide-react";

interface MemberTableClientProps {
    profiles: any[];
    events: any[];
}

export function MemberTableClient({ profiles, events }: MemberTableClientProps) {
    const [statusTab, setStatusTab] = useState("active");
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    const activeCount = profiles.filter(p => p.isActive !== false).length;
    const inactiveCount = profiles.filter(p => p.isActive === false).length;

    const filteredProfiles = useMemo(() => {
        return profiles.filter((profile) => {
            const matchesStatus = statusTab === "active" ? (profile.isActive !== false) : (profile.isActive === false);

            const matchesSearch =
                profile.fullName?.toLowerCase().includes(search.toLowerCase()) ||
                profile.email.toLowerCase().includes(search.toLowerCase());

            const matchesRole =
                roleFilter === "all" ||
                profile.roles.includes(roleFilter);

            return matchesStatus && matchesSearch && matchesRole;
        });
    }, [profiles, search, roleFilter, statusTab]);

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <Tabs value={statusTab} onValueChange={setStatusTab} className="w-full mt-2">
                <div className="flex items-center justify-between">
                    <TabsList className="bg-muted/50 p-1">
                        <TabsTrigger value="active" className="px-6 font-bold uppercase text-[10px] ">
                            Active Members ({activeCount})
                        </TabsTrigger>
                        <TabsTrigger value="inactive" className="px-6 font-bold uppercase text-[10px]  data-[state=active]:text-red-600">
                            Archive / Past ({inactiveCount})
                        </TabsTrigger>
                    </TabsList>
                </div>
            </Tabs>

            <div className=" overflow-hidden">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between px-6 py-4 bg-muted/20 border-b">
                    <div className="relative w-full lg:w-96">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 h-10 border-transparent bg-white/50 focus:bg-white transition-all text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase  text-muted-foreground whitespace-nowrap">
                            <FilterIcon className="h-3 w-3" />
                            By Role:
                        </div>
                        <Tabs value={roleFilter} onValueChange={setRoleFilter} className="w-full lg:w-auto">
                            <TabsList className="bg-white border">
                                <TabsTrigger value="all" className="text-[9px] uppercase font-bold ">All</TabsTrigger>
                                <TabsTrigger value="admin" className="text-[9px] uppercase font-bold ">Admins</TabsTrigger>
                                <TabsTrigger value="rsvp" className="text-[9px] uppercase font-bold ">RSVP</TabsTrigger>
                                <TabsTrigger value="cardholder" className="text-[9px] uppercase font-bold ">Cards</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="bg-primary-50/50 hover:bg-primary-50/50">
                            <TableHead className="w-[250px] pl-6 font-bold uppercase text-[11px] ">Full Name</TableHead>
                            <TableHead className="font-bold uppercase text-[11px] ">Email Identifier</TableHead>
                            <TableHead className="font-bold uppercase text-[11px] ">Institutional Roles</TableHead>
                            <TableHead className="font-bold uppercase text-[11px] ">Onboarded</TableHead>
                            <TableHead className="text-right pr-6 font-bold uppercase text-[11px] ">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProfiles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-2 opacity-60">
                                        <SearchIcon className="h-8 w-8 text-muted-foreground mb-2" />
                                        <p className="text-sm font-medium">No matching institutional records found.</p>
                                        <p className="text-xs">Try adjusting your search or role filters.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProfiles.map((profile: any) => (
                                <TableRow key={profile.id} className={cn(
                                    "group transition-colors hover:bg-muted/30",
                                    !profile.isActive && "opacity-60 grayscale-[0.5]"
                                )}>
                                    <TableCell className="pl-6 py-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm ">{profile.fullName || "Anonymous"}</span>
                                                {!profile.isActive && (
                                                    <span className="text-[9px] font-medium uppercase  bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Inactive</span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground uppercase  font-medium mt-0.5">{profile.classYear ? `Class of ${profile.classYear}` : "Institutional Member"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground/80 lowercase">{profile.email}</TableCell>
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
                                    <TableCell className="text-muted-foreground text-[11px] ">
                                        {format(new Date(profile.createdAt), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <MemberRowActions profile={profile} events={events} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
