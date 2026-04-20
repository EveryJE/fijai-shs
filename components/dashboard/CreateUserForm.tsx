"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createUserRecord, updateUserRecord, sendPasswordResetAction, resendInvitationEmail } from "@/lib/actions/auth";
import { UserPlusIcon, UsersIcon, Edit3Icon, MailIcon, KeyIcon, RefreshCwIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "rsvp", label: "RSVP (Contact Person)" },
  { value: "cardholder", label: "Digital Card Holder" },
];

interface Event {
  id: string;
  title: string;
}

interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  classYear: string | null;
  roles: string[];
}

export function CreateUserForm({ events, profile }: { events: Event[], profile?: Profile }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(profile?.email ?? "");
  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [eventId, setEventId] = useState("");
  const [classYear, setClassYear] = useState(profile?.classYear ?? "");
  const [roles, setRoles] = useState<string[]>(profile?.roles.filter(r => r !== "admin") ?? []);
  const [isAdmin, setIsAdmin] = useState(profile?.roles.includes("admin") ?? false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const isEdit = !!profile;

  const handleSendReset = async () => {
    if (!email) return toast.error("Email is required");
    setResetLoading(true);
    try {
      const result = await sendPasswordResetAction(email);
      if (result.success) {
        toast.success("Password reset link has been dispatched to the member's email.");
      } else {
        toast.error(result.error || "Failed to send reset link");
      }
    } catch (err) {
      toast.error("Failed to initiate password reset.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendInvitation = async () => {
    if (!profile?.id) return;
    setResendLoading(true);
    try {
      const result = await resendInvitationEmail(profile.id);
      if (result.success) {
        toast.success("Identity credentials and event details have been resent.");
      } else {
        toast.error(result.error || "Failed to resend credentials");
      }
    } catch (err) {
      toast.error("Failed to resend invitation.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Email is required");
    if (!fullName) return toast.error("Full Name is required");

    if (!isEdit) {
      if (!eventId) return toast.error("Select an Event Reference");
      if (roles.length === 0) return toast.error("Select at least one role");
    }

    setLoading(true);
    try {
      const allRoles = [...roles];
      if (isAdmin) allRoles.push("admin");
      
      // Safety check: remove any duplicates
      const uniqueRoles = Array.from(new Set(allRoles));

      const result = isEdit
        ? await updateUserRecord({ id: profile.id, email, fullName, roles: uniqueRoles, classYear: classYear || undefined })
        : await createUserRecord({ email, fullName, roles: uniqueRoles, eventId, classYear: classYear || undefined });

      if (result.success) {
        toast.success(isEdit ? "Identity record updated successfully" : "Participant record created successfully");
        if (!isEdit) resetForm();
        setOpen(false);
      } else {
        toast.error(result.error || "Failed to process record");
      }
    } catch (err) {
      toast.error("A connection error occurred. Please try again.");
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
    setIsAdmin(false);
  };

  const trigger = profile ? (
    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors">
      <Edit3Icon className="h-4 w-4" />
    </Button>
  ) : (
    <Button variant="default" className="shadow-md flex items-center gap-2">
      <UserPlusIcon className="h-4 w-4" />
      Establish Member
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen} modal={false}>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[500px] p-8">
        <SheetHeader className=" border-b">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <UsersIcon className="h-6 w-6" />
            </div>
            <SheetTitle className="text-xl font-bold">
              {isEdit ? "Refine Identity" : "Institutional Intake"}
            </SheetTitle>
          </div>
          <p className="text-sm">
            {isEdit ? "Update and modify existing alumni participant record details." : "Create and establish new alumni participant records directly in the system."}
          </p>
        </SheetHeader>

        <form onSubmit={handleAction} className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
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
            {!isEdit && (
              <div className="space-y-1.5">
                <Label htmlFor="event" className="text-sm font-semibold text-primary">Event Context</Label>
                <Select value={eventId} onValueChange={(val) => setEventId(val || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Reference">
                      {eventId ? events.find(e => e.id === eventId)?.title : "Select Reference"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {events.map(event => (
                      <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className={cn("space-y-1.5", isEdit && "col-span-2")}>
              <Label htmlFor="classYear" className="text-sm font-semibold text-primary">Alumni Class Year</Label>
              <Input
                id="classYear"
                value={classYear}
                onChange={e => setClassYear(e.target.value)}
                placeholder="e.g. 2008"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-primary">Primary Role Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map(role => (
                  <label key={role.value} className={cn(
                    "flex items-center gap-2 p-3 rounded border transition-all",
                    roles.includes(role.value) ? "bg-primary/5 border-primary shadow-sm" : "bg-muted/30 border-transparent",
                    isEdit ? "opacity-60 " : "cursor-pointer hover:bg-muted/50"
                  )}>
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
                    <span className="text-[11px] font-bold uppercase ">{role.label.split(' ')[0]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={cn("p-4 bg-primary/5 rounded border border-primary/10 flex items-center justify-between")}>
              <div className="space-y-0.5">
                <Label className="text-[11px] font-black uppercase tracking-widest text-[#730303]">Grant Admin Access</Label>
                <p className="text-[10px] text-muted-foreground leading-tight max-w-[200px]">Enables management of events, users, and overall system configuration.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-[9px] font-bold uppercase tracking-widest", isAdmin ? "text-primary" : "text-muted-foreground")}>
                  {isAdmin ? "Enabled" : "Disabled"}
                </span>
                <label className={cn("relative inline-flex items-center", !isEdit && "cursor-pointer")}>
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t flex flex-col gap-4">
            {isEdit && (
              <div className="space-y-3 mb-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-primary/60">Maintenance & Recovery</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-tight h-10 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5"
                    disabled={resendLoading || loading}
                    onClick={handleResendInvitation}
                  >
                    {resendLoading ? <RefreshCwIcon className="h-3 w-3 animate-spin" /> : <MailIcon className="h-3 w-3 text-primary" />}
                    Resend Credentials
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-tight h-10 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5"
                    disabled={resetLoading || loading}
                    onClick={handleSendReset}
                  >
                    {resetLoading ? <RefreshCwIcon className="h-3 w-3 animate-spin" /> : <KeyIcon className="h-3 w-3 text-amber-600" />}
                    Reset Password
                  </Button>
                </div>
                <p className="text-[9px] text-muted-foreground italic">Use these actions if the member has lost access or needs to re-establish their identity.</p>
              </div>
            )}
            {!isEdit && (
              <div className="bg-emerald-50 p-3 rounded border border-emerald-100">
                <p className="text-[10px] text-emerald-800 leading-relaxed font-medium">
                  Note: Creating a record will automatically provision platform identity. The member will receive authentication credentials via email.
                </p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading || resetLoading || resendLoading}>
              {loading ? (isEdit ? "Refining Identity..." : "Establishing Identity...") : (isEdit ? "Confirm Modifications" : "Commit Record")}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
