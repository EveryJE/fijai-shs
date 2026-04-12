"use client"

import * as React from "react"
import { NavMain } from "@/components/dashboard/NavMain"
import { NavUser } from "@/components/dashboard/NavUser"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"
import { GraduationCap } from "lucide-react"
import { navMain } from "@/lib/const/navigation"
import Image from "next/image"

export function AppSidebar({
  user,
  organization,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    id: string
    name: string
    email: string
    avatar?: string | null
    roles: string[]
  }
  organization: {
    id: string
    name: string
    logoUrl?: string | null
    primaryColor?: string | null
  }
}) {
  const filteredNavMain = navMain.filter((item) => {
    if (!item.roles) return true
    return item.roles.some((role) => user.roles.includes(role))
  })

  const logoColor = organization.primaryColor || "#730303";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
      {...props}
    >
      <SidebarHeader className="py-2 border-b border-sidebar-border/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-transparent">
              <div className="flex aspect-square size-10 items-center justify-center rounded-lg shadow-lg overflow-hidden shrink-0" style={{ backgroundColor: logoColor }}>
                <Image
                  src={organization.logoUrl || "/logo.png"}
                  alt={organization.name}
                  width={40}
                  height={40}
                  className="p-1.5 object-contain"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                <span className="truncate font-bold text-base" style={{ color: logoColor }}>{organization.name}</span>
                <span className="truncate text-[10px] uppercase font-semibold text-muted-foreground/60 ">Institutional Dashboard</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <NavMain items={filteredNavMain} />
      </SidebarContent>

      <SidebarFooter className="py-4 border-t border-sidebar-border/10">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
