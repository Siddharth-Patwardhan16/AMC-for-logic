'use client'

import { useState } from 'react'
import { Plus, Search, Megaphone, Phone, CheckCircle, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FadeIn } from '@/components/ui/fade-in'
import { trpc } from '@/components/providers'
import { toast } from 'sonner'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useListPage } from '@/hooks/use-list-page'
import { ListPagination } from '@/components/ui/list-pagination'

const statusColors: Record<string, string> = {
  PENDING: 'text-[#EAB308] bg-[#EAB308]/10',
  COMPLETED: 'text-[#22C55E] bg-[#22C55E]/10',
  CANCELLED: 'text-[#EF4444] bg-[#EF4444]/10',
}

const typeLabels: Record<string, string> = {
  CALL: 'Call',
  MEETING: 'Meeting',
  EMAIL: 'Email',
  QUOTATION: 'Quotation',
  NEGOTIATION: 'Negotiation',
  FOLLOW_UP: 'Follow Up',
  NOTE: 'Note',
}

export default function CRMPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [status, setStatus] = useState('')
  const { page, setPage } = useListPage(debouncedSearch, status)

  const { data, refetch } = trpc.crm.listActivities.useQuery({
    status: status || undefined,
    search: debouncedSearch || undefined,
    page,
  })
  const activities = data?.items ?? []

  const { data: pipeline } = trpc.crm.pipeline.useQuery()

  const updateMutation = trpc.crm.updateActivity.useMutation({
    onSuccess: () => {
      toast.success('Completed')
      refetch()
    },
  })

  const filtered = activities

  const stages = [
    { label: 'Leads', value: pipeline?.leads || 0, color: 'bg-[#4F8CFF]/10 text-[#4F8CFF]' },
    { label: 'Prospects', value: pipeline?.prospects || 0, color: 'bg-[#A855F7]/10 text-[#A855F7]' },
    { label: 'Active', value: pipeline?.active || 0, color: 'bg-[#22C55E]/10 text-[#22C55E]' },
    { label: 'Closed', value: pipeline?.closed || 0, color: 'bg-[#171717] text-[#A1A1AA]' },
  ]

  return (
    <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CRM</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">Pipeline & activities</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white text-sm font-medium transition-all active:scale-[0.98]">
          <Plus className="h-4 w-4" />
          Add Activity
        </button>
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stages.map((stage) => (
          <div key={stage.label} className="p-4 rounded-2xl bg-[#111111] border border-[#262626]">
            <p className="text-xs text-[#52525B] mb-1">{stage.label}</p>
            <p className="text-2xl font-bold text-white">{stage.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" />
          <Input
            placeholder="Search activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 px-3 rounded-xl bg-[#111111] border border-[#262626] text-sm text-[#A1A1AA] focus:outline-none focus:border-[#4F8CFF]/30"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Activities */}
      <div className="space-y-2">
        {filtered.map((activity: any, i: number) => (
          <FadeIn key={activity.id} staggerIndex={i % 6}>
            <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626] flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-[#4F8CFF]/10 flex items-center justify-center flex-shrink-0">
                <Megaphone className="h-4 w-4 text-[#4F8CFF]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-white">{activity.subject}</p>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium ${statusColors[activity.status] || statusColors.PENDING}`}>
                    {activity.status}
                  </span>
                </div>
                <p className="text-xs text-[#52525B]">{activity.customer?.name} · {typeLabels[activity.activityType]}</p>
              </div>
              {activity.status === 'PENDING' && (
                <button
                  onClick={() => updateMutation.mutate({ id: activity.id, status: 'COMPLETED', completedAt: new Date().toISOString() })}
                  className="px-3 py-1.5 rounded-lg bg-[#171717] border border-[#262626] text-xs text-[#A1A1AA] hover:text-[#22C55E] hover:border-[#22C55E]/30 transition-all flex items-center gap-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  Done
                </button>
              )}
            </div>
          </FadeIn>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="h-12 w-12 rounded-2xl bg-[#171717] flex items-center justify-center mx-auto mb-4">
            <Megaphone className="h-5 w-5 text-[#52525B]" />
          </div>
          <p className="text-sm text-[#A1A1AA]">No activities found</p>
          <p className="text-xs text-[#52525B] mt-1">Add your first CRM activity</p>
        </div>
      )}

      <ListPagination
        page={page}
        totalPages={data?.totalPages ?? 1}
        total={data?.total ?? 0}
        pageSize={data?.pageSize ?? 24}
        onPageChange={setPage}
      />
    </div>
  )
}
