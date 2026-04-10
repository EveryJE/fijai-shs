"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createUserRecord } from "@/lib/actions/auth";
import { UserPlusIcon, UsersIcon } from "lucide-react";

const ROLES = [
  { value: "rsvp", label: "RSVP (Contact Person)" },
  { value: "cardholder", label: "Digital Card Holder" },
  { value: "admin", label: "System Administrator" },
];

interface Event {
    id: string;
    title: string;
}

export function CreateUserForm({ events }: { events: Event[] }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [eventId, setEventId] = useState("");
  const [classYear, setClassYear] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Email is required");
    if (!fullName) return toast.error("Full Name is required");
    if (!eventId) return toast.error("Select an Event Reference");
    if (roles.length === 0) return toast.error("Select at least one role");

    setLoading(true);
    try {
      await createUserRecord({ email, fullName, roles, eventId, classYear });
      toast.success("Participant record created successfully");
      setOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user record");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setFullName("");
    setEventId("");
    setClassYear("");
    setRoles([]);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="default" className="shadow-md flex items-center gap-2">
            <UserPlusIcon className="h-4 w-4" />
            Establish Member
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[500px] p-8">
        <SheetHeader className="pb-6 border-b">
          <div className="flex items-center gap-3">
               <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <UsersIcon className="h-6 w-6" />
               </div>
               <SheetTitle className="text-xl font-bold">Institutional Intake</SheetTitle>
          </div>
          <p className="text-muted-foreground text-sm">Create and establish new alumni participant records directly in the system.</p>
        </SheetHeader>
        
        <form onSubmit={handleCreate} className="space-y-6 mt-8 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-sm font-semibold text-primary">Member Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              placeholder="e.g. John Fiifi Atta"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-semibold text-primary">Official Email Identifier</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="verified.email@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="event" className="text-sm font-semibold text-primary">Event Context</Label>
                <select
                    id="event"
                    value={eventId}
                    onChange={e => setEventId(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                >
                    <option value="">Select Reference</option>
                    {events.map(event => (
                        <option key={event.id} value={event.id}>{event.title}</option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="classYear" className="text-sm font-semibold text-primary">Alumni Class Year</Label>
                <Input
                  id="classYear"
                  value={classYear}
                  onChange={e => setClassYear(e.target.value)}
                  placeholder="e.g. 2008"
                />
              </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-primary">Designated Roles</Label>
            <div className="grid grid-cols-1 gap-2 p-3 bg-muted/50 rounded-lg border">
              {ROLES.map(role => (
                <label key={role.value} className="flex items-center gap-3 cursor-pointer hover:bg-background p-2 rounded-md transition-colors">
                  <input
                    type="checkbox"
                    value={role.value}
                    checked={roles.includes(role.value)}
                    onChange={e => {
                      if (e.target.checked) setRoles([...roles, role.value]);
                      else setRoles(roles.filter(r => r !== role.value));
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-medium">{role.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="pt-6 border-t flex flex-col gap-4">
              <div className="bg-emerald-50 p-3 rounded border border-emerald-100">
                <p className="text-[10px] text-emerald-800 leading-relaxed font-medium">
                    Note: Creating a record will automatically provision platform identity. The member will receive authentication credentials via email.
                </p>
              </div>
              <Button type="submit" className="w-full h-12 font-bold" disabled={loading}>
                {loading ? "Establishing Identity..." : "Commit Record"}
              </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
