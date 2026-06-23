import { Badge } from '@/components/ui/badge'
import type { QuarterPaymentStatus } from '@/lib/amc-payment-utils'

const statusVariant: Record<QuarterPaymentStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  PAID: 'success',
  PENDING: 'warning',
  OVERDUE: 'destructive',
  'N/A': 'secondary',
}

const statusLabel: Record<QuarterPaymentStatus, string> = {
  PAID: 'Paid',
  PENDING: 'Due',
  OVERDUE: 'Overdue',
  'N/A': '—',
}

export function QuarterStatusBadge({ status }: { status: QuarterPaymentStatus }) {
  return (
    <Badge variant={statusVariant[status]} className="text-[10px] min-w-[52px] justify-center">
      {statusLabel[status]}
    </Badge>
  )
}

export function QuarterStatusRow({
  installments,
}: {
  installments: Array<{ quarter: number; label: string; status: QuarterPaymentStatus }>
}) {
  if (!installments.length) {
    return <span className="text-xs text-[#52525B]">No quarterly split</span>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {installments.map((inst) => (
        <div
          key={inst.quarter}
          className="flex items-center gap-1 rounded-lg border border-[#262626] bg-[#0A0A0A] px-2 py-1"
          title={inst.label}
        >
          <span className="text-[10px] font-medium text-[#A1A1AA]">Q{inst.quarter}</span>
          <QuarterStatusBadge status={inst.status} />
        </div>
      ))}
    </div>
  )
}

function formatMoney(value: number | string | unknown) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN')}`
}

export { formatMoney }
