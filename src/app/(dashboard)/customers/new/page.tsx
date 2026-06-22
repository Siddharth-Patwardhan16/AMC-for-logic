'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileSpreadsheet, Loader2, Plus, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/components/providers'
import { parseAmcWorkbook, type AmcImportRow } from '@/lib/amc-excel-parser'

type Tab = 'manual' | 'import'

export default function NewCustomerPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<Tab>('manual')
  const [previewRows, setPreviewRows] = useState<AmcImportRow[]>([])

  const [form, setForm] = useState({
    name: '',
    industry: '',
    gst: '',
    pan: '',
    billingAddress: '',
    locationName: '',
    city: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    status: 'ACTIVE',
    companyId: '',
  })

  const { data: companies } = trpc.company.list.useQuery()
  const createMutation = trpc.customer.create.useMutation({
    onSuccess: (customer) => {
      toast.success('Customer created')
      router.push(`/customers/${customer.id}`)
    },
    onError: (err) => toast.error(err.message),
  })
  const importMutation = trpc.customer.importAmcSpreadsheet.useMutation({
    onSuccess: (result) => {
      toast.success(`Imported ${result.created} customers (${result.skipped} skipped)`)
      if (result.errors.length) {
        toast.error(`${result.errors.length} rows failed`)
      }
      router.push('/customers')
    },
    onError: (err) => toast.error(err.message),
  })

  const selectedCompanyId = form.companyId || companies?.[0]?.id || ''

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Customer name is required')
      return
    }
    if (!selectedCompanyId) {
      toast.error('Select a company first')
      return
    }

    createMutation.mutate({
      name: form.name.trim(),
      industry: form.industry || undefined,
      gst: form.gst || undefined,
      pan: form.pan || undefined,
      billingAddress: form.billingAddress || undefined,
      shippingAddress: form.billingAddress || undefined,
      status: form.status,
      companyId: selectedCompanyId,
      locations: form.locationName || form.city ? [{
        name: form.locationName || form.city || 'Head Office',
        city: form.city || undefined,
        isHeadOffice: true,
      }] : [],
      contactPersons: form.contactName ? [{
        name: form.contactName,
        email: form.contactEmail || undefined,
        phone: form.contactPhone || undefined,
        isPrimary: true,
      }] : [],
    })
  }

  const handleFileChange = async (file: File | null) => {
    if (!file) return
    try {
      const buffer = await file.arrayBuffer()
      const rows = parseAmcWorkbook(buffer)
      if (!rows.length) {
        toast.error('No customer rows found in this file')
        return
      }
      setPreviewRows(rows)
      toast.success(`Found ${rows.length} customers in spreadsheet`)
    } catch {
      toast.error('Could not read Excel file')
    }
  }

  const handleImport = () => {
    if (!previewRows.length) {
      toast.error('Upload the AMC Excel file first')
      return
    }
    importMutation.mutate({
      rows: previewRows,
      defaultCompanyId: selectedCompanyId || undefined,
      skipExisting: true,
    })
  }

  return (
    <div className="p-5 lg:p-8 max-w-[900px] mx-auto">
      <Link
        href="/customers"
        className="inline-flex items-center gap-1.5 text-sm text-[#A1A1AA] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">New Customer</h1>
        <p className="text-sm text-[#A1A1AA] mt-1">
          Add manually or import from your AMC Working 26-27 Excel sheet
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab('manual')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            tab === 'manual' ? 'bg-[#4F8CFF] text-white' : 'bg-[#111111] text-[#A1A1AA] border border-[#262626]'
          }`}
        >
          Manual Entry
        </button>
        <button
          type="button"
          onClick={() => setTab('import')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            tab === 'import' ? 'bg-[#4F8CFF] text-white' : 'bg-[#111111] text-[#A1A1AA] border border-[#262626]'
          }`}
        >
          Import Excel
        </button>
      </div>

      <div className="mb-6">
        <Label className="text-xs text-[#A1A1AA] mb-1.5 block">Company</Label>
        <select
          value={selectedCompanyId}
          onChange={(e) => setForm((f) => ({ ...f, companyId: e.target.value }))}
          className="w-full h-10 px-3 rounded-xl bg-[#111111] border border-[#262626] text-sm text-white focus:outline-none focus:border-[#4F8CFF]/30"
        >
          {companies?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {tab === 'manual' ? (
        <form onSubmit={handleManualSubmit} className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#111111] border border-[#262626] space-y-4">
            <h2 className="text-sm font-semibold text-white">Customer Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-[#A1A1AA] mb-1.5 block">Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Panva Engg."
                  required
                />
              </div>
              <div>
                <Label className="text-xs text-[#A1A1AA] mb-1.5 block">Industry</Label>
                <Input
                  value={form.industry}
                  onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                  placeholder="Manufacturing"
                />
              </div>
              <div>
                <Label className="text-xs text-[#A1A1AA] mb-1.5 block">GST</Label>
                <Input value={form.gst} onChange={(e) => setForm((f) => ({ ...f, gst: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs text-[#A1A1AA] mb-1.5 block">PAN</Label>
                <Input value={form.pan} onChange={(e) => setForm((f) => ({ ...f, pan: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-[#A1A1AA] mb-1.5 block">Billing Address</Label>
                <Input
                  value={form.billingAddress}
                  onChange={(e) => setForm((f) => ({ ...f, billingAddress: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#111111] border border-[#262626] space-y-4">
            <h2 className="text-sm font-semibold text-white">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-[#A1A1AA] mb-1.5 block">Site / Location</Label>
                <Input
                  value={form.locationName}
                  onChange={(e) => setForm((f) => ({ ...f, locationName: e.target.value }))}
                  placeholder="Ambad, Nashik, Satpur..."
                />
              </div>
              <div>
                <Label className="text-xs text-[#A1A1AA] mb-1.5 block">City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="Nashik"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#111111] border border-[#262626] space-y-4">
            <h2 className="text-sm font-semibold text-white">Primary Contact (optional)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-[#A1A1AA] mb-1.5 block">Name</Label>
                <Input value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs text-[#A1A1AA] mb-1.5 block">Email</Label>
                <Input type="email" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs text-[#A1A1AA] mb-1.5 block">Phone</Label>
                <Input value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} />
              </div>
            </div>
          </div>

          <Button type="submit" className="rounded-xl" disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Create Customer
          </Button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#111111] border border-[#262626]">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-[#22C55E]/10 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="h-5 w-5 text-[#22C55E]" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-white">AMC Working 26-27 format</h2>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Upload your Excel file with columns: Name, Company, Location, Server/Thin client/Laptop counts, and yearly billing amounts.
                </p>
                <p className="text-xs text-[#52525B] mt-2">
                  Template bundled at <code className="text-[#A1A1AA]">prisma/data/amc-working-26-27.xlsx</code>
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl border border-[#262626] bg-[#171717]"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Excel File
              </Button>
              <Button
                type="button"
                className="rounded-xl"
                disabled={!previewRows.length || importMutation.isPending}
                onClick={handleImport}
              >
                {importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Import {previewRows.length ? `${previewRows.length} customers` : 'customers'}
              </Button>
            </div>
          </div>

          {previewRows.length > 0 && (
            <div className="rounded-2xl border border-[#262626] overflow-hidden">
              <div className="px-4 py-3 bg-[#111111] border-b border-[#262626]">
                <p className="text-sm font-medium text-white">Preview ({previewRows.length} rows)</p>
              </div>
              <div className="max-h-[360px] overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#0A0A0A] text-[#52525B] uppercase tracking-wide">
                    <tr>
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Location</th>
                      <th className="text-left p-3">Section</th>
                      <th className="text-right p-3">Q1</th>
                      <th className="text-right p-3">Q2</th>
                      <th className="text-right p-3">Q3</th>
                      <th className="text-right p-3">Q4</th>
                      <th className="text-right p-3">Yearly</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.slice(0, 50).map((row, i) => (
                      <tr key={`${row.name}-${i}`} className="border-t border-[#262626]">
                        <td className="p-3 text-white">{row.name}</td>
                        <td className="p-3 text-[#A1A1AA]">{row.location}</td>
                        <td className="p-3 text-[#A1A1AA]">{row.section}</td>
                        <td className="p-3 text-right text-[#A1A1AA]">₹{row.amountQ1.toLocaleString()}</td>
                        <td className="p-3 text-right text-[#A1A1AA]">₹{row.amountQ2.toLocaleString()}</td>
                        <td className="p-3 text-right text-[#A1A1AA]">₹{row.amountQ3.toLocaleString()}</td>
                        <td className="p-3 text-right text-[#A1A1AA]">₹{row.amountQ4.toLocaleString()}</td>
                        <td className="p-3 text-right text-[#22C55E]">₹{row.yearlyAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewRows.length > 50 && (
                  <p className="p-3 text-xs text-[#52525B]">Showing first 50 of {previewRows.length} rows</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
