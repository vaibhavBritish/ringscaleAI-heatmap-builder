import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminBreadcrumbs } from "@/components/admin/AdminBreadcrumbs"
import { Bell, User, Search as SearchIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "admin") {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Fixed Sidebar */}
      <AdminSidebar />

      {/* Main content — offset by sidebar width */}
      <div style={{ marginLeft: "256px" }} className="flex flex-col min-h-screen">
        
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/60 bg-white/80 backdrop-blur-md px-6 dark:border-slate-800/60 dark:bg-slate-950/80">
          <div className="flex items-center gap-4">
            <AdminBreadcrumbs />
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden lg:block group">
              <div className="flex h-9 w-56 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-3 transition-all group-hover:border-slate-300 group-hover:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:group-hover:border-slate-700 dark:group-hover:bg-slate-900">
                <SearchIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-xs text-slate-400 font-medium">Search...</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400 dark:border-slate-800 dark:bg-slate-950">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>

            {/* Bell */}
            <button className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500 border-2 border-white dark:border-slate-950" />
            </button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 outline-none">
                  <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-800">
                    <AvatarImage src={`https://avatar.vercel.sh/${session.user.email}`} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {session.user.name?.[0] || session.user.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left lg:block">
                    <p className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-100">{session.user.name}</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{session.user.role}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2 border-slate-200 dark:border-slate-800">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user.name}</p>
                    <p className="text-xs leading-none text-slate-500 truncate">{session.user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800" />
                <DropdownMenuItem className="cursor-pointer gap-2">
                  <User className="h-4 w-4" /> Profile Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
