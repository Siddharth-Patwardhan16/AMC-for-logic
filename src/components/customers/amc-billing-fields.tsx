'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AMC_SECTION_OPTIONS,
  isImportableDataRow,
  type AmcImportRow,
} from '@/lib/amc-import-schema'

export type AmcBillingFormValues = Omit<AmcImportRow, 'name' | 'companyLabel' | 'location'>

type Props = {
  values: AmcBillingFormValues
  onChange: (values: AmcBillingFormValues) => void
  companyLabel?: string
  onCompanyLabelChange?: (value: string) => void
  showCompanyField?: boolean
}

function NumField({
  label,
  value,
  onChange,
  className = '',
}: {
  label: string
  value: number
  onChange: (v: number) => void
  className?: string
}) {
  return (
    <div className={className}>
      <Label className="text-xs text-[#A1A1AA] mb-1.5 block">{label}</Label>
      <Input
        type="number"
        min={0}
        step="any"
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-9"
      />
    </div>
  )
}

function QtyGrid({
  prefix,
  values,
  onChange,
}: {
  prefix: 'serverQty' | 'thinClientQty' | 'laptopDesktopQty'
  values: AmcBillingFormValues
  onChange: (values: AmcBillingFormValues) => void
}) {
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'] as const
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {quarters.map((q) => {
        const key = `${prefix}${q}` as keyof AmcBillingFormValues
        return (
          <NumField
            key={key}
            label={`Qty ${q}`}
            value={values[key] as number}
            onChange={(v) => onChange({ ...values, [key]: v })}
          />
        )
      })}
    </div>
  )
}

export function AmcBillingFields({
  values,
  onChange,
  companyLabel,
  onCompanyLabelChange,
  showCompanyField = false,
}: Props) {
  const set = <K extends keyof AmcBillingFormValues>(key: K, val: AmcBillingFormValues[K]) => {
    onChange({ ...values, [key]: val })
  }

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#111111] border border-[#262626] space-y-4">
        <h2 className="text-sm font-semibold text-white">AMC Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs text-[#A1A1AA] mb-1.5 block">Sr. No.</Label>
            <Input
              type="number"
              min={0}
              value={values.srNo ?? ''}
              onChange={(e) => set('srNo', e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div>
            <Label className="text-xs text-[#A1A1AA] mb-1.5 block">Description</Label>
            <Input
              value={values.description ?? ''}
              onChange={(e) => set('description', e.target.value || undefined)}
              placeholder="Optional notes"
            />
          </div>
          <div>
            <Label className="text-xs text-[#A1A1AA] mb-1.5 block">Section</Label>
            <select
              value={values.section ?? 'AMC Q1'}
              onChange={(e) => set('section', e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#111111] border border-[#262626] text-sm text-white focus:outline-none focus:border-[#4F8CFF]/30"
            >
              {AMC_SECTION_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {showCompanyField && onCompanyLabelChange && (
            <div>
              <Label className="text-xs text-[#A1A1AA] mb-1.5 block">Company (spreadsheet)</Label>
              <Input
                value={companyLabel ?? ''}
                onChange={(e) => onCompanyLabelChange(e.target.value)}
                placeholder="Logic, Computerwala..."
              />
            </div>
          )}
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-[#111111] border border-[#262626] space-y-4">
        <h2 className="text-sm font-semibold text-white">Server</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumField label="Rate yearly" value={values.serverRateYearly} onChange={(v) => set('serverRateYearly', v)} />
          <NumField label="Rate quarterly" value={values.serverRateQuarterly} onChange={(v) => set('serverRateQuarterly', v)} />
          <NumField label="Sophos Firewall (qty)" value={values.sophosQuantity} onChange={(v) => set('sophosQuantity', v)} />
        </div>
        <QtyGrid prefix="serverQty" values={values} onChange={onChange} />
      </div>

      <div className="p-6 rounded-2xl bg-[#111111] border border-[#262626] space-y-4">
        <h2 className="text-sm font-semibold text-white">Thin Client</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumField label="Rate yearly" value={values.thinClientRateYearly} onChange={(v) => set('thinClientRateYearly', v)} />
          <NumField label="Rate quarterly" value={values.thinClientRateQuarterly} onChange={(v) => set('thinClientRateQuarterly', v)} />
        </div>
        <QtyGrid prefix="thinClientQty" values={values} onChange={onChange} />
      </div>

      <div className="p-6 rounded-2xl bg-[#111111] border border-[#262626] space-y-4">
        <h2 className="text-sm font-semibold text-white">Laptop + Desktop</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumField label="Rate yearly" value={values.laptopDesktopRateYearly} onChange={(v) => set('laptopDesktopRateYearly', v)} />
          <NumField label="Rate quarterly" value={values.laptopDesktopRateQuarterly} onChange={(v) => set('laptopDesktopRateQuarterly', v)} />
        </div>
        <QtyGrid prefix="laptopDesktopQty" values={values} onChange={onChange} />
      </div>

      <div className="p-6 rounded-2xl bg-[#111111] border border-[#262626] space-y-4">
        <h2 className="text-sm font-semibold text-white">Net Amount (GST extra)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumField label="Amt Q1" value={values.amountQ1} onChange={(v) => set('amountQ1', v)} />
          <NumField label="Amt Q2" value={values.amountQ2} onChange={(v) => set('amountQ2', v)} />
          <NumField label="Amt Q3" value={values.amountQ3} onChange={(v) => set('amountQ3', v)} />
          <NumField label="Amt Q4" value={values.amountQ4} onChange={(v) => set('amountQ4', v)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumField label="Quarterly total" value={values.quarterlyTotal} onChange={(v) => set('quarterlyTotal', v)} />
          <NumField label="Yearly amount" value={values.yearlyAmount} onChange={(v) => set('yearlyAmount', v)} />
        </div>
      </div>
    </div>
  )
}

export function amcBillingToImportRow(
  name: string,
  companyLabel: string,
  location: string,
  billing: AmcBillingFormValues
): AmcImportRow {
  const quarterlyTotal =
    billing.quarterlyTotal ||
    billing.amountQ1 + billing.amountQ2 + billing.amountQ3 + billing.amountQ4

  return {
    name,
    companyLabel,
    location,
    ...billing,
    quarterlyTotal,
    yearlyAmount: billing.yearlyAmount || quarterlyTotal,
  }
}

export function hasAmcBillingData(billing: AmcBillingFormValues): boolean {
  return isImportableDataRow({
    name: 'placeholder',
    companyLabel: 'Logic',
    location: 'Head Office',
    ...billing,
  })
}
