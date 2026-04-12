"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Fijai SHS brand-aware colors
const fijaiColors = [
  {
    // Maroon
    hover: "hover:bg-[#730303]/10",
    active: "data-[active=true]:bg-[#730303]/15 data-[active=true]:shadow-sm",
    open: "data-[state=open]:bg-[#730303]/10",
    subHover: "hover:bg-[#730303]/10",
    subActive: "data-[active=true]:bg-[#730303]/15 data-[active=true]:shadow-sm",
    bar: "#730303ff",
  },
  {
    // Gold
    hover: "hover:bg-[#DAA520]/10",
    active: "data-[active=true]:bg-[#DAA520]/15 data-[active=true]:shadow-sm",
    open: "data-[state=open]:bg-[#DAA520]/10",
    subHover: "hover:bg-[#DAA520]/10",
    subActive: "data-[active=true]:bg-[#DAA520]/15 data-[active=true]:shadow-sm",
    bar: "#DAA520ff",
  },
  {
    // Dark Blue
    hover: "hover:bg-[#1B3A5C]/10",
    active: "data-[active=true]:bg-[#1B3A5C]/15 data-[active=true]:shadow-sm",
    open: "data-[state=open]:bg-[#1B3A5C]/10",
    subHover: "hover:bg-[#1B3A5C]/10",
    subActive: "data-[active=true]:bg-[#1B3A5C]/15 data-[active=true]:shadow-sm",
    bar: "#1B3A5Cff",
  },
] as const

function getFijaiColor(index: number) {
  return fijaiColors[index % fijaiColors.length]
}

export function NavMain({
  items,
}: {
  readonly items: readonly {
    readonly title: string
    readonly url: string
    readonly icon?: LucideIcon
    readonly isActive?: boolean
    readonly items?: readonly {
      readonly title: string
      readonly url: string
    }[]
  }[]
}) {
  const pathname = usePathname()

  const isUrlActive = (url: string) => {
    if (url === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname === url || pathname.startsWith(`${url}/`)
  }

  const hasActiveSubItem = (subItems?: readonly { readonly url: string }[]) => {
    return subItems?.some(subItem => isUrlActive(subItem.url)) ?? false
  }

  const findActiveSubItemIndex = (subItems?: readonly { readonly url: string }[]) => {
    if (!subItems) return 0
    const idx = subItems.findIndex(subItem => isUrlActive(subItem.url))
    return idx === -1 ? 0 : idx
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] uppercase  text-muted-foreground/60 font-semibold px-2">Navigation</SidebarGroupLabel>
      <SidebarMenu className="gap-1 mt-1">
        {items.map((item, index) => {
          const isActive = isUrlActive(item.url) || hasActiveSubItem(item.items)
          const color = getFijaiColor(index)

          if (!item.items || item.items.length === 0) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isActive}
                  className={cn(
                    "rounded-md text-sm transition-all duration-200  data-[active=true]:font-semibold",
                    color.hover,
                    color.active,
                    isActive ? "text-foreground" : "text-muted-foreground/80 hover:text-foreground"
                  )}
                  render={
                    <Link href={item.url}>
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span>{item.title}</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            )
          }

          const hasActiveSub = hasActiveSubItem(item.items)
          const activeSubIndex = findActiveSubItemIndex(item.items)

          return (
            <Collapsible
              key={item.title}
              defaultOpen={isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger
                  render={
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActive}
                      className={cn(
                        "rounded-md text-sm transition-all duration-200  data-[active=true]:font-semibold data-[state=open]:hover:text-foreground",
                        color.hover,
                        color.active,
                        color.open,
                        "text-muted-foreground/80 hover:text-foreground data-[active=true]:text-foreground"
                      )}
                    >
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span className="flex-1 text-left">{item.title}</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  }
                />
                <CollapsibleContent>
                  <div className="relative border-l ml-3.5 pl-2 mt-1 py-1 flex flex-col gap-1 border-muted/50">
                    <div
                      className="absolute left-[-1px] z-10 w-0.5 rounded-full transition-all duration-300 ease-in-out"
                      style={{
                        height: "16px",
                        top: `${activeSubIndex * 36 + 10}px`,
                        opacity: hasActiveSub ? 1 : 0,
                        backgroundColor: color.bar,
                      }}
                    />
                    <SidebarMenuSub className="mt-1 border-l-black/10">
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            isActive={isUrlActive(subItem.url)}
                            className={cn(
                              "rounded-md text-xs font-medium transition-all duration-200 data-[active=true]:font-semibold",
                              color.subHover,
                              color.subActive,
                              isUrlActive(subItem.url) ? "text-foreground" : "text-muted-foreground/70 hover:text-foreground"
                            )}
                            render={
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            }
                          />
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </div>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
