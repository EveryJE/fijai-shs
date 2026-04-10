"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { updateEvent, createCategory, updateCategory, deleteCategory, createDonationItem, updateDonationItem, deleteDonationItem } from "@/lib/actions/events";
import { format } from "date-fns";
import { 
    CalendarDays, 
    Clock, 
    Plus, 
    Pencil, 
    Trash2, 
    Package, 
    LayoutGrid, 
    DollarSign, 
    TrendingUp, 
    Users,
    Loader2,
    Save,
    X,
    Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
    id: string;
    name: string;
    color: string;
    displayOrder: number;
    donationItems: DonationItem[];
}

interface DonationItem {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    targetAmount: number | null;
    displayOrder: number;
}

interface Event {
    id: string;
    title: string;
    description: string | null;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    categories: Category[];
}

const COLORS = [
    "#730303", // Maroon
    "#DAA520", // Gold
    "#1B3A5C", // Dark Blue
    "#10B981", // Green
    "#8B5CF6", // Purple
    "#F97316", // Orange
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#CD7F32"//bronze
];

export function EventDetailClient({ event }: { readonly event: Event }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState("overview");
    const [isSaving, setIsSaving] = useState(false);
    const saveInProgress = useRef(false);
    
    // Category/Item editing
    const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryForm, setCategoryForm] = useState({ name: "", color: "#730303" });
    
    const [isItemSheetOpen, setIsItemSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<DonationItem | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [itemForm, setItemForm] = useState({ name: "", icon: "", color: "#730303", targetAmount: "" });
    
    // Delete confirmation
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: "category" | "item"; id: string; name: string } | null>(null);

    const handleSaveEvent = async (data: Partial<Event>) => {
        startTransition(async () => {
            try {
                const result = await updateEvent(event.id, data);
                if (result.success) {
                    toast.success("Event updated");
                    router.refresh();
                }
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to update");
            }
        });
    };

    const handleSaveCategory = async () => {
        if (!categoryForm.name.trim()) {
            toast.error("Category name is required");
            return;
        }
        
        if (saveInProgress.current || isSaving) return;
        saveInProgress.current = true;
        setIsSaving(true);
        
        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, {
                    name: categoryForm.name,
                    color: categoryForm.color,
                });
                toast.success("Category updated");
            } else {
                await createCategory(event.id, {
                    name: categoryForm.name,
                    color: categoryForm.color,
                });
                toast.success("Category created");
            }
            setIsCategorySheetOpen(false);
            setEditingCategory(null);
            setCategoryForm({ name: "", color: "#730303" });
            router.refresh();
        } catch (error) {
            toast.error("Failed to save category");
        } finally {
            saveInProgress.current = false;
            setIsSaving(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!deleteTarget || deleteTarget.type !== "category") return;
        
        startTransition(async () => {
            try {
                await deleteCategory(deleteTarget.id);
                toast.success("Category deleted");
                setDeleteDialogOpen(false);
                setDeleteTarget(null);
                router.refresh();
            } catch (error) {
                toast.error("Failed to delete category");
            }
        });
    };

    const handleSaveItem = async () => {
        if (!itemForm.name.trim() || !selectedCategoryId) {
            toast.error("Item name and category are required");
            return;
        }
        
        if (saveInProgress.current || isSaving) return;
        saveInProgress.current = true;
        setIsSaving(true);
        
        try {
            const itemData = {
                name: itemForm.name,
                icon: itemForm.icon || null,
                color: itemForm.color,
                targetAmount: itemForm.targetAmount ? parseFloat(itemForm.targetAmount) : null,
            };
            
            if (editingItem) {
                await updateDonationItem(editingItem.id, itemData);
                toast.success("Item updated");
            } else {
                await createDonationItem(selectedCategoryId, itemData);
                toast.success("Item created");
            }
            setIsItemSheetOpen(false);
            setEditingItem(null);
            setSelectedCategoryId(null);
            setItemForm({ name: "", icon: "", color: "#730303", targetAmount: "" });
            router.refresh();
        } catch (error) {
            toast.error("Failed to save item");
        } finally {
            saveInProgress.current = false;
            setIsSaving(false);
        }
    };

    const handleDeleteItem = async () => {
        if (!deleteTarget || deleteTarget.type !== "item") return;
        
        startTransition(async () => {
            try {
                await deleteDonationItem(deleteTarget.id);
                toast.success("Item deleted");
                setDeleteDialogOpen(false);
                setDeleteTarget(null);
                router.refresh();
            } catch (error) {
                toast.error("Failed to delete item");
            }
        });
    };

    const openCategorySheet = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setCategoryForm({ name: category.name, color: category.color });
        } else {
            setEditingCategory(null);
            setCategoryForm({ name: "", color: "#730303" });
        }
        setIsCategorySheetOpen(true);
    };

    const openItemSheet = (categoryId: string, item?: DonationItem) => {
        setSelectedCategoryId(categoryId);
        if (item) {
            setEditingItem(item);
            setItemForm({
                name: item.name,
                icon: item.icon || "",
                color: item.color || "#730303",
                targetAmount: item.targetAmount?.toString() || "",
            });
        } else {
            setEditingItem(null);
            setItemForm({ name: "", icon: "", color: "#730303", targetAmount: "" });
        }
        setIsItemSheetOpen(true);
    };

    const openDeleteDialog = (type: "category" | "item", id: string, name: string) => {
        setDeleteTarget({ type, id, name });
        setDeleteDialogOpen(true);
    };

    const statusColors: Record<string, string> = {
        draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        closed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    };

    return (
        <div className="max-w-7xl p-6 lg:p-10">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Badge className={statusColors[event.status]}>
                        {event.status}
                    </Badge>
                    {event.startDate && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            {format(new Date(event.startDate), "MMM d, yyyy")}
                        </span>
                    )}
                </div>
                <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
                {event.description && (
                    <p className="text-muted-foreground mt-2">{event.description}</p>
                )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="institutional" className="mb-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="categories">Categories & Items</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-none ">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{event.categories.length}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-none ">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Donation Items</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {event.categories.reduce((sum, cat) => sum + cat.donationItems.length, 0)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none ">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">GHS 0</div>
                            </CardContent>
                        </Card>
                        <Card className="border-none ">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Categories & Items Tab */}
                <TabsContent value="categories">
                    <Card className="border-none ">
                        <CardHeader className="bg-muted/30 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <LayoutGrid className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-xl">Categories & Items</CardTitle>
                                </div>
                                <Button onClick={() => openCategorySheet()}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Category
                                </Button>
                            </div>
                            <CardDescription>
                                Manage donation categories and items for this event.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            {event.categories.length === 0 ? (
                                <div className="text-center py-12">
                                    <LayoutGrid className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                                    <p className="text-muted-foreground mb-4">No categories created yet.</p>
                                    <Button onClick={() => openCategorySheet()}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create First Category
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {event.categories.map((category) => (
                                        <div key={category.id} className="border rounded-lg overflow-hidden">
                                            <div 
                                                className="flex items-center justify-between p-4 border-b"
                                                style={{ backgroundColor: `${category.color}10` }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div 
                                                        className="w-4 h-4 rounded-full"
                                                        style={{ backgroundColor: category.color }}
                                                    />
                                                    <span className="font-semibold">{category.name}</span>
                                                    <Badge variant="outline" className="ml-2">
                                                        {category.donationItems.length} items
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => openItemSheet(category.id)}
                                                    >
                                                        <Plus className="h-4 w-4 mr-1" />
                                                        Add Item
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => openCategorySheet(category)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => openDeleteDialog("category", category.id, category.name)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                {category.donationItems.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground text-center py-4">
                                                        No items in this category. Click "Add Item" to create one.
                                                    </p>
                                                ) : (
                                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                        {category.donationItems.map((item) => (
                                                            <div 
                                                                key={item.id}
                                                                className="flex items-center justify-between p-3 rounded-lg border bg-background"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    {item.icon && (
                                                                        <span className="text-xl">{item.icon}</span>
                                                                    )}
                                                                    <div>
                                                                        <p className="font-medium text-sm">{item.name}</p>
                                                                        {item.targetAmount && (
                                                                            <p className="text-xs text-muted-foreground">
                                                                                Target: GHS {item.targetAmount.toLocaleString()}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon-sm"
                                                                        onClick={() => openItemSheet(category.id, item)}
                                                                    >
                                                                        <Pencil className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon-sm"
                                                                        onClick={() => openDeleteDialog("item", item.id, item.name)}
                                                                    >
                                                                        <Trash2 className="h-3 w-3 text-destructive" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Category Sheet */}
            <Sheet open={isCategorySheetOpen} onOpenChange={setIsCategorySheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-lg">
                    <SheetHeader>
                        <SheetTitle>{editingCategory ? "Edit Category" : "Add Category"}</SheetTitle>
                        <SheetDescription>
                            {editingCategory ? "Update the category details." : "Create a new donation category."}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-6 py-6">
                        <div className="space-y-2">
                            <Label htmlFor="categoryName">Category Name</Label>
                            <Input
                                id="categoryName"
                                value={categoryForm.name}
                                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                placeholder="e.g. General Fund, Building Fund"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setCategoryForm({ ...categoryForm, color })}
                                        className={cn(
                                            "w-8 h-8 rounded-full border-2 transition-all",
                                            categoryForm.color === color ? "border-foreground scale-110" : "border-transparent"
                                        )}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <Button variant="outline" className="flex-1" onClick={() => setIsCategorySheetOpen(false)}>
                            Cancel
                        </Button>
                        <Button className="flex-1" onClick={handleSaveCategory} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            {editingCategory ? "Save Changes" : "Create Category"}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Item Sheet */}
            <Sheet open={isItemSheetOpen} onOpenChange={setIsItemSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-lg">
                    <SheetHeader>
                        <SheetTitle>{editingItem ? "Edit Item" : "Add Item"}</SheetTitle>
                        <SheetDescription>
                            {editingItem ? "Update the donation item." : "Create a new donation item."}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-6 py-6">
                        <div className="space-y-2">
                            <Label htmlFor="itemName">Item Name</Label>
                            <Input
                                id="itemName"
                                value={itemForm.name}
                                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                                placeholder="e.g. Wall of Fame, Library Fund"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="itemIcon">Icon (emoji)</Label>
                            <Input
                                id="itemIcon"
                                value={itemForm.icon}
                                onChange={(e) => setItemForm({ ...itemForm, icon: e.target.value })}
                                placeholder="e.g. 🎓, 🏫, 📚"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="itemTarget">Target Amount (GHS)</Label>
                            <Input
                                id="itemTarget"
                                type="number"
                                value={itemForm.targetAmount}
                                onChange={(e) => setItemForm({ ...itemForm, targetAmount: e.target.value })}
                                placeholder="Optional target"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setItemForm({ ...itemForm, color })}
                                        className={cn(
                                            "w-8 h-8 rounded-full border-2 transition-all",
                                            itemForm.color === color ? "border-foreground scale-110" : "border-transparent"
                                        )}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <Button variant="outline" className="flex-1" onClick={() => setIsItemSheetOpen(false)}>
                            Cancel
                        </Button>
                        <Button className="flex-1" onClick={handleSaveItem} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            {editingItem ? "Save Changes" : "Create Item"}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleteTarget?.name}"? 
                            {deleteTarget?.type === "category" && " This will also delete all items in this category."}
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={deleteTarget?.type === "category" ? handleDeleteCategory : handleDeleteItem}
                            disabled={isSaving}
                        >
                            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}