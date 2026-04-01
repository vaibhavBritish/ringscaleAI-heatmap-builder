import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { ShieldCheck, User } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'admin') {
    redirect('/')
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950">
        <AdminSidebar />
        <SidebarInset className="flex w-full flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 transition-all dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-1" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Pages</span>
                <span className="text-sm font-medium text-slate-300 dark:text-slate-600">/</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Admin Dashboard</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <div className="flex h-8 w-64 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
                  <span className="text-xs text-slate-400">Search anything...</span>
                  <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-slate-500 opacity-100 dark:border-slate-800 dark:bg-slate-950">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 outline-none">
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
                  <DropdownMenuItem className="cursor-pointer gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-6 md:p-10">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
