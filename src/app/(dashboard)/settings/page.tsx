'use client'

import { useState } from 'react'
import { Search, Building2, Pencil, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { FadeIn } from '@/components/ui/fade-in'
import { trpc } from '@/components/providers'
import { toast } from 'sonner'
import { staticDataQueryOptions } from '@/lib/query-options'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { TeamMembersPanel } from '@/components/settings/team-members'

type SettingsTab = 'companies' | 'team'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('companies')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', gstin: '', pan: '', address: '', city: '', state: '', pincode: '', bankName: '', bankAccount: '', bankIfsc: '', invoicePrefix: 'INV', quotationPrefix: 'QOT' })

  const { data: companies, refetch } = trpc.company.list.useQuery(undefined, staticDataQueryOptions)
  const create = trpc.company.create.useMutation({ onSuccess: () => { toast.success('Created'); refetch(); setEditing(null); } })
  const update = trpc.company.update.useMutation({ onSuccess: () => { toast.success('Updated'); refetch(); setEditing(null); } })
  const del = trpc.company.delete.useMutation({ onSuccess: () => { toast.success('Deleted'); refetch(); } })

  const filtered = companies?.filter((c: any) => c.name.toLowerCase().includes(debouncedSearch.toLowerCase()))

  const startEdit = (c: any) => {
    setEditing(c.id)
    setForm({ name: c.name, gstin: c.gstin || '', pan: c.pan || '', address: c.address || '', city: c.city || '', state: c.state || '', pincode: c.pincode || '', bankName: c.bankName || '', bankAccount: c.bankAccount || '', bankIfsc: c.bankIfsc || '', invoicePrefix: c.invoicePrefix, quotationPrefix: c.quotationPrefix })
  }

  const startCreate = () => {
    setEditing('new')
    setForm({ name: '', gstin: '', pan: '', address: '', city: '', state: '', pincode: '', bankName: '', bankAccount: '', bankIfsc: '', invoicePrefix: 'INV', quotationPrefix: 'QOT' })
  }

  const save = () => {
    if (editing === 'new') create.mutate(form as any)
    else if (editing) update.mutate({ id: editing, ...form } as any)
  }

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'companies', label: 'Companies' },
    { id: 'team', label: 'Team Members' },
  ]

  return (
    <div className="p-5 lg:p-8 max-w-[900px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-sm text-[#A1A1AA] mt-1">Companies, team members, and configuration</p>
      </div>

      <div className="mb-6 flex items-center gap-1 p-1 rounded-xl bg-[#111111] border border-[#262626] w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-[#171717] text-white shadow-sm' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'team' && <TeamMembersPanel />}

      {activeTab === 'companies' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-[#A1A1AA]">Manage billing companies and document prefixes</p>
            <button onClick={startCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white text-sm font-medium transition-all active:scale-[0.98]">
              + Company
            </button>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" />
            <Input placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>

          <div className="space-y-3">
            {filtered?.map((company: any) => (
              <FadeIn key={company.id} className="p-4 rounded-2xl bg-[#111111] border border-[#262626]">
                {editing === company.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="Company Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
                      <Input placeholder="GSTIN" value={form.gstin} onChange={(e) => setForm({...form, gstin: e.target.value})} />
                      <Input placeholder="PAN" value={form.pan} onChange={(e) => setForm({...form, pan: e.target.value})} />
                      <Input placeholder="City" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} />
                      <Input placeholder="State" value={form.state} onChange={(e) => setForm({...form, state: e.target.value})} />
                      <Input placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({...form, pincode: e.target.value})} />
                      <Input placeholder="Bank Name" value={form.bankName} onChange={(e) => setForm({...form, bankName: e.target.value})} />
                      <Input placeholder="Account No" value={form.bankAccount} onChange={(e) => setForm({...form, bankAccount: e.target.value})} />
                      <Input placeholder="IFSC" value={form.bankIfsc} onChange={(e) => setForm({...form, bankIfsc: e.target.value})} />
                      <Input placeholder="Invoice Prefix" value={form.invoicePrefix} onChange={(e) => setForm({...form, invoicePrefix: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-lg text-xs text-[#A1A1AA] hover:text-white">Cancel</button>
                      <button onClick={save} className="px-3 py-1.5 rounded-lg bg-[#22C55E] text-white text-xs font-medium">Save</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#4F8CFF]/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-[#4F8CFF]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{company.name}</p>
                        <p className="text-xs text-[#52525B]">{company.gstin || 'No GSTIN'} · {company.city || 'No city'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(company)} className="p-2 rounded-lg hover:bg-[#171717] text-[#A1A1AA] hover:text-white transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => del.mutate({ id: company.id })} className="p-2 rounded-lg hover:bg-[#171717] text-[#A1A1AA] hover:text-[#EF4444] transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </FadeIn>
            ))}
          </div>

          {editing === 'new' && (
            <FadeIn className="mt-3 p-4 rounded-2xl bg-[#111111] border border-[#262626]">
              <p className="text-sm font-medium text-white mb-3">New Company</p>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Company Name *" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
                <Input placeholder="GSTIN" value={form.gstin} onChange={(e) => setForm({...form, gstin: e.target.value})} />
                <Input placeholder="PAN" value={form.pan} onChange={(e) => setForm({...form, pan: e.target.value})} />
                <Input placeholder="City" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} />
                <Input placeholder="State" value={form.state} onChange={(e) => setForm({...form, state: e.target.value})} />
                <Input placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({...form, pincode: e.target.value})} />
                <Input placeholder="Bank Name" value={form.bankName} onChange={(e) => setForm({...form, bankName: e.target.value})} />
                <Input placeholder="Account No" value={form.bankAccount} onChange={(e) => setForm({...form, bankAccount: e.target.value})} />
                <Input placeholder="IFSC" value={form.bankIfsc} onChange={(e) => setForm({...form, bankIfsc: e.target.value})} />
                <Input placeholder="Invoice Prefix" value={form.invoicePrefix} onChange={(e) => setForm({...form, invoicePrefix: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-lg text-xs text-[#A1A1AA] hover:text-white">Cancel</button>
                <button onClick={save} className="px-3 py-1.5 rounded-lg bg-[#22C55E] text-white text-xs font-medium">Create</button>
              </div>
            </FadeIn>
          )}
        </>
      )}
    </div>
  )
}
