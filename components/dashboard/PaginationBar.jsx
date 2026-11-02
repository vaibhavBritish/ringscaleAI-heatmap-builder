"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

// Page numbers to show around the current page, with "…" gaps: 1 … 4 5 6 … 12
function getPageItems(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const items = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  if (start > 2) items.push('gap-start')
  for (let p = start; p <= end; p++) items.push(p)
  if (end < totalPages - 1) items.push('gap-end')
  items.push(totalPages)
  return items
}

export function PaginationBar({ page, pageSize, total, onPageChange, itemLabel = "items", className = "" }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}>
      <p className="text-sm text-slate-500">
        Showing <span className="font-semibold text-slate-900">{from}–{to}</span> of{" "}
        <span className="font-semibold text-slate-900">{total}</span> {itemLabel}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {getPageItems(page, totalPages).map(item =>
            typeof item === 'number' ? (
              <Button
                key={item}
                variant={item === page ? "default" : "ghost"}
                size="sm"
                className="h-8 min-w-8 px-2"
                onClick={() => onPageChange(item)}
                aria-current={item === page ? "page" : undefined}
              >
                {item}
              </Button>
            ) : (
              <span key={item} className="px-1 text-slate-400">…</span>
            )
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
