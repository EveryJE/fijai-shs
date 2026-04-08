"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
  Settings,
  UserCircle,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { createClient } from "@/utils/supabase/client"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export function NavUser({
  user,
}: {
  user: {
    id: string
    name: string
    email: string
    avatar?: string | null
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
                <SidebarMenuButton
                    size="lg"
                    className="rounded-lg border bg-card/50 hover:bg-accent transition-colors data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
                >
                    <Avatar className="h-8 w-8 rounded-lg shadow-sm border-[#DAA520]/20">
                        <AvatarImage src={user.avatar || ""} alt={user.name} />
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-black text-[10px]">
                            {(user.name || "A").charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight ml-1">
                        <span className="truncate font-semibold">{user.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 opacity-50" />
                </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg shadow-lg border-muted/50"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar || ""} alt={user.name} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-black text-[10px]">
                        {(user.name || "A").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                render={
                    <Link href="/dashboard/profile" className="cursor-pointer">
                        <BadgeCheck className="mr-2 size-4" />
                        My Profile
                    </Link>
                }
              />
              <DropdownMenuItem
                render={
                    <Link href="/auth/reset-password" title="Change your password" className="cursor-pointer">
                        <Settings className="mr-2 size-4" />
                        Account Settings
                    </Link>
                }
              />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer focus:bg-destructive/10">
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
