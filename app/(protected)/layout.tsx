import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { getProfileByEmail } from "@/lib/dal";
import { Separator } from "@/components/ui/separator";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login");

    const profile = await getProfileByEmail(user.email!);

    const sidebarUser = {
        id: user.id || "",
        name: profile?.fullName || user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        avatar: profile?.avatarUrl,
        roles: profile?.roles || [],
    };

    return (
        <SidebarProvider>
            <AppSidebar user={sidebarUser} />
            <SidebarInset className="bg-background/95">
                <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-sm sticky top-0 z-30 transition-[width,height] ease-linear bg-background/50">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex-1">
                        <span className="text-sm font-medium hidden sm:inline-block text-muted-foreground/80">Dashboard</span>
                    </div>
                </header>
                <div className="flex flex-1 flex-col p-0">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
