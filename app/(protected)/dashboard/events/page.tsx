import { getAllEvents } from "@/lib/dal/events";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { StatusBadge } from "@/components/ui/status-badge";
import { EventSheet } from "@/components/dashboard/EventSheet";
import { CalendarDaysIcon, MoreHorizontalIcon, EyeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function EventsPage() {
    const events = await getAllEvents();

    return (
        <div className="max-w-7xl p-6 lg:p-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Events Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Create and manage your school events, RSVPs, and Digital Cards.
                    </p>
                </div>
                <EventSheet />
            </div>

            <div className="grid gap-6">
                <Card className="overflow-hidden pt-0">
                    <CardHeader className="bg-primary/10 rounded-none pt-3 pb-4">
                        <div className="flex items-center gap-2">
                             <CalendarDaysIcon className="h-5 w-5 text-primary" />
                             <CardTitle className="text-xl">All Events</CardTitle>
                        </div>
                        <CardDescription>A list of all organized events and their current status.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/10 hover:bg-muted/10">
                                    <TableHead className="w-[300px]">Event Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>End Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {events.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            No events created yet. Use the button above to start.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    events.map((event: any) => (
                                        <TableRow key={event.id} className="hover:bg-muted/50 transition-colors">
                                            <TableCell className="font-semibold text-foreground">
                                                <Link href={`/dashboard/events/${event.id}`} className="hover:underline">
                                                    {event.title}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge variant={event.status} size="sm" />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {event.startDate 
                                                    ? format(new Date(event.startDate), "MMM d, yyyy HH:mm") 
                                                    : "Not set"}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {event.endDate 
                                                    ? format(new Date(event.endDate), "MMM d, yyyy HH:mm") 
                                                    : "Not set"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <EventSheet event={event} />
                                                    <Button variant="ghost" size="icon-sm">
                                                        <MoreHorizontalIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
