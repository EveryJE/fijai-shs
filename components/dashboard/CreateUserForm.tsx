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
      <SheetTrigger
        render={
            <Button variant="default" className="shadow-lg border-b-4 border-primary/20 flex items-center gap-2">
                <UserPlusIcon className="h-4 w-4" />
                Establish Member
            </Button>
        }
      />
      <SheetContent side="right" className="w-full sm:w-[500px] bg-white text-black/90 p-10">
        <SheetHeader className="pb-8 border-b">
          <div className="flex items-center gap-3 mb-2">
               <div className="bg-primary/10 p-2 rounded-md text-primary">
                    <UsersIcon className="h-6 w-6" />
               </div>
               <SheetTitle className="text-2xl font-black uppercase tracking-tighter text-[#730303]">Institutional Intake</SheetTitle>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Create and establish new alumni participant records directly in the system.</p>
        </SheetHeader>
        
        <form onSubmit={handleCreate} className="space-y-6 mt-10 h-[calc(100vh-200px)] overflow-y-auto pr-4 pb-10 scrollbar-hide">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-widest text-[#730303]/60">Member Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="h-12 border-muted-foreground/10 focus-visible:ring-primary shadow-sm"
              placeholder="e.g. John Fiifi Atta"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-[#730303]/60">Official Email Identifier</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="h-12 border-muted-foreground/10 focus-visible:ring-primary shadow-sm"
              placeholder="verified.email@yopmail.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event" className="text-[10px] font-black uppercase tracking-widest text-[#730303]/60">Event Context</Label>
                <select
                    id="event"
                    value={eventId}
                    onChange={e => setEventId(e.target.value)}
                    className="w-full flex h-12 rounded-md border border-muted-foreground/10 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                    required
                >
                    <option value="">Select Reference</option>
                    {events.map(event => (
                        <option key={event.id} value={event.id}>{event.title}</option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classYear" className="text-[10px] font-black uppercase tracking-widest text-[#730303]/60">Alumni Class Year</Label>
                <Input
                  id="classYear"
                  value={classYear}
                  onChange={e => setClassYear(e.target.value)}
                  className="h-12 border-muted-foreground/10 focus-visible:ring-primary shadow-sm"
                  placeholder="e.g. Class of 2008"
                />
              </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-[#730303]/60">Designated Institutional Roles</Label>
            <div className="grid grid-cols-1 gap-3 p-4 bg-muted/30 rounded-md border border-muted-foreground/5 inner-shadow">
              {ROLES.map(role => (
                <label key={role.value} className="flex items-center gap-4 cursor-pointer hover:bg-white/60 p-3 rounded-lg transition-all border border-transparent hover:border-primary/10 hover:shadow-sm">
                  <input
                    type="checkbox"
                    value={role.value}
                    checked={roles.includes(role.value)}
                    onChange={e => {
                      if (e.target.checked) setRoles([...roles, role.value]);
                      else setRoles(roles.filter(r => r !== role.value));
                    }}
                    className="w-5 h-5 rounded border-muted focus:ring-primary text-primary"
                  />
                  <div className="flex flex-col">
                      <span className="text-sm font-black uppercase tracking-tight text-[#730303]">{role.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <div className="pt-8 mt-6 border-t">
              <div className="bg-emerald-50 p-4 rounded-md border border-emerald-100 mb-6">
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest leading-relaxed">
                    Note: Creating an institutional record will automatically provision a secure platform identity. The member will receive authentication credentials via their provided identifier.
                </p>
              </div>
              <Button type="submit" className="w-full h-14 text-sm font-black uppercase tracking-[2px] shadow-2xl" disabled={loading}>
                {loading ? "Establishing Identity..." : "Commit Institutional Record"}
              </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
