'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type ListPaginationProps = {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  className?: string
}

export function ListPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  className,
}: ListPaginationProps) {
  if (total === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-[#262626]',
        className,
      )}
    >
      <p className="text-xs text-[#52525B]">
        Showing {from}–{to} of {total}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#111111] border border-[#262626] text-xs text-[#A1A1AA] hover:text-white hover:border-[#333333] disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>
          <span className="text-xs text-[#A1A1AA] px-2">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#111111] border border-[#262626] text-xs text-[#A1A1AA] hover:text-white hover:border-[#333333] disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
