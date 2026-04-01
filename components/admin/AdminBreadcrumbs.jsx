"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

export function AdminBreadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  return (
    <nav className="flex items-center gap-2 text-sm font-medium">
      <Link 
        href="/admin" 
        className="flex items-center gap-1.5 text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">Admin</span>
      </Link>

      {segments.length > 1 && segments.slice(1).map((segment, index) => {
        const path = `/${segments.slice(0, index + 2).join('/')}`
        const isLast = index === segments.length - 2
        
        // Capitalize and format segment (e.g., user-management -> User Management)
        const label = segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')

        return (
          <div key={path} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-700" />
            {isLast ? (
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {label}
              </span>
            ) : (
              <Link 
                href={path}
                className="text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
              >
                {label}
              </Link>
            )}
          </div>
        )
      })}
      
      {segments.length === 1 && (
         <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-700" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Overview
            </span>
         </div>
      )}
    </nav>
  )
}
