"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateOrganization } from "@/lib/actions/org";
import { toast } from "sonner";
import { Building2Icon, PaletteIcon } from "lucide-react";

export function OrgGeneralSettings({ organization }: { organization: any }) {
    const [isPending, startTransition] = useTransition();

    const { register, handleSubmit } = useForm({
        defaultValues: {
            name: organization?.name || "",
            primaryColor: organization?.primaryColor || "#730303",
            secondaryColor: organization?.secondaryColor || "#DAA520",
            tertiaryColor: organization?.tertiaryColor || "#1B3A5C",
        }
    });

    const onSubmit = (data: any) => {
        startTransition(async () => {
            try {
                await updateOrganization(organization?.id || null, data);
                toast.success("Organization settings updated");
            } catch (err) {
                toast.error("Failed to update settings");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                             <Building2Icon className="h-5 w-5 text-primary" />
                             <CardTitle>School Information</CardTitle>
                        </div>
                        <CardDescription>Basic identification for the alumni platform.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">School Name</Label>
                            <Input id="name" {...register("name")} required />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                             <PaletteIcon className="h-5 w-5 text-primary" />
                             <CardTitle>Branding & Colors</CardTitle>
                        </div>
                        <CardDescription>Visual identity settings for the school.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="primaryColor">Primary</Label>
                            <div className="flex gap-2">
                                <Input type="color" id="primaryColor" {...register("primaryColor")} className="w-12 p-1" />
                                <Input value={organization?.primaryColor} disabled className="flex-1 text-xs" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="secondaryColor">Secondary</Label>
                            <div className="flex gap-2">
                                <Input type="color" id="secondaryColor" {...register("secondaryColor")} className="w-12 p-1" />
                                <Input value={organization?.secondaryColor} disabled className="flex-1 text-xs" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tertiaryColor">Tertiary</Label>
                            <div className="flex gap-2">
                                <Input type="color" id="tertiaryColor" {...register("tertiaryColor")} className="w-12 p-1" />
                                <Input value={organization?.tertiaryColor} disabled className="flex-1 text-xs" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={isPending} className="px-10 font-bold uppercase tracking-widest">
                    {isPending ? "Saving..." : "Save Branding"}
                </Button>
            </div>
        </form>
    );
}
