import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { getProfileByEmail } from "@/lib/dal";
import { Separator } from "@/components/ui/separator";
import { RouteGuard } from "@/components/RouteGuard";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";

export default async function ProtectedLayout(props: {
    children: React.ReactNode;
    params: Promise<{ slug?: string[] }>;
}) {
    const params = await props.params;
    const children = props.children;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login");


    // Fetch profile first
    const profile = await getProfileByEmail(user.email!);

    // Grant super admin if email matches a hardcoded value or env variable (for dev/admin override)
    const isSuperAdmin = [
        "ama@yopmail.com", // replace with your email
        process.env.SUPER_ADMIN_EMAIL,
    ].includes(user.email);


    const sidebarUser = {
        id: user.id || "",
        name: profile?.fullName || user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        avatar: profile?.avatarUrl,
        roles: isSuperAdmin ? ["admin", "rsvp", "cardholder"] : Array.isArray(profile?.roles) ? profile.roles : [],
        superAdmin: isSuperAdmin,
    };

    // Route-based permission check (server context)
    // Dynamically build pathname from params for nested routes
    let pathname = "/dashboard";
    if (params?.slug && Array.isArray(params.slug)) {
        pathname += "/" + params.slug.join("/");
    }
    // Remove server-side permission redirect; use client RouteGuard instead

    return (
        <SidebarProvider>
            <AppSidebar user={sidebarUser} />
            <SidebarInset className="bg-background/95">
                <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-sm sticky top-0 z-30 transition-[width,height] ease-linear bg-background/50">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex-1 px-2">
                        <Breadcrumbs />
                    </div>
                </header>
                <div className="flex flex-1 flex-col p-0 ">
                    <RouteGuard user={sidebarUser}>
                        {children}
                    </RouteGuard>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
