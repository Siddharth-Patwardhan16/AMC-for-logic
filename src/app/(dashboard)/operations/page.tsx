'use client'

import Link from 'next/link'
import { Bell, CalendarClock, AlertTriangle, ArrowRight } from 'lucide-react'
import { FadeIn } from '@/components/ui/fade-in'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/components/providers'
import { useCompany } from '@/components/company/company-context'
import { CompanyBadge } from '@/components/company/company-selector'
import { formatMoney } from '@/components/finance/quarter-status'

function ReminderCard({ reminder, variant }: { reminder: any; variant: 'overdue' | 'upcoming' }) {
  const isOverdue = variant === 'overdue'

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#262626] bg-[#111111] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isOverdue ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#EAB308]/10 text-[#EAB308]'
        }`}>
          {isOverdue ? <AlertTriangle className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Link href={`/customers/${reminder.customer.id}?tab=amc`} className="text-sm font-semibold text-white hover:text-[#4F8CFF]">
              {reminder.customer.name}
            </Link>
            {reminder.customer.company?.name && <CompanyBadge name={reminder.customer.company.name} />}
          </div>
          <p className="text-sm text-[#A1A1AA]">
            {reminder.label} · AMC {reminder.fiscalYear}
            {reminder.section ? ` · ${reminder.section}` : ''}
          </p>
          <p className="text-xs text-[#52525B] mt-1">
            Due {new Date(reminder.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            {isOverdue
              ? ` · ${Math.abs(reminder.daysUntilDue)} day(s) overdue`
              : ` · in ${reminder.daysUntilDue} day(s)`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
        <div className="text-left sm:text-right">
          <p className="text-sm font-bold text-white">{formatMoney(reminder.balance)}</p>
          <Badge variant={isOverdue ? 'destructive' : 'warning'} className="text-[10px]">
            {isOverdue ? 'Overdue' : 'Upcoming'}
          </Badge>
        </div>
        <Link
          href={`/customers/${reminder.customer.id}?tab=amc`}
          className="inline-flex items-center gap-1 rounded-lg border border-[#262626] bg-[#171717] px-3 py-1.5 text-xs text-[#A1A1AA] hover:text-white"
        >
          Record payment
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}

export default function OperationsPage() {
  const { companyFilter } = useCompany()
  const { data, isLoading } = trpc.amcSchedule.paymentReminders.useQuery({
    companyId: companyFilter,
    daysAhead: 45,
  })

  const overdue = data?.overdue ?? []
  const upcoming = data?.upcoming ?? []

  return (
    <div className="p-5 lg:p-8 max-w-[1000px] mx-auto">
      <FadeIn className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-[#EAB308]/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-[#EAB308]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Operations</h1>
            <p className="text-sm text-[#A1A1AA] mt-0.5">
              Payment reminders — overdue and upcoming quarterly AMC dues
            </p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.05} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <div className="rounded-2xl border border-[#262626] bg-[#111111] p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#52525B]">Overdue</p>
          <p className="text-2xl font-bold text-[#EF4444]">{overdue.length}</p>
        </div>
        <div className="rounded-2xl border border-[#262626] bg-[#111111] p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#52525B]">Upcoming (45 days)</p>
          <p className="text-2xl font-bold text-[#EAB308]">{upcoming.length}</p>
        </div>
        <div className="rounded-2xl border border-[#262626] bg-[#111111] p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#52525B]">Total due</p>
          <p className="text-2xl font-bold text-white">{formatMoney(data?.totalOutstanding ?? 0)}</p>
        </div>
      </FadeIn>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-5 w-5 rounded-full border-2 border-[#4F8CFF] border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-semibold text-white mb-3">Overdue payments</h2>
            {overdue.length ? (
              <div className="space-y-3">
                {overdue.map((reminder: any) => (
                  <ReminderCard key={reminder.id} reminder={reminder} variant="overdue" />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#262626] bg-[#111111] p-6 text-center">
                <p className="text-sm text-[#52525B]">No overdue quarterly payments</p>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold text-white mb-3">Upcoming reminders</h2>
            {upcoming.length ? (
              <div className="space-y-3">
                {upcoming.map((reminder: any) => (
                  <ReminderCard key={reminder.id} reminder={reminder} variant="upcoming" />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#262626] bg-[#111111] p-6 text-center">
                <p className="text-sm text-[#52525B]">No upcoming dues in the next 45 days</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
