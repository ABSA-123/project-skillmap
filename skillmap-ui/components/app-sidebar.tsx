"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Compass, Globe2, Library, Map, Plus, Swords } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { UserMenu } from "@/components/user-menu"

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  if (!user) return null

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Compass className="size-4" strokeWidth={1.6} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-serif text-lg tracking-tight">
                    SkillMap
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Overview"
                isActive={pathname === "/dashboard"}
              >
                <Link href="/dashboard">
                  <Map />
                  <span>Overview</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="My roadmaps"
                isActive={pathname.startsWith("/roadmaps") && pathname !== "/roadmaps/new"}
              >
                <Link href="/roadmaps">
                  <Library />
                  <span>My roadmaps</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Community"
                isActive={pathname.startsWith("/community")}
              >
                <Link href="/community">
                  <Globe2 />
                  <span>Community</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Challenges"
                isActive={pathname.startsWith("/challenges")}
              >
                <Link href="/challenges">
                  <Swords />
                  <span>Challenges</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <div className="mt-4 px-4">
          <Button asChild className="w-full justify-start" size="sm">
            <Link href="/roadmaps/new">
              <Plus className="mr-2 size-4" />
              New roadmap
            </Link>
          </Button>
        </div>
      </SidebarContent>

      <SidebarFooter>
        <UserMenu user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
