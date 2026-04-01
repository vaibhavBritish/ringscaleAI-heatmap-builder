"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Users, 
  LayoutDashboard, 
  Settings, 
  Database, 
  LogOut,
  ShieldCheck,
  Search,
  Plus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from "@/components/ui/sidebar"
import { signOut } from "next-auth/react"

const adminNavItems = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "User Management",
    href: "/admin/users",
    icon: Users,
  },
  // {
  //   title: "Platform Stats",
  //   href: "/admin/stats",
  //   icon: Database,
  // },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-slate-800 bg-slate-950 text-white">
      <SidebarHeader className="p-6 border-b border-slate-900/50">
        <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-[1.02]">
          <div className="relative h-12 w-full">
            <Image
              src="/logo.png"
              alt="Ringscale AI"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-4 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link 
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                        pathname === item.href 
                          ? "bg-blue-600/10 text-blue-400 font-medium" 
                          : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                      <span>{item.title}</span>
                      {pathname === item.href && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    href="/admin/settings"
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 text-slate-400 hover:bg-slate-900 hover:text-slate-200",
                      pathname === "/admin/settings" && "bg-slate-900 text-slate-200"
                    )}
                  >
                    <Settings className="h-[18px] w-[18px]" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-900 p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
