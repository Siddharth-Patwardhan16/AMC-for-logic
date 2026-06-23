export type QuarterPaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'N/A'
export type DbInstallmentStatus = 'PAID' | 'PENDING' | 'OVERDUE'

export function quarterPaymentStatus(
  amount: number,
  paid: number,
  dueDate: Date | string
): QuarterPaymentStatus {
  if (amount <= 0) return 'N/A'
  if (paid >= amount) return 'PAID'
  if (new Date() > new Date(dueDate)) return 'OVERDUE'
  return 'PENDING'
}

/** Maps computed status to the BillingStatus enum stored on installments. */
export function dbInstallmentStatus(
  amount: number,
  paid: number,
  dueDate: Date | string
): DbInstallmentStatus {
  const status = quarterPaymentStatus(amount, paid, dueDate)
  if (status === 'PAID') return 'PAID'
  if (status === 'OVERDUE') return 'OVERDUE'
  return 'PENDING'
}

type InstallmentLike = {
  quarter: number
  label: string
  dueDate: Date | string
  amount: unknown
  paidAmount: unknown
  status?: string
}

type ScheduleLike = {
  id: string
  fiscalYear: string
  section: string | null
  enableQuarterlySplit: boolean
  yearlyAmount: unknown
  company?: { name: string } | null
  installments: InstallmentLike[]
}

export function schedulePaymentSummary(schedule: ScheduleLike) {
  const installments = schedule.installments.map((inst) => {
    const amount = Number(inst.amount)
    const paid = Number(inst.paidAmount)
    const status = quarterPaymentStatus(amount, paid, inst.dueDate)
    return {
      id: (inst as { id?: string }).id,
      quarter: inst.quarter,
      label: inst.label,
      dueDate: inst.dueDate,
      amount,
      paid,
      balance: Math.max(0, amount - paid),
      status,
    }
  })

  const outstanding = installments.reduce((sum, i) => sum + i.balance, 0)
  const paidQuarters = installments.filter((i) => i.status === 'PAID').length
  const overdueQuarters = installments.filter((i) => i.status === 'OVERDUE').length

  return {
    scheduleId: schedule.id,
    fiscalYear: schedule.fiscalYear,
    section: schedule.section,
    companyName: schedule.company?.name ?? null,
    enableQuarterlySplit: schedule.enableQuarterlySplit,
    yearlyAmount: Number(schedule.yearlyAmount),
    installments,
    outstanding,
    paidQuarters,
    overdueQuarters,
    totalQuarters: installments.length,
  }
}

export function customerPaymentSummaries(schedules: ScheduleLike[]) {
  const summaries = schedules.map(schedulePaymentSummary)
  const outstanding = summaries.reduce((sum, s) => sum + s.outstanding, 0)
  const overdueQuarters = summaries.reduce((sum, s) => sum + s.overdueQuarters, 0)
  return { schedules: summaries, outstanding, overdueQuarters }
}
