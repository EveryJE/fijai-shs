"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createEvent, updateEvent } from "@/lib/actions/events";
import { CalendarIcon, PlusIcon, PencilIcon } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface Event {
  id: string;
  title: string;
  description: string | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface EventSheetProps {
  event?: Event;
  trigger?: React.ReactNode;
}

export function EventSheet({ event, trigger }: EventSheetProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEditing = !!event;

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    status: string;
    startDate: string;
    endDate: string;
  }>({
    title: "",
    description: "",
    status: "draft",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || "",
        status: event.status,
        startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : "",
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "",
      });
    } else {
        setFormData({
            title: "",
            description: "",
            status: "draft",
            startDate: "",
            endDate: "",
        });
    }
  }, [event, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (isEditing) {
          await updateEvent(event.id, formData);
          toast.success("Event updated successfully");
        } else {
          await createEvent(formData);
          toast.success("Event created successfully");
        }
        setOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Something went wrong");
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen} modal={false}>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger || (
          <Button variant={isEditing ? "outline" : "default"} size={isEditing ? "sm" : "default"}>
            {isEditing ? (
              <><PencilIcon className="mr-2 h-4 w-4" /> Edit</>
            ) : (
              <><PlusIcon className="mr-2 h-4 w-4" /> Create Event</>
            )}
          </Button>
        )}
      </div>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col h-full">
        <SheetHeader className="flex-shrink-0 p-6 border-b bg-background z-10">
          <SheetTitle>{isEditing ? "Edit Event" : "Create New Event"}</SheetTitle>
          <SheetDescription>
            {isEditing 
                ? "Update the details of your event below." 
                : "Fill in the basic info to get your event started."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form id="event-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Founder's Day Celebration"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell us more about the event..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
             <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value || "draft" })}
              >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
             </Select>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" /> Start Date
                </Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" /> End Date
                </Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          </form>
        </div>
        <div className="flex-shrink-0 p-6 border-t bg-background z-10 flex gap-3">
          <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={() => setOpen(false)}
              disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="event-form" className="flex-1" disabled={isPending}>
            {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Event"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
