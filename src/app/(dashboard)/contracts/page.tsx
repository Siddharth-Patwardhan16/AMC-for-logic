'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Search, FileText, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/components/providers'
import { useCompany } from '@/components/company/company-context'

const typeLabels: Record<string, string> = {
  QUARTERLY_AMC: 'Quarterly AMC',
  HALF_YEARLY_AMC: 'Half Yearly AMC',
  YEARLY_AMC: 'Yearly AMC',
  MONTHLY_SUPPORT: 'Monthly Support',
  PROJECT_BASED: 'Project Based',
  NON_AMC: 'Non AMC',
}

const statusColors: Record<string, string> = {
  ACTIVE: 'text-[#22C55E] bg-[#22C55E]/10',
  EXPIRED: 'text-[#EF4444] bg-[#EF4444]/10',
  TERMINATED: 'text-[#52525B] bg-[#171717]',
  PENDING_RENEWAL: 'text-[#EAB308] bg-[#EAB308]/10',
}

export default function ContractsPage() {
  const [search, setSearch] = useState('')
  const [contractType, setContractType] = useState('')
  const [status, setStatus] = useState('')
  const { companyFilter } = useCompany()

  const { data: contracts } = trpc.contract.list.useQuery({
    companyId: companyFilter,
    contractType: contractType || undefined,
    status: status || undefined,
  })

  return (
    <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Contracts</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">AMC agreements & service contracts</p>
        </div>
        <Link href="/contracts/new">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white text-sm font-medium transition-all active:scale-[0.98]">
            <Plus className="h-4 w-4" />
            New Contract
          </button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" />
          <Input
            placeholder="Search contracts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={contractType}
          onChange={(e) => setContractType(e.target.value)}
          className="h-10 px-3 rounded-xl bg-[#111111] border border-[#262626] text-sm text-[#A1A1AA] focus:outline-none focus:border-[#4F8CFF]/30"
        >
          <option value="">All Types</option>
          <option value="YEARLY_AMC">Yearly AMC</option>
          <option value="HALF_YEARLY_AMC">Half Yearly</option>
          <option value="QUARTERLY_AMC">Quarterly</option>
          <option value="MONTHLY_SUPPORT">Monthly Support</option>
          <option value="PROJECT_BASED">Project</option>
          <option value="NON_AMC">Non AMC</option>
        </select>
      </div>

      <div className="space-y-3">
        {contracts?.map((contract, i) => (
          <motion.div
            key={contract.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.25 }}
          >
            <Link href={`/contracts/${contract.id}`}>
              <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#333333] transition-all duration-300 group cursor-pointer flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-[#A855F7]/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-[#A855F7]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-white">{contract.contractNumber}</p>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium ${statusColors[contract.status] || statusColors.ACTIVE}`}>
                      {contract.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#52525B]">{contract.customer?.name}</p>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-sm font-medium text-white">₹{Number(contract.value).toLocaleString()}</p>
                  <p className="text-xs text-[#52525B]">{typeLabels[contract.contractType]}</p>
                </div>
                <div className="text-right flex-shrink-0 hidden md:block">
                  <p className="text-xs text-[#EAB308]">{new Date(contract.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  <p className="text-[10px] text-[#52525B]">Expires</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#52525B] group-hover:text-[#4F8CFF] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {contracts?.length === 0 && (
        <div className="text-center py-16">
          <div className="h-12 w-12 rounded-2xl bg-[#171717] flex items-center justify-center mx-auto mb-4">
            <FileText className="h-5 w-5 text-[#52525B]" />
          </div>
          <p className="text-sm text-[#A1A1AA]">No contracts found</p>
          <p className="text-xs text-[#52525B] mt-1">Create your first contract</p>
        </div>
      )}
    </div>
  )
}
