"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createEvent(data: {
  title: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || "draft",
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });

    revalidatePath("/dashboard/events");
    return { success: true, event };
  } catch (error) {
    console.error("Failed to create event:", error);
    throw new Error("Could not create event");
  }
}

export async function updateEvent(id: string, data: {
  title?: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const event = await prisma.event.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });

    revalidatePath("/dashboard/events");
    return { success: true, event };
  } catch (error) {
    console.error("Failed to update event:", error);
    throw new Error("Could not update event");
  }
}

export async function deleteEvent(id: string) {
  try {
    await prisma.event.delete({
      where: { id },
    });

    revalidatePath("/dashboard/events");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete event:", error);
    throw new Error("Could not delete event");
  }
}
