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
  description?: string | null;
  status?: string;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
}) {
  try {
    const event = await prisma.event.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : (data.startDate === null ? null : undefined),
        endDate: data.endDate ? new Date(data.endDate) : (data.endDate === null ? null : undefined),
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

export async function createCategory(eventId: string, data: {
  name: string;
  color: string;
}) {
  try {
    const maxOrder = await prisma.category.aggregate({
      where: { eventId },
      _max: { displayOrder: true },
    });
    
    const category = await prisma.category.create({
      data: {
        eventId,
        name: data.name,
        color: data.color,
        displayOrder: (maxOrder._max.displayOrder || 0) + 1,
      },
    });

    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true, category };
  } catch (error) {
    console.error("Failed to create category:", error);
    throw new Error("Could not create category");
  }
}

export async function updateCategory(id: string, data: {
  name?: string;
  color?: string;
}) {
  try {
    const category = await prisma.category.update({
      where: { id },
      data,
    });

    const event = await prisma.category.findUnique({
      where: { id },
      select: { eventId: true },
    });
    
    if (event) {
      revalidatePath(`/dashboard/events/${event.eventId}`);
    }
    return { success: true, category };
  } catch (error) {
    console.error("Failed to update category:", error);
    throw new Error("Could not update category");
  }
}

export async function deleteCategory(id: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      select: { eventId: true },
    });

    await prisma.category.delete({
      where: { id },
    });

    if (category) {
      revalidatePath(`/dashboard/events/${category.eventId}`);
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to delete category:", error);
    throw new Error("Could not delete category");
  }
}

export async function createDonationItem(categoryId: string, data: {
  name: string;
  icon?: string | null;
  color?: string;
  targetAmount?: number | null;
}) {
  try {
    const maxOrder = await prisma.donationItem.aggregate({
      where: { categoryId },
      _max: { displayOrder: true },
    });
    
    const item = await prisma.donationItem.create({
      data: {
        categoryId,
        name: data.name,
        icon: data.icon,
        color: data.color,
        targetAmount: data.targetAmount,
        displayOrder: (maxOrder._max.displayOrder || 0) + 1,
      },
    });

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { eventId: true },
    });
    
    if (category) {
      revalidatePath(`/dashboard/events/${category.eventId}`);
    }
    return { success: true, item };
  } catch (error) {
    console.error("Failed to create donation item:", error);
    throw new Error("Could not create donation item");
  }
}

export async function updateDonationItem(id: string, data: {
  name?: string;
  icon?: string | null;
  color?: string;
  targetAmount?: number | null;
}) {
  try {
    const item = await prisma.donationItem.update({
      where: { id },
      data,
    });

    const category = await prisma.donationItem.findUnique({
      where: { id },
      select: { category: { select: { eventId: true } } },
    });
    
    if (category) {
      revalidatePath(`/dashboard/events/${category.category.eventId}`);
    }
    return { success: true, item };
  } catch (error) {
    console.error("Failed to update donation item:", error);
    throw new Error("Could not update donation item");
  }
}

export async function deleteDonationItem(id: string) {
  try {
    const item = await prisma.donationItem.findUnique({
      where: { id },
      select: { category: { select: { eventId: true } } },
    });

    await prisma.donationItem.delete({
      where: { id },
    });

    if (item) {
      revalidatePath(`/dashboard/events/${item.category.eventId}`);
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to delete donation item:", error);
    throw new Error("Could not delete donation item");
  }
}
